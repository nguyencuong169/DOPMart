<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { X, MapPin, ArrowRight } from "lucide-vue-next";
import { useCartStore } from "../../stores/cartStore";
import { useFloorStore } from "../../stores/floorStore";
import CartItem from "./CartItem.vue";
const cart = useCartStore(),
  floor = useFloorStore();
const drawerEl = ref(null);
const closeEl = ref(null);
let lastTrigger = null;

function close() {
  cart.open = false;
}
function focusables() {
  if (!drawerEl.value) return [];
  return Array.from(
    drawerEl.value.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((node) => node.offsetParent !== null);
}
/* the drawer is modal: Escape closes it and Tab cycles inside */
function onKeydown(event) {
  if (!cart.open) return;
  if (event.key === "Escape") {
    event.preventDefault();
    close();
    return;
  }
  if (event.key !== "Tab") return;
  const list = focusables();
  if (!list.length) return;
  const first = list[0];
  const last = list[list.length - 1];
  const inside = drawerEl.value?.contains(document.activeElement);
  if (event.shiftKey && (document.activeElement === first || !inside)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
watch(
  () => cart.open,
  async (open) => {
    if (open) {
      lastTrigger = document.activeElement;
      await nextTick();
      closeEl.value?.focus({ preventScroll: true });
    } else if (lastTrigger) {
      lastTrigger.focus?.({ preventScroll: true });
      lastTrigger = null;
    }
  }
);
onMounted(() => document.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
</script>
<template>
  <div class="overlay" v-if="cart.open" @click="close"></div>
  <aside
    ref="drawerEl"
    class="cart-drawer"
    :class="{ open: cart.open }"
    role="dialog"
    aria-modal="true"
    aria-label="Giỏ hàng"
    :aria-hidden="cart.open ? undefined : 'true'"
  >
    <div class="drawer-head">
      <div>
        <small>YOUR HAPPY CART</small>
        <h2>Giỏ hàng 🛒</h2>
      </div>
      <button ref="closeEl" type="button" aria-label="Đóng giỏ hàng" @click="close"><X /></button>
    </div>
    <div class="cart-items">
      <CartItem v-for="i in cart.items" :key="i.id" :item="i" />
      <div v-if="!cart.items.length" class="empty-cart">
        Giỏ hàng đang chờ một món thật vui 🍿
      </div>
    </div>
    <div class="cart-bottom">
      <div class="pickup"><MapPin /> Nhận tại tầng {{ floor.floor }}</div>
      <div class="total">
        <span>Tổng cộng</span><b>{{ cart.total.toLocaleString("vi-VN") }} ₫</b>
      </div>
      <RouterLink
        to="/checkout"
        class="checkout"
        :class="{ disabled: !cart.items.length }"
        :aria-disabled="!cart.items.length"
        @click="close"
        >Thanh toán QR <ArrowRight
      /></RouterLink>
    </div>
  </aside>
</template>
