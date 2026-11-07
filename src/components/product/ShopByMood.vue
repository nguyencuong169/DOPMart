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
      title="Hôm nay bạn thèm gì?"
      lead="Sáu kệ hàng, sáu kiểu thèm khác nhau — từ đồ mặn, đồ cay tới bữa nhanh và soda lạnh. Chạm một kệ để xem toàn bộ món bên trong."
      cta="Xem tủ snack"
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
        <span class="cat-card__head">
          <i class="cat-card__dot" aria-hidden="true"></i>
          <b class="cat-card__name">{{ shelf.name }}</b>
          <span class="cat-card__count">{{ shelf.count }} món</span>
          <em class="cat-card__tag">{{ shelf.tagline }}</em>
        </span>
        <span class="cat-card__stage">
          <img :src="shelf.image" alt="" loading="lazy" decoding="async" />
          <i class="cat-card__rail" aria-hidden="true"></i>
        </span>
        <span class="cat-card__foot">
          <span class="cat-card__from">từ {{ shelf.from.toLocaleString("vi-VN") }} ₫</span>
          <span class="cat-card__go">Xem <ArrowUpRight :size="15" /></span>
        </span>
      </RouterLink>
    </div>
  </section>
</template>
