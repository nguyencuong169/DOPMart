<script setup>
import { computed } from "vue";
import { ArrowUpRight } from "lucide-vue-next";
import { useProductStore } from "../../stores/productStore";
import colaCan from "../../assets/categories/coca-cola.webp";

const store = useProductStore();
const shelves = computed(() => store.categories.map(category => {
  const products = store.products.filter(product => product.category === category.slug);
  const image = category.slug === "do-uong" ? colaCan : products.find(product => product.image)?.image;
  return { ...category, image, count: products.length };
}));
</script>

<template>
  <section id="danh-muc" class="shelf-menu" aria-labelledby="shelf-heading">
    <div class="glass-intro">
      <div>
        <span class="shelf-brand">DOP Mart</span>
        <h2 id="shelf-heading">Khám phá<br><em>kệ hàng</em></h2>
      </div>
      <p>Từ snack giòn đến nước mát, chọn kệ theo món bạn đang thèm.</p>
      <RouterLink to="/products">Xem tất cả sản phẩm <ArrowUpRight :size="18" /></RouterLink>
    </div>
    <nav class="shelves" aria-label="Danh mục DOP Mart">
      <RouterLink v-for="shelf in shelves" :key="shelf.slug" class="shelf"
        :to="`/category/${shelf.slug}`" :style="{ '--shelf-color': shelf.color }">
        <span class="shelf-label"><strong>{{ shelf.name }}</strong><small>{{ shelf.count }} món</small></span>
        <img v-if="shelf.image" :src="shelf.image" alt="" loading="lazy" decoding="async">
        <span v-else class="shelf-icon" aria-hidden="true">{{ shelf.icon }}</span>
        <ArrowUpRight class="shelf-arrow" :size="21" aria-hidden="true" />
      </RouterLink>
    </nav>
  </section>
</template>

<style scoped>
.shelf-menu {
  display:grid; grid-template-columns:clamp(220px,20vw,300px) minmax(0,1fr);
  align-items:center; gap:clamp(16px,2vw,32px); padding:clamp(28px,4vw,64px) var(--edge,4vw);
  background:#0b1120; color:white; scroll-margin-top:70px;
}
.glass-intro { padding:clamp(18px,2vw,32px); border:1px solid #ffffff29; border-radius:20px; background:linear-gradient(130deg,#ffffff12,#ffffff04); }
.shelf-brand { color:#ff766b; font:850 1.1rem var(--font-display); }
.glass-intro h2 { margin:.55rem 0; font:900 clamp(2rem,3.3vw,3.5rem)/.97 var(--font-display); letter-spacing:-.045em; text-transform:uppercase; }
.glass-intro em { font-style:normal; text-shadow:0 0 14px #ffd70066; }
.glass-intro p { color:#c1ccda; margin:.8rem 0 1rem; line-height:1.45; }
.glass-intro a { display:inline-flex; align-items:center; gap:.4rem; min-height:44px; padding:0 .85rem; border-radius:999px; background:white; color:#0b1120; font-weight:800; text-decoration:none; }
.shelves { display:flex; min-width:0; overflow-x:auto; padding:8px 0 12px; scroll-snap-type:x proximity; scrollbar-color:#64748b #182132; }
.shelf { position:relative; isolation:isolate; display:flex; flex-direction:column; align-items:center; justify-content:space-between;
  flex:1 0 170px; min-height:255px; padding:20px; color:#0b1120; text-decoration:none; text-align:center; scroll-snap-align:center;
  background:radial-gradient(at 0 0,#ffffff49,transparent 65%),var(--shelf-color); }
.shelf-label { align-self:center; padding:5px 10px; border-radius:8px; background:#fff9ed; }
.shelf strong { display:block; font:900 1.15rem/1.12 var(--font-display); text-transform:uppercase; }
.shelf small { font-weight:700; }
.shelf img { width:100%; height:130px; object-fit:contain; filter:drop-shadow(0 9px 7px #0004); }
.shelf-icon { font-size:3rem; }
.shelf-arrow { border-radius:50%; padding:3px; background:white; }
.shelf:focus-visible .shelf-label { outline:3px solid #101827; }
@media(min-width:1024px) {
  .shelf { clip-path:polygon(12% 0,100% 0,88% 100%,0 100%); margin-right:-18px; padding-inline:24px; }
  .shelf:last-child { margin-right:0; }
  .shelf:is(:hover,:focus-visible) { clip-path:inset(0); z-index:1; }
}
@media(max-width:1023px) {
  .shelves { gap:4px; }
  .shelf { flex:0 0 170px; }
}
@media(max-width:767px) {
  .shelf-menu { grid-template-columns:minmax(0,1fr); padding:24px 16px; }
  .glass-intro br { display:none; }
  .glass-intro em { margin-left:.15em; }
  .shelf { min-height:210px; padding:12px; }
  .shelf img { height:110px; }
}
</style>
