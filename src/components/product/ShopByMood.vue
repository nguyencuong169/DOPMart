<script setup>
import { computed } from "vue";
import { ArrowUpRight } from "lucide-vue-next";
import SectionHeader from "../common/SectionHeader.vue";
import { useProductStore } from "../../stores/productStore";
const store = useProductStore();
const shelves = computed(() =>
  store.categories
    .map((category) => {
      const items = store.products.filter((p) => p.category === category.slug);
      if (!items.length) return null;
      const top = [...items].sort((a, b) => b.sold - a.sold)[0];
      return {
        ...category,
        count: items.length,
        from: Math.min(...items.map((p) => p.price)),
        image: top.image,
        color: top.color,
      };
    })
    .filter(Boolean)
);
</script>
<template>
  <section class="cat-strip">
    <SectionHeader
      kicker="CHỌN NHANH THEO DANH MỤC"
      title="Hôm nay bạn muốn ăn gì?"
      lead="Tám kệ hàng, tám kiểu thèm khác nhau. Chạm một kệ để xem toàn bộ món bên trong."
      cta="Lục tủ snack"
      to="/products"
    />
    <div class="cat-grid">
      <RouterLink
        v-for="shelf in shelves"
        :key="shelf.slug"
        :to="`/category/${shelf.slug}`"
        class="cat-card"
        :style="{ '--cat-color': shelf.color }"
      >
        <span class="cat-card__copy">
          <b>{{ shelf.name }}</b>
          <small>{{ shelf.count }} món · từ {{ shelf.from.toLocaleString("vi-VN") }} ₫</small>
        </span>
        <ArrowUpRight class="cat-card__arrow" :size="16" />
        <img :src="shelf.image" alt="" loading="lazy" decoding="async" />
      </RouterLink>
    </div>
  </section>
</template>
