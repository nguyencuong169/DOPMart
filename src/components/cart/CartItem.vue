<script setup>
import { Minus, Plus, X } from "lucide-vue-next";
import { useCartStore } from "../../stores/cartStore";
defineProps({ item: Object });
const cart = useCartStore();
</script>
<template>
  <div class="cart-item">
    <img :src="item.image" :alt="item.name" loading="lazy" decoding="async" />
    <div>
      <b>{{ item.name }}</b
      ><small>{{ item.price.toLocaleString("vi-VN") }} ₫</small>
      <div class="quantity">
        <button @click="cart.change(item.id, -1)" aria-label="Giảm số lượng"><Minus /></button
        ><span>{{ item.qty }}</span
        ><button @click="cart.change(item.id, 1)" aria-label="Tăng số lượng"><Plus /></button
        ><button class="remove" @click="cart.remove(item.id)" :aria-label="`Xóa ${item.name}`"><X /></button>
      </div>
    </div>
  </div>
</template>
