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
 * Per-combo card palettes — 1 màu tương ứng với 1 sản phẩm trong combo.
 * Mọi tông ở đây đã đo: chữ trắng trên từng màu phải qua AA (4.5:1).
 * Hai giá trị cũ trượt nên đã tối lại — #d64e12 (4.24) → #a83a09 (6.41);
 * band #ef3340 (4.02) → #b81f2b (6.42). Đổi tông nào thì đo lại tông đó.
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
              :class="['dc__strip', { 'dc__strip--flip': i % 2 !== 0 }]"
              :style="{ '--n': i, '--bc': item.cardBg }"
            >
              <!--
                DOM order: [strip-body, img-wrap]
                Default (row)       → body LEFT  | image RIGHT  (Image-1 style)
                .dc__strip--flip    → image LEFT  | body RIGHT  (xen kẽ)
              -->
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
  background: var(--cc);
  color: #fff;
  isolation: isolate;
  transition: background-color 0.55s ease;
}

/* ─── Sunburst rays ─── */
.dc__rays {
  position: absolute;
  inset: 0;
  background: repeating-conic-gradient(
    from -6deg at 68% 52%,
    rgb(255 255 255 / 0.07) 0deg 7deg,
    transparent 7deg 14deg
  );
  pointer-events: none;
}

/* ─── Layout grid: two columns on the page measure ─── */
.dc__layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 340px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(24px, 4vw, 72px);
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
}

.dc__eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: var(--fs-xs);
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--cream);
}

.dc__copy {
  margin: 0;
  font-size: var(--fs-sm);
  line-height: 1.6;
  color: var(--cream);
  max-width: 26ch;
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
  color: var(--cream);
  text-decoration-thickness: 2px;
}

.dc__price-new {
  font-family: var(--font-display);
  font-size: clamp(24px, 3.2vw, 36px);
  font-weight: 800;
  letter-spacing: var(--tracking-display);
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
  border: var(--bw-bold) solid var(--cream);
  background: transparent;
  color: var(--cream);
  cursor: pointer;
  transition: background 0.15s;
}

.dc__nav button:hover {
  background: rgb(255 255 255 / 0.22);
}

.dc__nav-label {
  font-size: var(--fs-sm);
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--cream);
  font-variant-numeric: tabular-nums;
}

/* ─── Right panel ─── */
.dc__right {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dc__tag {
  margin: 0;
  font-size: var(--fs-xs);
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--cream);
}

/* Big headline — the shared display face, no local condensed italic */
.dc__name {
  font-family: var(--font-display);
  font-weight: 800;
  font-style: normal;
  font-size: clamp(2.25rem, 5.2vw, 4.5rem);
  line-height: var(--lh-display);
  letter-spacing: var(--tracking-display);
  text-transform: uppercase;
  margin: 0 0 1rem;
  padding-top: 0.06em;
  overflow-wrap: break-word;
  text-wrap: balance;
}

/* ─── Product strips – REDESIGNED ─── */
.dc__strips {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dc__strip {
  position: relative;
  display: flex;
  align-items: center;
  /* flex-direction: row (default) → body LEFT | image RIGHT */
  background: var(--bc);
  color: #fff;
  border-radius: 100px;
  min-height: 108px;
  overflow: visible;
  box-shadow:
    0 6px 28px rgb(0 0 0 / 0.28),
    inset 0 1px 0 rgb(255 255 255 / 0.14); /* subtle top highlight */

  animation: strip-enter 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--n, 0) * 0.07s + 0.14s);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.dc__strip:hover {
  transform: translateY(-3px);
  box-shadow:
    0 14px 40px rgb(0 0 0 / 0.32),
    inset 0 1px 0 rgb(255 255 255 / 0.14);
}

@keyframes strip-enter {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.97);
  }
}

/* Flip: image LEFT, body RIGHT — tạo nhịp điệu xen kẽ */
.dc__strip--flip {
  flex-direction: row-reverse;
}

.dc__strip--flip .dc__strip-body {
  text-align: right;
}

/* ── Floating image ── */
.dc__img-wrap {
  flex-shrink: 0;
  width: 108px;
  height: 108px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.dc__img-wrap img {
  width: 100%;
  height: 100%;
  max-height: 130%; /* giới hạn overflow cho ảnh tall (lon nước, chai) */
  object-fit: contain;
  /* Nổi lên trên strip, nhô ra ngoài biên trên */
  transform: scale(1.55) translateY(-10%);
  filter: drop-shadow(0 8px 20px rgb(0 0 0 / 0.4));
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.dc__strip:hover .dc__img-wrap img {
  transform: scale(1.65) translateY(-15%);
}

/* ── Text body ── */
.dc__strip-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.35rem;
  padding: 1rem 1.6rem;
}

/* Item line 1 — name, in the display face */
.dc__strip-name {
  font-family: var(--font-display);
  font-weight: 800;
  font-style: normal;
  font-size: clamp(1rem, 1.9vw, 1.4rem);
  text-transform: uppercase;
  line-height: 1.15;
  letter-spacing: var(--tracking-display);
  margin: 0;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid rgb(255 255 255 / 0.28);
}

/* Item line 2 — what it tastes like, with a 14px plate icon so the line reads as
   "a thing you eat", not as a third tier of type */
.dc__strip-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: var(--fs-xs);
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--cream);
}

.dc__strip-meta svg {
  flex-shrink: 0;
}

/* Item line 3 — price */
.dc__strip-price {
  font-size: var(--fs-md);
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #fff;
  font-variant-numeric: tabular-nums;
  margin: 0;
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

  .dc__copy {
    max-width: none;
  }

  /* Trên mobile luôn left-align dù strip có flip hay không */
  .dc__strip--flip .dc__strip-body {
    text-align: left;
  }
}
</style>
