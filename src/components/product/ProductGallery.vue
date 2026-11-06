<script setup>
defineProps({ product: Object });
</script>
<template>
  <div class="detail-image" :style="{ background: product.color }">
    <div class="gallery-orbit"></div>
    <img class="detail-product" :src="product.image" :alt="product.name" />
  </div>
</template>
