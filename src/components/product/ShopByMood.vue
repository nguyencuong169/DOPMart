<script setup>
import { computed } from "vue";
import { ArrowRight } from "lucide-vue-next";
import { useProductStore } from "../../stores/productStore";
const store = useProductStore();
const moods = computed(() =>
  store.categories
    .map((category, index) => ({
      category,
      product: store.products
        .filter((p) => p.category === category.slug)
        .sort((a, b) => b.sold - a.sold)[0],
      index,
    }))
    .filter((x) => x.product)
);
</script>
<template>
  <section class="mood-section">
    <div class="mood-heading">
      <div>
        <span class="kicker">SHOP BY MOOD</span>
        <h2>Hôm nay bạn muốn ăn gì?</h2>
      </div>
      <RouterLink to="/products">Xem toàn bộ catalog <ArrowRight /></RouterLink>
    </div>
    <div class="mood-grid">
      <article
        v-for="m in moods"
        :key="m.category.slug"
        class="mood-card"
        :style="{ '--mood-color': m.product.color }"
      >
        <div class="mood-index">0{{ m.index + 1 }}</div>
        <div class="mood-product">
          <img :src="m.product.image" :alt="m.product.name" />
        </div>
        <div class="mood-info">
          <span>{{ m.category.icon }} {{ m.category.name }}</span>
          <h3>{{ m.product.name }}</h3>
          <b>{{ m.product.price.toLocaleString("vi-VN") }} ₫</b
          ><RouterLink :to="`/category/${m.category.slug}`"
            >Xem tất cả {{ m.category.name }} <ArrowRight
          /></RouterLink>
        </div>
      </article>
    </div>
  </section>
</template>
