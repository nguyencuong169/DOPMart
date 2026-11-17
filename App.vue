<script setup>
import AppHeader from "./components/layout/AppHeader.vue";
import AppFooter from "./components/layout/AppFooter.vue";
import MobileNav from "./components/layout/MobileNav.vue";
import MiniCart from "./components/cart/MiniCart.vue";
import ProductQuickView from "./components/product/ProductQuickView.vue";
import { onMounted } from "vue";
import { supabase } from "../utils/supabase";
import { useAuthStore } from "./stores";

const auth = useAuthStore();

onMounted(async () => {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      auth.setUser(user);
    }
  }
});
</script>

<template>
  <div id="top" class="app-shell" role="application">
    <AppHeader />
    <RouterView />
    <AppFooter />
    <MobileNav />
    <MiniCart />
    <ProductQuickView />
  </div>
</template>
