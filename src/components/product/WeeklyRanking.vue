<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { ArrowLeft, ArrowRight, Trophy } from "lucide-vue-next";
import QuickAdd from "./QuickAdd.vue";
import { useProductStore } from "../../stores/productStore";
import { useFloorStore } from "../../stores/floorStore";

const store = useProductStore();
const floor = useFloorStore();
const stockOf = (p) => p?.stock?.[floor.floor] ?? null;

const ranked = computed(() => [...store.products].sort((a, b) => b.sold - a.sold));
const topSix = computed(() => ranked.value.slice(0, 6));

const root = ref(null);
const track = ref(null);
const index = ref(0);
const perView = ref(3);

const canPrev = computed(() => index.value > 0);
const canNext = computed(() => index.value + perView.value < topSix.value.length);

const maxIndex = Math.max(0, topSix.value.length - perView.value);

function prev() {
  if (!canPrev.value) return;
  index.value--;
  scrollTrack();
}

function next() {
  if (!canNext.value) return;
  index.value++;
  scrollTrack();
}

function scrollTrack() {
  nextTick(() => {
    const el = track.value;
    if (!el) return;
    const cards = el.children;
    const target = cards[index.value];
    if (!target) return;
    const containerWidth = el.parentElement?.clientWidth ?? 0;
    const offset = target.offsetLeft - (containerWidth - target.offsetWidth) / 2;
    el.scrollTo({ left: Math.max(0, offset), behavior: "smooth" });
  });
}

onMounted(() => {
  window.addEventListener("resize", () => perView.value = window.innerWidth > 900 ? 3 : 2);
  scrollTrack();
});
onBeforeUnmount(() => window.removeEventListener("resize", () => {}));
</script>

<template>
  <section ref="root" class="wr-section">
    <div class="wr-inner">
      <header class="wr-header">
        <div class="wr-kicker">
          <Trophy :size="13" /> BẢNG XẾP HẠNG TUẦN NÀY
        </div>
        <h2 class="wr-title">Top sản phẩm<br />bán chạy tuần này</h2>
        <p class="wr-lead">
          Những món mọi người đang săn nhất tại DOP Mart — cập nhật theo số lượng bán ra thực tế.
        </p>
      </header>

      <div class="wr-nav-wrap">
        <button
          v-if="canPrev"
          type="button"
          class="wr-nav wr-nav--prev"
          @click="prev"
          :aria-label="`Xem hạng trước`"
        >
          <ArrowLeft :size="18" />
        </button>

        <div class="wr-track-wrap" ref="root">
          <div ref="track" class="wr-track" aria-label="Top sản phẩm bán chạy">
            <article
              v-for="(product, i) in topSix"
              :key="product.id"
              class="wr-card"
              :class="{ 'wr-card--champ': i === 0 }"
              :style="{ '--c': product.color, '--rank': i + 1 }"
            >
              <span class="wr-rank">
                #{{ i + 1 }}
                <span class="wr-rank__dot"></span>
              </span>

              <div class="wr-media">
                <img
                  class="wr-img"
                  :src="product.image"
                  :alt="product.name"
                  loading="lazy"
                  decoding="async"
                />
                <div class="wr-shine"></div>
              </div>

              <div class="wr-info">
                <span class="wr-cat">{{ product.categoryName }}</span>
                <h3 class="wr-name">{{ product.name }}</h3>
                <div class="wr-meta">
                  <span class="wr-rating">★ {{ product.rating }}</span>
                  <span class="wr-sold">{{ product.sold }} đã bán</span>
                </div>
                <strong class="wr-price">
                  {{ product.price.toLocaleString("vi-VN") }}
                  <small>₫</small>
                </strong>
              </div>

              <div class="wr-action">
                <QuickAdd :product="product" :stock="stockOf(product)" variant="icon" />
              </div>
            </article>
          </div>
        </div>

        <button
          v-if="canNext"
          type="button"
          class="wr-nav wr-nav--next"
          @click="next"
          :aria-label="`Xem hạng sau`"
        >
          <ArrowRight :size="18" />
        </button>
      </div>

      <a href="/best-sellers" class="wr-cta">
        Xem bảng xếp hạng đầy đủ <ArrowRight :size="14" />
      </a>
    </div>
  </section>
</template>

<style scoped>
/* ── Section ── */
.wr-section {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: var(--cream);
  color: var(--ink);
  padding: var(--section-y) var(--edge);
}

.wr-section::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.10;
  background-image:
    radial-gradient(#1a1a1a 1.2px, transparent 1.6px),
    radial-gradient(#1a1a1a 1.2px, transparent 1.6px);
  background-size: 170px 210px, 200px 240px;
  background-position: top left, bottom right;
}

.wr-inner {
  position: relative;
  z-index: 1;
  max-width: var(--container);
  margin: 0 auto;
  padding: 0 var(--gutter, 12px);
}

/* ── Header ── */
.wr-header {
  margin-bottom: var(--s5);
  position: relative;
  z-index: 2;
}

.wr-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-meta);
  font-weight: 900;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--sun);
  margin-bottom: 10px;
}

.wr-title {
  margin: 0 0 8px;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(44px, 7vw, 72px);
  line-height: 0.9;
  letter-spacing: -0.04em;
  text-transform: uppercase;
  color: var(--ink);
  text-wrap: balance;
}

.wr-lead {
  margin: 0;
  font-size: var(--fs-sm);
  line-height: var(--lh-body, 1.5);
  color: var(--on-cream);
  max-width: 48ch;
}

/* ── Track ── */
.wr-nav-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s3);
  margin-top: var(--s4);
}

.wr-track-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  padding: 0 60px;
}

.wr-track {
  display: flex;
  gap: var(--s3);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding-bottom: 20px;
}

.wr-track::-webkit-scrollbar {
  display: none;
}

.wr-card {
  flex: 0 0 auto;
  scroll-snap-align: start;
  width: min(320px, calc((100% - 48px) / 3));
  height: 460px;
  position: relative;
  isolation: isolate;
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--paper);
  border: var(--bw-bold) solid var(--ink);
  box-shadow: 8px 8px 0 var(--cd, #000);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.wr-card--champ {
  width: min(430px, calc((100% - 48px) / 2.4));
  z-index: 10;
  box-shadow: 14px 14px 0 var(--cd, #000);
  filter: drop-shadow(10px 10px 0 var(--cd, #000));
}

.wr-card:hover {
  transform: translateY(-4px);
  box-shadow: 12px 12px 0 var(--cd, #000);
}

.wr-card--champ:hover {
  transform: translateY(-6px);
  box-shadow: 18px 18px 0 var(--cd, #000);
}

.wr-card:active {
  transform: translateY(2px);
  box-shadow: 4px 4px 0 var(--cd, #000);
}

/* ── Rank badge ── */
.wr-rank {
  position: absolute;
  top: var(--s3);
  left: var(--s3);
  z-index: 20;
  background: var(--c, var(--sun));
  color: var(--on, var(--ink));
  border: var(--bw-bold) solid var(--ink);
  border-radius: var(--r-pill);
  padding: 7px 16px;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(18px, 3.2cqw, 24px);
  letter-spacing: -0.02em;
  box-shadow: 4px 4px 0 var(--ink);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.wr-rank__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--ink);
  border: 2px solid var(--c, var(--sun));
  box-shadow: 0 0 0 2px var(--paper);
}

/* ── Media ── */
.wr-media {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: color-mix(in srgb, var(--c, #000) 12%, var(--cream));
}

.wr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  padding: 16px;
  filter: drop-shadow(0 16px 16px #0004);
  transition: transform 0.4s ease;
}

.wr-card:hover .wr-img {
  transform: scale(1.05);
}

.wr-shine {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(
    135deg,
    transparent 0%,
    color-mix(in srgb, #fff 35%, transparent) 40%,
    transparent 60%
  );
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.wr-card:hover .wr-shine {
  transform: translateX(200%);
}

/* ── Info ── */
.wr-info {
  padding: var(--s3) var(--s3) var(--s2);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wr-cat {
  font-size: var(--fs-xs);
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--on-cream);
}

.wr-name {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(17px, 2.6vw, 20px);
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--ink);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.wr-meta {
  display: flex;
  gap: 10px;
  margin-top: 4px;
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--on-cream);
}

.wr-price {
  margin-top: var(--s1);
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(20px, 3.4vw, 26px);
  letter-spacing: -0.02em;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.wr-price small {
  font-size: 0.55em;
  font-weight: 800;
  color: var(--on-cream);
}

/* ── Action ── */
.wr-action {
  position: absolute;
  bottom: var(--s3);
  left: var(--s3);
  right: var(--s3);
  z-index: 15;
  display: flex;
  justify-content: center;
}

.wr-action .qa--icon .qa__go {
  width: 44px;
  height: 44px;
  padding: 0;
  font-size: 0;
}

/* ── Nav buttons ── */
.wr-nav {
  position: relative;
  z-index: 30;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: var(--bw-bold) solid var(--ink);
  background: var(--paper);
  color: var(--ink);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 3px 3px 0 var(--ink);
  transition: transform 0.15s, box-shadow 0.15s;
  flex-shrink: 0;
}

.wr-nav:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--ink);
}

.wr-nav:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 var(--ink);
}

.wr-nav--prev {
  margin-left: -52px;
}

.wr-nav--next {
  margin-right: -52px;
}

/* ── CTA ── */
.wr-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: var(--s5);
  min-height: 52px;
  padding: 0 26px;
  border: var(--bw-bold) solid var(--ink);
  border-radius: var(--r-pill);
  background: var(--sun);
  color: var(--ink);
  font-weight: 900;
  text-decoration: none;
  box-shadow: 4px 4px 0 var(--ink);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.wr-cta:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--ink);
}

.wr-cta:active {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 var(--ink);
}

/* ── Responsive ── */
@media (max-width: 1100px) {
  .wr-card {
    width: min(300px, calc((100% - 48px) / 2.6));
  }
  .wr-card--champ {
    width: min(380px, calc((100% - 48px) / 2.2));
  }
}

@media (max-width: 750px) {
  .wr-section {
    padding: var(--sp-5) var(--edge);
  }
  .wr-title {
    font-size: clamp(34px, 14vw, 56px);
  }
  .wr-card {
    width: min(290px, calc(100% - 48px));
    height: 420px;
  }
  .wr-card--champ {
    width: min(340px, calc(100% - 48px));
  }
  .wr-nav-wrap {
    gap: var(--s2);
  }
  .wr-track-wrap {
    padding: 0 52px;
  }
  .wr-nav--prev {
    margin-left: -44px;
  }
  .wr-nav--next {
    margin-right: -44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wr-card,
  .wr-img,
  .wr-shine {
    transition: none !important;
    animation: none !important;
  }
  .wr-card:hover {
    transform: none;
  }
  .wr-img {
    transform: none !important;
  }
}
</style>
