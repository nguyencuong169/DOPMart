<script setup>
import { computed, onMounted, ref } from "vue";
import { ArrowRight, Flame, ShoppingBag } from "lucide-vue-next";
import { useProductStore } from "../../stores/productStore";
import { useCartStore } from "../../stores/cartStore";
import { useFloorStore } from "../../stores/floorStore";

const store = useProductStore();
const cart = useCartStore();
const floor = useFloorStore();

const ranked = computed(() => [...store.products].sort((a, b) => b.sold - a.sold));
const topSix = computed(() => ranked.value.slice(0, 6));

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");

const onColor = (hex) => {
  const n = parseInt(String(hex || "#000000").replace("#", ""), 16);
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.62 ? "#0f172a" : "#ffffff";
};

function addToCart(product) {
  cart.add(product, 1);
}

onMounted(() => {
  store.init();
  cart.init();
  floor.init();
});
</script>

<template>
  <main class="wr-page">
    <!-- Header (left) -->
    <header class="wr-header">
      <div class="wr-header__ghost" aria-hidden="true">
        <h1 class="wr-ghost-title">DOP MART</h1>
      </div>
      <div class="wr-header__content">
        <div class="wr-header__rule">
          <div class="wr-header__line"></div>
          <span class="wr-header__kicker">DOP MART EXCLUSIVE</span>
          <div class="wr-header__line"></div>
        </div>
        <span class="wr-header__badge">Món ngon mỗi ngày</span>
        <h2 class="wr-header__title">
          TOP <span class="wr-header__glow">SNACK</span> BÁN CHẠY
        </h2>
        <p class="wr-header__lead">
          Khám phá những hương vị độc bản tại DOP Mart. Mỗi sản phẩm là một hành trình cảm xúc từ nguyên liệu tự nhiên nhất.
        </p>
      </div>
    </header>

    <!-- Leaderboard (right, full height) -->
    <section aria-label="Danh sách sản phẩm bán chạy" class="wr-shelf">
      <div class="wr-track carousel-scrollbar">
        <article
          v-for="(product, i) in topSix"
          :key="product.id"
          class="wr-card skew-card group stagger-in"
          :style="{
            '--card-color': product.tint || product.color,
            '--card-text': onColor(product.tint || product.color),
            animationDelay: `${(i + 1) * 0.1}s`,
          }"
        >
          <div class="wr-card__divider" aria-hidden="true"></div>
          <div class="wr-card__pattern" aria-hidden="true"></div>
          <div v-if="product.hot" class="wr-card__badge">
            <span class="wr-card__badge-inner">
              <Flame class="wr-card__flame" /> BEST SELLER
            </span>
          </div>
          <h3 class="wr-card__name font-display">{{ product.name }}</h3>
          <div class="wr-card__price-block">
            <span class="wr-card__price font-display">{{ fmt(product.price) }} ₫</span>
            <button
              type="button"
              class="wr-card__cta"
              :aria-label="`Mua ${product.name} giá ${fmt(product.price)} đồng`"
              @click="addToCart(product)"
            >
              MUA NGAY
            </button>
          </div>
          <div class="wr-card__media shine-effect">
            <img
              :src="product.image"
              :alt="product.name"
              loading="lazy"
              decoding="async"
              class="wr-card__img floating"
              :style="{ animationDelay: `${(i + 1) * 0.5}s` }"
            />
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.wr-page {
  display: flex;
  flex-direction: row;
  min-height: 650px;
  background-color: #0b1120;
  overflow: hidden;
  color: #fff;
  font-family: var(--font-display);
  -webkit-tap-highlight-color: transparent;
  padding: 4rem 1rem;
  gap: 2rem;
  align-items: stretch;
}
@media (max-width: 1023px) {
  .wr-page { flex-direction: column; }
}
.font-display {
  font-family: var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
/* Header (left) */
.wr-header {
  flex: 0 0 320px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 1rem;
}
.wr-header__ghost {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.03;
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
}
.wr-ghost-title {
  font-family: var(--font-display);
  font-size: 8rem;
  color: #fff;
  letter-spacing: -0.05em;
  margin: 0;
  line-height: 1;
}
.wr-header__content { position: relative; z-index: 10; }
.wr-header__rule {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.wr-header__line { height: 1px; width: 2rem; background: rgba(255, 255, 255, 0.2); }
.wr-header__kicker {
  font-family: var(--font-display);
  font-size: 0.875rem;
  letter-spacing: 0.4em;
  color: rgba(255, 255, 255, 0.6);
}
.wr-header__badge {
  display: inline-block;
  background: linear-gradient(to right, #dc2626, #f97316);
  color: #fff;
  padding: 0.25rem 1.25rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  box-shadow: 0 10px 15px -3px rgba(127, 29, 29, 0.2);
}
.wr-header__title {
  font-family: var(--font-display);
  font-size: 3rem;
  color: #fff;
  margin-bottom: 1.5rem;
  letter-spacing: -0.05em;
  line-height: 0.9;
  text-shadow: 0 10px 0 rgba(0, 0, 0, 0.8), 0 20px 30px rgba(0, 0, 0, 0.4);
}
.wr-header__glow {
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.2);
  letter-spacing: 0.05em;
}
.wr-header__lead {
  color: #94a3b8;
  max-width: 24rem;
  margin: 0 auto;
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0.8;
}
/* Shelf */
.wr-shelf {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: stretch;
}
.wr-track {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  gap: 0;
  padding-bottom: 1rem;
}
.carousel-scrollbar::-webkit-scrollbar { height: 4px; }
.carousel-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
.carousel-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
/* Card */
.skew-card {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}
.wr-card {
  flex: 1 1 0%;
  min-width: 260px;
  background: var(--card-color, #E91E63);
  background-image: radial-gradient(at 0% 0%, rgba(255, 255, 255, 0.15) 0px, transparent 50%),
                    radial-gradient(at 100% 100%, rgba(0, 0, 0, 0.1) 0px, transparent 50%);
  color: var(--card-text, #fff);
  padding: 2rem;
  padding-top: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  scroll-snap-align: center;
  animation: fadeInUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) both;
  height: 100%;
}
@media (min-width: 1024px) {
  .wr-card {
    clip-path: polygon(12% 0, 100% 0, 88% 100%, 0 100%);
    margin-left: -2.5%;
    margin-right: -2.5%;
  }
  .wr-card:hover {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    z-index: 50;
    transform: scale(1.04) translateY(-10px);
    margin-left: 0;
    margin-right: 0;
    box-shadow: 0 40px 60px -15px rgba(0, 0, 0, 0.7);
  }
}
.wr-card__divider {
  display: none;
}
@media (min-width: 1024px) {
  .wr-card__divider {
    display: block;
    position: absolute;
    right: 0;
    top: 25%;
    height: 50%;
    width: 2px;
    background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.7), transparent);
    filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.3));
    z-index: 10;
    pointer-events: none;
  }
}
.wr-card__pattern {
  position: absolute;
  inset: 0;
  opacity: 0.2;
  pointer-events: none;
  background-image: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.05) 0, rgba(255, 255, 255, 0.05) 1px, transparent 0, transparent 50%);
  background-size: 15px 15px;
  animation: pulse-overlay 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
.wr-card__badge {
  position: absolute;
  top: 1rem;
  right: 2rem;
  z-index: 30;
}
.wr-card__badge-inner {
  background: linear-gradient(to right, #facc15, #f97316);
  color: var(--ink);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: var(--fs-xs);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}
.wr-card__flame { width: 0.875rem; height: 0.875rem; }
.wr-card__name {
  font-size: var(--fs-lg);
  line-height: var(--lh-display);
  text-align: center;
  margin-bottom: 0.5rem;
  transition: transform 0.5s;
  filter: drop-shadow(0 4px 3px rgba(0, 0, 0, 0.3));
}
.group:hover .wr-card__name { transform: scale(1.05); }
@media (min-width: 1024px) {
  .wr-card__name { font-size: var(--fs-xl); }
}
.wr-card__price-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
}
.wr-card__price {
  font-size: var(--fs-lg);
  color: var(--card-text, #fff);
  letter-spacing: 0.05em;
}
@media (min-width: 1024px) {
  .wr-card__price { font-size: clamp(var(--fs-lg), 4vw, var(--fs-xl)); }
}
.wr-card__cta {
  margin-top: 1rem;
  background: #fff;
  color: var(--card-color, #E91E63);
  font-weight: 700;
  padding: 0.625rem 2rem;
  border-radius: 9999px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  transition: all 0.3s;
  transform: scale(1);
  border: none;
  cursor: pointer;
  font-family: var(--font-display);
}
.wr-card__cta:hover { transform: scale(1.05); background: #f8fafc; }
.wr-card__cta:active { transform: scale(0.95); }
.wr-card__media {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  overflow: hidden;
  flex: 1;
  min-height: 120px;
}
.shine-effect::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent 45%, rgba(255, 255, 255, 0.3) 50%, transparent 55%);
  transform: rotate(-45deg);
  animation: shine 6s infinite;
  pointer-events: none;
  z-index: 10;
}
.wr-card__img {
  display: block;
  width: 12rem;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 30px 30px rgba(0, 0, 0, 0.65));
  z-index: 20;
  margin: 0 auto;
  transform: translateX(-0.5rem);
}
@media (min-width: 1024px) {
  .wr-card__img { width: 16rem; }
}
.floating {
  animation: float 4s ease-in-out infinite;
}
/* Animations */
.stagger-in { animation: fadeInUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) both; }
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes shine {
  0% { transform: translateX(-100%) rotate(-45deg); }
  20% { transform: translateX(100%) rotate(-45deg); }
  100% { transform: translateX(100%) rotate(-45deg); }
}
@keyframes float {
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(2deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}
@keyframes pulse-overlay {
  0%, 100% { opacity: 0.1; }
  50% { opacity: 0.25; }
}
@media (prefers-reduced-motion: reduce) {
  .wr-card, .wr-card__img, .wr-card__pattern, .shine-effect::before {
    animation: none !important;
    transition: none !important;
  }
  .wr-card:hover { transform: none; }
  .wr-card__img { transform: none !important; }
}
@media (max-width: 767px) {
  .wr-header { flex: 0 0 auto; width: 100%; }
  .wr-ghost-title { font-size: 5rem; }
}
</style>
