<script setup>
import { computed, ref } from "vue";
import { ArrowRight } from "lucide-vue-next";
import SectionHeader from "../common/SectionHeader.vue";
import { useProductStore } from "../../stores/productStore";

const MAX = 4; // số món đại diện tối đa mỗi category
const emit = defineEmits(["add"]);
const store = useProductStore();
const active = ref("all");
const uid = Math.random().toString(36).slice(2, 7);

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
const link = computed(() =>
  current.value.slug === "all"
    ? "/products"
    : `/category/${current.value.slug}`,
);

const catName = (slug) =>
  store.categories.find((c) => c.slug === slug)?.name ?? "";
const badge = (p) => {
  if (p.oldPrice > p.price)
    return `-${Math.round((1 - p.price / p.oldPrice) * 100)}%`;
  return p.isNew ? "MỚI" : "";
};
// nghiêng 3D theo con trỏ
function tilt(e) {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget,
    r = el.getBoundingClientRect();
  el.style.setProperty(
    "--ry",
    `${((e.clientX - r.left) / r.width - 0.5) * 10}deg`,
  );
  el.style.setProperty(
    "--rx",
    `${-((e.clientY - r.top) / r.height - 0.5) * 8}deg`,
  );
}
function untilt(e) {
  e.currentTarget.style.setProperty("--ry", "0deg");
  e.currentTarget.style.setProperty("--rx", "0deg");
}
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
            @pointermove="tilt"
            @pointerleave="untilt"
          >
            <span class="cat-card__bg" aria-hidden="true"></span>
            <span
              v-if="badge(p)"
              class="cat-card__badge"
              :class="{ 'is-new': badge(p) === 'MỚI' }"
              >{{ badge(p) }}</span
            >
            <div class="cat-card__stage">
              <i class="cat-card__ground" aria-hidden="true"></i>
              <img
                :src="p.image"
                :alt="p.name"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div class="cat-card__info">
              <span class="cat-card__kick">{{ catName(p.category) }}</span>
              <RouterLink :to="`/product/${p.slug}`" class="cat-card__name">{{
                p.name
              }}</RouterLink>
              <span class="cat-card__price">
                <s v-if="p.oldPrice > p.price">{{ fmt(p.oldPrice) }} ₫</s>
                <b>{{ fmt(p.price) }} ₫</b>
              </span>
              <button
                type="button"
                class="cat-card__btn"
                @click="emit('add', p)"
              >
                Thêm nhanh <ArrowRight :size="16" />
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
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
  perspective: 1200px;
}
.cat-card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  /* no fixed aspect: the height is the stage (86% of the width, deals-style)
     plus the footer's own content, so the pack keeps the deals proportions */
  border-radius: 32px;
  color: var(--on);
  box-shadow: 8px 9px 0 var(--ink);
  transform-style: preserve-3d;
  transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
  animation: cat-up 0.55s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
  animation-delay: calc(var(--i) * 80ms);
}
@keyframes cat-up {
  from {
    opacity: 0;
    transform: translateY(26px) scale(0.96);
  }
}
.cat-card__bg {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  overflow: hidden;
  border: 3px solid var(--ink);
  background: var(--c);
}
.cat-card__bg:before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--cream);
  /* the V: odd cards drop the cream line from a left-edge third to ~70% down the
     right edge, even cards mirror it — the line passes behind the pack's lower
     body and stays above the info block so the footer always sits on the colour */
  clip-path: polygon(0 0, 100% 0, 100% 70%, 0 36%);
}
.cat-card:nth-child(even) .cat-card__bg:before {
  clip-path: polygon(0 0, 100% 0, 100% 36%, 0 70%);
}
.cat-card__bg:after {
  content: "";
  position: absolute;
  inset: 0;
  border: 3px solid rgba(255, 255, 255, 0.92);
  border-radius: inherit;
}
.cat-card__stage {
  position: relative;
  z-index: 2;
  /* deals-card stage: the height rides on the width (86%), so the pack and its
     poke keep the same proportions at every card size */
  flex: 0 0 auto;
  padding: 86% 0 0;
  transform: translateZ(50px);
}
.cat-card__stage img {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: auto;
  object-fit: contain;
  /* rest pose: the pack leans into the cream side; even cards mirror the tilt,
     so neighbouring packs echo the V of the diagonals */
  transform: rotate(var(--tilt, 4deg));
  transform-origin: 50% 100%;
  /* leave speed: long soft settle; the hover rule re-arms the fast spring */
  transition:
    transform 0.4s ease-out,
    filter 0.4s;
  filter: drop-shadow(1px 2px 1px rgba(0, 0, 0, 0.22))
    drop-shadow(6px 12px 8px rgba(0, 0, 0, 0.2))
    drop-shadow(14px 28px 20px rgba(0, 0, 0, 0.18));
}
.cat-card:nth-child(even) .cat-card__stage img {
  --tilt: -4deg;
}
.cat-card__ground {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 70%;
  height: 7%;
  transform: translateX(calc(-50% + var(--ry, 0deg) * -1.2));
  background: radial-gradient(closest-side, rgba(0, 0, 0, 0.6), transparent);
  filter: blur(6px);
  mix-blend-mode: multiply;
  transition:
    transform 0.4s,
    opacity 0.4s;
}
.cat-card:hover .cat-card__stage img,
.cat-card:focus-within .cat-card__stage img {
  /* two-speed spring: snappy back-out on enter, the base rule settles on leave */
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    filter 0.3s;
  transform: translateY(-14px) rotate(calc(var(--tilt, 4deg) * 0.375))
    scale(1.04);
  filter: drop-shadow(2px 4px 2px rgba(0, 0, 0, 0.16))
    drop-shadow(10px 22px 14px rgba(0, 0, 0, 0.16))
    drop-shadow(20px 42px 30px rgba(0, 0, 0, 0.14));
}
.cat-card:hover .cat-card__ground {
  transform: translateX(calc(-50% + var(--ry, 0deg) * -1.2)) scale(0.8, 0.85);
  opacity: 0.5;
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
  transform: translateZ(70px) rotate(8deg);
  box-shadow: 4px 4px 0 var(--ink);
}
.cat-card__badge.is-new {
  background: #fff;
  color: var(--ink);
  border-color: var(--ink);
}
.cat-card__info {
  position: relative;
  z-index: 2;
  flex: 1;
  min-height: 0;
  /* deals-card footer: kick + name take full rows, the price hugs the left and
     the CTA is pinned to the right corner (on narrow cards margin-left auto
     wraps it there instead of stacking at the left) */
  display: flex;
  flex-wrap: wrap;
  place-content: end flex-start;
  align-items: center;
  gap: 4px 12px;
  padding: 0 7% 6%;
  transform: translateZ(22px);
}
.cat-card__kick,
.cat-card__name {
  flex: 1 1 100%;
}
.cat-card__kick {
  font-size: clamp(11px, 0.8vw, 13px);
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.cat-card__name {
  font: 800 clamp(17px, 1.35vw, 26px)/1.15 var(--fd);
  color: inherit;
  text-decoration: none;
}
.cat-card__price {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.cat-card__price s {
  font-size: 15px;
  font-weight: 700;
  opacity: 0.8;
}
.cat-card__price b {
  font: 800 clamp(19px, 1.5vw, 28px) var(--fd);
  text-decoration: underline;
  text-underline-offset: 5px;
  text-decoration-thickness: 2px;
}
.cat-card__btn {
  flex: 0 0 auto;
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #ffc72c;
  color: var(--ink);
  border: 2.5px solid var(--ink);
  border-radius: 999px;
  padding: 10px 20px;
  font-weight: 700;
  font-size: 15px;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--ink);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}
.cat-card__btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--ink);
}
.cat-card__btn:active {
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
    box-shadow: 5px 6px 0 var(--ink);
  }
  .cat-card__info {
    padding: 8px 10px 12px;
  }
  .cat-card__name {
    font-size: 15px;
  }
  .cat-card__btn {
    padding: 7px 12px;
    font-size: 13px;
  }
  .cat-card__price s {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cat-strip * {
    animation: none !important;
    transition: none !important;
  }
  .cat-card {
    transform: none !important;
  }
}
</style>
