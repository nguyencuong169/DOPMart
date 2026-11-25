<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { ArrowLeft, Check, Clock3, MapPin, PackageCheck, QrCode, WalletCards } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
import { useCartStore } from '../stores/cartStore'
import { useFloorStore } from '../stores/floorStore'
import { useProductStore } from '../stores/productStore'
import { getMartOrder, simulateMockPayment } from '../services/martOrderService'
import { useOrderCheckout } from '../features/ordering/useOrderCheckout'

const cart = useCartStore()
const floor = useFloorStore()
const products = useProductStore()
const route = useRoute()
const {
  method,
  paymentMethod,
  deliveryLocation,
  note,
  submitting,
  result,
  error,
  total,
  canSubmit,
  submit,
  reset,
} = useOrderCheckout(cart, () => products.products)

const formattedTotal = computed(() => formatVnd(total.value))
const order = computed(() => result.value?.order ?? null)
const payment = computed(() => order.value?.payment ?? null)
let paymentPollTimer: ReturnType<typeof window.setInterval> | undefined

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

function stopPaymentPolling() {
  if (paymentPollTimer) {
    window.clearInterval(paymentPollTimer)
    paymentPollTimer = undefined
  }
}

async function loadReturnedOrder(orderId: string) {
  const refresh = async () => {
    try {
      const returnedOrder = await getMartOrder(orderId)
      result.value = { order: returnedOrder, isMock: false }

      if (returnedOrder.payment?.status !== 'pending') {
        stopPaymentPolling()
        await cart.clear()
      }
    } catch {
      // The checkout page remains usable even if a stale return URL is opened.
    }
  }

  await refresh()
  if (result.value?.order.payment?.status === 'pending') {
    let attempts = 0
    paymentPollTimer = window.setInterval(async () => {
      attempts += 1
      await refresh()
      if (attempts >= 30) stopPaymentPolling()
    }, 2_000)
  }
}

function simulatePayment() {
  if (!order.value || !result.value?.isMock) return
  result.value = {
    ...result.value,
    order: simulateMockPayment(order.value.id),
  }
  void cart.clear()
}

async function cancelOrder() {
  stopPaymentPolling()
  reset()
  await cart.init()
}

onMounted(async () => {
  await Promise.all([
    cart.init(),
    floor.init(),
    products.init(),
  ])

  const returnedOrderId = typeof route.query.order === 'string' ? route.query.order : undefined
  if (returnedOrderId) await loadReturnedOrder(returnedOrderId)
})

onUnmounted(stopPaymentPolling)
</script>

<template>
  <main class="checkout-page">
    <header class="checkout-hero">
      <RouterLink class="checkout-back" to="/cart">
        <ArrowLeft :size="17" aria-hidden="true" />
        Quay lại giỏ hàng
      </RouterLink>
      <div class="checkout-hero__copy">
        <span class="kicker">DOP MART · CHECKOUT</span>
        <h1>Đặt món trong vài chạm.</h1>
        <p class="checkout-lead">
          Chọn cách nhận hàng, thanh toán và để DOP Mart lo phần còn lại.
        </p>
      </div>
    </header>

    <div v-if="!order" class="checkout-grid">
      <section class="checkout-card form-card" aria-labelledby="delivery-heading">
        <div class="section-heading">
          <span class="section-index">01</span>
          <div>
            <h2 id="delivery-heading">Nhận hàng</h2>
            <p>Đơn sẽ được giữ sau khi bạn bấm đặt hàng.</p>
          </div>
        </div>

        <div class="choice-grid" role="radiogroup" aria-label="Hình thức nhận hàng">
          <button
            type="button"
            class="choice-card"
            :class="{ active: method === 'pickup' }"
            :aria-pressed="method === 'pickup'"
            @click="method = 'pickup'"
          >
            <PackageCheck :size="22" aria-hidden="true" />
            <span>
              <strong>Tự đến lấy</strong>
              <small>Nhận tại quầy/kho DOP Mart</small>
            </span>
            <Check v-if="method === 'pickup'" class="choice-check" :size="18" aria-hidden="true" />
          </button>

          <button
            type="button"
            class="choice-card"
            :class="{ active: method === 'office_delivery' }"
            :aria-pressed="method === 'office_delivery'"
            @click="method = 'office_delivery'"
          >
            <MapPin :size="22" aria-hidden="true" />
            <span>
              <strong>Giao tại chỗ</strong>
              <small>Giao trong văn phòng</small>
            </span>
            <Check v-if="method === 'office_delivery'" class="choice-check" :size="18" aria-hidden="true" />
          </button>
        </div>

        <label v-if="method === 'office_delivery'" class="field">
          <span>Vị trí giao hàng</span>
          <input
            v-model="deliveryLocation"
            type="text"
            maxlength="255"
            :placeholder="`Ví dụ: Tầng ${floor.floor}, khu A, bàn 12`"
          />
        </label>

        <label class="field">
          <span>Ghi chú cho vận hành <em>không bắt buộc</em></span>
          <textarea
            v-model="note"
            maxlength="500"
            rows="3"
            placeholder="Ví dụ: Giao trước 15:00"
          />
        </label>

        <div class="section-heading payment-heading">
          <span class="section-index">02</span>
          <div>
            <h2>Thanh toán</h2>
            <p>Trạng thái chỉ được xác nhận từ hệ thống thanh toán.</p>
          </div>
        </div>

        <div class="payment-list" role="radiogroup" aria-label="Phương thức thanh toán">
          <button
            type="button"
            class="payment-option"
            :class="{ active: paymentMethod === 'vietqr' }"
            @click="paymentMethod = 'vietqr'"
          >
            <QrCode :size="20" aria-hidden="true" />
            <span>
              <strong>VietQR</strong>
              <small>Chuyển khoản nhanh bằng mã QR</small>
            </span>
            <span class="radio-dot" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="payment-option"
            :class="{ active: paymentMethod === 'momo' }"
            @click="paymentMethod = 'momo'"
          >
            <WalletCards :size="20" aria-hidden="true" />
            <span>
              <strong>MoMo</strong>
              <small>Thanh toán qua ví điện tử</small>
            </span>
            <span class="radio-dot" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="payment-option"
            :class="{ active: paymentMethod === 'zalopay' }"
            @click="paymentMethod = 'zalopay'"
          >
            <WalletCards :size="20" aria-hidden="true" />
            <span>
              <strong>ZaloPay</strong>
              <small>Thanh toán qua ví điện tử</small>
            </span>
            <span class="radio-dot" aria-hidden="true" />
          </button>
        </div>

        <div v-if="error" class="error-box" role="alert">
          {{ error.message }}
        </div>
      </section>

      <aside class="checkout-card summary-card" aria-labelledby="summary-heading">
        <div class="summary-topline">
          <span class="kicker summary-kicker">YOUR ORDER</span>
          <span class="item-count">{{ cart.count }} món</span>
        </div>
        <h2 id="summary-heading">Tóm tắt đơn</h2>

        <div v-if="cart.items.length" class="summary-items">
          <div v-for="item in cart.items" :key="item.id" class="summary-item">
            <div class="summary-item-image">
              <img v-if="item.image" :src="item.image" :alt="item.name" />
              <span v-else>{{ item.name.slice(0, 1) }}</span>
            </div>
            <div class="summary-item-copy">
              <strong>{{ item.name }}</strong>
              <span>{{ item.qty }} × {{ formatVnd(item.price) }}</span>
            </div>
            <b>{{ formatVnd(item.price * item.qty) }}</b>
          </div>
        </div>

        <div v-else class="empty-cart">
          <p>Giỏ hàng đang trống.</p>
          <RouterLink to="/products">Xem sản phẩm</RouterLink>
        </div>

        <div class="summary-breakdown">
          <div class="summary-row">
            <span>Tạm tính</span>
            <b class="tabular-nums">{{ formattedTotal }}</b>
          </div>
          <div class="summary-row summary-row--muted">
            <span>Phí giao hàng</span>
            <span>Miễn phí</span>
          </div>
          <div class="summary-row summary-row--grand">
            <span>Tổng thanh toán</span>
            <b class="tabular-nums">{{ formattedTotal }}</b>
          </div>
        </div>

        <button
          type="button"
          class="submit-button"
          :disabled="!canSubmit"
          @click="submit"
        >
          <span v-if="submitting" class="button-spinner" aria-hidden="true" />
          <span v-else>Đặt hàng · {{ formattedTotal }}</span>
          <span v-if="submitting">Đang kiểm tra tồn kho…</span>
        </button>
        <p class="secure-note">Giá và tồn kho sẽ được xác nhận lại ở bước đặt hàng.</p>
      </aside>
    </div>

    <section v-else class="payment-state checkout-card" aria-live="polite">
      <div class="payment-state-icon" :class="{ success: payment?.status === 'succeeded' }">
        <Check v-if="payment?.status === 'succeeded'" :size="32" aria-hidden="true" />
        <Clock3 v-else :size="32" aria-hidden="true" />
      </div>
      <span class="kicker state-kicker">{{ payment?.status === 'succeeded' ? 'PAYMENT RECEIVED' : 'ORDER CREATED' }}</span>
      <h1>{{ payment?.status === 'succeeded' ? 'Thanh toán thành công.' : 'Đơn đã được giữ hàng.' }}</h1>
      <p class="payment-lead">
        Mã đơn <strong>{{ order.orderNumber }}</strong> · {{ formatVnd(order.grandTotal) }}
      </p>

      <div v-if="payment?.status !== 'succeeded'" class="payment-instructions">
        <div class="qr-placeholder">
          <QrCode :size="52" aria-hidden="true" />
          <span>{{ payment?.checkoutUrl ? 'PayOS đã tạo link VietQR cho đơn này.' : 'QR thanh toán sẽ hiển thị ở đây khi kết nối provider.' }}</span>
        </div>
        <a
          v-if="payment?.checkoutUrl"
          class="submit-button payment-link"
          :href="payment.checkoutUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Mở trang thanh toán PayOS
        </a>
        <p class="demo-note" v-if="result?.isMock">
          Đây là chế độ demo local. Nút dưới mô phỏng webhook thanh toán thành công.
        </p>
        <button v-if="result?.isMock" type="button" class="submit-button" @click="simulatePayment">
          Mô phỏng thanh toán thành công
        </button>
      </div>

      <div v-else class="success-summary">
        <div><span>Hình thức nhận</span><strong>{{ order.fulfillmentMethod === 'pickup' ? 'Tự đến lấy' : 'Giao tại chỗ' }}</strong></div>
        <div v-if="order.deliveryLocation"><span>Vị trí</span><strong>{{ order.deliveryLocation }}</strong></div>
        <div><span>Trạng thái</span><strong>Đang chuẩn bị hàng</strong></div>
      </div>

      <div class="payment-actions">
        <RouterLink class="secondary-button" to="/products">Mua thêm</RouterLink>
        <button v-if="payment?.status !== 'succeeded'" type="button" class="text-button" @click="cancelOrder">
          Tạo lại đơn
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.checkout-page {
  min-height: calc(100svh - 88px);
  padding: 104px 6vw 96px;
  background: var(--paper);
  color: var(--ink);
}
.checkout-page a {
  color: inherit;
  text-decoration: none;
}

/* ---------- hero header ---------- */
.checkout-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 46px;
  flex-wrap: wrap;
}
.checkout-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 2px solid var(--ink);
  border-radius: var(--ds-radius-pill);
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-ui);
  font-weight: var(--ds-weight-heavy);
  padding: 10px 18px;
  font-size: var(--fs-sm);
  box-shadow: 3px 3px 0 var(--ink);
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.checkout-back:hover {
  transform: translate(-1px, -1px);
  box-shadow: 5px 5px 0 var(--ink);
}
.checkout-hero__copy {
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
.checkout-hero h1 {
  font-family: var(--font-display);
  font-size: clamp(42px, 6vw, 76px);
  line-height: 1;
  margin: 6px 0 0;
  letter-spacing: var(--tracking-display);
  text-wrap: balance;
}
.checkout-lead {
  max-width: 52ch;
  margin: 10px 0 0;
  color: var(--muted-foreground);
  font-size: var(--fs-lead);
  line-height: var(--lh-body);
}

/* ---------- grid ---------- */
.checkout-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 22px;
  max-width: 980px;
  margin: 0 auto;
}
@media (min-width: 760px) {
  .checkout-grid {
    grid-template-columns: 1.35fr 0.65fr;
  }
}

/* ---------- cards ---------- */
.checkout-card {
  position: relative;
  background: var(--paper);
  border: 2px solid var(--ink);
  border-radius: 24px;
  padding: 26px;
  box-shadow: 6px 6px 0 var(--ink);
  overflow: hidden;
}
.checkout-card::before {
  content: "";
  position: absolute;
  inset: 0 -40px -40px 0;
  background: var(--yellow);
  opacity: 0.10;
  z-index: 0;
  transform: rotate(-2deg);
  transform-origin: top left;
  pointer-events: none;
}
.checkout-card > * {
  position: relative;
  z-index: 1;
}

/* ---------- form ---------- */
.section-heading {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 24px;
}
.section-index {
  display: grid;
  place-items: center;
  flex: 0 0 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--ink);
  color: #fffdf7;
  font-size: 12px;
  font-weight: 900;
}
.section-heading h2 {
  margin: 0 0 6px;
  font-family: var(--font-display);
  font-size: 30px;
  line-height: 1;
  letter-spacing: var(--tracking-display);
}
.section-heading p {
  margin: 0;
  color: var(--muted-foreground);
  font-size: var(--fs-sm);
  line-height: var(--lh-body);
}
.payment-heading {
  margin-top: 32px;
}
.choice-grid, .payment-list {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}
.choice-card, .payment-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  border: 1.5px solid #c8beb2;
  border-radius: 16px;
  background: #fff;
  color: var(--ink);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}
.choice-card {
  min-height: 88px;
  padding: 18px;
}
.payment-option {
  min-height: 68px;
  padding: 14px 16px;
}
.choice-card:hover, .payment-option:hover,
.choice-card.active, .payment-option.active {
  border-color: var(--ink);
  box-shadow: 3px 3px 0 var(--ink);
  transform: translate(-1px, -1px);
}
.choice-card > span, .payment-option > span:not(.radio-dot) {
  display: grid;
  gap: 4px;
}
.choice-card small, .payment-option small {
  color: #73685f;
  font-size: 12px;
}
.choice-check {
  margin-left: auto;
}
.field {
  display: grid;
  gap: 8px;
  margin-top: 20px;
  font-size: 14px;
  font-weight: var(--ds-weight-semibold);
  color: var(--ink);
}
.field em {
  color: #81776e;
  font-size: 12px;
  font-style: normal;
  font-weight: var(--ds-weight-semibold);
}
.field input, .field textarea {
  width: 100%;
  border: 1.5px solid #c8beb2;
  border-radius: 12px;
  background: #fff;
  padding: 13px 14px;
  color: var(--ink);
  font: inherit;
  font-weight: 500;
  outline: none;
}
.field textarea {
  resize: vertical;
}
.field input:focus, .field textarea:focus {
  border-color: var(--ink);
  box-shadow: 0 0 0 3px rgb(255 211 56 / 45%);
}
.radio-dot {
  width: 18px;
  height: 18px;
  margin-left: auto;
  border: 2px solid #b9aea3;
  border-radius: 50%;
}
.payment-option.active .radio-dot {
  border: 5px solid var(--ink);
}
.error-box {
  margin-top: 20px;
  border: 1.5px solid #b42318;
  border-radius: 12px;
  background: #fff1f0;
  padding: 14px;
  color: #8e1c16;
  font-size: 14px;
  font-weight: 700;
}

/* ---------- summary ---------- */
.summary-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}
.summary-kicker {
  margin: 0;
}
.item-count {
  color: var(--muted-foreground);
  font-size: 13px;
  font-weight: var(--ds-weight-heavy);
}
.summary-items {
  display: grid;
  gap: 14px;
  margin: 22px 0;
}
.summary-item {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}
.summary-item-image {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  overflow: hidden;
  border-radius: 12px;
  background: #f1e9dc;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 900;
}
.summary-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.summary-item-copy {
  display: grid;
  min-width: 0;
  gap: 4px;
}
.summary-item-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--ink);
}
.summary-item-copy span, .summary-item b {
  font-size: 12px;
}
.summary-item-copy span {
  color: var(--muted-foreground);
}
.summary-breakdown {
  border: 2px solid var(--ink);
  border-radius: 20px;
  background: #fffdf7;
  padding: 18px;
  margin-bottom: 24px;
  box-shadow: 5px 5px 0 var(--ink);
}
.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--ink);
}
.summary-row--muted {
  color: var(--muted-foreground);
  font-size: 13px;
  font-weight: var(--ds-weight-medium);
}
.summary-row--grand {
  border-top: 1px solid #ded5ca;
  padding-top: 14px;
  margin-top: 10px;
  font-size: 16px;
  font-weight: var(--ds-weight-heavy);
}
.summary-row--grand b {
  font-family: var(--font-display);
  font-size: 26px;
}
.submit-button, .secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  border: 2px solid var(--ink);
  border-radius: var(--ds-radius-pill);
  background: var(--yellow);
  color: var(--ink);
  font-weight: 900;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--ink);
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}
.submit-button {
  width: 100%;
  margin-top: 24px;
  font-family: var(--font-ui);
  font-weight: var(--ds-weight-heavy);
  padding: 0 18px;
  font-size: var(--fs-md);
}
.secondary-button {
  width: 100%;
  margin-top: 10px;
  font-family: var(--font-ui);
  font-weight: var(--ds-weight-heavy);
  padding: 0 18px;
  font-size: var(--fs-md);
}
.submit-button:hover:not(:disabled), .secondary-button:hover {
  transform: translate(-1px, -1px);
  box-shadow: 5px 5px 0 var(--ink);
}
.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: none;
}
.button-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgb(25 25 25 / 30%);
  border-top-color: var(--ink);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.secure-note {
  margin: 14px 0 0;
  color: var(--muted-foreground);
  font-size: var(--fs-xs);
  line-height: 1.45;
  text-align: center;
}
.empty-cart {
  padding: 24px 0;
  color: var(--muted-foreground);
  text-align: center;
}
.empty-cart a {
  color: var(--ink);
  font-weight: 800;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ---------- payment state ---------- */
.payment-state {
  display: grid;
  justify-items: center;
  max-width: 720px;
  margin: 0 auto;
  padding: clamp(32px, 7vw, 72px) clamp(22px, 5vw, 64px);
  text-align: center;
}
.payment-state-icon {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  margin-bottom: 24px;
  border: 2px solid var(--ink);
  border-radius: 50%;
  background: #ffe9a1;
}
.payment-state-icon.success {
  background: #b9edc4;
}
.state-kicker {
  margin: 0 0 10px;
}
.payment-state h1 {
  max-width: 13ch;
  margin-inline: auto;
  margin-bottom: 12px;
  font-family: var(--font-display);
  font-size: clamp(42px, 6vw, 76px);
  line-height: 1;
  letter-spacing: var(--tracking-display);
}
.payment-lead {
  max-width: 52ch;
  margin: 0 auto 32px;
  color: var(--muted-foreground);
  font-size: var(--fs-md);
  line-height: var(--lh-body);
}
.payment-instructions {
  width: min(100%, 380px);
  margin-top: 24px;
  text-align: left;
}
.qr-placeholder {
  display: grid;
  justify-items: center;
  gap: 10px;
  border: 1.5px dashed #b9aea3;
  border-radius: 16px;
  padding: 32px 20px;
  color: var(--muted-foreground);
  font-size: 13px;
  margin-bottom: 16px;
}
.payment-link {
  width: 100%;
  font-family: var(--font-ui);
  font-weight: var(--ds-weight-heavy);
  font-size: var(--fs-md);
}
.demo-note {
  margin: 16px 0 16px;
  color: var(--muted-foreground);
  font-size: var(--fs-sm);
  line-height: 1.5;
}
.success-summary {
  display: grid;
  width: min(100%, 440px);
  gap: 12px;
  margin-top: 24px;
  text-align: left;
}
.success-summary div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #ded5ca;
  padding-bottom: 12px;
}
.success-summary span {
  color: var(--muted-foreground);
  font-size: var(--fs-sm);
}
.payment-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}
.text-button {
  all: unset;
  border: 2px solid var(--ink);
  border-radius: var(--ds-radius-pill);
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-ui);
  font-weight: var(--ds-weight-heavy);
  padding: 10px 18px;
  font-size: var(--fs-sm);
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--ink);
  text-align: center;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.text-button:hover {
  transform: translate(-1px, -1px);
  box-shadow: 5px 5px 0 var(--ink);
}
@media (max-width: 760px) {
  .checkout-hero {
    align-items: stretch;
    flex-direction: column;
  }
  .checkout-back {
    width: 100%;
    justify-content: center;
  }
  .checkout-grid {
    grid-template-columns: 1fr;
  }
  .summary-card {
    position: static;
  }
}
</style>
