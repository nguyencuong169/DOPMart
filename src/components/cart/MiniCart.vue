<script setup>
import { X, MapPin, ArrowRight } from "lucide-vue-next";
import { useCartStore } from "../../stores/cartStore";
import { useFloorStore } from "../../stores/floorStore";
import CartItem from "./CartItem.vue";
const cart = useCartStore(),
  floor = useFloorStore();
</script>
<template>
  <div class="overlay" v-if="cart.open" @click="cart.open = false"></div>
  <aside class="cart-drawer" :class="{ open: cart.open }">
    <div class="drawer-head">
      <div>
        <small>YOUR HAPPY CART</small>
        <h2>Giỏ hàng 🛒</h2>
      </div>
      <button aria-label="Đóng giỏ hàng" @click="cart.open = false"><X /></button>
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
        @click="cart.open = false"
        >Thanh toán QR <ArrowRight
      /></RouterLink>
    </div>
  </aside>
</template>
