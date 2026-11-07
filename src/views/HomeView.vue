<script setup>
import { computed } from "vue";
import { useProductStore } from "../stores/productStore";
import { useFavoriteStore } from "../stores/favoriteStore";
import HeroCarousel from "../components/product/HeroCarousel.vue";
import ShopByMood from "../components/product/ShopByMood.vue";
import PromotionShowcase from "../components/product/PromotionShowcase.vue";
import NewProductsSection from "../components/product/NewProductsSection.vue";
import FavoriteFocus from "../components/product/FavoriteFocus.vue";
import BestSellerSpotlight from "../components/product/BestSellerSpotlight.vue";
import OrderProcess from "../components/common/OrderProcess.vue";
import AboutTeaser from "../components/common/AboutTeaser.vue";

const store = useProductStore();
const favorites = useFavoriteStore();
const homeNewProducts = computed(() => store.newProducts.slice(0, 4));
</script>
<template>
  <main class="home">
    <HeroCarousel />
    <ShopByMood />
    <PromotionShowcase />
    <NewProductsSection :products="homeNewProducts" />
    <BestSellerSpotlight />
    <OrderProcess />
    <AboutTeaser />
    <FavoriteFocus v-if="favorites.ids.length > 1" />
  </main>
</template>

