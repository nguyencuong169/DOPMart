<script setup>
import { Minus, Plus, X } from "lucide-vue-next";
import { useCartStore } from "../../stores/cartStore";
defineProps({ item: Object });
const cart = useCartStore();
</script>

<template>
  <article class="cart-item" aria-label="Số lượng {{ item.qty }} × {{ item.name }}">
    <div class="item-image">
      <img :src="item.image" :alt="item.name" loading="lazy" decoding="async" />
    </div>
    <div class="item-details">
      <h3 class="item-name">{{ item.name }}</h3>
      <p class="item-sku">SKU: {{ item.slug }}</p>
      <div class="item-price">
        <span class="item-price-amount">{{ item.price.toLocaleString("vi-VN") }} ₫</span>
        <span class="item-price-qty">× {{ item.qty }}</span>
      </div>
    </div>
    <div class="item-actions">
      <div class="quantity-selector">
        <button @click="cart.change(item.id, -1)" aria-label="Giảm số lượng"><Minus /></button>
        <span class="quantity-value">{{ item.qty }}</span>
        <button @click="cart.change(item.id, 1)" aria-label="Tăng số lượng"><Plus /></button>
      </div>
      <button class="remove-btn" @click="cart.remove(item.id)" aria-label="Xóa món {{ item.name}}">
        <X />
      </button>
    </div>
  </article>
</template>

<style scoped>
.cart-item {
  display: grid;
  grid-template-columns: 80px 1fr 120px;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(26, 26, 26, 0.1);
  align-items: start;
  transition: background 0.2s;
}
.cart-item:hover {
  background: rgba(26, 26, 26, 0.03);
}
.cart-item:focus-within {
  outline: 2px solid var(--mango-glow);
  outline-offset: 1px;
}
.cart-item:focus-within .item-name {
  color: var(--midnight-dream);
}

.item-image {
  grid-row: 1 / -1;
  width: 80px;
  flex-shrink: 0;
}
.item-image img {
  width: 100%;
  height: auto;
  border-radius: 0;
  object-fit: contain;
  border: 1px solid rgba(26, 26, 26, 0.1);
}

.item-details {
  padding-top: 0.25rem;
}
.item-name {
  font-family: "Bricolage Grotesque", sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--ink-well);
  margin-bottom: 0.25rem;
  line-height: 1.4;
}
.item-sku {
  font-size: 0.75rem;
  color: rgba(26, 26, 26, 0.5);
  margin-bottom: 0.5rem;
  font-family: "Bricolage Grotesque", sans-serif;
  letter-spacing: 0.05em;
}
.item-price {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  margin-top: 0.25rem;
}
.item-price-amount {
  font-family: "Bricolage Grotesque", sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--mango-glow);
}
.item-price-qty {
  font-size: 0.75rem;
  color: rgba(26, 26, 26, 0.5);
  font-family: "Bricolage Grotesque", sans-serif;
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: end;
}
.quantity-selector {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.quantity-value {
  min-width: 24px;
  text-align: center;
  font-family: "Bricolage Grotesque", sans-serif;
  font-size: 0.875rem;
  color: var(--ink-well);
}
.remove-btn {
  all: unset;
  cursor: pointer;
  padding: 0 0.5rem;
  height: 24px;
  font-size: 1rem;
  color: var(--ink-well);
  border-radius: 0;
  border: 1px solid rgba(26, 26, 26, 0.2);
  background: transparent;
  font-family: "Bricolage Grotesque", sans-serif;
}
.remove-btn:hover {
  border-color: var(--mango-glow);
  color: var(--mango-glow);
}
</style>