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
  display:grid; grid-template-columns:minmax(0,1fr);
  gap:clamp(16px,3vw,56px); align-items:center;
  padding:clamp(28px,5vw,80px) var(--edge,5vw); color:var(--ink);
  background:var(--cream);
  scroll-margin-top:70px;
}
.glass-intro {
  padding:clamp(20px,2.8vw,42px); border:1px solid #32241038; border-radius:20px;
  background:linear-gradient(135deg,#fff9,#fff3); backdrop-filter:blur(12px);
  box-shadow:inset 0 1px #fffd,0 15px 40px -28px #723b13;
}
.shelf-brand { display:block; margin-bottom:.45rem; color:var(--red-ink); font:850 clamp(1rem,1.35vw,1.25rem)/1.1 var(--font-display); }
.glass-intro h2 { margin:0; font:900 clamp(2.4rem,4.3vw,5rem)/1.06 var(--font-display); letter-spacing:-.025em; transform:rotate(-1.5deg); text-transform:uppercase; color:var(--ink); }
.glass-intro em { display:inline-block; color:var(--ink); background:var(--sun); padding:0 .14em .08em; transform:rotate(-2deg); font-style:inherit; }
.glass-intro p { max-width:28ch; margin:1rem 0; line-height:1.5; }
.glass-intro a { display:inline-flex; align-items:center; gap:.4rem; min-height:44px; padding:0 .85rem; border:1.5px solid var(--ink); border-radius:12px; background:#ffdc65; box-shadow:3px 3px var(--ink); color:inherit; font-weight:800; text-decoration:none; }
.shelves { display:grid; grid-auto-flow:column; grid-auto-columns:minmax(150px,1fr); gap:12px; overflow-x:auto; scroll-snap-type:x proximity; padding:10px 14px 16px; }
.shelf {
  position:relative; isolation:isolate; display:grid; grid-template-rows:minmax(3.25em,auto) 1fr; min-width:0;
  scroll-snap-align:start; padding:16px clamp(12px,1.2vw,24px); text-decoration:none; color:inherit;
  }
.shelf::before {
  content:""; position:absolute; inset:0; z-index:-1; pointer-events:none;
  border:var(--bw-bold) solid var(--ink); border-radius:var(--r-md);
  box-shadow:6px 6px 0 var(--ink);
  background:linear-gradient(to bottom,var(--shelf-color) 0 9px,var(--paper) 9px);
}
.shelf strong { display:block; font:850 clamp(1.15rem,2vw,2rem)/1.1 var(--font-display); letter-spacing:-.04em; }
.shelf-label { align-self:start; justify-self:start; padding:2px 5px; border-radius:4px; }
.shelf small { display:block; margin-top:.25rem; font:750 .8125rem/1.25 var(--font-ui); color:var(--paper); background:var(--ink); width:fit-content; border-radius:var(--r-pill); padding:2px 7px; }
.shelf img { justify-self:center; width:100%; height:clamp(88px,9vw,160px); object-fit:contain; transform:rotate(var(--tilt,-3deg)); filter:drop-shadow(0 7px 5px #28180338); transition:transform .25s; }
.shelf:nth-child(even) { --tilt:3deg; }
.shelf-icon { align-self:center; justify-self:center; font-size:3rem; }
.shelf-arrow { position:absolute; right:12%; bottom:12px; color:var(--ink); background:#ffdc65; border:1px solid currentColor; border-radius:50%; padding:2px; }
.shelf:hover img,.shelf:focus-visible img { transform:translateY(-3px) rotate(var(--tilt,-3deg)); }
.shelf:focus-visible { outline:0; }
.shelf:focus-visible .shelf-label { outline:3px solid; outline-offset:3px; }
@media(min-width:768px) {
  .shelf-menu {
    grid-template-columns:clamp(210px,19vw,300px) minmax(0,1fr);
    gap:clamp(16px,1.8vw,30px);
  }
  .glass-intro { padding:clamp(16px,1.5vw,26px); }
  .glass-intro h2 { font-size:clamp(2rem,3vw,3.25rem); }
  .shelves { grid-auto-columns:minmax(132px,1fr); align-self:stretch; }
  .shelf { padding:16px 10px; }
  .shelf strong { font-size:clamp(1.15rem,1.5vw,1.7rem); }
  .shelf img { align-self:center; }
}
@media(min-width:601px) and (max-width:767px) {
  .glass-intro { display:flex; align-items:center; gap:1.5rem; }
  .glass-intro br { display:none; }
  .glass-intro em { margin-left:.15em; }
  .glass-intro a { margin-left:auto; flex-shrink:0; }
}
@media(max-width:600px) {
  .shelf-menu { padding:22px 0; gap:14px; }
  .glass-intro { margin-inline:16px; display:block; padding:18px; }
  .glass-intro br { display:none; }
  .glass-intro em { margin-left:.15em; }
  .glass-intro p { max-width:35ch; margin:.6rem 0 .8rem; }
  .shelves { display:flex; overflow-x:auto; padding:8px 16px 14px; scroll-snap-type:x mandatory; scroll-padding:16px; }
  .shelf { flex:0 0 47%; padding:15px 6%; scroll-snap-align:start; }
  .shelf img { height:118px; }
}
@media(prefers-reduced-motion:reduce) { .shelf img { transition:none; } }
</style>
