<script setup>
import {useProductStore} from '../stores/productStore'
import HeroCarousel from '../components/product/HeroCarousel.vue'
import AboutDopMart from '../components/common/AboutDopMart.vue'
import BestSellerSpotlight from '../components/product/BestSellerSpotlight.vue'
import NewProductsSection from '../components/product/NewProductsSection.vue'
import PromotionShowcase from '../components/product/PromotionShowcase.vue'
import DopComboShowcase from '../components/product/DopComboShowcase.vue'
import ProductShowcase from '../components/product/ProductShowcase.vue'
import FavoriteFocus from '../components/product/FavoriteFocus.vue'
import ShopByMood from '../components/product/ShopByMood.vue'
import OrderProcess from '../components/common/OrderProcess.vue'
import FeedbackSection from '../components/common/FeedbackSection.vue'
const store=useProductStore();const homeNewProducts=store.newProducts.slice(0,4)
</script>
<template><main><HeroCarousel/><section id="about"><AboutDopMart/></section><BestSellerSpotlight/><NewProductsSection :products="homeNewProducts"/><section id="deals"><PromotionShowcase/></section><DopComboShowcase/><ProductShowcase :product="store.newProducts[0]"/><FavoriteFocus/><ShopByMood/><OrderProcess/><FeedbackSection/></main></template>
