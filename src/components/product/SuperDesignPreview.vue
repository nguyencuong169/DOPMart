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
  display:grid; grid-template-columns:minmax(230px,.8fr) minmax(0,2fr);
  gap:clamp(16px,3vw,56px); align-items:center;
  padding:clamp(28px,5vw,80px) var(--edge,5vw); color:var(--ink);
  background:radial-gradient(ellipse at 5% 10%,#ffdb85,transparent 48%),var(--cream);
  scroll-margin-top:70px;
}
.glass-intro {
  padding:clamp(20px,2.8vw,42px); border:1px solid #32241038; border-radius:20px;
  background:linear-gradient(135deg,#fff9,#fff3); backdrop-filter:blur(12px);
  box-shadow:inset 0 1px #fffd,0 15px 40px -28px #723b13;
}
.shelf-brand { display:block; margin-bottom:.45rem; color:var(--red-ink); font:850 clamp(1rem,1.35vw,1.25rem)/1.1 var(--font-display); }
.glass-intro h2 { margin:0; font:900 clamp(2.4rem,4.3vw,5rem)/1.06 var(--font-display); letter-spacing:-.055em; }
.glass-intro em { display:inline-block; color:#fff6dc; background:#242019; padding:0 .14em .08em; transform:rotate(-2deg); font-style:normal; }
.glass-intro p { max-width:28ch; margin:1rem 0; line-height:1.5; }
.glass-intro a { display:inline-flex; align-items:center; gap:.4rem; min-height:44px; padding:0 .85rem; border:1.5px solid var(--ink); border-radius:12px; background:var(--cream); box-shadow:2px 2px var(--ink); color:inherit; font-weight:800; text-decoration:none; }
.shelves { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px 0; }
.shelf {
  position:relative; isolation:isolate; display:grid; grid-template-rows:auto 1fr; min-width:0;
  padding:16px 12%; text-decoration:none; color:inherit;
  clip-path:polygon(8% 0,100% 0,92% 100%,0 100%);
  background:linear-gradient(150deg,#fff9,transparent 60%),repeating-linear-gradient(45deg,transparent 0 12px,#fff2 12px 13px),var(--shelf-color,#ffbf38);
}
.shelf strong { display:block; font:850 clamp(1.15rem,2vw,2rem)/1.1 var(--font-display); letter-spacing:-.04em; }
.shelf small { display:block; margin-top:.25rem; font:650 .8125rem/1.25 var(--font-ui); }
.shelf img { justify-self:center; width:100%; height:clamp(88px,9vw,160px); object-fit:contain; filter:drop-shadow(0 7px 5px #28180338); transition:transform .25s; }
.shelf-icon { align-self:center; justify-self:center; font-size:3rem; }
.shelf-arrow { position:absolute; right:12%; bottom:12px; color:var(--ink); background:var(--cream); border:1px solid currentColor; border-radius:50%; padding:2px; }
.shelf:hover img,.shelf:focus-visible img { transform:translateY(-3px) rotate(-3deg); }
.shelf:focus-visible { outline:0; }
.shelf:focus-visible .shelf-label { outline:3px solid; outline-offset:3px; }
@media(max-width:900px) {
  .shelf-menu { grid-template-columns:1fr; }
  .glass-intro { display:flex; align-items:center; gap:1.5rem; }
  .glass-intro a { margin-left:auto; flex-shrink:0; }
}
@media(max-width:600px) {
  .shelf-menu { padding:22px 0; gap:14px; }
  .glass-intro { margin-inline:16px; display:block; padding:18px; }
  .glass-intro br { display:none; }
  .glass-intro em { margin-left:.15em; }
  .glass-intro p { max-width:35ch; margin:.6rem 0 .8rem; }
  .shelves { display:flex; overflow-x:auto; padding:3px 16px 10px; scroll-snap-type:x mandatory; scroll-padding:16px; }
  .shelf { flex:0 0 47%; padding:15px 6%; scroll-snap-align:start; }
  .shelf img { height:118px; }
}
@media(prefers-reduced-motion:reduce) { .shelf img { transition:none; } }
</style>
