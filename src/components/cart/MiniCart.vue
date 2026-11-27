<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { X, MapPin, ArrowRight } from 'lucide-vue-next'
import { useCartStore } from '../../stores/cartStore'
import { useFloorStore } from '../../stores/floorStore'
import CartItem from './CartItem.vue'
const cart = useCartStore()
const floor = useFloorStore()
const drawerEl = ref(null)
const closeEl = ref(null)
let lastTrigger = null

function close() {
  cart.open = false
}
function focusables() {
  if (!drawerEl.value) return []
  return Array.from(
    drawerEl.value.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(node => node.offsetParent !== null)
}
function onKeydown(event) {
  if (!cart.open) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab') return
  const list = focusables()
  if (!list.length) return
  const first = list[0]
  const last = list[list.length - 1]
  const inside = drawerEl.value?.contains(document.activeElement)
  if (event.shiftKey && (document.activeElement === first || !inside)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
watch(
  () => cart.open,
  async open => {
    if (open) {
      lastTrigger = document.activeElement
      await nextTick()
      closeEl.value?.focus({ preventScroll: true })
    } else if (lastTrigger) {
      lastTrigger.focus?.({ preventScroll: true })
      lastTrigger = null
    }
  }
)
onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>
<template>
  <div class="minicart-overlay" v-if="cart.open" @click="close"></div>
  <aside
    ref="drawerEl"
    class="minicart"
    :class="{ open: cart.open }"
    role="dialog"
    aria-modal="true"
    aria-label="Giỏ hàng"
    :aria-hidden="cart.open ? undefined : 'true'"
  >
    <div class="minicart__head">
      <div>
        <span class="kicker minicart__kicker">GIỎ HÀNG · TẠM THỜI</span>
        <h2 class="minicart__title">Giỏ hàng 🛒</h2>
      </div>
      <button ref="closeEl" type="button" aria-label="Đóng giỏ hàng" @click="close">
        <X :size="18" />
      </button>
    </div>

    <div class="minicart__items">
      <CartItem v-for="item in cart.items" :key="item.id" :item="item" />
      <div v-if="!cart.items.length" class="minicart__empty">
        <div class="minicart__empty__mark">🛒</div>
        <p class="minicart__empty__text">Giỏ hàng đang chờ một món thật vui 🍿</p>
      </div>
    </div>

    <div class="minicart__bottom">
      <div class="minicart__pickup">
        <MapPin :size="14" aria-hidden="true" />
        <span>Nhận tại tầng {{ floor.floor }}</span>
      </div>
      <div class="minicart__total">
        <span>Tổng cộng</span>
        <b class="tabular-nums">{{ cart.total.toLocaleString('vi-VN') }} ₫</b>
      </div>
      <RouterLink
        to="/checkout"
        class="minicart__cta"
        :class="{ disabled: !cart.items.length }"
        :aria-disabled="!cart.items.length"
        @click="close"
      >
        Thanh toán QR <ArrowRight :size="15" aria-hidden="true" />
      </RouterLink>
    </div>
  </aside>
</template>

<style scoped>
.minicart-overlay {
  position: fixed;
  inset: 0;
  background: #0008;
  z-index: 40;
  backdrop-filter: blur(2px);
}
.minicart {
  position: fixed;
  top: 0;
  right: -470px;
  width: min(450px, 100%);
  height: 100vh;
  background: var(--cream);
  z-index: 50;
  transition: right 0.35s var(--ds-ease);
  display: flex;
  flex-direction: column;
  box-shadow: -6px 0 0 var(--ink);
}
.minicart.open {
  right: 0;
}
.minicart__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 20px 16px;
  border-bottom: 2px solid var(--ink);
  background: var(--paper);
}
.minicart__kicker {
  margin: 0;
}
.minicart__title {
  font-family: var(--font-display);
  font-size: clamp(26px, 4vw, 36px);
  line-height: 1.1;
  margin: 4px 0 0;
  letter-spacing: var(--tracking-display);
}
.minicart__head button {
  all: unset;
  width: 40px;
  height: 40px;
  border: 2px solid var(--ink);
  border-radius: 50%;
  background: var(--paper);
  color: var(--ink);
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--ink);
}
.minicart__head button:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--ink);
}
.minicart__items {
  flex: 1;
  overflow: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.minicart__empty {
  display: grid;
  place-items: center;
  gap: 12px;
  padding: 40px 20px;
  text-align: center;
  color: var(--muted-foreground);
}
.minicart__empty__mark {
  font-size: 44px;
}
.minicart__empty__text {
  margin: 0;
  font-size: var(--fs-md);
  font-weight: var(--ds-weight-medium);
}
.minicart__bottom {
  padding: 18px 20px 24px;
  border-top: 1px solid #ded5ca;
  background: var(--paper);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.minicart__pickup {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: var(--ds-weight-medium);
  color: var(--ink);
}
.minicart__total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: var(--ds-weight-heavy);
  color: var(--ink);
}
.minicart__total span {
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: var(--ds-weight-medium);
  color: var(--muted-foreground);
}
.minicart__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  border: 2px solid var(--ink);
  border-radius: var(--ds-radius-pill);
  background: var(--yellow);
  color: var(--ink);
  font-family: var(--font-ui);
  font-weight: var(--ds-weight-heavy);
  padding: 12px 20px;
  font-size: var(--fs-md);
  text-decoration: none;
  box-shadow: 4px 4px 0 var(--ink);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.18s ease;
}
.minicart__cta:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 6px 6px 0 var(--ink);
}
.minicart__cta.disabled {
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: none;
}
@media (max-width: 640px) {
  .minicart {
    width: 100%;
  }
}
</style>
