<script setup lang="ts">
import { computed } from "vue";
import { Minus, Plus, X } from "lucide-vue-next";
import { useCartStore } from "../../stores/cartStore";
defineProps({ item: Object });
const cart = useCartStore();

const formatVnd = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
</script>
<template>
  <article class="cart-item" :class="{ 'is-empty': !item.image }">
    <div class="cart-item__visual">
      <img
        v-if="item.image"
        :src="item.image"
        :alt="item.name"
        loading="lazy"
        decoding="async"
      />
      <span v-else class="cart-item__badge">{{ item.name.slice(0, 1).toUpperCase() }}</span>
    </div>
    <div class="cart-item__body">
      <div class="cart-item__head">
        <h3 class="cart-item__name">{{ item.name }}</h3>
        <button
          class="cart-item__remove"
          @click="cart.remove(item.id)"
          aria-label="Xóa món {{ item.name }}"
        >
          <X :size="16" />
        </button>
      </div>
      <p class="cart-item__meta">{{ item.qty }} × {{ formatVnd(item.price) }}</p>
      <div class="cart-item__controls">
        <button
          class="cart-item__qty cart-item__qty--minus"
          @click="cart.change(item.id, -1)"
          aria-label="Giảm số lượng"
        >
          <Minus :size="14" />
        </button>
        <span class="cart-item__qty-value">{{ item.qty }}</span>
        <button
          class="cart-item__qty cart-item__qty--plus"
          @click="cart.change(item.id, 1)"
          aria-label="Tăng số lượng"
        >
          <Plus :size="14" />
        </button>
      </div>
    </div>
    <b class="cart-item__subtotal">{{ formatVnd(item.price * item.qty) }}</b>
  </article>
</template>

<style scoped>
.cart-item {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 16px 0;
  border-bottom: 2px solid var(--ink);
  background: var(--paper);
  position: relative;
}
.cart-item::before {
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
.cart-item > * {
  position: relative;
  z-index: 1;
}
.cart-item:last-child {
  border-bottom: none;
}
.cart-item__visual {
  position: relative;
  width: 72px;
  height: 72px;
  border: 2px solid var(--ink);
  border-radius: 16px;
  background: #fff;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 3px 3px 0 var(--ink);
}
.cart-item__visual img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.cart-item__badge {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-weight: var(--ds-weight-heavy);
  font-size: 18px;
  color: var(--ink);
  background: var(--yellow);
}
.cart-item__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.cart-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.cart-item__name {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: var(--ds-weight-heavy);
  color: var(--ink);
  margin: 0;
  line-height: 1.15;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cart-item__remove {
  all: unset;
  width: 28px;
  height: 28px;
  border: 2px solid var(--ink);
  border-radius: 50%;
  background: var(--paper);
  color: var(--ink);
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 2px 2px 0 var(--ink);
  flex-shrink: 0;
}
.cart-item__remove:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--ink);
}
.cart-item__meta {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: var(--ds-weight-medium);
  color: var(--muted-foreground);
}
.cart-item__controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}
.cart-item__qty {
  width: 34px;
  height: 34px;
  border: 2px solid var(--ink);
  border-radius: 50%;
  background: #fff;
  color: var(--ink);
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 2px 2px 0 var(--ink);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.cart-item__qty:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 var(--ink);
}
.cart-item__qty--minus {
  transform: rotate(180deg);
}
.cart-item__qty-value {
  min-width: 26px;
  text-align: center;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: var(--ds-weight-heavy);
  color: var(--ink);
}
.cart-item__subtotal {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: var(--ds-weight-heavy);
  color: var(--ink);
  white-space: nowrap;
}
@media (prefers-reduced-motion: reduce) {
  .cart-item__qty,
  .cart-item__remove {
    transition: none;
  }
}
</style>
