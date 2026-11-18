<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  CheckCircle2,
} from "lucide-vue-next";
import { useCartStore } from "../../stores/cartStore";
import drinkImg from "../../assets/products/drinks.webp";
import noodleImg from "../../assets/products/noodles.webp";
import seaweedImg from "../../assets/products/candy.webp";
import spicyImg from "../../assets/products/spicy.webp";

const cart = useCartStore();
const index = ref(0);
const addedFeedback = ref(false);
let feedbackTimer;
let touchStartX = 0;

const vnd = (n) => `${n.toLocaleString("vi-VN")}₫`;

const PRODUCTS = {
  noodle: {
    id: "noodle",
    name: "Mì ly vị tôm cay",
    price: 28000,
    image: noodleImg,
  },
  drink: {
    id: "drink",
    name: "Soda trái cây 330ml",
    price: 16000,
    image: drinkImg,
  },
  seaweed: {
    id: "seaweed",
    name: "Snack rong biển 40g",
    price: 18000,
    image: seaweedImg,
  },
  spicy: {
    id: "spicy",
    name: "Khoai tây chiên cay 50g",
    price: 20000,
    image: spicyImg,
  },
};

const LAYOUTS = {
  2: [
    { x: 0, b: 3, w: 58, z: 3, r: -3 },
    { x: 40, b: 12, w: 60, z: 2, r: 4 },
  ],
  3: [
    { x: 0, b: 3, w: 50, z: 3, r: -3 },
    { x: 26, b: 18, w: 48, z: 2, r: 3 },
    { x: 54, b: 3, w: 46, z: 4, r: 5 },
  ],
  4: [
    { x: 0, b: 3, w: 42, z: 3, r: -4 },
    { x: 19, b: 27, w: 42, z: 1, r: 2 },
    { x: 40, b: 3, w: 42, z: 4, r: -2 },
    { x: 60, b: 25, w: 40, z: 2, r: 5 },
  ],
};

const COMBOS = [
  {
    kicker: "COMBO OFFER",
    name: "CỨU ĐÓI GIỮA CA",
    tag: "MÌ · NƯỚC",
    ids: ["noodle", "drink"],
    price: 35000,
    accent: "#E52521",
    copy: "Tô mì tôm cay nóng hổi đi cùng lon soda trái cây mát lạnh, xong bữa chỉ trong 5 phút.",
  },
  {
    kicker: "SNACK TIME",
    name: "CHILL BUỔI CHIỀU",
    tag: "SNACK · NƯỚC",
    ids: ["spicy", "seaweed", "drink"],
    price: 42000,
    accent: "#D9381E",
    copy: "Một gói cay giòn, một gói rong biển thanh nhẹ, thêm lon soda để cân vị.",
  },
  {
    kicker: "HEALTHY DEAL",
    name: "NHẸ BỤNG ĐỦ VỊ",
    tag: "RONG BIỂN · NƯỚC",
    ids: ["seaweed", "drink"],
    price: 29000,
    accent: "#1F7A3A",
    copy: "Rong biển giòn ít béo, không bột ngọt, đi cùng lon soda trái cây thật.",
  },
  {
    kicker: "PARTY PACK",
    name: "HỘP CHIA TEAM",
    tag: "4 MÓN CHIA SỂ",
    ids: ["noodle", "drink", "seaweed", "spicy"],
    price: 69000,
    accent: "#C81D25",
    copy: "Gom đủ 4 món best-seller để cả nhóm cùng nhâm nhi.",
  },
].map((c) => {
  const items = c.ids.map((id) => PRODUCTS[id]);
  const old = items.reduce((s, p) => s + p.price, 0);
  return { ...c, items, old, save: old - c.price };
});

const maxSavePct = Math.max(
  ...COMBOS.map((c) => Math.round((c.save / c.old) * 100)),
);
const tickerText =
  `DOP COMBO OFFER · GOM VUI GIÁ NHẸ · TIẾT KIỆM TỚI ${maxSavePct}% · `.repeat(
    4,
  );

const current = computed(() => COMBOS[index.value]);
const kickerLines = computed(() => current.value.kicker.split(" "));

function move(d) {
  index.value = (index.value + d + COMBOS.length) % COMBOS.length;
}

function itemStyle(i) {
  const set = LAYOUTS[current.value.items.length] ?? LAYOUTS[4];
  const l = set[i] ?? set[set.length - 1];
  return {
    left: `${l.x}%`,
    bottom: `${l.b}%`,
    width: `${l.w}%`,
    zIndex: l.z,
    "--r": `${l.r}deg`,
    "--i": i,
  };
}

function add() {
  current.value.items.forEach((p) => cart.add(p, 1));
  addedFeedback.value = true;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => (addedFeedback.value = false), 1600);
}

function onTouchStart(e) {
  touchStartX = e.touches[0].clientX;
}

function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 40) move(dx > 0 ? -1 : 1);
}

onBeforeUnmount(() => clearTimeout(feedbackTimer));
</script>

<template>
  <section
    class="fp-combo"
    :style="{ '--fp-red': current.accent }"
    tabindex="0"
    aria-roledescription="carousel"
    aria-label="Combo ưu đãi"
    @keydown.left.prevent="move(-1)"
    @keydown.right.prevent="move(1)"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    touch-action="pan-y"
  >
    <!-- Branding đơn giản của khu vực (kicker + title), không dùng SectionHeader -->
    <header class="fp-combo__eyebrow">
      <span class="fp-combo__kicker">DOP COMBO</span>
      <h2 class="fp-combo__section-title">MÀU SẮC MỚI</h2>
    </header>

    <!-- POSTER NGANG 16:9 — mọi kích thước bên trong tính theo bề rộng poster (cqw) -->
    <div class="fp-combo__stage">
      <div class="fp-combo__bg" aria-hidden="true">
        <svg viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid slice">
          <g fill="none" stroke="#FFF9EE" stroke-width="2.2" opacity="0.6">
            <path
              v-for="n in 18"
              :key="n"
              :d="`M -100 ${n * 48 - 200} Q 250 ${n * 48 - 110}, 600 ${n * 48 - 40} T 1350 ${n * 48 + 140}`"
            />
          </g>
        </svg>
        <div class="fp-combo__blob"></div>
      </div>

      <div class="fp-combo__nav" role="group" aria-label="Chuyển combo">
        <button
          type="button"
          class="fp-combo__nav-btn"
          aria-label="Combo trước"
          @click="move(-1)"
        >
          <ChevronLeft />
        </button>
        <span class="fp-combo__nav-count" aria-live="polite">
          {{ String(index + 1).padStart(2, "0") }} /
          {{ String(COMBOS.length).padStart(2, "0") }}
        </span>
        <button
          type="button"
          class="fp-combo__nav-btn"
          aria-label="Combo tiếp theo"
          @click="move(1)"
        >
          <ChevronRight />
        </button>
      </div>

      <Transition name="fp-fade" mode="out-in">
        <div :key="index" class="fp-combo__slide">
          <h2 class="fp-combo__title">
            <span class="fp-combo__kicker">
              <span
                v-for="(word, w) in kickerLines"
                :key="w"
                class="fp-combo__kicker-line"
                >{{ word }}</span
              >
            </span>
            <span class="fp-combo__name">{{ current.name }}</span>
          </h2>

          <!-- Thẻ đỏ: giá hero "CHỈ / GIÁ / THÔI" + thanh trắng -->
          <div class="fp-combo__red-card">
            <span class="fp-combo__price-line">CHỈ</span>
            <strong class="fp-combo__price-line">{{
              vnd(current.price)
            }}</strong>
            <span class="fp-combo__price-line">THÔI</span>
            <span class="fp-combo__white-bar" aria-hidden="true"></span>
          </div>

          <div class="fp-combo__glow" aria-hidden="true"></div>
          <div class="fp-combo__cluster">
            <div
              v-for="(item, idx) in current.items"
              :key="item.id"
              class="fp-combo__product"
              :style="itemStyle(idx)"
            >
              <img
                :src="item.image"
                :alt="item.name"
                :title="item.name"
                decoding="async"
                width="400"
                height="300"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Thanh mua hàng dưới poster -->
    <Transition name="fp-fade" mode="out-in">
      <div :key="index" class="fp-combo__bar">
        <div class="fp-combo__bar-info">
          <p class="fp-combo__desc">{{ current.copy }}</p>
          <ul class="fp-combo__items" aria-label="Combo gồm">
            <li v-for="item in current.items" :key="item.id">
              <strong>{{ item.name }}</strong> {{ vnd(item.price) }}
            </li>
          </ul>
        </div>
        <div class="fp-combo__bar-buy">
          <p class="fp-combo__meta">
            Mua lẻ {{ vnd(current.old) }} període
            <span class="fp-combo__save"
              >Tiết kiệm {{ vnd(current.save) }}</span
            >
          </p>
          <button
            type="button"
            class="fp-combo__cta"
            :class="{ 'is-added': addedFeedback }"
            aria-live="polite"
            @click="add"
          >
            <template v-if="addedFeedback"
              ><CheckCircle2 :size="18" /> Đã thêm vào giỏ</template
            >
            <template v-else
              ><ShoppingBag :size="18" /> Thêm combo vào giỏ</template
            >
          </button>
        </div>
      </div>
    </Transition>

    <div class="fp-combo__ticker" aria-hidden="true">
      <div class="fp-combo__ticker-track">
        <span v-for="n in 2" :key="n">{{ tickerText }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.fp-combo {
  --fp-red: var(--red, #e52521);
  --fp-cream: var(--cream, #fff7ed);
  --fp-cream-light: #fffdf7;
  --fp-ink: var(--ink, #18181b);
  --fp-yellow: var(--yellow, #ffd233);
  --fp-display: var(--font-display, "Bricolage Grotesque", sans-serif);
  max-width: 100%;
  margin: 0;
  padding: clamp(12px, 3vw, 32px) var(--edge, 20px);
  color: var(--fp-ink);
  font-family: var(--font-ui, "Be Vietnam Pro", sans-serif);
  outline: none;
}
.fp-combo:focus-visible .fp-combo__stage {
  outline: 3px solid var(--fp-red);
  outline-offset: 4px;
}

/* ---------- Section branding ---------- */
.fp-combo__eyebrow {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 14px;
}
.fp-combo__kicker {
  font-family: var(--fp-display);
  font-size: max(11px, 0.9cqw);
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--fp-red);
  line-height: 1;
}
.fp-combo__section-title {
  margin: 0;
  font-family: var(--fp-display);
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  color: var(--fp-ink);
}

/* ---------- Poster ---------- */
.fp-combo__stage {
  position: relative;
  container-type: inline-size;
  aspect-ratio: 16 / 9;
  background: var(--fp-cream);
  border-radius: clamp(16px, 2.4vw, 28px);
  overflow: hidden;
}
.fp-combo__bg svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.fp-combo__blob {
  position: absolute;
  top: -9cqw;
  right: -7cqw;
  width: 26cqw;
  height: 19cqw;
  border-radius: 50%;
  background: var(--fp-red);
  transition: background-color 0.4s ease;
}

/* ---------- Nav ---------- */
.fp-combo__nav {
  position: absolute;
  top: 2cqw;
  right: 3.2cqw;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 0.8cqw;
  padding: 0.5cqw;
  border-radius: var(--r-pill);
  background: var(--fp-cream-light);
  box-shadow: 0 0.4cqw 1.2cqw rgb(24 24 27 / 0.25);
}
.fp-combo__nav-btn {
  display: grid;
  place-items: center;
  width: max(44px, 3.4cqw);
  height: max(44px, 3.4cqw);
  border: 0;
  border-radius: 50%;
  background: var(--fp-red);
  color: #fff;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background-color 0.4s ease;
}
.fp-combo__nav-btn:hover {
  transform: scale(1.1);
}
.fp-combo__nav-btn svg {
  width: 62%;
  height: 62%;
}
.fp-combo__nav-count {
  min-width: 5.2em;
  text-align: center;
  font-size: max(11px, 1.2cqw);
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--fp-red);
}

/* ---------- Slide ---------- */
.fp-combo__slide {
  position: absolute;
  inset: 0;
}
.fp-combo__title {
  position: absolute;
  top: 8cqw;
  left: 4.2cqw;
  z-index: 2;
  margin: 0;
  font-family: var(--fp-display);
  font-weight: 800;
  text-transform: uppercase;
  color: var(--fp-red);
  transition: color 0.4s ease;
}
.fp-combo__kicker {
  display: block;
  font-size: 8.2cqw;
  line-height: 0.9;
}
.fp-combo__kicker-line {
  display: block;
}
.fp-combo__name {
  display: block;
  margin-top: 1.3cqw;
  font-size: 2.6cqw;
  line-height: 1.1;
  letter-spacing: 0.05em;
  color: var(--fp-ink);
}

/* ---------- Red price card ---------- */
.fp-combo__red-card {
  position: absolute;
  top: 29cqw;
  left: 4.2cqw;
  right: 4.2cqw;
  height: 23cqw;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 3.6cqw;
  border-radius: 4cqw;
  background: var(--fp-red);
  color: #fff;
  box-shadow:
    0 1.2cqw 0 #fff,
    0 2.6cqw 3.2cqw rgb(120 20 15 / 0.22);
  transition: background-color 0.4s ease;
}
.fp-combo__price-line {
  display: block;
  font-family: var(--fp-display);
  font-size: 5.4cqw;
  font-weight: 800;
  line-height: 0.92;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
}
.fp-combo__white-bar {
  display: block;
  width: 9cqw;
  height: 1.15cqw;
  margin-top: 1.3cqw;
  border-radius: 0.2cqw;
  background: #fff;
}

/* ---------- Product cluster ---------- */
.fp-combo__glow {
  position: absolute;
  top: 4cqw;
  left: 38cqw;
  width: 60cqw;
  height: 50cqw;
  background: radial-gradient(
    closest-side,
    rgb(255 255 255 / 0.35),
    transparent 72%
  );
}
.fp-combo__cluster {
  position: absolute;
  top: 2.5cqw;
  left: 38cqw;
  width: 60cqw;
  height: 52cqw;
  z-index: 3;
  pointer-events: none;
}
.fp-combo__product {
  position: absolute;
  transform: rotate(var(--r, 0deg));
  pointer-events: auto;
  animation: fp-pop 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.2) backwards;
  animation-delay: calc(var(--i, 0) * 90ms);
  transition: transform 0.3s ease;
}
.fp-combo__product:hover {
  transform: rotate(var(--r, 0deg)) scale(1.04);
}
.fp-combo__product img {
  display: block;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 1.4cqw 1.6cqw rgb(24 24 27 / 0.35));
}
@keyframes fp-pop {
  from {
    opacity: 0;
    transform: translateY(8%) rotate(var(--r, 0deg)) scale(0.9);
  }
}

/* ---------- Buy bar ---------- */
.fp-combo__bar {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 16px 28px;
  margin-top: 14px;
  padding: 16px 22px;
  border-radius: var(--radius);
  background: var(--fp-cream-light);
  border: 2px solid color-mix(in srgb, var(--fp-red) 18%, transparent);
}
.fp-combo__desc {
  margin: 0 0 10px;
  font-size: 1rem;
  line-height: 1.45;
}
.fp-combo__items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.fp-combo__items li {
  padding: 5px 12px;
  border-radius: var(--r-pill);
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--fp-red) 25%, transparent);
  font-size: 0.82rem;
}
.fp-combo__bar-buy {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}
.fp-combo__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 0.9rem;
}
.fp-combo__meta s {
  color: color-mix(in srgb, var(--fp-ink) 50%, transparent);
}
.fp-combo__save {
  padding: 3px 10px;
  border-radius: var(--r-pill);
  background: var(--fp-yellow);
  color: #5a4400;
  font-weight: 800;
  font-size: 0.82rem;
}
.fp-combo__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: max(180px, 24cqw);
  padding: max(10px, 1.4cqw) max(20px, 2.6cqw);
  border: 0;
  border-radius: var(--r-pill);
  background: var(--fp-red);
  color: #fff;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--shadow);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.3s ease;
}
.fp-combo__cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 var(--fp-ink);
}
.fp-combo__cta:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--fp-ink);
}
.fp-combo__cta.is-added {
  background: var(--green-ink, #156b3d);
}

/* ---------- Ticker ---------- */
.fp-combo__ticker {
  margin-top: 14px;
  overflow: hidden;
  border-radius: var(--r-pill);
  background: var(--fp-ink);
  color: var(--fp-cream);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}
.fp-combo__ticker-track {
  display: flex;
  width: max-content;
  padding: 8px 0;
  animation: fp-marquee 40s linear infinite;
}
.fp-combo__ticker-track span {
  white-space: nowrap;
}
@keyframes fp-marquee {
  to {
    transform: translateX(-50%);
  }
}

/* ---------- Transitions ---------- */
.fp-fade-enter-active,
.fp-fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.fp-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fp-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ---------- Màn hình nhỏ ---------- */
@container (max-width: 560px) {
  .fp-combo__eyebrow,
  .fp-combo__nav-count {
    display: none;
  }
}
@media (max-width: 720px) {
  .fp-combo__bar {
    grid-template-columns: 1fr;
  }
  .fp-combo__bar-buy {
    align-items: stretch;
  }
  .fp-combo__meta {
    justify-content: space-between;
  }
}
@media (prefers-reduced-motion: reduce) {
  .fp-combo__product,
  .fp-combo__ticker-track {
    animation: none;
  }
  .fp-fade-enter-active,
  .fp-fade-leave-active {
    transition: none;
  }
}
.fp-combo__nav-btn:focus-visible,
.fp-combo__cta:focus-visible {
  outline: 3px solid var(--fp-ink, #18181b);
  outline-offset: 2px;
}
.fp-combo__kicker,
.fp-combo__section-title,
.fp-combo__title,
.fp-combo__name {
  line-height: 1.05;
}
.fp-combo__desc {
  line-height: 1.5;
  max-width: 60ch;
  text-wrap: pretty;
}
</style>
