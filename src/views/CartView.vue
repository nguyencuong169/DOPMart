<script setup>
import { useCartStore } from "../stores/cartStore";
import CartItem from "../components/cart/CartItem.vue";
const cart = useCartStore();
</script>
<template>
  <main class="page narrow">
    <div class="page-title">
      <span class="kicker">YOUR HAPPY CART</span>
      <h1>Giỏ hàng</h1>
    </div>
    <CartItem v-for="i in cart.items" :key="i.id" :item="i" />
    <div class="total big">
      <span>Tổng cộng</span><b>{{ cart.total.toLocaleString("vi-VN") }} ₫</b>
    </div>
    <RouterLink v-if="cart.items.length" class="checkout" to="/checkout"
      >Tiếp tục thanh toán</RouterLink
    >
    <p v-else class="empty">Chưa có sản phẩm nào.</p>
  </main>
</template>
