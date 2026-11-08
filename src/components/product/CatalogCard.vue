<script setup>
import { computed, onMounted, ref } from "vue";
import QuantitySelector from "./QuantitySelector.vue";
import { headWords, heroMeta } from "../../data/products";

/* The one product card for the whole page. Style and animation are the ones the
   "CH盻君 NHANH THEO DANH M盻､C" shelf already had 窶・they were lifted out of ShopByMood
   verbatim so the other grids can share them without a single pixel moving:
   container-query type on the shelf head, the pack that floats and lifts on hover,
   the hanging price/new/hot tags, the buy row that rises from the bottom edge. */
const props = defineProps({
  product: { type: Object, required: true },
  index: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
});
const emit = defineEmits(["add", "quick", "update:quantity"]);

const fmt = (n) => n.toLocaleString("vi-VN");
/* black or white type on the product's own colour, by perceived lightness */
const onColor = (hex) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.62 ? "#1a1a1a" : "#ffffff";
};

/* the hanging tags: the discount rides the product colour, hot stays red, the new
   flag is the same shape as the price tag */
const tags = computed(() => {
  const p = props.product;
  const on = onColor(p.color);
  const out = [];
  if (p.oldPrice > p.price)
    out.push({
      text: `-${Math.round((1 - p.price / p.oldPrice) * 100)}%`,
      type: "save",
      bg: p.color,
      fg: on,
    });
  if (p.isNew) out.push({ text: "M盻唔", type: "hanging", bg: p.color, fg: on });
  if (p.hot) out.push({ text: "Nﾃ哲G", type: "hanging", bg: "#c8202f", fg: "#ffffff" });
  for (const x of (heroMeta[p.format]?.tags ?? []).slice(0, 2))
    out.push({ text: x, type: "format", bg: "#fff", fg: "var(--ink)" });
  return out;
});
const hangingTags = computed(() => tags.value.filter((t) => t.type === "hanging"));

/* the shelf head is sized with a canvas measure so two lines always fill the card:
   --hs is what the type scales from, in container query units */
let ctx = null;
const fontTick = ref(0);
const head = computed(() => {
  fontTick.value; // re-measure once the display face has landed
  if (typeof document !== "undefined" && !ctx) ctx = document.createElement("canvas").getContext("2d");
  if (ctx)
    ctx.font = 'italic 900 100px "Barlow Condensed", "Arial Narrow", Impact, sans-serif';
  const lines = headWords[props.product.category] ?? [
    (props.product.categoryName ?? props.product.name).toUpperCase(),
    "",
  ];
  const widest = Math.max(
    ...lines.map((l) => (ctx ? ctx.measureText(l).width : l.length * 46)),
    1,
  );
  const size = Math.min(26, Math.max(12, 9600 / widest));
  return { lines, style: { "--hs": `${size.toFixed(2)}cqw` } };
});
onMounted(async () => {
  try {
    await document.fonts.load('italic 900 100px "Barlow Condensed"');
  } catch {
    /* no font loading support: the fallback metrics already work */
  }
  fontTick.value += 1;
});
</script>

<template>
  <article
    class="cat-card"
    :style="{ '--c': product.color, '--on': onColor(product.color), '--i': index }"
  >
    <div class="cat-card__stage">
      <div class="cat-card__head" aria-hidden="true" :style="head.style">
        <span class="cat-card__line">{{ head.lines[0] }}</span>
        <span class="cat-card__line cat-card__line--hollow">{{ head.lines[1] }}</span>
      </div>
      <i class="cat-card__ground" aria-hidden="true"></i>
      <button
        type="button"
        class="cat-card__shot"
        :aria-label="`Xem nhanh ${product.name}`"
        @click="emit('quick')"
      >
        <img :src="product.image" :alt="product.name" loading="lazy" decoding="async" />
      </button>

      <!-- tags d蘯｡ng treo (Hot/New) -->
      <div
        v-for="(t, k) in hangingTags"
        :key="'hanging-' + k"
        class="cat-card__hanging-tag"
        :style="`background:${t.bg};color:${t.fg};border-color:${t.fg}`"
      >
        {{ t.text }}
      </div>

      <span class="cat-card__tag" aria-hidden="true"><b>{{ fmt(product.price) }} 竄ｫ</b></span>

      <div class="cat-card__buy">
        <QuantitySelector
          :model-value="quantity"
          @update:model-value="(v) => emit('update:quantity', v)"
        />
        <button type="button" class="cat-card__add" @click="emit('add')">
          Thﾃｪm vﾃo gi盻・
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
/* ==== catalogue card: the shelf card, moved here untouched ==== */
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
  user-select: none;
  opacity: 0;
  font-family:
    "Barlow Condensed", "Arial Narrow", "Roboto Condensed", Impact, sans-serif;
  font-weight: 900;
  font-style: italic;
  font-size: var(--hs, 22cqw);
  line-height: 0.86;
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
  top: 99cqw;
  transform: translateY(-26cqw);
  color: transparent;
  -webkit-text-stroke: clamp(1.5px, 0.5cqw, 3.5px) var(--ink);
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
.cat-card__shot {
  position: absolute;
  left: 50%;
  top: 19cqw;
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
.cat-card__shot img {
  display: block;
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
.cat-card:hover .cat-card__shot,
.cat-card:focus-within .cat-card__shot {
  transform: translateX(-50%) translateY(-7px) rotate(var(--tilt, 3deg))
    scale(1.03);
  filter: drop-shadow(2px 8px 4px rgba(0, 0, 0, 0.16))
    drop-shadow(14px 32px 24px rgba(0, 0, 0, 0.18));
}
.cat-card:hover .cat-card__ground,
.cat-card:focus-within .cat-card__ground {
  transform: translateX(-50%) scale(0.9, 0.86);
  opacity: 0.8;
}
/* tags treo (Hot/New) 窶・cﾃｹng hﾃｬnh v盻嬖 tag giﾃ｡ */
.cat-card__hanging-tag {
  position: absolute;
  right: 5%;
  top: 45cqw;
  z-index: 4;
  padding: 5px 12px 5px 18px;
  border: 2.5px solid var(--ink);
  border-radius: 6px 14px 14px 6px;
  font: 800 clamp(12px, 3.5cqw, 16px) / 1 var(--fd, var(--font-display));
  white-space: nowrap;
  box-shadow: 3px 4px 0 var(--ink);
  opacity: 0;
  transform: rotate(-14deg) translateY(3cqw) scale(0.86);
  transform-origin: 16% 30%;
  transition:
    opacity 0.28s ease-out,
    transform 0.5s cubic-bezier(0.3, 1.35, 0.5, 1);
}
.cat-card__hanging-tag::before {
  content: "";
  position: absolute;
  left: 6px;
  top: 50%;
  width: 9px;
  height: 9px;
  margin-top: -4.5px;
  border: 2px solid var(--ink);
  border-radius: 50%;
  background: var(--cream, #fffaf0);
}
.cat-card__hanging-tag::after {
  content: "";
  position: absolute;
  left: 13px;
  top: calc(50% - 1.25px);
  width: 26px;
  height: 2.5px;
  border-radius: 2px;
  background: var(--ink);
  transform-origin: 0 50%;
  transform: rotate(-152deg);
}
.cat-card:hover .cat-card__hanging-tag,
.cat-card:focus-within .cat-card__hanging-tag {
  opacity: 1;
  transform: rotate(-14deg) translateY(0) scale(1);
}
@media (hover: none) {
  .cat-card__hanging-tag {
    opacity: 1;
    transform: rotate(-14deg);
  }
}
.cat-card__tag {
  position: absolute;
  right: 1%;
  top: 60cqw;
  z-index: 4;
  padding: 7px 14px 7px 22px;
  border: 2.5px solid var(--ink);
  border-radius: 6px 14px 14px 6px;
  background: var(--c);
  color: var(--on);
  font: 800 clamp(13px, 4.4cqw, 19px) / 1 var(--fd, var(--font-display));
  white-space: nowrap;
  box-shadow: 3px 4px 0 var(--ink);
  opacity: 0;
  transform: rotate(-14deg) translateY(3cqw) scale(0.86);
  transform-origin: 16% 30%;
  transition:
    opacity 0.28s ease-out,
    transform 0.5s cubic-bezier(0.3, 1.35, 0.5, 1);
}
.cat-card__tag::before {
  content: "";
  position: absolute;
  left: 6px;
  top: 50%;
  width: 9px;
  height: 9px;
  margin-top: -6.5px;
  border: 2px solid var(--ink);
  border-radius: 50%;
  background: var(--cream, #fffaf0);
}
.cat-card__tag::after {
  content: "";
  position: absolute;
  left: 13px;
  top: calc(50% - 1.25px);
  width: 26px;
  height: 2.5px;
  border-radius: 2px;
  background: var(--ink);
  transform-origin: 0 50%;
  transform: rotate(-152deg);
}
.cat-card:hover .cat-card__tag,
.cat-card:focus-within .cat-card__tag {
  opacity: 1;
  transform: rotate(-14deg) translateY(0) scale(1);
}
@media (hover: none) {
  .cat-card__tag {
    opacity: 1;
    transform: rotate(-14deg);
  }
}
.cat-card__buy {
  position: absolute;
  left: 3%;
  right: 3%;
  bottom: 2cqw;
  z-index: 4;
  display: flex;
  align-items: center;
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
.cat-card__buy .quantity {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border: 2px solid var(--ink);
  border-radius: 999px;
  background: #fff;
  box-shadow: 2px 2px 0 var(--ink);
}
.cat-card__buy .quantity button {
  width: 26px;
  height: 26px;
  min-width: 26px;
  border-radius: 50%;
  border: 1.5px solid var(--ink);
  background: #fff;
  color: var(--ink);
  font: 800 13px/1 var(--font-display);
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 0;
  line-height: 1;
}
.cat-card__buy .quantity button:hover {
  background: #f3f3f3;
}
.cat-card__buy .quantity span {
  min-width: 20px;
  text-align: center;
  font-weight: 800;
  font-size: 15px;
  color: var(--ink);
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
@media (max-width: 520px) {
  .cat-card {
    border-radius: 22px;
  }
}
/* the shelf switches its own animations off for anyone who asks; the card carries the
   same promise now that it is no longer markup inside .cat-strip */
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
