<script setup>
import ProductCard from "./ProductCard.vue";
defineProps({ products: Array });
</script>
<template>
  <div class="product-grid bestseller-grid">
    <ProductCard
      v-for="(product, index) in products"
      :key="product.id"
      :product="product"
      :rank="index + 1"
    />
  </div>
</template>
