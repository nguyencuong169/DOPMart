<script setup>
import { watch, computed } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "./stores/userStore";
import AppHeader from "./components/layout/AppHeader.vue";
import AppFooter from "./components/layout/AppFooter.vue";
import MobileNav from "./components/layout/MobileNav.vue";
import MiniCart from "./components/cart/MiniCart.vue";
import ProductQuickView from "./components/product/ProductQuickView.vue";

const route = useRoute();
const userStore = useUserStore();
userStore.init();

watch(
  () => route.path,
  (newPath) => {
    console.log("Current route:", newPath);
  },
);

const isAdminRoute = computed(() => route.path.startsWith("/admin"));
</script>
<template>
  <div id="top" class="app-shell" role="application">
    <AppHeader v-if="!isAdminRoute" /><RouterView />
    <AppFooter v-if="!isAdminRoute" /><MobileNav v-if="!isAdminRoute" /><MiniCart v-if="!isAdminRoute" /><ProductQuickView v-if="!isAdminRoute" />
  </div>
</template>