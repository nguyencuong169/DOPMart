<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { ArrowUpRight, ReceiptText, RefreshCw } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { getMyMartOrders } from '../services/martOrderService'
import type { MartOrderStatus, MartOrderSummary } from '../types/mart-order'

const router = useRouter()

const orders = shallowRef<MartOrderSummary[]>([])
const loading = shallowRef(true)
const errorMessage = shallowRef('')

const statusLabels: Record<MartOrderStatus, string> = {
  pending_payment: 'Chờ thanh toán',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang soạn hàng',
  ready_for_pickup: 'Sẵn sàng lấy',
  out_for_delivery: 'Đang giao',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
  expired: 'Hết hạn',
  manual_review: 'Đang kiểm tra',
}

const paymentLabels: Record<string, string> = {
  pending: 'Chờ thanh toán',
  succeeded: 'Đã thanh toán',
  failed: 'Thanh toán lỗi',
  manual_review: 'Cần đối soát',
  expired: 'Hết hạn',
  unknown: 'Chưa có trạng thái',
}

const hasOrders = computed(() => orders.value.length > 0)

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function paymentLabel(status: string) {
  return paymentLabels[status] ?? status
}

function goToOrder(id: string) {
  router.push(`/orders/${id}`)
}

async function loadOrders() {
  loading.value = true
  errorMessage.value = ''

  try {
    orders.value = await getMyMartOrders()
  } catch (cause) {
    errorMessage.value = cause instanceof Error
      ? cause.message
      : 'Không thể tải lịch sử đơn hàng.'
  } finally {
    loading.value = false
  }
}

onMounted(loadOrders)
</script>

<template>
  <main class="orders-page">
    <header class="orders-hero">
      <div class="orders-hero__copy">
        <span class="kicker">LỊCH SỬ · ĐƠN HÀNG</span>
        <h1>Đơn hàng của tôi.</h1>
        <p class="orders-lead">Theo dõi thanh toán, chuẩn bị hàng và thời điểm nhận đồ tại văn phòng.</p>
      </div>
      <button type="button" class="orders-refresh" :disabled="loading" @click="loadOrders">
        <RefreshCw :size="15" :class="{ spinning: loading }" aria-hidden="true" />
        Làm mới
      </button>
    </header>

    <div v-if="errorMessage" class="orders-alert" role="alert">{{ errorMessage }}</div>

    <div v-if="loading && !hasOrders" class="orders-loading" role="status">
      <div class="profile-spin"></div>
      <span class="orders-loading-text">Đang tải đơn hàng…</span>
    </div>

    <section v-else-if="hasOrders" class="order-list" aria-label="Danh sách đơn hàng">
      <article
        v-for="order in orders"
        :key="order.id"
        class="order-card"
        @click="goToOrder(order.id)"
        role="button"
        tabindex="0"
        @keydown.enter="goToOrder(order.id)"
        @keydown.space.prevent="goToOrder(order.id)"
      >
        <div class="order-card__topline">
          <div>
            <span class="order-number">{{ order.orderNumber }}</span>
            <small>{{ formatDate(order.createdAt) }}</small>
          </div>
          <span class="status-pill" :class="`status-${order.status}`">
            {{ statusLabels[order.status] }}
          </span>
        </div>

        <div class="order-card__body">
          <div class="order-facts">
            <div>
              <span>Nhận hàng</span>
              <strong>{{ order.fulfillmentMethod === 'pickup' ? 'Tự đến quầy / kho' : 'Giao tại chỗ' }}</strong>
            </div>
            <div>
              <span>Thanh toán</span>
              <strong>{{ paymentLabel(order.paymentStatus) }}</strong>
            </div>
            <div>
              <span>Số món</span>
              <strong>{{ order.itemCount }}</strong>
            </div>
          </div>

          <div class="order-total">
            <span>Tổng cộng</span>
            <strong>{{ formatCurrency(order.grandTotal) }}</strong>
          </div>
        </div>

        <div class="order-card__footer">
          <small v-if="order.deliveryLocation">{{ order.deliveryLocation }}</small>
          <span v-else />
          <span class="order-link" @click.stop>
            {{ order.status === 'pending_payment' ? 'Tiếp tục thanh toán' : 'Xem chi tiết' }}
            <ArrowUpRight :size="14" aria-hidden="true" />
          </span>
        </div>
      </article>
    </section>

    <section v-else class="orders-empty orders-empty--card">
      <div class="orders-empty__mark"><ReceiptText :size="56" :stroke-width="1.5" aria-hidden="true" /></div>
      <h2>Chưa có đơn hàng nào.</h2>
      <p>Đặt món đầu tiên để lịch sử mua hàng xuất hiện ở đây.</p>
      <RouterLink class="profile-btn" to="/products">Xem sản phẩm</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.orders-page {
  min-height: calc(100svh - 88px);
  padding: 112px 6vw 100px;
  background: var(--paper);
  color: var(--ink);
}
.orders-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 46px;
  flex-wrap: wrap;
}
.orders-hero__copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.kicker {
  font-family: var(--font-ui);
  font-size: var(--fs-kicker);
  font-weight: var(--ds-weight-semibold);
  letter-spacing: var(--tracking-kicker);
  text-transform: uppercase;
  color: var(--on-yellow);
  background: var(--yellow);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 11px;
  border-radius: var(--ds-radius-pill);
  border: 2px solid var(--ink);
  box-shadow: 3px 3px 0 var(--ink);
}
.orders-hero h1 {
  font-family: var(--font-display);
  font-size: clamp(42px, 6vw, 76px);
  line-height: 1;
  margin: 6px 0 0;
  text-wrap: balance;
}
.orders-lead {
  max-width: 34em;
  margin: 10px 0 0;
  color: var(--muted-foreground);
  font-size: var(--fs-lead);
  line-height: var(--lh-body);
}
.orders-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px solid var(--ink);
  border-radius: var(--ds-radius-pill);
  background: var(--yellow);
  color: var(--ink);
  font-family: var(--font-ui);
  font-weight: var(--ds-weight-heavy);
  padding: 11px 18px;
  font-size: var(--fs-md);
  box-shadow: 4px 4px 0 var(--ink);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}
.orders-refresh:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 6px 6px 0 var(--ink);
}
.orders-refresh:disabled {
  cursor: wait;
  opacity: 0.55;
  box-shadow: none;
}
.orders-refresh .spinning {
  animation: profileSpin 0.8s linear infinite;
}
.orders-alert {
  margin-bottom: 20px;
  padding: 13px 16px;
  border-radius: 14px;
  border: 2px solid var(--red-ink);
  background: #fdecec;
  color: var(--red-ink);
  font-family: var(--font-ui);
  font-weight: var(--ds-weight-semibold);
  font-size: var(--fs-sm);
}
.orders-loading {
  display: grid;
  place-items: center;
  gap: 12px;
  padding: 26px 0;
  color: var(--muted-foreground);
}
.orders-loading-text {
  font-family: var(--font-ui);
  font-weight: var(--ds-weight-semibold);
}

/* ---------- list ---------- */
.order-list {
  display: grid;
  gap: 18px;
  max-width: 980px;
}
.order-card {
  position: relative;
  background: var(--paper);
  border: 2px solid var(--ink);
  border-radius: 24px;
  padding: 24px 26px;
  box-shadow: 6px 6px 0 var(--ink);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  overflow: hidden;
}
.order-card::before {
  content: '';
  position: absolute;
  inset: 0 -40px -40px 0;
  background: var(--yellow);
  opacity: 0.12;
  z-index: 0;
  transform: rotate(-2deg);
  transform-origin: top left;
  pointer-events: none;
}
.order-card > * {
  position: relative;
  z-index: 1;
}
.order-card:hover {
  transform: translate(-1px, -1px);
  box-shadow: 8px 8px 0 var(--ink);
}
.order-card__topline, .order-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.order-number {
  display: block;
  font-family: var(--font-display);
  font-weight: var(--ds-weight-heavy);
  font-size: 15px;
  letter-spacing: 0.02em;
  color: var(--ink);
}
.order-card small {
  display: block;
  margin-top: 4px;
  color: var(--muted-foreground);
  font-size: 12px;
}
.status-pill {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: var(--ds-weight-semibold);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 6px 11px;
  border-radius: var(--ds-radius-pill);
  border: 2px solid var(--ink);
  white-space: nowrap;
  box-shadow: 3px 3px 0 var(--ink);
}
.status-pending_payment, .status-expired {
  background: var(--cream);
  color: #935b00;
  border-color: var(--ink);
  box-shadow: 3px 3px 0 var(--ink);
}
.status-confirmed, .status-preparing {
  background: #e7e1ff;
  color: #5b35b7;
  border-color: #5b35b7;
  box-shadow: 3px 3px 0 #5b35b7;
}
.status-ready_for_pickup, .status-out_for_delivery, .status-completed {
  background: #d8f5df;
  color: #176b39;
  border-color: #176b39;
  box-shadow: 3px 3px 0 #176b39;
}
.status-cancelled, .status-manual_review {
  background: #ffe1df;
  color: #a22b24;
  border-color: #a22b24;
  box-shadow: 3px 3px 0 #a22b24;
}
.order-card__body {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: end;
  margin-top: 24px;
}
.order-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.order-facts div {
  display: grid;
  gap: 5px;
}
.order-facts span, .order-total span {
  color: var(--muted-foreground);
  font-size: 12px;
}
.order-facts strong {
  font-size: 14px;
}
.order-total {
  display: grid;
  gap: 5px;
  text-align: right;
}
.order-total strong {
  font-family: var(--font-display);
  font-size: 28px;
  line-height: 1;
  color: var(--ink);
}
.order-card__footer {
  margin-top: 22px;
  border-top: 1px solid #ded5ca;
  padding-top: 16px;
}
.order-card__footer small {
  max-width: 28em;
  margin: 0;
  color: var(--muted-foreground);
  font-size: 12px;
}
.order-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 2px solid var(--ink);
  border-radius: var(--ds-radius-pill);
  background: var(--yellow);
  color: var(--ink);
  font-family: var(--font-ui);
  font-weight: var(--ds-weight-heavy);
  padding: 8px 13px;
  font-size: 12px;
  box-shadow: 3px 3px 0 var(--ink);
  white-space: nowrap;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.order-link:hover {
  transform: translate(-1px, -1px);
  box-shadow: 5px 5px 0 var(--ink);
}

/* ---------- empty ---------- */
.orders-empty {
  display: grid;
  place-items: center;
  gap: 16px;
  padding: 40px 20px;
  text-align: center;
  border: 2px dashed #b9aea3;
  border-radius: 24px;
  max-width: 560px;
  margin: 0 auto;
}
.orders-empty__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.orders-empty__mark svg,
.orders-empty__mark [stroke] {
  width: 56px;
  height: 56px;
}
.orders-empty h2 {
  font-family: var(--font-display);
  font-size: clamp(30px, 5vw, 48px);
  line-height: 1.15;
  margin: 0;
}
.orders-empty p {
  margin: 6px 0 18px;
  color: var(--muted-foreground);
  font-size: var(--fs-md);
  line-height: var(--lh-body);
}

.profile-spin {
  width: 30px;
  height: 30px;
  border: 3px solid #e2d8c2;
  border-top-color: var(--ink);
  border-radius: 50%;
  animation: profileSpin 0.8s linear infinite;
}
@keyframes profileSpin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .order-card, .orders-refresh, .order-link {
    transition: none;
  }
  .profile-spin {
    animation: none;
  }
}
@media (max-width: 700px) {
  .orders-hero {
    align-items: stretch;
    flex-direction: column;
  }
  .orders-refresh {
    width: 100%;
  }
  .order-card__body {
    grid-template-columns: 1fr;
    align-items: start;
  }
  .order-facts {
    grid-template-columns: 1fr 1fr;
  }
  .order-total {
    text-align: left;
  }
  .order-card__footer {
    align-items: flex-start;
    flex-direction: column;
  }
  .order-link {
    width: 100%;
  }
}
</style>
