<script setup>
import { computed, onMounted } from "vue";
import { useProductStore } from "../stores/productStore";
import { useFavoriteStore } from "../stores/favoriteStore";
import HeroCarousel from "../components/product/HeroCarousel_V2.vue";
import PromotionShowcase from "../components/product/PromotionShowcase.vue";
import NewProductsSection from "../components/product/NewProductsSection.vue";
import DropComboShowcaseNew from "../components/product/DropComboShowcaseNew.vue";
import FavoriteFocus from "../components/product/FavoriteFocus.vue";
import OrderProcess from "../components/common/OrderProcess.vue";
import AboutTeaser from "../components/common/AboutTeaser.vue";
import WeeklyRanking from "@/components/product/WeeklyRanking.vue";
import SuperDesignPreview from "@/components/product/SuperDesignPreview.vue";

const store = useProductStore();
const favorites = useFavoriteStore();
onMounted(() => {
  store.init();
  favorites.init();
});
const homeNewProducts = computed(() => store.newProducts.slice(0, 4));
</script>
<template>
  <main class="home">
    <HeroCarousel />
    <SuperDesignPreview />
    <PromotionShowcase />
    <NewProductsSection :products="homeNewProducts" />
    <DropComboShowcaseNew />
    <WeeklyRanking />
    <FavoriteFocus v-if="favorites.ids.length > 1" />
    <OrderProcess />
    <AboutTeaser />
  </main>
</template>
