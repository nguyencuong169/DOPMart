<script setup>
import { computed } from "vue";
import { Heart, ArrowUpRight } from "lucide-vue-next";
import QuickAdd from "../product/QuickAdd.vue";
import { headWords } from "../../data/products";

const props = defineProps({
  product: { type: Object, required: true },
  index: { type: Number, default: 0 },
  stock: { type: Number, default: null },
  floor: { type: [Number, String], default: "" },
  featured: { type: Boolean, default: false },
  favorited: { type: Boolean, default: false },
});
const emit = defineEmits(["quick", "toggle-favorite"]);

const soldOut = computed(() => props.stock !== null && props.stock <= 0);
const lowStock = computed(
  () => props.stock !== null && props.stock > 0 && props.stock <= 3,
);
const discount = computed(() => {
  const oldPrice = props.product.oldPrice;
  const price = props.product.price;
  return oldPrice && oldPrice > price
    ? Math.round((1 - price / oldPrice) * 100)
    : 0;
});

const handleQuick = () => emit("quick");
const handleToggleFavorite = () => emit("toggle-favorite");

const fmt = (n) => n.toLocaleString("vi-VN");

const onColor = (hex) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const l =
    (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.62 ? "#1a1a1a" : "#ffffff";
};

const stockLabel = computed(() => {
  if (props.stock === null) return "";
  const at = props.floor === "" ? "" : `Tầng ${props.floor}`;
  const tail = at ? ` · ${at}` : "";
  if (soldOut.value) return `Hết hàng${tail}`;
  if (lowStock.value) return `Chỉ còn ${props.stock}${tail}`;
  return `Còn ${props.stock}${tail}`;
});

const stockDotColor = computed(() => {
  if (props.stock === null) return "";
  if (props.stock <= 0) return "var(--red-ink)";
  if (props.stock <= 3) return "#8a4b00";
  return "var(--green-ink)";
});

const slogan = computed(() => {
  const cat = props.product.category;
  const hw = headWords[cat];
  if (hw) return hw;
  const name = (props.product.categoryName ?? "").toUpperCase();
  return [name, ""];
});

const lastWordHollow = computed(() => {
  const words = String(props.product.name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return { head: "", last: "" };
  if (words.length === 1) return { head: "", last: words[0] };
  const last = words.pop();
  return { head: words.join(" "), last };
});
</script>

<template>
  <article
    class="shelf-card"
    :class="{ 'shelf-card--feature': featured, 'is-sold-out': soldOut }"
    :style="{
      '--c': product.color,
      '--on': onColor(product.color),
      '--i': index,
      '--tilt': index % 2 === 0 ? '3deg' : '-3deg',
    }"
  >
    <div class="shelf-card__after" aria-hidden="true" />

    <!-- TOP RAIL -->
    <div class="shelf-card__rail" v-if="!featured">
      <span class="shelf-card__index" aria-hidden="true">
        {{ String(index + 1).padStart(2, "0") }}
      </span>
      <span class="shelf-card__cat">{{ product.categoryName }}</span>
      <button
        type="button"
        class="shelf-card__fav"
        :class="{ liked: favorited }"
        :aria-label="favorited ? `Bỏ lưu ${product.name}` : `Lưu ${product.name}`"
        :aria-pressed="favorited"
        @click="handleToggleFavorite"
      >
        <Heart :size="17" />
      </button>
    </div>

    <!-- STAGE -->
    <div class="shelf-card__stage" v-if="!featured">
      <div class="shelf-card__poster" aria-hidden="true">
        <span
          class="shelf-card__poster-line shelf-card__poster-line--solid"
          >{{ slogan[0] }}</span
        >
        <span
          class="shelf-card__poster-line shelf-card__poster-line--hollow"
          >{{ slogan[1] }}</span
        >
      </div>

      <i class="shelf-card__ground" />

      <button
        type="button"
        class="shelf-card__shot"
        :aria-label="`Xem nhanh ${product.name}`"
        @click="handleQuick"
        :disabled="soldOut"
      >
        <img
          :src="product.image"
          :alt="product.name"
          loading="lazy"
          decoding="async"
        />
      </button>

      <span class="shelf-card__quick-label" aria-hidden="true">XEM NHANH</span>

      <!-- HANGING TAGS LEFT -->
      <div class="shelf-card__tags" aria-hidden="true">
        <span
          v-if="product.isNew"
          class="shelf-card__tag shelf-card__tag--new shelf-card__tag--hang-left"
          >MỚI</span
        >
        <span
          v-if="product.hot"
          class="shelf-card__tag shelf-card__tag--hot shelf-card__tag--hang-left"
          >BÁN CHẠY</span
        >
        <span
          v-if="discount"
          class="shelf-card__tag shelf-card__tag--save shelf-card__tag--hang-left"
          >-{{ discount }}%</span
        >
      </div>

      <!-- PRICE STICKER BOTTOM-RIGHT -->
      <span
        class="shelf-card__tag shelf-card__tag--price shelf-card__tag--hang-right"
        aria-hidden="true"
        >{{ fmt(product.price) }} ₫</span
      >
    </div>

    <!-- PLATE -->
    <div class="shelf-card__plate" v-if="!featured">
      <button
        type="button"
        class="shelf-card__name-btn"
        :title="product.name"
        @click="handleQuick"
      >
        <h3 class="shelf-card__name">{{ product.name }}</h3>
      </button>
      <p class="shelf-card__meta">
        <span>★ {{ product.rating }}</span
        ><span>{{ product.sold }} đã bán</span>
      </p>
      <p
        v-if="stockLabel"
        class="shelf-card__stock"
        :class="{ low: lowStock, out: soldOut }"
      >
        <span
          class="shelf-card__stock-dot"
          :style="{ background: stockDotColor }"
          aria-hidden="true"
        />
        {{ stockLabel }}
      </p>
      <div class="shelf-card__price-row">
        <div class="shelf-card__prices">
          <strong class="shelf-card__price">{{ fmt(product.price) }} ₫</strong>
          <span
            v-if="discount"
            class="shelf-card__old-price"
            >{{ fmt(product.oldPrice) }} ₫</span
          >
        </div>
        <QuickAdd :product="product" :stock="stock" variant="icon" />
      </div>
    </div>

    <!-- FEATURED CONTENT -->
    <div v-if="featured" class="shelf-card__feature">
      <div class="shelf-card__feature-copy">
        <div class="shelf-card__feature-sticker" aria-hidden="true">
          <span class="shelf-card__feature-pick">PICK</span>
          <span class="shelf-card__feature-num">#1</span>
        </div>
        <div class="shelf-card__feature-kicker">PICK #1 · TUẦN NÀY</div>
        <h2 class="shelf-card__feature-name">
          <span class="shelf-card__feature-name-head">
            {{ lastWordHollow.head }}
          </span>
          <span class="shelf-card__feature-name-last" aria-hidden="true">
            {{ lastWordHollow.last }}
          </span>
        </h2>
        <div class="shelf-card__feature-tags">
          <span
            v-for="tag in product.tags"
            :key="tag"
            class="shelf-card__feature-tag"
            >{{ tag }}</span
          >
        </div>
        <p class="shelf-card__feature-desc">{{ product.description }}</p>
        <div class="shelf-card__feature-price">
          <span class="shelf-card__feature-price-label">CHỈ</span>
          <strong class="shelf-card__feature-price-value"
            >{{ fmt(product.price) }} <span>/món</span></strong
          >
          <span
            v-if="discount && !soldOut"
            class="shelf-card__feature-old"
            >{{ fmt(product.oldPrice) }} ₫</span
          >
        </div>
        <div class="shelf-card__feature-actions">
          <QuickAdd
            :product="product"
            :stock="stock"
            variant="row"
            label="Thêm vào giỏ"
          />
          <button
            type="button"
            class="shelf-card__feature-detail"
            @click="handleQuick"
          >
            Xem chi tiết
            <ArrowUpRight :size="14" />
          </button>
        </div>
      </div>
      <div class="shelf-card__feature-stage" aria-hidden="true">
        <div class="shelf-card__feature-disc" />
        <div class="shelf-card__feature-ring" />
        <button
          type="button"
          class="shelf-card__feature-shot"
          :aria-label="`Xem nhanh ${product.name}`"
          @click="handleQuick"
          :disabled="soldOut"
        >
          <img
            :src="product.image"
            :alt="product.name"
            loading="lazy"
            decoding="async"
          />
        </button>
        <div class="shelf-card__feature-sparks" aria-hidden="true">
          <i class="shelf-card__spark" style="--d: 0; --c: var(--yellow);" />
          <i class="shelf-card__spark" style="--d: 90deg; --c: var(--red-ink);" />
          <i class="shelf-card__spark" style="--d: 180deg; --c: var(--yellow);" />
          <i class="shelf-card__spark" style="--d: 270deg; --c: var(--red-ink);" />
        </div>
        <span
          v-if="discount && !soldOut"
          class="shelf-card__feature-save"
          aria-hidden="true"
          >-{{ discount }}%</span
        >
      </div>
    </div>
  </article>
</template>

<style scoped>
/* ==== ROOT ==== */
.shelf-card {
  container-type: inline-size;
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--paper-bright);
  border: var(--bw-bold) solid var(--ink);
  border-radius: 26px;
  box-shadow: 4px 4px 0 var(--ink);
  transition:
    transform 0.28s cubic-bezier(0.3, 1.15, 0.5, 1),
    box-shadow 0.28s;
  animation: card-in 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
  animation-delay: calc(var(--i) * 60ms);
}
@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.97);
  }
}
.shelf-card:not(.shelf-card--feature):hover,
.shelf-card:not(.shelf-card--feature):focus-within {
  transform: translate(-3px, -3px);
  box-shadow: 7px 7px 0 var(--ink);
}
.shelf-card__after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  border-radius: inherit;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.04) 2px,
    rgba(0, 0, 0, 0.04) 4px
  );
  opacity: 0.4;
}

/* ==== TOP RAIL ==== */
.shelf-card__rail {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px 6px;
}
.shelf-card__index {
  font-family: "Barlow Condensed", "Arial Narrow", Impact, sans-serif;
  font-weight: 900;
  font-size: 22px;
  line-height: 1;
  letter-spacing: -0.02em;
  color: transparent;
  -webkit-text-stroke: 1px var(--ink);
  text-transform: uppercase;
}
.shelf-card__cat {
  flex: 1;
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--on-cream);
}
.shelf-card__fav {
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  padding: 0;
  border: var(--bw-bold) solid var(--ink);
  border-radius: 50%;
  background: #fff;
  color: var(--ink);
  box-shadow: 2px 2px 0 var(--ink);
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.15s,
    background 0.2s;
}
.shelf-card__fav:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 var(--ink);
}
.shelf-card__fav.liked {
  background: var(--red-ink);
  color: var(--cream);
}
.shelf-card__fav:focus-visible {
  outline: 3px solid var(--ink);
  outline-offset: 2px;
}

/* ==== STAGE ==== */
.shelf-card__stage {
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
  padding-top: 120%;
  min-height: 150px;
  overflow: hidden;
  border-radius: inherit;
}
.shelf-card__stage::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  background: radial-gradient(
    ellipse at 50% -20%,
    color-mix(in srgb, var(--c) 18%, transparent),
    transparent 60%
  );
  border-radius: inherit;
}
.shelf-card__stage::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 60%;
  height: 60%;
  z-index: 0;
  background: color-mix(in srgb, var(--c) 10%, transparent);
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
  border-radius: 0 26px 0 0;
}

/* POSTER LINES */
.shelf-card__poster {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: "Barlow Condensed", "Arial Narrow", Impact, sans-serif;
  font-weight: 900;
  font-style: italic;
  font-size: 19cqw;
  line-height: 0.92;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  text-align: center;
}
.shelf-card__poster-line {
  opacity: 0;
  transition:
    opacity 0.45s ease-out,
    transform 0.55s cubic-bezier(0.3, 1.15, 0.5, 1);
}
.shelf-card__poster-line--solid {
  color: color-mix(in srgb, var(--c) 86%, var(--ink));
  transform: translateY(-18cqw);
}
.shelf-card__poster-line--hollow {
  color: var(--ink);
  transform: translateY(18cqw);
}
.shelf-card:hover .shelf-card__poster-line,
.shelf-card:focus-within .shelf-card__poster-line {
  opacity: 1;
  transform: translateY(0);
}

/* PACK SHOT */
.shelf-card__shot {
  position: absolute;
  left: 50%;
  top: 8%;
  z-index: 2;
  width: 78%;
  max-height: 100%;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transform: translateX(-50%) rotate(var(--tilt));
  transform-origin: 50% 90%;
  transition:
    transform 0.5s cubic-bezier(0.3, 1.15, 0.5, 1),
    filter 0.4s ease-out;
  filter: drop-shadow(2px 6px 3px rgba(0, 0, 0, 0.18))
    drop-shadow(10px 24px 18px rgba(0, 0, 0, 0.16));
}
.shelf-card__shot img {
  display: block;
  width: 100%;
  height: auto;
  animation: float 5s ease-in-out infinite;
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
.shelf-card__shot:focus-visible {
  outline: 3px solid var(--ink);
  outline-offset: 8px;
  border-radius: 12px;
}
.shelf-card:hover .shelf-card__shot,
.shelf-card:focus-within .shelf-card__shot {
  transform: translateX(-50%) translateY(-8px) rotate(var(--tilt)) scale(1.04);
  filter: drop-shadow(2px 8px 4px rgba(0, 0, 0, 0.16))
    drop-shadow(14px 32px 24px rgba(0, 0, 0, 0.18));
}
.shelf-card__shot:disabled {
  cursor: not-allowed;
}

/* CONTACT SHADOW */
.shelf-card__ground {
  position: absolute;
  left: 50%;
  bottom: 8%;
  z-index: 1;
  width: 55%;
  height: 6cqw;
  transform: translateX(-50%);
  background: radial-gradient(closest-side, rgba(0, 0, 0, 0.35), transparent);
  filter: blur(8px);
  mix-blend-mode: multiply;
  transition:
    transform 0.45s,
    opacity 0.45s;
}
.shelf-card:hover .shelf-card__ground,
.shelf-card:focus-within .shelf-card__ground {
  transform: translateX(-50%) scale(0.88, 0.82);
  opacity: 0.85;
}

/* QUICK LABEL */
.shelf-card__quick-label {
  position: absolute;
  left: 50%;
  bottom: 4cqw;
  z-index: 3;
  padding: 6px 16px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: var(--ink);
  color: var(--cream);
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
  box-shadow: 2px 2px 0 var(--ink);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease-out;
}
.shelf-card:hover .shelf-card__quick-label,
.shelf-card:focus-within .shelf-card__quick-label {
  opacity: 1;
}

/* HANGING TAGS */
.shelf-card__tags {
  position: absolute;
  left: 1%;
  top: 26%;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  pointer-events: none;
}
.shelf-card__tag {
  position: relative;
  padding: 6px 10px;
  border: var(--bw-bold) solid var(--ink);
  border-radius: 8px;
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: 0;
  white-space: nowrap;
  box-shadow: 2px 3px 0 var(--ink);
}
.shelf-card__tag::before {
  content: "";
  position: absolute;
  top: 50%;
  width: 6px;
  height: 6px;
  margin-top: -3px;
  border: 1.5px solid currentColor;
  border-radius: 50%;
  background: inherit;
}
.shelf-card__tag::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 26px;
  height: 2px;
  margin-top: -1px;
  border-radius: 2px;
  background: #1a1a1a;
}
.shelf-card__tag--hang-left {
  transform: rotate(-6deg);
}
.shelf-card__tag--hang-left::before {
  right: 4px;
}
.shelf-card__tag--hang-left::after {
  left: calc(100% - 7px);
  transform-origin: 0 50%;
  transform: rotate(-34deg);
}
.shelf-card__tag--hang-right::before {
  left: 4px;
}
.shelf-card__tag--hang-right::after {
  right: calc(100% - 7px);
  transform-origin: 100% 50%;
  transform: rotate(34deg);
}
.shelf-card__tag--new {
  background: var(--green-ink);
  color: var(--cream);
}
.shelf-card__tag--hot {
  background: var(--red-ink);
  color: var(--cream);
}
.shelf-card__tag--save {
  background: var(--cream);
  color: var(--red-ink);
  border-color: var(--red-ink);
}
.shelf-card__tag--price {
  position: absolute;
  right: 2%;
  bottom: 9%;
  z-index: 5;
  background: var(--cream);
  color: var(--red-ink);
  transform: rotate(5deg);
}

/* PLATE */
.shelf-card__plate {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 4px;
  padding: 10px 14px 14px;
  border-top: 1.5px dashed color-mix(in srgb, var(--ink) 22%, transparent);
}
.shelf-card__name-btn {
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
  cursor: pointer;
  color: var(--ink);
}
.shelf-card__name {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(15px, 4.6cqw, 21px);
  font-weight: 800;
  line-height: 1.16;
  letter-spacing: var(--tracking-display);
  max-width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.shelf-card__meta {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--on-cream);
}
.shelf-card__stock {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--on-cream);
}
.shelf-card__stock.low {
  color: #8a4b00;
}
.shelf-card__stock.out {
  color: var(--red-ink);
}
.shelf-card__stock-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.shelf-card__price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1.5px dashed color-mix(in srgb, var(--ink) 22%, transparent);
}
.shelf-card__prices {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}
.shelf-card__price {
  font-size: 20px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  color: var(--red-ink);
}
.shelf-card__old-price {
  font-size: 14px;
  font-weight: 500;
  color: var(--on-cream);
  text-decoration: line-through;
}

/* ==== FEATURED VARIANT ==== */
.shelf-card--feature {
  background: var(--ink);
  border-radius: 28px;
  box-shadow: 8px 8px 0 var(--yellow);
}
.shelf-card--feature .shelf-card__rail {
  display: none;
}
.shelf-card--feature .shelf-card__stage {
  display: none;
}
.shelf-card--feature .shelf-card__plate {
  display: none;
}

.shelf-card__feature {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}
@container (min-width: 640px) {
  .shelf-card__feature {
    grid-template-columns: 1.05fr 0.95fr;
  }
}
@container (max-width: 639px) {
  .shelf-card__feature-stage {
    padding-top: 82%;
  }
}

/* FEATURE STICKER */
.shelf-card__feature-sticker {
  position: absolute;
  top: -14px;
  right: 16px;
  z-index: 10;
  width: 52px;
  height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  background: var(--red-ink);
  clip-path: polygon(
    50% 0%,
    61% 35%,
    98% 35%,
    68% 57%,
    79% 91%,
    50% 70%,
    21% 91%,
    32% 57%,
    2% 35%,
    39% 35%
  );
  transform: rotate(-3deg);
  box-shadow: 3px 3px 0 var(--ink);
}
.shelf-card__feature-pick {
  font-family: var(--font-ui);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--yellow);
  line-height: 1;
}
.shelf-card__feature-num {
  font-family: "Barlow Condensed", "Arial Narrow", Impact, sans-serif;
  font-weight: 900;
  font-size: 18px;
  line-height: 1;
  color: var(--yellow);
}

/* FEATURE COPY */
.shelf-card__feature-copy {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 46px 32px 32px;
  color: var(--cream);
}
.shelf-card__feature-kicker {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--yellow);
  margin-bottom: 8px;
}
.shelf-card__feature-name {
  margin: 0 0 16px;
  font-family: "Barlow Condensed", "Arial Narrow", Impact, sans-serif;
  font-weight: 900;
  font-style: italic;
  font-size: clamp(34px, 5.2cqw, 62px);
  line-height: 0.86;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--yellow);
}
.shelf-card__feature-name-last {
  color: transparent;
  -webkit-text-stroke: 1.5px var(--cream);
}
.shelf-card__feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.shelf-card__feature-tag {
  padding: 4px 10px;
  border: 1.5px solid color-mix(in srgb, var(--cream) 40%, transparent);
  border-radius: 999px;
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 700;
  color: var(--cream);
  background: transparent;
}
.shelf-card__feature-desc {
  margin: 0 0 20px;
  font-family: var(--font-ui);
  font-size: 13px;
  line-height: 1.5;
  color: var(--on-black);
}
.shelf-card__feature-price {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.shelf-card__feature-price-label {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--yellow);
}
.shelf-card__feature-price-value {
  font-family: "Barlow Condensed", "Arial Narrow", Impact, sans-serif;
  font-weight: 900;
  font-size: 34px;
  line-height: 1;
  color: var(--yellow);
}
.shelf-card__feature-price-value span {
  font-size: 16px;
  font-weight: 600;
}
.shelf-card__feature-old {
  font-family: var(--font-ui);
  font-size: 16px;
  font-weight: 500;
  color: var(--cream);
  text-decoration: line-through;
  opacity: 0.6;
}
.shelf-card__feature-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.shelf-card__feature-detail {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 40px;
  border: 0;
  background: transparent;
  color: var(--cream);
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.shelf-card__feature-detail:hover {
  opacity: 1;
}
.shelf-card__feature-detail:focus-visible {
  outline: 3px solid var(--yellow);
  outline-offset: 3px;
  border-radius: 4px;
}

/* FEATURE STAGE */
.shelf-card__feature-stage {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.shelf-card__feature-disc {
  position: absolute;
  inset: 10%;
  z-index: 0;
  background: radial-gradient(
    circle at 50% 50%,
    color-mix(in srgb, var(--cream) 25%, transparent),
    transparent 70%
  );
  border-radius: 50%;
}
.shelf-card__feature-ring {
  position: absolute;
  inset: 18%;
  z-index: 0;
  border: 1.5px dashed color-mix(in srgb, var(--cream) 35%, transparent);
  border-radius: 50%;
}
.shelf-card__feature-shot {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 86%;
  max-height: 100%;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transform: rotate(-6deg);
  transform-origin: 50% 90%;
  transition:
    transform 0.5s cubic-bezier(0.3, 1.15, 0.5, 1),
    filter 0.4s ease-out;
  filter: drop-shadow(2px 8px 4px rgba(0, 0, 0, 0.2))
    drop-shadow(12px 28px 20px rgba(0, 0, 0, 0.18));
}
.shelf-card__feature-shot img {
  display: block;
  width: 100%;
  height: auto;
  animation: float 5s ease-in-out infinite;
}
.shelf-card__feature-shot:focus-visible {
  outline: 3px solid var(--yellow);
  outline-offset: 8px;
  border-radius: 12px;
}
.shelf-card__feature-shot:disabled {
  cursor: not-allowed;
}
.shelf-card:hover .shelf-card__feature-shot,
.shelf-card:focus-within .shelf-card__feature-shot {
  transform: rotate(-6deg) translateY(-6px) scale(1.03);
}

/* SPARKS */
.shelf-card__feature-sparks {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}
.shelf-card__spark {
  position: absolute;
  width: 14px;
  height: 14px;
  background: var(--c);
  clip-path: polygon(
    50% 0%,
    61% 35%,
    98% 35%,
    68% 57%,
    79% 91%,
    50% 70%,
    21% 91%,
    32% 57%,
    2% 35%,
    39% 35%
  );
  animation: spark-twinkle 2s ease-in-out infinite;
  animation-delay: calc(var(--d) / 360 * 2s);
}
.shelf-card__spark:nth-child(1) {
  top: 15%;
  left: 10%;
}
.shelf-card__spark:nth-child(2) {
  top: 10%;
  right: 15%;
}
.shelf-card__spark:nth-child(3) {
  bottom: 15%;
  right: 10%;
}
.shelf-card__spark:nth-child(4) {
  bottom: 10%;
  left: 15%;
}
@keyframes spark-twinkle {
  0%,
  100% {
    opacity: 0.4;
    transform: rotate(0deg) scale(1);
  }
  50% {
    opacity: 1;
    transform: rotate(180deg) scale(1.3);
  }
}

/* FEATURE SAVE BADGE */
.shelf-card__feature-save {
  position: absolute;
  bottom: 8%;
  right: 8%;
  z-index: 4;
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  background: var(--yellow);
  color: var(--ink);
  border-radius: 50%;
  font-family: "Barlow Condensed", "Arial Narrow", Impact, sans-serif;
  font-weight: 900;
  font-size: 14px;
  line-height: 1;
  transform: rotate(8deg);
  box-shadow: 2px 2px 0 var(--ink);
  animation: save-pop 0.6s cubic-bezier(0.3, 1.25, 0.5, 1) both;
}
@keyframes save-pop {
  from {
    opacity: 0;
    transform: rotate(8deg) scale(0.6);
  }
}

/* SOLD OUT STATE */
.is-sold-out .shelf-card__shot img,
.is-sold-out .shelf-card__feature-shot img {
  filter: grayscale(0.45);
}
.is-sold-out .shelf-card__shot,
.is-sold-out .shelf-card__feature-shot {
  cursor: not-allowed;
}

/* REDUCED MOTION */
@media (prefers-reduced-motion: reduce) {
  .shelf-card,
  .shelf-card * {
    animation: none !important;
    transition: none !important;
  }
  .shelf-card__shot {
    transform: translateX(-50%) rotate(var(--tilt)) !important;
  }
  .shelf-card__feature-shot {
    transform: rotate(-6deg) !important;
  }
  .shelf-card__poster-line {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
  .shelf-card__quick-label {
    opacity: 0 !important;
  }
}

/* FOCUS VISIBLE FOR WHOLE CARD */
.shelf-card:focus-visible {
  outline: 3px solid var(--ink);
  outline-offset: 3px;
}
.shelf-card--feature:focus-visible {
  outline-color: var(--yellow);
}
</style>