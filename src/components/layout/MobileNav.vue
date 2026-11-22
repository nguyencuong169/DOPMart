<script setup>
import { computed } from "vue";
import { Home, Search, LayoutGrid, ShoppingBag } from "lucide-vue-next";
import { useRoute } from "vue-router";
import { useCartStore } from "../../stores/cartStore";
const cart = useCartStore();
const route = useRoute();
const isProductSubpage = computed(() => ["product", "category"].includes(route.name));
</script>
<template>
  <nav class="mobile-nav" aria-label="Điều hướng nhanh">
    <RouterLink to="/"><Home /><span>Trang chủ</span></RouterLink>
    <RouterLink to="/search"><Search /><span>Tìm món</span></RouterLink>
    <RouterLink to="/products" custom v-slot="{ href, navigate, isExactActive }">
      <a
        :href="href"
        :class="{ 'router-link-active': isExactActive || isProductSubpage }"
        :aria-current="isExactActive ? 'page' : isProductSubpage ? 'location' : undefined"
        @click="navigate"
      ><LayoutGrid /><span>Sản phẩm</span></a>
    </RouterLink>
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
