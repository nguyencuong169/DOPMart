<script setup>
import SectionHeader from "../common/SectionHeader.vue";
import ProductGrid from "./ProductGrid.vue";
defineProps({ products: Array });
</script>
<template>
  <section class="new-strip">
    <SectionHeader
      kicker="FRESH DROP · MỚI LÊN KỆ"
      title="Thử trước đồng nghiệp"
      lead="Những món vừa cập bến kệ DOP Mart trong tuần này — số lượng còn ít."
      cta="Bắt món mới"
      to="/new"
    />
    <ProductGrid :products="products.slice(0, 4)" />
  </section>
</template>

