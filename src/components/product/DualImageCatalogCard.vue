<script setup>
import { computed, onMounted, ref } from "vue";
import { Heart } from "lucide-vue-next";
import QuickAdd from "./QuickAdd.vue";
import { headWords } from "../../data/products";

const props = defineProps({
  product: { type: Object, required: true },
  index: { type: Number, default: 0 },
  variant: { type: String, default: "shelf" },
  favorited: { type: Boolean, default: false },
  stock: { type: Number, default: null },
  floor: { type: [Number, String], default: "" },
  hideInfo: { type: Boolean, default: false },
  /* ảnh hiện khi hover (ví dụ món đã chế biến). Nếu bỏ trống, giữ nguyên ảnh mặc định */
  hoverImage: { type: String, default: "" },
});
const emit = defineEmits(["quick", "toggle-favorite"]);

const isGrid = computed(() => props.variant === "grid");
const soldOut = computed(() => props.stock !== null && props.stock <= 0);
const nameVisible = ref(false);
const lowStock = computed(
  () => props.stock !== null && props.stock > 0 && props.stock <= 3,
);
const stockLabel = computed(() => {
  if (props.stock === null) return "";
  const at = props.floor === "" ? "" : `Tầng ${props.floor}`;
  const tail = at ? ` · ${at}` : "";
  if (soldOut.value) return `Hết hàng${tail}`;
  if (lowStock.value) return `Chỉ còn ${props.stock}${tail}`;
  return `Còn ${props.stock}${tail}`;
});

const fmt = (n) => n.toLocaleString("vi-VN");
const onColor = (hex) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const l =
    (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.62 ? "#1a1a1a" : "#ffffff";
};

const discount = computed(() =>
  props.product.oldPrice > props.product.price
    ? Math.round((1 - props.product.price / props.product.oldPrice) * 100)
    : 0,
);

const splitName = (name) => {
  const words = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < 2) return [words[0] ?? "", ""];
  if (words.length === 2) return [words[0], words[1]];
  const cut = words.length - 2;
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
};

let ctx = null;
const fontTick = ref(0);
const head = computed(() => {
  fontTick.value;
  if (typeof document !== "undefined" && !ctx)
    ctx = document.createElement("canvas").getContext("2d");
  if (ctx)
    ctx.font =
      'italic 900 100px "Barlow Condensed", "Arial Narrow", Impact, sans-serif';
  const slogan = headWords[props.product.category] ?? [
    (props.product.categoryName ?? props.product.name).toUpperCase(),
    "",
  ];
  const lines = isGrid.value ? slogan : splitName(props.product.name);
  const widest = Math.max(
    ...lines.map((l) => {
      const text = (l ?? "").toUpperCase();
      return Math.max(ctx ? ctx.measureText(text).width : text.length * 42, 1);
    }),
    1,
  );
  const size = Math.min(26, Math.max(12, 9600 / widest));
  return { lines, style: { "--hs": `${size.toFixed(2)}cqw` } };
});
onMounted(async () => {
  try {
    await document.fonts.load('italic 900 100px "Barlow Condensed"');
  } catch {
    fontTick.value += 1;
  }
  fontTick.value += 1;
});

const hasHoverImage = computed(() => !!props.hoverImage);
</script>

<template>
  <article
    class="cat-card"
    :class="{ 'cat-card--grid': isGrid, 'is-sold-out': isGrid && soldOut }"
    :style="{
      '--c': product.color,
      '--on': onColor(product.color),
      '--i': index,
    }"
  >
    <div class="cat-card__stage">
      <div class="cat-card__head" aria-hidden="true" :style="head.style">
        <span class="cat-card__line">{{ head.lines[0] }}</span>
        <span class="cat-card__line cat-card__line--hollow">{{
          head.lines[1]
        }}</span>
      </div>
      <i class="cat-card__ground" aria-hidden="true"></i>
      <button
        type="button"
        class="cat-card__shot"
        :aria-label="`Xem nhanh ${product.name}`"
        @click="emit('quick')"
      >
        <!-- dual-image swap: mặc định ảnh đóng gói, hover crossfade sang ảnh chế biến -->
        <img
          v-if="hasHoverImage"
          class="cat-card__image cat-card__image--default"
          :src="product.image"
          :alt="product.name"
          loading="lazy"
          decoding="async"
        />
        <img
          v-if="hasHoverImage"
          class="cat-card__image cat-card__image--hover"
          :src="props.hoverImage"
          :alt="`${product.name} (chế biến)`"
          loading="lazy"
          decoding="async"
        />
        <img
          v-else
          class="cat-card__image cat-card__image--single"
          :src="product.image"
          :alt="product.name"
          loading="lazy"
          decoding="async"
        />
      </button>

      <div class="cat-card__tags">
        <span
          v-if="product.isNew"
          class="cat-card__tag cat-card__tag--new cat-card__tag--hang-left"
          >MỚI</span
        >
        <span
          v-if="product.hot"
          class="cat-card__tag cat-card__tag--hot cat-card__tag--hang-left"
          >BÁN CHẠY</span
        >
        <span
          v-if="discount"
          class="cat-card__tag cat-card__tag--save cat-card__tag--hang-left"
          >-{{ discount }}%</span
        >
      </div>

      <span
        v-if="!isGrid"
        class="cat-card__tag cat-card__tag--price cat-card__tag--hang-right"
        aria-hidden="true"
        >{{ fmt(product.price) }} ₫</span
      >

      <button
        v-if="isGrid"
        type="button"
        class="cat-card__fav"
        :class="{ liked: favorited }"
        :aria-label="
          favorited ? `Bỏ lưu ${product.name}` : `Lưu ${product.name}`
        "
        :aria-pressed="favorited"
        @click="emit('toggle-favorite')"
      >
        <Heart :size="18" />
      </button>

      <div class="cat-card__buy">
        <QuickAdd :product="product" :stock="stock" />
      </div>
    </div>

    <div v-if="isGrid && !hideInfo" class="cat-card__info">
      <span class="cat-card__cat">{{ product.categoryName }}</span>
      <button
        type="button"
        class="cat-card__name-btn"
        :data-name="product.name"
        @mouseenter="nameVisible = true"
        @mouseleave="nameVisible = false"
        @click="emit('quick')"
      >
        <h3 class="cat-card__name" :class="{ show: nameVisible }">
          {{ product.name }}
        </h3>
      </button>

      <p class="cat-card__meta">
        <span>★ {{ product.rating }}</span
        ><span>{{ product.sold }} đã bán</span>
      </p>
      <p
        v-if="stockLabel"
        class="cat-card__stock"
        :class="{ low: lowStock, out: soldOut }"
      >
        {{ stockLabel }}
      </p>
      <div class="cat-card__price-row">
        <strong class="cat-card__price">{{ fmt(product.price) }} ₫</strong>
        <QuickAdd :product="product" :stock="stock" variant="icon" />
      </div>
    </div>
  </article>
</template>

<style scoped>
.cat-card {
  container-type: inline-size;
  position: relative;
  display: block;
  width: 100%;
  border-radius: 32px;
  color: var(--ink);
  animation: cat-up 0.55s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
  animation-delay: calc(var(--i) * 80ms);
}
@keyframes cat-up {
  from {
    opacity: 0;
    transform: translateY(26px) scale(0.96);
  }
}
.cat-card__head {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  opacity: 0;
  font-family: "Barlow Condensed", "Arial Narrow", Impact, sans-serif;
  font-weight: 900;
  font-style: italic;
  font-size: var(--hs, 22cqw);
  line-height: 1.25;
  letter-spacing: -0.005em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: opacity 0.35s ease-out;
}
.cat-card__line {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  transition: transform 0.55s cubic-bezier(0.3, 1.15, 0.5, 1);
}
.cat-card__line:first-child {
  top: 2cqw;
  transform: translateY(26cqw);
  color: color-mix(in srgb, var(--c) 86%, var(--ink));
}
.cat-card__line:last-child {
  top: 90cqw;
  transform: translateY(-26cqw);
  color: transparent;
  -webkit-text-stroke: clamp(1.5px, 0.5cqw, 3.5px) var(--ink);
}
.cat-card--grid .cat-card__line:last-child {
  top: 99cqw;
}
.cat-card:hover .cat-card__head,
.cat-card:focus-within .cat-card__head {
  opacity: 1;
}
.cat-card:hover .cat-card__line,
.cat-card:focus-within .cat-card__line {
  transform: translateY(0);
}
.cat-card__stage {
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
  padding: 150% 0 0;
}
/* --- dual-image: two images stacked, crossfade on hover --- */
.cat-card__shot {
  position: absolute;
  left: 50%;
  top: 24cqw;
  z-index: 2;
  width: 75%;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transform: translateX(-50%) translateY(0) rotate(var(--tilt, 3deg)) scale(1);
  transform-origin: 50% 90%;
  transition:
    transform 0.5s cubic-bezier(0.3, 1.15, 0.5, 1),
    filter 0.4s ease-out;
  filter: drop-shadow(2px 6px 3px rgba(0, 0, 0, 0.18))
    drop-shadow(10px 24px 18px rgba(0, 0, 0, 0.16));
}
.cat-card__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  transition: opacity 0.35s ease, transform 0.5s cubic-bezier(0.3, 1.15, 0.5, 1);
}
.cat-card__image--default {
  opacity: 1;
  z-index: 2;
}
.cat-card__image--hover {
  opacity: 0;
  z-index: 3;
  transform: scale(1.05);
}
.cat-card__image--single {
  width: 100%;
  height: auto;
  animation: cat-float 5s ease-in-out infinite;
}
@keyframes cat-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
.cat-card__shot:focus-visible {
  outline: 3px solid var(--ink);
  outline-offset: 8px;
  border-radius: 12px;
}
.cat-card:nth-child(even) .cat-card__shot {
  --tilt: -3deg;
}
/* --- hover: lift card, swap image crossfade, deepen shadow --- */
.cat-card:hover,
.cat-card:focus-within {
  z-index: 3;
}
.cat-card:hover .cat-card__shot,
.cat-card:focus-within .cat-card__shot {
  transform: translateX(-50%) translateY(-10px) rotate(var(--tilt, 3deg))
    scale(1.08);
  filter: drop-shadow(2px 8px 4px rgba(0, 0, 0, 0.16))
    drop-shadow(18px 40px 30px rgba(0, 0, 0, 0.22));
}
.cat-card:hover .cat-card__image--default,
.cat-card:focus-within .cat-card__image--default {
  opacity: 0;
}
.cat-card:hover .cat-card__image--hover,
.cat-card:focus-within .cat-card__image--hover {
  opacity: 1;
  transform: scale(1);
}
.cat-card__ground {
  position: absolute;
  left: 50%;
  top: 96cqw;
  z-index: 1;
  width: 58%;
  height: 8cqw;
  transform: translateX(-50%);
  background: radial-gradient(closest-side, rgba(0, 0, 0, 0.4), transparent);
  filter: blur(7px);
  mix-blend-mode: multiply;
  transition:
    transform 0.45s,
    opacity 0.45s;
}
.cat-card:hover .cat-card__ground,
.cat-card:focus-within .cat-card__ground {
  transform: translateX(-50%) scale(0.85, 0.8);
  opacity: 0.75;
}
.cat-card__tags {
  position: absolute;
  left: 0.5%;
  top: 30%;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  pointer-events: none;
}
.cat-card__tag {
  position: relative;
  padding: 7px 12px;
  border: var(--bw-bold) solid var(--ink);
  border-radius: 8px;
  background: var(--ink);
  color: var(--cream);
  font-family: var(--font-ui);
  font-size: clamp(12px, 3.6cqw, 14px);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: 0;
  white-space: nowrap;
  box-shadow: 2px 3px 0 var(--ink);
}
.cat-card__tag::before {
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
.cat-card__tag::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 26px;
  height: 2px;
  margin-top: -1px;
  border-radius: 2px;
  background: #1a1a1a;
}
.cat-card__tag--hang-left {
  transform: rotate(-6deg);
}
.cat-card__tag--hang-left::before {
  right: 4px;
}
.cat-card__tag--hang-left::after {
  left: calc(100% - 7px);
  transform-origin: 0 50%;
  transform: rotate(-34deg);
}
.cat-card__tag--hang-right::before {
  left: 4px;
}
.cat-card__tag--hang-right::after {
  right: calc(100% - 7px);
  transform-origin: 100% 50%;
  transform: rotate(34deg);
}
.cat-card__tag--price {
  position: absolute;
  right: 0.5%;
  top: 46%;
  z-index: 5;
  background: var(--c);
  color: var(--on);
  transform: translateY(-50%) rotate(6deg);
}
.cat-card__tag--new {
  background: var(--green-ink);
}
.cat-card__tag--hot {
  background: var(--red-ink);
}
.cat-card__tag--save {
  background: var(--cream);
  color: var(--red-ink);
  border-color: var(--red-ink);
}
.cat-card__buy {
  position: absolute;
  left: 3%;
  right: 3%;
  bottom: 2cqw;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 0.3s ease-out,
    transform 0.45s cubic-bezier(0.3, 1.25, 0.5, 1);
}
.cat-card:hover .cat-card__buy,
.cat-card:focus-within .cat-card__buy {
  opacity: 1;
  transform: translateY(0);
}
.cat-card__add {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  border: 2.5px solid var(--ink);
  border-radius: 999px;
  background: #ffc72c;
  color: var(--ink);
  font: 700 clamp(12px, 3.6cqw, 15px) / 1 var(--fd, var(--font-display));
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--ink);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}
.cat-card__add:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--ink);
}
.cat-card__add:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--ink);
}

.cat-card--grid .cat-card__stage {
  padding: 122% 0 0;
}
.cat-card--grid .cat-card__shot {
  top: 15cqw;
  width: 72%;
}
.cat-card--grid .cat-card__ground {
  top: 92cqw;
}
.cat-card--grid .cat-card__buy {
  display: none;
}
.cat-card__fav {
  position: absolute;
  right: 3%;
  top: 3%;
  z-index: 5;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  padding: 0;
  border: var(--bw-bold) solid var(--ink);
  border-radius: var(--r-pill);
  background: #fff;
  color: var(--ink);
  box-shadow: 2px 2px 0 var(--ink);
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.15s,
    background 0.2s;
}
.cat-card__fav:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 var(--ink);
}
.cat-card__fav.liked {
  background: var(--red-ink);
  color: var(--cream);
}
.cat-card__fav:focus-visible,
.cat-card__info {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 2px;
  padding: var(--sp-1) 2px 0;
}
.cat-card__cat {
  font-size: var(--fs-xs);
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--on-cream);
}
.cat-card__name-btn {
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
  cursor: pointer;
  color: var(--ink);
}
.cat-card__name {
  margin: 2px 0 0;
  font-family: var(--font-display);
  font-size: var(--fs-lg);
  font-weight: 800;
  line-height: 1.18;
  letter-spacing: var(--tracking-display);
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
  display: block;
  transition: transform 0.35s cubic-bezier(0.3, 1.25, 0.5, 1);
}
.cat-card__name-btn::after {
  content: attr(data-name);
  display: block;
  font:
    800 clamp(14px, 3.2cqw, 22px) "Barlow Condensed",
    "Arial Narrow",
    Impact,
    sans-serif;
  line-height: 1.2;
  letter-spacing: var(--tracking-display);
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 0.35s ease,
    transform 0.35s cubic-bezier(0.3, 1.25, 0.5, 1);
  pointer-events: none;
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.cat-card__name-btn:hover::after,
.cat-card__name-btn:focus-within::after {
  opacity: 1;
  transform: translateY(0);
}
.cat-card__name-btn:hover .cat-card__name,
.cat-card__name-btn:focus-within .cat-card__name {
  transform: translateY(-6px);
  color: var(--on-cream);
}
.cat-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 6px 0 0;
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--on-cream);
}
.cat-card__stock {
  margin: 4px 0 0;
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--on-cream);
}
.cat-card__stock.low {
  color: #8a4b00;
}
.cat-card__stock.out {
  color: var(--red-ink);
}
.cat-card__price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: var(--sp-1);
  padding-top: var(--sp-1);
  border-top: var(--bw) dashed color-mix(in srgb, var(--ink) 22%, transparent);
}
.cat-card__price {
  font-size: var(--fs-lg);
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  color: var(--red-ink);
}
.cat-card--grid.is-sold-out .cat-card__shot img {
  filter: grayscale(0.45);
}
.cat-card--grid.is-sold-out .cat-card__shot {
  cursor: not-allowed;
}
@media (max-width: 767px) {
  .cat-card--grid .cat-card__name {
    font-size: var(--fs-md);
  }
}
@media (max-width: 520px) {
  .cat-card {
    border-radius: 22px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cat-card,
  .cat-card * {
    animation: none !important;
    transition: none !important;
  }
  .cat-card__shot {
    transform: translateX(-50%) rotate(var(--tilt, 3deg)) !important;
  }
}
</style>
