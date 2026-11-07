<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { ArrowRight } from "lucide-vue-next";
import SectionHeader from "../common/SectionHeader.vue";
import QuantitySelector from "./QuantitySelector.vue";
import { useProductStore } from "../../stores/productStore";
import { useCartStore } from "../../stores/cartStore";
import { headWords } from "../../data/products";

const MAX = 4; // số món đại diện tối đa mỗi category
const store = useProductStore();
const cart = useCartStore();
const active = ref("all");
const uid = Math.random().toString(36).slice(2, 7);

/* per-card quantity for the hover quick-add (defaults to 1, resets after add) */
const qty = reactive({});
const qtyOf = (p) => qty[p.id] ?? 1;
const addToCart = (p) => {
  cart.add(p, qtyOf(p));
  qty[p.id] = 1;
};

const fmt = (n) => n.toLocaleString("vi-VN");
const bySold = (arr) => [...arr].sort((a, b) => b.sold - a.sold);
// chọn màu chữ (đen/trắng) theo độ sáng của màu sản phẩm
const onColor = (hex) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const l =
    (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.62 ? "#1a1a1a" : "#ffffff";
};

const tabs = computed(() => {
  const cats = store.categories
    .map((c) => ({
      ...c,
      items: bySold(store.products.filter((p) => p.category === c.slug)),
    }))
    .filter((c) => c.items.length);
  const all = {
    slug: "all",
    name: "Tất cả",
    tagline: "Bán chạy nhất tuần này",
    items: bySold(store.products),
  };
  return [all, ...cats].map((t) => ({
    ...t,
    color: t.slug === "all" ? "#ffc72c" : t.items[0].color,
    imgs: t.items.slice(0, t.slug === "all" ? 3 : 2).map((p) => p.image),
  }));
});
const current = computed(
  () => tabs.value.find((t) => t.slug === active.value) ?? tabs.value[0],
);
const shown = computed(() => current.value.items.slice(0, MAX));
let headCtx = null;
const fitTick = ref(0);
const heads = computed(() => {
  fitTick.value; // recount once the display face has actually landed
  if (typeof document !== "undefined" && !headCtx)
    headCtx = document.createElement("canvas").getContext("2d");
  if (headCtx)
    headCtx.font =
      'italic 900 100px "Barlow Condensed", "Arial Narrow", Impact, sans-serif';
  return shown.value.map((p) => {
    const lines = headWords[p.category] ?? [
      (p.categoryName ?? p.name).toUpperCase(),
      "",
    ];
    const widest = Math.max(
      ...lines.map((l) => (headCtx ? headCtx.measureText(l).width : l.length * 46)),
      1,
    );
    /* 100cqw = card width, so a line that spans 96cqw needs font-size 9600/widest
       (widest measured at a 100px reference size); the 26 cap keeps the two
       lines inside the poster tile's air above and below the pack */
    const size = Math.min(26, Math.max(12, 9600 / widest));
    return { lines, style: { "--hs": `${size.toFixed(2)}cqw` } };
  });
});
onMounted(async () => {
  /* measure with the face that renders: wait for the condensed webfont, then
     recount (offline, the system condensed stack is measured instead) */
  try {
    await document.fonts.load('italic 900 100px "Barlow Condensed"');
  } catch {
    /* no font loading support: the fallback metrics already work */
  }
  fitTick.value++;
});
const link = computed(() =>
  current.value.slug === "all"
    ? "/products"
    : `/category/${current.value.slug}`,
);

const badge = (p) => {
  if (p.oldPrice > p.price)
    return `-${Math.round((1 - p.price / p.oldPrice) * 100)}%`;
  return p.isNew ? "MỚI" : "";
};
</script>

<template>
  <section class="cat-strip">
    <div class="cat-inner">
      <SectionHeader
        kicker="CHỌN NHANH THEO DANH MỤC"
        title="Hôm nay bạn thèm gì?"
        lead="Chọn một danh mục để xem món nổi bật. Muốn xem hết thì bấm Xem toàn bộ."
        cta="Xem tủ snack"
        to="/products"
      />
      <div class="cat-tabs" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.slug"
          type="button"
          class="cat-tab"
          role="tab"
          :id="`${uid}-tab-${t.slug}`"
          :aria-controls="`${uid}-panel`"
          :aria-selected="t.slug === active"
          :style="{ '--c': t.color, '--on': onColor(t.color) }"
          @click="active = t.slug"
        >
          <b>{{ t.name }}</b>
          <small>{{ t.items.length }} món</small>
          <span class="cat-tab__pop" aria-hidden="true">
            <img v-for="(src, i) in t.imgs" :key="i" :src="src" alt="" />
          </span>
        </button>
      </div>
    </div>

    <!-- dải danh sách: nhận màu của tab đang chọn (--ac) -->
    <div class="cat-stage" :style="{ '--ac': current.color }">
      <div class="cat-inner">
        <div class="cat-bar">
          <div>
            <h3>{{ current.name }}</h3>
            <p>
              {{ current.tagline }}
              <template v-if="current.items.length > MAX">
                · hiển thị {{ MAX }}/{{ current.items.length }} món</template
              >
            </p>
          </div>
          <RouterLink
            v-if="current.items.length > MAX"
            :to="link"
            class="cat-more"
          >
            Xem toàn bộ ({{ current.items.length }}) <ArrowRight :size="16" />
          </RouterLink>
        </div>

        <div
          class="cat-grid"
          :key="current.slug"
          role="tabpanel"
          :id="`${uid}-panel`"
          :aria-labelledby="`${uid}-tab-${current.slug}`"
        >
          <article
            v-for="(p, i) in shown"
            :key="p.id ?? p.slug"
            class="cat-card"
            :style="{ '--c': p.color, '--on': onColor(p.color), '--i': i }"
          >
            <span
              v-if="badge(p)"
              class="cat-card__badge"
              :class="{ 'is-new': badge(p) === 'MỚI' }"
              >{{ badge(p) }}</span
            >
            <div class="cat-card__stage">
              <div
                class="cat-card__head"
                aria-hidden="true"
                :style="heads[i].style"
              >
                <span class="cat-card__line">{{ heads[i].lines[0] }}</span>
                <span class="cat-card__line cat-card__line--hollow">{{
                  heads[i].lines[1]
                }}</span>
              </div>
              <i class="cat-card__ground" aria-hidden="true"></i>
              <button
                type="button"
                class="cat-card__shot"
                :aria-label="`Xem nhanh ${p.name}`"
                @click="store.openQuick(p)"
              >
                <img
                  :src="p.image"
                  :alt="p.name"
                  loading="lazy"
                  decoding="async"
                />
              </button>
              <span class="cat-card__tag" aria-hidden="true"
                ><b>{{ fmt(p.price) }} ₫</b></span
              >
              <div class="cat-card__buy">
                <QuantitySelector
                  :model-value="qtyOf(p)"
                  @update:model-value="(v) => (qty[p.id] = v)"
                />
                <button
                  type="button"
                  class="cat-card__add"
                  @click="addToCart(p)"
                >
                  Thêm vào giỏ
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* the poster face for the category head — self-contained so the card never
   depends on a page-level font link (system condensed stack as the fallback) */
@import url("https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@1,900&display=swap");
/* Full-bleed: nếu layout cha đã full-width thì bỏ 2 dòng width/margin-left; nếu bị thanh cuộn ngang thì thêm html{overflow-x:clip} */
.cat-strip {
  --ink: #1a1a1a;
  --cream: #fffaf0;
  --fd: var(--font-display, "Bricolage Grotesque", system-ui, sans-serif);
  width: 100vw;
  margin-left: calc(50% - 50vw);
  padding: 48px 0 0;
}
.cat-inner {
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 12px;
}
/* ---------- Tabs: panel 3D pop-out ---------- */
.cat-tabs {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  padding: 58px 12px 26px;
  margin: 0 -12px;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
}
.cat-tabs::-webkit-scrollbar {
  display: none;
}
.cat-tab {
  --cd: color-mix(in srgb, var(--c) 60%, #000);
  position: relative;
  isolation: isolate;
  flex: none;
  scroll-snap-align: start;
  width: clamp(212px, 13vw, 264px);
  height: clamp(88px, 5.2vw, 104px);
  border: 0;
  border-radius: 24px;
  padding: 0 0 0 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
  color: var(--on);
  cursor: pointer;
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--c) 90%, #fff),
    var(--c) 70%
  );
  box-shadow:
    0 6px 0 var(--cd),
    0 16px 18px -6px rgba(0, 0, 0, 0.35);
  transition:
    transform 0.3s cubic-bezier(0.3, 1.5, 0.5, 1),
    box-shadow 0.3s;
}
.cat-tab:hover {
  transform: translateY(-3px);
}
.cat-tab[aria-selected="true"] {
  transform: translateY(-8px);
  box-shadow:
    0 0 0 3px #fff,
    0 0 0 5.5px var(--ink),
    0 13px 0 3px var(--cd),
    0 24px 26px -8px rgba(0, 0, 0, 0.4);
}
/* mũi tên nối tab đang chọn xuống dải danh sách */
.cat-tab[aria-selected="true"]:after {
  content: "";
  position: absolute;
  left: 50%;
  top: calc(100% + 16px);
  transform: translateX(-50%);
  border: 15px solid transparent;
  border-bottom: 0;
  border-top: 18px solid var(--c);
}
.cat-tab > b,
.cat-tab > small {
  position: relative;
  z-index: 4;
}
.cat-tab > b {
  font: 800 clamp(17px, 1.15vw, 21px)/1.1 var(--fd);
  max-width: 46%;
}
.cat-tab > small {
  font-size: 13px;
  opacity: 0.9;
  margin-top: 3px;
}
.cat-tab__pop {
  position: absolute;
  isolation: isolate;
  right: 8px;
  bottom: 7px;
  width: 50%;
  height: 150%;
  pointer-events: none;
  transition: transform 0.3s cubic-bezier(0.3, 1.5, 0.5, 1);
}
.cat-tab__pop:before {
  content: "";
  position: absolute;
  inset: -4% -14% -2%;
  background: radial-gradient(
    closest-side,
    rgba(255, 255, 255, 0.55),
    transparent
  );
  z-index: 0;
}
.cat-tab[aria-selected="true"] .cat-tab__pop {
  transform: translateY(-7px) scale(1.1);
}
.cat-tab__pop img {
  position: absolute;
  bottom: 0;
  right: 0;
  height: 78%;
  max-width: 100%;
  object-fit: contain;
  z-index: 3;
  filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.25))
    drop-shadow(0 9px 6px rgba(0, 0, 0, 0.25));
}
.cat-tab__pop img:nth-child(2) {
  right: 30%;
  height: 56%;
  z-index: 2;
  transform: rotate(-9deg);
}
.cat-tab__pop img:nth-child(3) {
  right: 56%;
  height: 42%;
  z-index: 1;
  transform: rotate(-16deg);
}
/* ---------- Dải danh sách: tô theo màu tab đang chọn ---------- */
.cat-stage {
  --ac: #ffc72c;
  background: color-mix(in srgb, var(--ac) 13%, var(--cream));
  border-top: 6px solid var(--ac);
  padding: 22px 0 88px;
  transition:
    background 0.45s,
    border-color 0.45s;
}
.cat-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.cat-bar h3 {
  margin: 0;
  font: 800 26px/1.1 var(--fd);
  letter-spacing: -0.02em;
}
.cat-bar p {
  margin: 4px 0 0;
  color: #5b554b;
  font-size: 14px;
}
.cat-more {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  color: var(--ink);
  border: 2.5px solid var(--ink);
  border-radius: 999px;
  padding: 10px 20px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 3px 3px 0 var(--ink);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}
.cat-more:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--ink);
}
/* ---------- Card 456×513, gap 24, đường chéo chữ V ---------- */
.cat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 456px));
  justify-content: center;
  gap: 24px;
  padding: 88px 0 12px;
}
.cat-card {
  container-type: inline-size;
  position: relative;
  display: block;
  width: 100%;
  /* no fixed aspect: the height is the stage (86% of the width, deals-style)
     plus the footer's own content, so the pack keeps the deals proportions */
  border-radius: 32px;
  /* no panel: the pack and the vertical type float straight on the strip's
     cream, so the row reads as posters laid out on the page itself */
  color: var(--ink);
  /* the card itself never moves — every hover effect lives on the pack */
  animation: cat-up 0.55s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
  animation-delay: calc(var(--i) * 80ms);
}
@keyframes cat-up {
  from {
    opacity: 0;
    transform: translateY(26px) scale(0.96);
  }
}
/* the poster head: two display lines that hide behind the pack and, on hover,
   split apart — the top line floats up, the bottom line drops down, so the
   packshot is revealed whole (image-2 idea, revealed only on hover) */
.cat-card__head {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  user-select: none;
  opacity: 0;
  font-family: "Barlow Condensed", "Arial Narrow", "Roboto Condensed", Impact,
    sans-serif;
  font-weight: 900;
  font-style: italic;
  /* --hs comes from the measured fit (widest line = ~96% of the card width) */
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
/* rest: both lines tucked at the pack's yoke, out of sight */
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
  /* poster tile: air above the pack for the head, air below for the tag and the
     quick-add row — and it still rides on the width at every card size */
  flex: 0 0 auto;
  padding: 150% 0 0;
}
/* the packshot: 75% of the card wide, dropped ~19% from the top, so the head
   can stand above it and the shadow has room to breathe below (image-2 art) */
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
  filter:
    drop-shadow(2px 6px 3px rgba(0, 0, 0, 0.18))
    drop-shadow(10px 24px 18px rgba(0, 0, 0, 0.16));
}
.cat-card__shot img {
  display: block;
  width: 100%;
  height: auto;
}
.cat-card__shot:focus-visible {
  outline: 3px solid var(--ink);
  outline-offset: 8px;
  border-radius: 12px;
}
.cat-card:nth-child(even) .cat-card__shot {
  --tilt: -3deg;
}
/* the pool of shade the pack floats over */
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
  /* a nudge, never a spin: the pack lifts and leans a touch */
  transform: translateX(-50%) translateY(-7px) rotate(var(--tilt, 3deg))
    scale(1.03);
  filter:
    drop-shadow(2px 8px 4px rgba(0, 0, 0, 0.16))
    drop-shadow(14px 32px 24px rgba(0, 0, 0, 0.18));
}
.cat-card:hover .cat-card__ground,
.cat-card:focus-within .cat-card__ground {
  transform: translateX(-50%) scale(0.9, 0.86);
  opacity: 0.8;
}
.cat-card__badge {
  position: absolute;
  z-index: 3;
  top: 16px;
  right: 16px;
  width: clamp(46px, 3.4vw, 64px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #c8202f;
  color: #fff;
  border: 3px solid #fff;
  font: 800 clamp(12px, 0.9vw, 16px) var(--fd);
  transform: rotate(8deg);
  box-shadow: 4px 4px 0 var(--ink);
}
.cat-card__badge.is-new {
  background: #fff;
  color: var(--ink);
  border-color: var(--ink);
}
/* the price is a tag hooked on the pack (image-2): eyelet, string, tilt.
   it stays out of sight until hover so the tile is calm at rest */
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
  font: 800 clamp(13px, 4.4cqw, 19px) / 1 var(--fd);
  white-space: nowrap;
  box-shadow: 3px 4px 0 var(--ink);
  opacity: 0;
  transform: rotate(-14deg) translateY(3cqw) scale(0.86);
  transform-origin: 16% 30%;
  transition:
    opacity 0.28s ease-out,
    transform 0.5s cubic-bezier(0.3, 1.35, 0.5, 1);
}
/* eyelet on the tag's left edge; the string starts exactly at the eyelet's
   centre and swings around it, so the two can never come apart */
.cat-card__tag::before {
  content: "";
  position: absolute;
  left: 6px;
  top: 50%;
  width: 9px;
  height: 9px;
  margin-top: -6.5px; /* (9 + 2 x 2 border) / 2 */
  border: 2px solid var(--ink);
  border-radius: 50%;
  background: var(--cream, #fffaf0);
}
.cat-card__tag::after {
  content: "";
  position: absolute;
  left: 13px; /* eyelet centre: 6 + (9 + 4) / 2 */
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
/* touch screens have no hover: the price must still be readable there */
@media (hover: none) {
  .cat-card__tag {
    opacity: 1;
    transform: rotate(-14deg);
  }
}
/* quick add sits right under the pack, shown on hover / focus */
.cat-card__buy {
  position: absolute;
  left: 3%;
  right: 3%;
  bottom: 2cqw;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 6px;
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
  margin: 0;
  gap: 6px;
  padding: 4px 6px;
  border: 2.5px solid var(--ink);
  border-radius: 999px;
  background: #fff;
  box-shadow: 3px 3px 0 var(--ink);
}
.cat-card__buy .quantity button {
  width: 22px;
  height: 22px;
  border: 0;
  background: none;
}
.cat-card__buy .quantity span {
  min-width: 18px;
  text-align: center;
  font-weight: 800;
  font-size: 14px;
}
.cat-card__add {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 10px;
  border: 2.5px solid var(--ink);
  border-radius: 999px;
  background: #ffc72c;
  color: var(--ink);
  font: 700 clamp(12px, 3.6cqw, 15px) / 1 var(--fd);
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
@media (max-width: 980px) {
  .cat-grid {
    grid-template-columns: repeat(2, minmax(0, 456px));
    gap: 96px 24px;
  }
}
@media (max-width: 520px) {
  .cat-grid {
    gap: 84px 14px;
  }
  .cat-tab {
    width: 196px;
  }
  .cat-card {
    border-radius: 22px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cat-strip * {
    animation: none !important;
    transition: none !important;
  }
  .cat-card__shot {
    transform: translateX(-50%) rotate(var(--tilt, 3deg)) !important;
  }
}
</style>
