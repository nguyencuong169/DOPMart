<script setup>
import { computed, ref } from "vue";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  Utensils,
} from "lucide-vue-next";
import { useProductStore } from "../../stores/productStore";
import { useCartStore } from "../../stores/cartStore";

const store = useProductStore();
const cart = useCartStore();
const index = ref(0);

/*
 * Per-combo palette accents keep each product card's edge and shadow tied to its
 * combo while the shared cream surface keeps the text contrast consistent.
 */
const PALETTES = [
  ["#c8192a", "#a83a09", "#921520"], // Cứu deadline  — đỏ / cam đất
  ["#0a5c3e", "#0e7a52"], // Sạc lại       — xanh lá sâu
  ["#4a1275", "#7a32a8", "#9640c4", "#2d0d5a"], // Hộp chia team — tím
];

/*
 * Tagline ngắn per-product — tạo cấu trúc 3 tầng: NAME → tagline → price
 * giống LEAFZILLA / "Greens stacked with attitude" / ₦5,000 trong Image 1.
 * Extend bảng này khi thêm sản phẩm mới vào store.
 */
const ITEM_TAGS = {
  1: "Giòn rụm · Cay phê",
  2: "Bùi béo · Healthy",
  3: "Nóng hổi · Đậm vị",
  4: "Giải khát tức thì",
  6: "Dẻo dai · Trái cây",
  8: "Thanh vị · Nhiệt đới",
};

const combos = computed(() =>
  [
    {
      name: "Cứu deadline",
      tag: "MÌ · NƯỚC · SNACK",
      ids: [3, 4, 1],
      price: 39000,
      color: "#b81f2b",
      copy: "Cứu đói nhanh trước một buổi họp dài.",
    },
    {
      name: "Sạc lại buổi chiều",
      tag: "HẠT · NƯỚC",
      ids: [2, 4],
      price: 25000,
      color: "#137c58",
      copy: "Nhẹ bụng nhưng vẫn đủ năng lượng cho buổi chiều.",
    },
    {
      name: "Hộp chia team",
      tag: "4 MÓN CHIA SẺ",
      ids: [1, 8, 6, 4],
      price: 45000,
      color: "#7a32a8",
      copy: "Một combo vui vẻ để chia cùng đồng đội.",
    },
  ].map((c, ci) => {
    const pal = PALETTES[ci];
    const items = c.ids
      .map((id, ii) => {
        const p = store.products.find((x) => x.id === id);
        return p ? { ...p, cardBg: pal[ii % pal.length] } : null;
      })
      .filter(Boolean);
    const old = items.reduce((s, p) => s + p.price, 0);
    return { ...c, items, old, save: old - c.price };
  }),
);

const current = computed(() => combos.value[index.value]);

function move(d) {
  index.value = (index.value + d + combos.value.length) % combos.value.length;
}

function add() {
  current.value.items.forEach((p) => cart.add(p, 1));
}
</script>

<template>
  <section class="dc" :style="{ '--cc': current.color }">
    <!-- Sunburst rays -->
    <div class="dc__rays" aria-hidden="true" />
    <svg class="dc__defs" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="dc-trapezoid-shape" clipPathUnits="objectBoundingBox">
          <path
            d="M .1 0 H .88 Q .96 0 .96 .08 V .72 Q .96 .8 .88 .82 L .12 1 Q .04 1 .04 .92 V .08 Q .04 0 .1 0 Z"
          />
        </clipPath>
      </defs>
    </svg>

    <div class="dc__layout">
      <!-- ── Left: copy + pricing + nav ── -->
      <aside class="dc__left">
        <p class="dc__eyebrow">
          <Sparkles :size="14" aria-hidden="true" />
          DOP COMBO
        </p>

        <p class="dc__copy">{{ current.copy }}</p>

        <div class="dc__pricing">
          <span class="dc__save-pill">
            Tiết kiệm&nbsp;<strong
              >{{ current.save.toLocaleString("vi-VN") }}₫</strong
            >
          </span>
          <div class="dc__price-line">
            <s>{{ current.old.toLocaleString("vi-VN") }} ₫</s>
            <strong class="dc__price-new"
              >{{ current.price.toLocaleString("vi-VN") }} ₫</strong
            >
          </div>
        </div>

        <button class="dc__cta" type="button" @click="add">
          Thêm cả combo <ShoppingBag :size="16" aria-hidden="true" />
        </button>

        <div class="dc__nav" role="group" aria-label="Điều hướng combo">
          <button type="button" aria-label="Combo trước" @click="move(-1)">
            <ChevronLeft :size="18" />
          </button>
          <span class="dc__nav-label" aria-live="polite">
            {{ String(index + 1).padStart(2, "0") }} /
            {{ String(combos.length).padStart(2, "0") }}
          </span>
          <button type="button" aria-label="Combo tiếp theo" @click="move(1)">
            <ChevronRight :size="18" />
          </button>
        </div>
      </aside>

      <!-- ── Right: big name + product strips ── -->
      <Transition name="combo-swap" mode="out-in">
        <div class="dc__right" :key="index">
          <p class="dc__tag">{{ current.tag }}</p>
          <h2 class="dc__name">{{ current.name }}</h2>

          <ul class="dc__strips" aria-label="Món trong combo">
            <li
              v-for="(item, i) in current.items"
              :key="item.id"
              :class="[
                'dc__strip',
                {
                  'dc__strip--flip': i % 2 !== 0,
                  'dc__strip--solo': current.items.length === 1,
                },
              ]"
              :style="{ '--n': i, '--bc': item.cardBg }"
            >
              <div class="dc__strip-body">
                <h3 class="dc__strip-name">{{ item.name }}</h3>
                <p class="dc__strip-meta">
                  <Utensils :size="14" aria-hidden="true" />
                  <span>{{ ITEM_TAGS[item.id] ?? item.categoryName }}</span>
                </p>
                <p class="dc__strip-price">
                  {{ item.price.toLocaleString("vi-VN") }}₫
                </p>
              </div>

              <div class="dc__img-wrap" aria-hidden="true">
                <img
                  :src="item.image"
                  :alt="item.name"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </li>
          </ul>
        </div>
      </Transition>
    </div>

    <!-- Scrolling ticker -->
    <div class="dc__ticker" aria-hidden="true">
      <div class="dc__ticker-track">
        <span
          >DOP MIX · LOVE PRICE · DOP MIX · LOVE PRICE · DOP MIX · LOVE PRICE
          &nbsp;&nbsp;&nbsp;&nbsp;</span
        >
        <span
          >DOP MIX · LOVE PRICE · DOP MIX · LOVE PRICE · DOP MIX · LOVE PRICE
          &nbsp;&nbsp;&nbsp;&nbsp;</span
        >
      </div>
    </div>
  </section>
</template>

<style scoped>
/* No local web font any more: the section used Barlow Condensed italic 900 for its
   display lines, which is neither of the two families the project keeps (and italic
   condensed has no Vietnamese mark coverage worth trusting). It now uses the same
   --font-display as every other headline. */

/* ─── Shell ─── */
.dc {
  --cc: #b81f2b;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(
      ellipse at 88% 12%,
      color-mix(in srgb, var(--cc) 18%, transparent),
      transparent 42%
    ),
    linear-gradient(132deg, #ffd22d 0%, #ffad1b 54%, #f47718 100%);
  color: #fff;
  isolation: isolate;
  transition: background-color 0.55s ease;
}

/* ─── Sunburst rays ─── */
.dc__rays {
  position: absolute;
  inset: 0;
  background: repeating-conic-gradient(
    from -4deg at 50% 48%,
    rgb(92 37 10 / 0.055) 0deg 5deg,
    transparent 5deg 12deg
  );
  opacity: 0.8;
  pointer-events: none;
}

.dc__defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

/* ─── Layout grid: two columns on the page measure ─── */
.dc__layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 280px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(24px, 3.5vw, 64px);
  /* same 12px edge as the shelves, the grids and the bestseller band, so the combo
     copy starts on the same line as every other section */
  padding: var(--sp-6) var(--edge) var(--sp-5);
  min-height: 440px;
}

/* ─── Left panel ─── */
.dc__left {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  padding-inline: clamp(16px, 2.4vw, 36px);
}

.dc__eyebrow {
  display: flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 7px 11px;
  border: 1px solid rgb(83 35 13 / 0.25);
  border-radius: var(--r-pill);
  background: rgb(255 253 247 / 0.34);
  color: #57260f;
  font-size: var(--fs-xs);
  font-weight: 800;
  letter-spacing: 0.17em;
  text-transform: uppercase;
}

.dc__copy {
  margin: 0;
  max-width: 28ch;
  color: #63381f;
  font-size: 15px;
  line-height: 1.55;
}

.dc__pricing {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.dc__save-pill {
  display: inline-flex;
  align-items: center;
  background: rgb(0 0 0 / 0.35);
  border-radius: 100px;
  padding: 0.3rem 0.9rem;
  font-size: var(--fs-xs);
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  width: fit-content;
}

.dc__save-pill strong {
  font-size: var(--fs-md);
  font-weight: 800;
  margin-left: 2px;
}

.dc__price-line {
  display: flex;
  align-items: baseline;
  gap: 0.65rem;
}

.dc__price-line s {
  font-size: var(--fs-sm);
  color: #713e24;
  text-decoration-thickness: 2px;
}

.dc__price-new {
  font-family: var(--font-display);
  color: #52220d;
  font-size: clamp(30px, 3vw, 40px);
  font-weight: 900;
  letter-spacing: -0.045em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

/* CTA — the card's plate language: ink rule, cream fill, hard shadow, 48px tall */
.dc__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  background: var(--cream);
  color: var(--ink);
  border: var(--bw-bold) solid var(--ink);
  border-radius: var(--r-pill);
  padding: 0 20px;
  font-family: var(--font-ui);
  font-size: var(--fs-md);
  font-weight: 800;
  cursor: pointer;
  width: fit-content;
  box-shadow: 4px 4px 0 var(--ink);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.dc__cta:hover {
  transform: translate(-1px, -1px);
  box-shadow: 5px 5px 0 var(--ink);
}

.dc__cta:active {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 var(--ink);
}

.dc__cta:focus-visible,
.dc__nav button:focus-visible {
  outline: 3px solid var(--ink);
  outline-offset: 2px;
  box-shadow: 0 0 0 6px var(--cream);
}

/* Nav — 44px targets, the project's touch floor (the brief asks for 40+) */
.dc__nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dc__nav button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: var(--bw-bold) solid #57260f;
  background: transparent;
  color: #57260f;
  cursor: pointer;
  transition: background 0.15s;
}

.dc__nav button:hover {
  background: rgb(255 253 247 / 0.6);
}

.dc__nav-label {
  font-size: var(--fs-sm);
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #57260f;
  font-variant-numeric: tabular-nums;
}

/* ─── Right panel ─── */
.dc__right {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: min(100%, 820px);
  justify-self: start;
}

.dc__tag {
  margin: 0;
  color: #57260f;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

/* Big headline — the shared display face, no local condensed italic */
.dc__name {
  font-family: var(--font-display);
  color: #54220e;
  font-weight: 900;
  font-style: normal;
  font-size: clamp(2.5rem, 4.5vw, 4rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
  text-transform: uppercase;
  margin: 0 0 0.6rem;
  padding-top: 0.06em;
  overflow-wrap: break-word;
  text-wrap: balance;
  text-shadow: 2px 2px 0 rgb(255 253 247 / 0.28);
}

/* ─── Product strips – REDESIGNED ─── */
.dc__strips {
  position: relative;
  isolation: isolate;
  list-style: none;
  margin: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 820px;
  row-gap: 7px;
  align-items: stretch;
  padding: 4px 3px;
  border-radius: 30px 12px 30px 12px;
}

.dc__strips::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: 28px 10px 28px 10px;
  background: linear-gradient(
    125deg,
    rgb(255 244 220 / 0.76),
    color-mix(in srgb, var(--cc) 18%, rgb(105 50 18 / 0.48))
  );
  box-shadow:
    inset 0 1px 5px rgb(77 39 15 / 0.15),
    0 8px 18px rgb(64 28 8 / 0.12);
}

.dc__strip {
  position: relative;
  display: flex;
  align-items: center;
  background: transparent;
  color: #552510;
  border: 0;
  border-radius: 18px 8px;
  min-height: 152px;
  width: 100%;
  overflow: visible;
  animation: strip-enter 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--n, 0) * 0.07s + 0.14s);
}

.dc__strip::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  clip-path: url(#dc-trapezoid-shape);
  background: radial-gradient(
    ellipse 78% 120% at 82% 50%,
    rgb(255 253 244 / 0.99) 0%,
    color-mix(in srgb, var(--bc) 9%, #fff1dc) 54%,
    color-mix(in srgb, var(--bc) 24%, #f3c77a) 100%
  );
  filter: drop-shadow(0 6px 12px rgb(64 28 8 / 0.2));
  opacity: 0.97;
  pointer-events: none;
  transition:
    opacity 0.25s ease,
    filter 0.25s ease;
}

.dc__strip--flip::before {
  transform: scaleX(-1);
  background: radial-gradient(
    ellipse 78% 120% at 18% 50%,
    rgb(255 253 244 / 0.99) 0%,
    color-mix(in srgb, var(--bc) 9%, #fff1dc) 54%,
    color-mix(in srgb, var(--bc) 24%, #f3c77a) 100%
  );
}

.dc__strip:hover::before {
  opacity: 1;
  filter: drop-shadow(0 9px 16px rgb(64 28 8 / 0.25));
}

.dc__strip--solo {
  border-radius: 28px 10px 28px 10px;
}

.dc__strip--flip {
  flex-direction: row-reverse;
}

.dc__strip--flip .dc__strip-body {
  padding-left: 4.2rem;
  padding-right: 1.2rem;
  text-align: right;
}

.dc__strip--flip .dc__strip-meta {
  justify-content: flex-end;
}

@keyframes strip-enter {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.97);
  }
}

/* ── Floating image ── */
.dc__img-wrap {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: clamp(176px, 15vw, 232px);
  height: clamp(176px, 15vw, 232px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  margin-inline: -0.25rem;
}

.dc__img-wrap img {
  width: 100%;
  height: 100%;
  max-height: 130%;
  object-fit: contain;
  transform: scale(1.3) translateY(-5%);
  filter: drop-shadow(0 10px 13px rgb(63 27 9 / 0.28));
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.dc__strip:hover .dc__img-wrap img {
  transform: scale(1.4) translateY(-8%);
}

/* ── Text body ── */
.dc__strip-body {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.3rem;
  padding: 1rem 4.2rem 1rem 1.2rem;
}

/* Item line 1 — name, in the display face */
.dc__strip-name {
  font-family: var(--font-display);
  font-weight: 900;
  font-style: normal;
  font-size: clamp(1.1rem, 1.65vw, 1.4rem);
  color: #642811;
  text-transform: uppercase;
  line-height: 1.15;
  letter-spacing: -0.035em;
  margin: 0;
  padding: 0;
  text-wrap: balance;
}

/* Item line 2 — what it tastes like, with a 14px plate icon so the line reads as
   "a thing you eat", not as a third tier of type */
.dc__strip-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #8f4c2b;
}

.dc__strip-meta svg {
  flex-shrink: 0;
}

/* Item line 3 — price */
.dc__strip-price {
  position: absolute;
  top: 50%;
  right: -38px;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  padding: 5px;
  border: 3px solid #fff4e3;
  border-radius: 50%;
  background: #52220d;
  color: var(--cream);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  margin: 0;
  text-align: center;
  line-height: 1.1;
  transform: translateY(-50%);
  box-shadow: 0 5px 12px rgb(64 28 8 / 0.24);
}

.dc__strip--flip .dc__strip-price {
  right: auto;
  left: -38px;
}

/* ─── Ticker: a 34px band with 12px type, not a 22px sliver of 10px caps ─── */
.dc__ticker {
  position: relative;
  z-index: 1;
  overflow: hidden;
  background: rgb(0 0 0 / 0.35);
  padding: 0.6rem 0;
}

.dc__ticker-track {
  display: flex;
  white-space: nowrap;
  animation: dc-ticker 26s linear infinite;
}

.dc__ticker-track span {
  flex-shrink: 0;
  font-size: var(--fs-xs);
  font-weight: 800;
  line-height: 1.2; /* stacked diacritics need the extra baseline room */
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--cream);
}

@keyframes dc-ticker {
  to {
    transform: translateX(-50%);
  }
}

/* ─── Combo swap transition ─── */
.combo-swap-enter-active,
.combo-swap-leave-active {
  transition: opacity 0.22s ease;
}

.combo-swap-enter-from,
.combo-swap-leave-to {
  opacity: 0;
}

/* ─── Reduced motion: the marquee stops dead, strips are already in place ─── */
@media (prefers-reduced-motion: reduce) {
  .dc__ticker-track {
    animation: none;
  }
  .dc__strip {
    animation: none;
  }
  .dc__strip,
  .dc__img-wrap img,
  .dc__cta,
  .combo-swap-enter-active,
  .combo-swap-leave-active {
    transition: none;
  }
}

/* ─── Responsive ─── */
@media (max-width: 960px) {
  .dc__layout {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-3);
    padding: var(--sp-5) var(--edge) var(--sp-4);
    min-height: 0;
  }

  /* Name + strips lên trước, copy/pricing xuống sau */
  .dc__right {
    order: -1;
  }

  .dc__name {
    font-size: clamp(2rem, 8vw, 3.25rem);
  }

  .dc__right {
    width: 100%;
  }

  .dc__strips {
    max-width: 820px;
  }

  .dc__copy {
    max-width: none;
  }
}

@media (max-width: 600px) {
  .dc__strip {
    min-height: 112px;
    border-radius: 15px 6px 15px 6px;
  }

  .dc__strips::before {
    border-radius: 20px 8px 20px 8px;
  }

  .dc__strips {
    row-gap: 5px;
    padding: 3px 2px;
  }

  .dc__img-wrap {
    width: 96px;
    height: 96px;
  }

  .dc__strip {
    min-height: 112px;
  }

  .dc__strip-body {
    gap: 0.25rem;
    padding: 0.8rem 2.8rem 0.8rem 0.7rem;
  }

  .dc__strip--flip .dc__strip-body {
    padding: 0.8rem 0.7rem 0.8rem 2.8rem;
  }

  .dc__strip-name {
    font-size: clamp(0.95rem, 4vw, 1.15rem);
  }

  .dc__strip-meta {
    font-size: 11px;
  }

  .dc__strip-price {
    right: -30px;
    width: 60px;
    height: 60px;
    font-size: 11px;
  }

  .dc__strip--flip .dc__strip-price {
    right: auto;
    left: -30px;
  }
}
</style>
