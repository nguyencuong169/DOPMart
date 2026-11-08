<script setup>
import { computed, ref } from "vue";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Sparkles,
} from "lucide-vue-next";
import { useProductStore } from "../../stores/productStore";
import { useCartStore } from "../../stores/cartStore";

const store = useProductStore();
const cart = useCartStore();
const index = ref(0);

/*
 * Per-combo card palettes — 1 màu tương ứng với 1 sản phẩm trong combo.
 * Chọn tông tối hơn combo-background để strip nổi lên nhưng vẫn hài hòa.
 * Khi productStore bổ sung trường `brandColor`, thay thế bằng:
 *   cardBg: p.brandColor ?? pal[ii % pal.length]
 */
const PALETTES = [
  ["#c8192a", "#d64e12", "#921520"], // Cứu deadline  — đỏ / cam đất
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
      color: "#ef3340",
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
          <Sparkles :size="12" aria-hidden="true" />
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
            <ChevronLeft :size="17" />
          </button>
          <span class="dc__nav-label" aria-live="polite">
            {{ String(index + 1).padStart(2, "0") }} /
            {{ String(combos.length).padStart(2, "0") }}
          </span>
          <button type="button" aria-label="Combo tiếp theo" @click="move(1)">
            <ChevronRight :size="17" />
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
                <small v-if="ITEM_TAGS[item.id]" class="dc__strip-tag">
                  {{ ITEM_TAGS[item.id] }}
                </small>
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
@import url("https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@1,900&display=swap");

/* ─── Shell ─── */
.dc {
  --cc: #ef3340;
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

/* ─── Layout grid ─── */
.dc__layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 260px 1fr;
  align-items: center;
  gap: 2.75rem;
  max-width: 1160px;
  margin: 0 auto;
  padding: 3.5rem 2.5rem 2.75rem;
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
  gap: 5px;
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  opacity: 0.72;
}

.dc__copy {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.65;
  opacity: 0.88;
  max-width: 24ch;
}

.dc__pricing {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.dc__save-pill {
  display: inline-flex;
  align-items: center;
  background: rgb(0 0 0 / 0.22);
  border-radius: 100px;
  padding: 0.3rem 0.9rem;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  width: fit-content;
}

.dc__save-pill strong {
  font-size: 0.9rem;
  font-weight: 800;
  margin-left: 2px;
}

.dc__price-line {
  display: flex;
  align-items: baseline;
  gap: 0.65rem;
}

.dc__price-line s {
  font-size: 0.9rem;
  opacity: 0.5;
}

.dc__price-new {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1;
}

/* CTA */
.dc__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 100px;
  padding: 0.85rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  width: fit-content;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.dc__cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.32);
}

/* Nav */
.dc__nav {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.dc__nav button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1.5px solid rgb(255 255 255 / 0.4);
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s;
}

.dc__nav button:hover {
  background: rgb(255 255 255 / 0.2);
}

.dc__nav-label {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  opacity: 0.72;
}

/* ─── Right panel ─── */
.dc__right {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dc__tag {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  opacity: 0.72;
}

/* BIG headline – food poster style */
.dc__name {
  font-family: "Barlow Condensed", "Impact", "Arial Narrow", system-ui;
  font-weight: 900;
  font-style: italic;
  font-size: clamp(2.75rem, 6.5vw, 5.25rem);
  line-height: 0.88;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  margin: 0 0 1rem;
  word-break: break-word;
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

/* Big condensed italic name — food-poster style (giống LEAFZILLA, MIGHTYMEAT) */
.dc__strip-name {
  font-family: "Barlow Condensed", "Impact", "Arial Narrow", system-ui;
  font-weight: 900;
  font-style: italic;
  font-size: clamp(1.1rem, 2.3vw, 1.65rem);
  text-transform: uppercase;
  line-height: 1;
  letter-spacing: 0.03em;
  margin: 0;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid rgb(255 255 255 / 0.2);
  text-shadow: 0 2px 10px rgb(0 0 0 / 0.25);
}

/* Tagline — tầng 2 (giống "Greens stacked with attitude" trong Image 1) */
.dc__strip-tag {
  font-size: 0.65rem;
  font-weight: 500;
  font-style: italic;
  letter-spacing: 0.06em;
  opacity: 0.65;
  margin: 0;
  line-height: 1;
}

/* Price — tầng 3, prominent */
.dc__strip-price {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  opacity: 0.9;
  margin: 0;
}

/* ─── Ticker ─── */
.dc__ticker {
  position: relative;
  z-index: 1;
  overflow: hidden;
  background: rgb(0 0 0 / 0.25);
  padding: 0.42rem 0;
}

.dc__ticker-track {
  display: flex;
  white-space: nowrap;
  animation: dc-ticker 22s linear infinite;
}

.dc__ticker-track span {
  flex-shrink: 0;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
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

/* ─── Responsive ─── */
@media (max-width: 800px) {
  .dc__layout {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 2.5rem 1.5rem;
    min-height: auto;
  }

  /* Name + strips lên trước, copy/pricing xuống sau */
  .dc__right {
    order: -1;
  }

  .dc__name {
    font-size: clamp(2.25rem, 10vw, 4rem);
  }

  .dc__copy {
    max-width: none;
  }

  /* Trên mobile luôn left-align dù strip có flip hay không */
  .dc__strip--flip .dc__strip-body {
    text-align: left;
  }

  .dc__strip-name {
    font-size: clamp(0.95rem, 3.5vw, 1.4rem);
  }

  .dc__strip-tag {
    font-size: 0.6rem;
  }

  .dc__strip-price {
    font-size: 0.82rem;
  }
}
</style>
