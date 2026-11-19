<script setup>
import { computed } from "vue";
defineProps({ products: { type: Array, default: () => [] } });
</script>
<template>
  <section class="new-strip">
    <ProductGrid :products="products" variant="shelf" />
  </section>
</template>
<style scoped>
.new-strip { color: #1a1a1a; }
</style>