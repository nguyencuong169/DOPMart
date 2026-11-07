<script setup>
import { Home, Search, LayoutGrid, ShoppingBag } from "lucide-vue-next";
import { useCartStore } from "../../stores/cartStore";
const cart = useCartStore();
</script>
<template>
  <nav class="mobile-nav" aria-label="Điều hướng nhanh">
    <RouterLink to="/"><Home /><span>Trang chủ</span></RouterLink>
    <RouterLink to="/search"><Search /><span>Tìm món</span></RouterLink>
    <RouterLink to="/products"><LayoutGrid /><span>Sản phẩm</span></RouterLink>
    <button
      type="button"
      :aria-label="`Mở giỏ hàng, ${cart.count} món`"
      @click="cart.open = true"
    >
      <ShoppingBag /><span>Giỏ hàng</span>
      <b v-if="cart.count" class="nav-count" aria-hidden="true">{{ cart.count }}</b>
    </button>
  </nav>
</template>
