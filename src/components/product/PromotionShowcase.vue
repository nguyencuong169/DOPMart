<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger.js";
import { ArrowRight, Tag, Flame, Clock3 } from "lucide-vue-next";
import { useProductStore } from "../../stores/productStore";
import { useCartStore } from "../../stores/cartStore";
import { surfaceTone } from "../../utils/color";
gsap.registerPlugin(ScrollTrigger);

const products = useProductStore(),
  cart = useCartStore(),
  root = ref();
const offers = computed(() => products.offers.slice(0, 3));
let animation;
let played = false;

function play() {
  if (played) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!offers.value.length) return;
  played = true;
  animation?.revert();
  nextTick(() => {
    if (!root.value) return;
    animation = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: root.value,
            start: "top 75%",
            end: "center 40%",
            scrub: 0.6,
          },
        })
        .from(".promo-kicker, .promo-eyebrow", { y: 40, opacity: 0, duration: 0.6 })
        .from(".promo-eyebrow-line", { scaleX: 0, transformOrigin: "left center", duration: 0.6 }, 0)
        .from(".promo-h1", { y: 30, opacity: 0, duration: 0.7 }, 0.1)
        .from(".promo-lead", { y: 30, opacity: 0, duration: 0.7 }, 0.2)
        .from(".promo-meta", { y: 30, opacity: 0, duration: 0.7 }, 0.3)
        .from(".promo-card", { y: 60, opacity: 0, duration: 0.7, stagger: 0.15 }, 0.4);
    }, root.value);
  });
}
onMounted(play);
watch(
  () => offers.value.length,
  (n) => {
    if (n) play();
  },
  { immediate: true }
);
onBeforeUnmount(() => animation?.revert());
</script>

<template>
  <section ref="root" class="promo-showcase">
    <div class="promo-copy">
      <span class="promo-kicker"><Tag /> HAPPY DEALS</span>
      <div class="promo-eyebrow">
        <span class="promo-eyebrow-line"></span>
        <span class="promo-eyebrow-text">DOP MART · MÓN NGON MỖI NGÀY</span>
      </div>
      <h1 class="promo-h1">Giá nhỏ hơn.<br /><em>Niềm vui lớn hơn.</em></h1>
      <p class="promo-lead">
        Ưu đãi giới hạn cho giờ nghỉ văn phòng. Số lượng khuyến mãi được áp dụng theo tồn kho tại tầng nhận hàng.
      </p>
      <div class="promo-meta"><Clock3 /> Ưu đãi trong tuần này</div>
      <button type="button" class="promo-cta" @click="$router.push('/deals')">
        Săn deal ngay <ArrowRight />
      </button>
    </div>
    <div class="promo-list">
      <article
        v-for="offer in offers"
        :key="offer.id"
        class="promo-card"
        :class="surfaceTone(offer.tint || offer.color)"
        :style="{ '--promo-color': offer.tint || offer.color }"
      >
        <div class="promo-media">
          <img :src="offer.image" :alt="offer.name" loading="lazy" decoding="async" width="400" height="300" />
        </div>
        <div class="promo-body">
          <small class="promo-category">{{ offer.categoryName }}</small>
          <h3 class="promo-title">{{ offer.name }}</h3>
          <div class="promo-price">
            <s class="promo-old">{{ offer.oldPrice.toLocaleString("vi-VN") }} ₫</s>
            <b class="promo-new">{{ offer.price.toLocaleString("vi-VN") }} ₫</b>
          </div>
          <div class="promo-save">Tiết kiệm {{ (offer.oldPrice - offer.price).toLocaleString("vi-VN") }} ₫</div>
          <button
            type="button"
            class="promo-add"
            :aria-label="`Thêm ${offer.name} vào giỏ`"
            @click="cart.add(offer)"
          >
            Thêm nhanh <ArrowRight />
          </button>
        </div>
        <div class="promo-discount">-{{ offer.discount }}%</div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.promo-showcase {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-5);
  align-items: start;
  padding: var(--sp-6) var(--edge);
  overflow: hidden;
}

.promo-copy {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  max-width: 48ch;
  z-index: 2;
}

.promo-kicker {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  font-family: "Bricolage Grotesque", sans-serif;
  font-size: var(--fs-xs);
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--mango-glow);
}

.promo-eyebrow {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  margin-top: var(--sp-1);
}

.promo-eyebrow-line {
  flex: 1;
  height: 1px;
  background: var(--mango-glow);
  transform-origin: left center;
}

.promo-eyebrow-text {
  font-family: "Bricolage Grotesque", sans-serif;
  font-size: var(--fs-xs);
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-well);
}

.promo-h1 {
  font-family: "Anton", "Barlow Condensed", sans-serif;
  font-size: clamp(40px, 6vw, 64px);
  font-weight: 400;
  line-height: 0.9;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  color: var(--ink-well);
  margin: 0;
}

.promo-h1 em {
  font-style: normal;
  color: var(--mango-glow);
}

.promo-lead {
  font-family: "Bricolage Grotesque", sans-serif;
  font-size: var(--fs-md);
  font-weight: 500;
  line-height: 1.6;
  color: var(--ink-well);
  margin: 0;
  max-width: 42ch;
}

.promo-meta {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  margin-top: var(--sp-1);
  font-family: "Bricolage Grotesque", sans-serif;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--ink-well);
  opacity: 0.8;
}

.promo-cta {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  margin-top: var(--sp-3);
  padding: var(--sp-2) var(--sp-4);
  font-family: "Bricolage Grotesque", sans-serif;
  font-size: var(--fs-md);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ink-well);
  background: var(--mango-glow);
  border: none;
  border-radius: 0;
  cursor: pointer;
  transition: transform 0.15s, background 0.2s;
}

.promo-cta:hover {
  transform: translateY(-2px);
  background: var(--ink-well);
  color: var(--rice-paper);
}

.promo-cta:focus-visible {
  outline: 3px solid var(--mango-glow);
  outline-offset: 2px;
}

.promo-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-2);
  align-items: start;
}

.promo-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: var(--border);
  border-radius: 0;
  background: var(--rice-paper);
  transition: transform 0.2s, border-color 0.2s;
  aspect-ratio: 4 / 5;
}

.promo-card:hover {
  transform: translateY(-4px);
  border-color: var(--mango-glow);
}

.promo-card:hover .promo-media img {
  transform: scale(1.05);
}

.promo-media {
  position: relative;
  width: 100%;
  height: 40%;
  overflow: hidden;
  background: var(--paper);
}

.promo-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease-out;
}

.promo-body {
  padding: var(--sp-3) var(--sp-3) var(--sp-2);
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  flex: 1;
}

.promo-category {
  font-family: "Bricolage Grotesque", sans-serif;
  font-size: var(--fs-xs);
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-well);
  opacity: 0.6;
}

.promo-title {
  font-family: "Bricolage Grotesque", sans-serif;
  font-size: var(--fs-lg);
  font-weight: 600;
  line-height: 1.2;
  color: var(--ink-well);
  margin: 0;
}

.promo-price {
  display: flex;
  align-items: baseline;
  gap: var(--sp-1);
  margin-top: var(--sp-1);
}

.promo-old {
  font-family: "Bricolage Grotesque", sans-serif;
  font-size: var(--fs-sm);
  color: rgba(26, 26, 26, 0.4);
}

.promo-new {
  font-family: "Bricolage Grotesque", sans-serif;
  font-size: var(--fs-lg);
  font-weight: 700;
  color: var(--mango-glow);
}

.promo-save {
  font-family: "Bricolage Grotesque", sans-serif;
  font-size: var(--fs-xs);
  font-weight: 700;
  color: var(--green-ink);
}

.promo-add {
  width: 100%;
  margin-top: var(--sp-2);
  padding: var(--sp-1) var(--sp-2);
  font-family: "Bricolage Grotesque", sans-serif;
  font-size: var(--fs-sm);
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--ink-well);
  background: var(--cream);
  border: var(--border);
  border-radius: 0;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.promo-add:hover {
  background: var(--ink-well);
  color: var(--cream);
}

.promo-add:focus-visible {
  outline: 3px solid var(--mango-glow);
  outline-offset: 2px;
}

.promo-discount {
  position: absolute;
  top: var(--sp-2);
  right: var(--sp-2);
  padding: var(--sp-1) var(--sp-2);
  font-family: "Anton", "Barlow Condensed", sans-serif;
  font-size: var(--fs-lg);
  font-weight: 400;
  text-transform: uppercase;
  color: var(--ink-well);
  background: var(--cream);
  border: var(--border);
  border-radius: 0;
  letter-spacing: -0.02em;
}

@media (max-width: 1024px) {
  .promo-showcase {
    grid-template-columns: 1fr;
    gap: var(--sp-4);
    padding: var(--sp-4) var(--gutter);
  }

  .promo-list {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--sp-2);
  }
}

@media (max-width: 768px) {
  .promo-list {
    grid-template-columns: 1fr;
  }

  .promo-showcase {
    padding: var(--sp-4) var(--gutter);
  }
}

@media (prefers-reduced-motion: reduce) {
  .promo-card,
  .promo-copy > *,
  .promo-media img {
    animation: none !important;
    transition: none !important;
  }
  .promo-card:hover {
    transform: none;
  }
  .promo-media img:hover {
    transform: none;
  }
}
</style>