<script setup>
import AppHeader from "./components/layout/AppHeader.vue";
import AppFooter from "./components/layout/AppFooter.vue";
import MobileNav from "./components/layout/MobileNav.vue";
import MiniCart from "./components/cart/MiniCart.vue";
import ProductQuickView from "./components/product/ProductQuickView.vue";
</script>
<template>
  <div id="top" class="app-shell">
    <AppHeader /><RouterView /><AppFooter /><MobileNav /><MiniCart /><ProductQuickView />
  </div>
</template>
