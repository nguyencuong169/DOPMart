<script setup>
import { Home, Search, Heart, ShoppingBag } from "lucide-vue-next";
import { useCartStore } from "../../stores/cartStore";
const cart = useCartStore();
</script>
<template>
  <nav class="mobile-nav">
    <RouterLink to="/"><Home />Home</RouterLink
    ><RouterLink to="/search"><Search />Tìm</RouterLink
    ><RouterLink to="/products"><Heart />Món</RouterLink
    ><button @click="cart.open = true">
      <ShoppingBag />Giỏ <b>{{ cart.count }}</b>
    </button>
  </nav>
</template>
