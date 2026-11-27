<script setup>
import { computed } from 'vue'
import { ArrowUpRight } from 'lucide-vue-next'
import { useProductStore } from '../../stores/productStore'
import colaCan from '../../assets/categories/coca-cola.webp'

const store = useProductStore()
const onColor = hex => {
  const n = parseInt(String(hex || '#000000').replace('#', ''), 16)
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return l > 0.62 ? '#0f172a' : '#ffffff'
}

const shelves = computed(() =>
  store.categories.map(category => {
    const products = store.products.filter(product => product.category === category.slug)
    const image =
      category.slug === 'do-uong' ? colaCan : products.find(product => product.image)?.image
    const theme = products.find(product => product.tint)?.tint || category.color
    return { ...category, image, theme, count: products.length }
  })
)
</script>

<template>
  <section id="danh-muc" class="wr-page category-menu" aria-labelledby="shelf-heading">
    <div class="glass-intro">
      <div>
        <span class="shelf-brand">DOP Mart</span>
        <h2 id="shelf-heading">Khám phá<br /><em>kệ hàng</em></h2>
      </div>
      <p>Từ snack giòn đến nước mát, chọn kệ theo món bạn đang thèm.</p>
      <RouterLink to="/products">Xem tất cả sản phẩm <ArrowUpRight :size="18" /></RouterLink>
    </div>
    <nav class="wr-shelf" aria-label="Danh mục DOP Mart">
      <div class="wr-track carousel-scrollbar">
        <RouterLink
          v-for="(shelf, i) in shelves"
          :key="shelf.slug"
          class="wr-card skew-card stagger-in group"
          :to="`/category/${shelf.slug}`"
          :style="{
            '--card-color': shelf.theme,
            '--card-text': onColor(shelf.theme),
            animationDelay: `${(i + 1) * 0.1}s`,
          }"
        >
          <div class="wr-card__divider" aria-hidden="true"></div>
          <div class="wr-card__pattern" aria-hidden="true"></div>
          <h3 class="wr-card__name font-display">{{ shelf.name }}</h3>
          <div class="wr-card__price-block">
            <span class="wr-card__price font-display">{{ shelf.count }} món</span>
            <span class="wr-card__cta">Xem kệ</span>
          </div>
          <div class="wr-card__media shine-effect">
            <img
              v-if="shelf.image"
              class="wr-card__img floating"
              :class="{ 'drink-packshot': shelf.slug === 'do-uong' }"
              :src="shelf.image"
              alt=""
              loading="lazy"
              decoding="async"
              :style="{ animationDelay: `${(i + 1) * 0.5}s` }"
            />
            <span v-else aria-hidden="true">{{ shelf.icon }}</span>
          </div>
        </RouterLink>
      </div>
    </nav>
  </section>
</template>

<style scoped src="./WeeklyRanking.css"></style>
<style scoped>
.category-menu {
  scroll-margin-top: 70px;
}
.category-menu .wr-card__img {
  height: clamp(150px, 16vw, 220px);
  object-fit: contain;
}
.category-menu .drink-packshot {
  padding-block: clamp(15px, 2vw, 27px);
  box-sizing: border-box;
}
.glass-intro {
  align-self: center;
  flex: 0 0 clamp(280px, 23vw, 350px);
}
.glass-intro {
  padding: clamp(18px, 2vw, 32px);
  border: 1px solid #ffffff29;
  border-radius: 20px;
  background: linear-gradient(130deg, #ffffff12, #ffffff04);
}
.shelf-brand {
  color: #ff766b;
  font: 850 1.1rem var(--font-display);
}
.glass-intro h2 {
  margin: 0.55rem 0;
  font: 900 clamp(2rem, 2.8vw, 3rem)/0.97 var(--font-display);
  letter-spacing: -0.045em;
  text-transform: uppercase;
}
.glass-intro em {
  font-style: normal;
  text-shadow: 0 0 14px #ffd70066;
}
.glass-intro p {
  color: #c1ccda;
  margin: 0.8rem 0 1rem;
  line-height: 1.45;
}
.glass-intro a {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 44px;
  padding: 0 0.85rem;
  border-radius: 999px;
  background: white;
  color: #0b1120;
  font-weight: 800;
  text-decoration: none;
}
@media (max-width: 1023px) {
  .glass-intro {
    align-self: stretch;
    flex-basis: auto;
  }
}
.category-menu .wr-card__price {
  font-size: 15px;
  font-weight: 650;
}
.category-menu .wr-card__name {
  min-height: 2lh;
  display: grid;
  place-items: center;
}
@media (min-width: 768px) and (max-width: 1023px) {
  .glass-intro {
    display: flex;
    align-items: center;
    gap: 24px;
  }
  .glass-intro p {
    flex: 1;
  }
  .glass-intro a {
    flex-shrink: 0;
  }
}
</style>
