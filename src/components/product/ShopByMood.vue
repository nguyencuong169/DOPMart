<script setup>
import { computed, shallowRef } from "vue";
import { ArrowRight } from "lucide-vue-next";
import SectionHeader from "../common/SectionHeader.vue";
import CatalogCard from "./CatalogCard.vue";
import { useProductStore } from "../../stores/productStore";

const MAX = 4; // số món đại diện tối đa mỗi category
const store = useProductStore();
const active = shallowRef("all");
const uid = Math.random().toString(36).slice(2, 7);

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

function select(slug) {
  active.value = slug;
}

function onTabKeydown(e, slug) {
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  e.preventDefault();
  const list = Array.from(e.currentTarget.parentElement.children);
  const idx = list.indexOf(e.currentTarget);
  const dir = e.key === "ArrowRight" ? 1 : -1;
  const nextTab = list[(idx + dir + list.length) % list.length];
  nextTab.focus();
  select(nextTab.dataset.slug);
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
          :data-slug="t.slug"
          @click="select(t.slug)"
          @keydown="onTabKeydown($event, t.slug)"
        >
          <span class="cat-tab__name">{{ t.name }}</span>
          <span class="cat-tab__count">{{ t.items.length }} món</span>
          <span class="cat-tab__pop" aria-hidden="true">
            <img
              v-for="(src, i) in t.imgs"
              :key="i"
              :src="src"
              alt=""
            />
          </span>
        </button>
      </div>
    </div>

    <div class="cat-stage" :style="{ '--ac': current.color }">
      <div class="cat-inner">
        <div v-if="current.items.length > MAX" class="cat-bar">
          <RouterLink :to="link" class="cat-more">
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
          <CatalogCard
            v-for="(p, i) in shown"
            :key="p.id ?? p.slug"
            :product="p"
            :index="i"
            @quick="store.openQuick(p)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cat-strip {
  --fd: var(--font-display);
  width: 100vw;
  margin-left: calc(50% - 50vw);
  padding: var(--sp-4) 0 0;
}
.cat-inner {
  max-width: var(--container, 1920px);
  margin: 0 auto;
  padding: 0 var(--gutter, 12px);
}
.cat-tabs {
  display: flex;
  gap: var(--sp-3);
  overflow-x: auto;
  width: 100vw;
  margin-inline: calc(50% - 50vw);
  padding: var(--sp-4)
    max(var(--gutter, 12px), calc((100vw - var(--container, 1920px)) / 2 + var(--gutter, 12px)))
    var(--sp-3);
  scroll-padding-inline: max(
    var(--gutter, 12px),
    calc((100vw - var(--container, 1920px)) / 2 + var(--gutter, 12px))
  );
  mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 72px), transparent 100%);
  scroll-snap-type: x proximity;
  scrollbar-width: none;
}
.cat-tabs::after {
  content: "";
  flex: none;
  width: 72px;
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
  border-radius: var(--radius);
  padding: 0 0 0 var(--sp-2);
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
.cat-tab:focus-visible {
  outline: 3px solid var(--ink);
  outline-offset: 4px;
  border-radius: var(--radius);
}
.cat-tab[aria-selected="true"] {
  transform: translateY(-8px);
  box-shadow:
    0 0 0 3px #fff,
    0 0 0 5.5px var(--ink),
    0 13px 0 3px var(--cd),
    0 24px 26px -8px rgba(0, 0, 0, 0.4);
}
.cat-tab[aria-selected="true"]:after {
  content: "";
  position: absolute;
  left: 50%;
  top: calc(100% + var(--sp-2));
  transform: translateX(-50%);
  border: 15px solid transparent;
  border-bottom: 0;
  border-top: 18px solid var(--c);
}
.cat-tab__name,
.cat-tab__count {
  position: relative;
  z-index: 4;
}
.cat-tab__name {
  font: 800 var(--fs-lg) / 1.1 var(--font-display);
  max-width: 46%;
}
.cat-tab__count {
  font-size: var(--fs-xs);
  opacity: 0.9;
  margin-top: var(--sp-1);
}
.cat-tab__pop {
  position: absolute;
  isolation: isolate;
  right: var(--sp-1);
  bottom: var(--sp-1);
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
.cat-stage {
  --ac: var(--yellow);
  background: color-mix(in srgb, var(--ac) 13%, var(--cream));
  border-top: 6px solid var(--ac);
  padding: var(--sp-2) 0 var(--sp-6);
  transition:
    background 0.45s,
    border-color 0.45s;
}
.cat-bar {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  gap: var(--sp-1);
  flex-wrap: wrap;
}
.cat-bar__title {
  margin: 0;
  font: 800 var(--fs-xl) / 1.1 var(--font-display);
  letter-spacing: var(--tracking-display);
}
.cat-bar__lead {
  margin: var(--sp-1) 0 0;
  color: #5b554b;
  font-size: var(--fs-sm);
}
.cat-more {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  background: #fff;
  color: var(--ink);
  border: var(--bw-bold) solid var(--ink);
  border-radius: var(--r-pill);
  padding: 10px var(--sp-2);
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
.cat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 456px));
  justify-content: center;
  gap: var(--sp-3);
  padding: var(--sp-3) 0 var(--sp-1);
}
@media (max-width: 980px) {
  .cat-grid {
    grid-template-columns: repeat(2, minmax(0, 456px));
    gap: 96px var(--sp-3);
  }
}
@media (max-width: 520px) {
  .cat-grid {
    gap: 84px var(--sp-2);
  }
  .cat-tab {
    width: 196px;
  }
}
</style>
