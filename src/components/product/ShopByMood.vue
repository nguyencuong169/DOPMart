<script setup>
import { computed, reactive, ref } from "vue";
import { ArrowRight } from "lucide-vue-next";
import SectionHeader from "../common/SectionHeader.vue";
import CatalogCard from "./CatalogCard.vue";
import { useProductStore } from "../../stores/productStore";
import { useCartStore } from "../../stores/cartStore";

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
            :quantity="qtyOf(p)"
            @update:quantity="(v) => (qty[p.id] = v)"
            @quick="store.openQuick(p)"
            @add="addToCart(p)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cat-strip {
  --ink: #1a1a1a;
  --cream: #fffaf0;
  --fd: var(--font-display, "Bricolage Grotesque", system-ui, sans-serif);
  width: 100vw;
  margin-left: calc(50% - 50vw);
  padding: 48px 0 0;
}
.cat-inner {
  /* one measure for the whole page: the tokens are the source, these numbers are it */
  max-width: var(--container, 1920px);
  margin: 0 auto;
  padding: 0 var(--gutter, 12px);
}
.cat-tabs {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  /* full bleed: the row runs the whole viewport even inside the container, with its
     first chip on the page edge, so no chip is cut by an invisible margin. the fade on
     the right says "there is more", and the spacer after the last chip lets it scroll
     clear of the fade */
  width: 100vw;
  margin-inline: calc(50% - 50vw);
  padding: 58px
    max(var(--gutter, 12px), calc((100vw - var(--container, 1920px)) / 2 + var(--gutter, 12px)))
    26px;
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
.cat-stage {
  --ac: #ffc72c;
  background: color-mix(in srgb, var(--ac) 13%, var(--cream));
  border-top: 6px solid var(--ac);
  /* ... tiếp nối phần CSS ở trên ... */
  padding: 22px 0 88px;
  transition:
    background 0.45s,
    border-color 0.45s;
}
.cat-bar {
  display: flex;
  /* the stage lost its "Tất cả / 4-of-8" line: only the action is left, so it docks
     to the right and the grid moves up to meet the tabs */
  justify-content: flex-end;
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
.cat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 456px));
  justify-content: center;
  gap: 24px;
  padding: 24px 0 12px;
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
}
</style>
