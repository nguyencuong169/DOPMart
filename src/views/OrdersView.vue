<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { ArrowUpRight, ClipboardList, RefreshCw } from 'lucide-vue-next'
import { getMyMartOrders } from '../services/martOrderService'
import type { MartOrderStatus, MartOrderSummary } from '../types/mart-order'

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
  <main class="page orders-page">
    <header class="orders-hero">
      <div>
        <span class="kicker">YOUR DOP MART</span>
        <h1>Đơn hàng của tôi.</h1>
        <p class="orders-lead">Theo dõi thanh toán, chuẩn bị hàng và thời điểm nhận đồ tại văn phòng.</p>
      </div>
      <button type="button" class="refresh-button" :disabled="loading" @click="loadOrders">
        <RefreshCw :size="16" :class="{ spinning: loading }" aria-hidden="true" />
        Làm mới
      </button>
    </header>

    <div v-if="errorMessage" class="orders-alert" role="alert">{{ errorMessage }}</div>

    <div v-if="loading && !hasOrders" class="orders-empty" role="status">
      Đang tải đơn hàng…
    </div>

    <section v-else-if="hasOrders" class="order-list" aria-label="Danh sách đơn hàng">
      <article v-for="order in orders" :key="order.id" class="order-card">
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
          <RouterLink class="order-link" :to="`/checkout?order=${order.id}`">
            {{ order.status === 'pending_payment' ? 'Tiếp tục thanh toán' : 'Xem chi tiết' }}
            <ArrowUpRight :size="15" aria-hidden="true" />
          </RouterLink>
        </div>
      </article>
    </section>

    <section v-else class="orders-empty orders-empty--card">
      <ClipboardList :size="30" aria-hidden="true" />
      <h2>Chưa có đơn hàng nào.</h2>
      <p>Đặt món đầu tiên để lịch sử mua hàng xuất hiện ở đây.</p>
      <RouterLink class="shop-link" to="/products">Xem sản phẩm</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.orders-page { min-height: calc(100svh - 96px); padding-block: clamp(32px, 6vw, 80px) 96px; }
.orders-hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 40px; }
.orders-hero h1 { max-width: 12ch; margin: 10px 0 12px; font-family: var(--font-display); font-size: clamp(46px, 7vw, 84px); line-height: .92; letter-spacing: -.05em; }
.orders-lead { max-width: 56ch; margin: 0; color: #645b53; line-height: 1.55; }
.refresh-button, .order-link, .shop-link { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 2px solid var(--ink); border-radius: 12px; background: #ffd338; padding: 11px 15px; color: var(--ink); font-weight: 900; text-decoration: none; cursor: pointer; box-shadow: 3px 3px 0 var(--ink); }
.refresh-button:disabled { cursor: wait; opacity: .55; box-shadow: none; }
.refresh-button .spinning { animation: spin .8s linear infinite; }
.orders-alert { margin-bottom: 20px; border: 1.5px solid #b42318; border-radius: 12px; background: #fff1f0; padding: 13px 15px; color: #8e1c16; font-weight: 700; }
.order-list { display: grid; gap: 16px; max-width: 920px; }
.order-card { border: 2px solid var(--ink); border-radius: 20px; background: #fffdf7; box-shadow: 5px 5px 0 var(--ink); padding: 22px; }
.order-card__topline, .order-card__footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.order-number { display: block; font-weight: 900; letter-spacing: .02em; }
.order-card small { display: block; margin-top: 5px; color: #756a61; font-size: 12px; }
.status-pill { display: inline-flex; border-radius: 999px; padding: 7px 10px; font-size: 12px; font-weight: 900; white-space: nowrap; }
.status-pending_payment, .status-expired { background: #fff0c2; color: #935b00; }
.status-confirmed, .status-preparing { background: #e7e1ff; color: #5b35b7; }
.status-ready_for_pickup, .status-out_for_delivery, .status-completed { background: #d8f5df; color: #176b39; }
.status-cancelled, .status-manual_review { background: #ffe1df; color: #a22b24; }
.order-card__body { display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: end; margin-top: 24px; }
.order-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.order-facts div { display: grid; gap: 5px; }
.order-facts span, .order-total span { color: #756a61; font-size: 12px; }
.order-facts strong { font-size: 14px; }
.order-total { display: grid; gap: 5px; text-align: right; }
.order-total strong { font-family: var(--font-display); font-size: 28px; line-height: 1; }
.order-card__footer { margin-top: 22px; border-top: 1px solid #ded5ca; padding-top: 16px; }
.order-card__footer small { max-width: 50ch; margin: 0; }
.order-link { border-width: 1.5px; padding: 8px 10px; font-size: 12px; box-shadow: 2px 2px 0 var(--ink); white-space: nowrap; }
.orders-empty { display: grid; justify-items: center; gap: 10px; padding: 40px 20px; color: #756a61; text-align: center; }
.orders-empty--card { max-width: 680px; border: 2px dashed #b9aea3; border-radius: 20px; }
.orders-empty h2, .orders-empty p { margin: 0; }
.orders-empty h2 { color: var(--ink); font-family: var(--font-display); font-size: 30px; }
.shop-link { margin-top: 8px; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 700px) {
  .orders-hero { align-items: stretch; flex-direction: column; }
  .refresh-button { width: 100%; }
  .order-card__body { grid-template-columns: 1fr; align-items: start; }
  .order-facts { grid-template-columns: 1fr 1fr; }
  .order-total { text-align: left; }
  .order-card__footer { align-items: flex-start; flex-direction: column; }
  .order-link { width: 100%; }
}
</style>
