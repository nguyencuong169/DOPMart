<script setup>
import ProductCard from "./ProductCard.vue";
defineProps({ products: Array });
</script>
<template>
  <div v-if="products.length" class="product-grid">
    <ProductCard v-for="p in products" :key="p.id" :product="p" />
  </div>
  <p v-else class="empty">Chưa tìm thấy món phù hợp.</p>
</template>
