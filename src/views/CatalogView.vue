<script setup>
import { computed, ref, watch, onMounted, nextTick, onBeforeUnmount } from "vue";
import { RouterLink } from "vue-router";
import { gsap } from "gsap";
import { ArrowRight, Search, X, ChevronLeft, ChevronRight } from "lucide-vue-next";
import { useProductStore } from "../stores/productStore";
import { useFloorStore } from "../stores/floorStore";
import { useFavoriteStore } from "../stores/favoriteStore";
import { paginate } from "../data/catalog";
import { products as seedProducts, categories as seedCategories } from "../data/products";
import ShelfPosterCard from "../components/catalog/ShelfPosterCard.vue";

const s = useProductStore();
const floor = useFloorStore();
const favorites = useFavoriteStore();

// The store seeds from Supabase when configured; when it is not (or has not
// loaded yet) fall back to the catalogue seed so the shelf always has product
// to show. This is scoped to this page — the store itself is untouched.
const shelfProducts = computed(() =>
  s.products && s.products.length ? s.products : seedProducts,
);
const cats = computed(() =>
  s.categories && s.categories.length ? s.categories : seedCategories,
);

const page = ref(1);
const query = ref("");
const category = ref("all");
const stockOnly = ref(false);
const sort = ref("default");
const pageSize = 8;

const strip = (v) => (v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const filtered = computed(() => {
  let list = [...shelfProducts.value];
  if (category.value !== "all") list = list.filter((p) => p.category === category.value);
  if (stockOnly.value) list = list.filter((p) => (p?.stock?.[floor.floor] ?? 0) > 0);
  const q = strip(query.value);
  if (q) list = list.filter((p) => strip(p.name).includes(q) || strip(p.categoryName).includes(q));
  const sorts = {
    best: (a, b) => b.sold - a.sold,
    rating: (a, b) => b.rating - a.rating,
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    newest: (a, b) => Number(b.isNew) - Number(a.isNew) || b.id - a.id,
  };
  if (sorts[sort.value]) list.sort(sorts[sort.value]);
  return list;
});

const pagination = computed(() => paginate(filtered.value, page.value, pageSize));
const list = computed(() => pagination.value.items);
const total = computed(() => filtered.value.length);
const pages = computed(() => pagination.value.pages);

watch([category, stockOnly, query, sort], () => (page.value = 1));
watch(pages, (v) => { if (page.value > v) page.value = v; });

const stockOf = (p) => p?.stock?.[floor.floor] ?? null;
const isFeatured = (i) => i === 0 && page.value === 1 && category.value === "all" && !query.value && !stockOnly.value;

const gridHeader = ref(null);
const onPrev = () => { if (page.value > 1) page.value--; };
const onNext = () => { if (page.value < pages.value) page.value++; };
const goTo = (n) => { page.value = n; };
watch(page, async () => {
  await nextTick();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  gridHeader.value?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
});

const resetFilters = () => { query.value = ""; category.value = "all"; stockOnly.value = false; sort.value = "default"; };

const heroPacks = computed(() => {
  const prods = shelfProducts.value || [];
  const picks = [];
  const seen = new Set();
  for (const p of prods) {
    if (seen.has(p.category)) continue;
    seen.add(p.category);
    picks.push(p);
    if (picks.length >= 3) break;
  }
  if (picks.length < 3) picks.push(...prods.slice(0, 3 - picks.length));
  return picks.slice(0, 3);
});

const countByCategory = (slug) =>
  (shelfProducts.value || []).filter((p) => p.category === slug).length;

const sortLabel = computed(() => {
  const m = { default: "Kệ mặc định", best: "Bán chạy", rating: "Đánh giá cao", "price-asc": "Giá thấp → cao", "price-desc": "Giá cao → thấp", newest: "Mới lên kệ" };
  return m[sort.value] || "Kệ mặc định";
});

const catName = computed(() => {
  if (category.value === "all") return "Tất cả món";
  return cats.value?.find((c) => c.slug === category.value)?.name || "Tất cả món";
});

let gsapCtx = null;
onMounted(() => {
  s.init();
  floor.init();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsapCtx = gsap.context(() => {
    gsap.from(".shelf-hero__ticket, .shelf-hero__title, .shelf-hero__lead, .shelf-hero__facts, .shelf-hero__cta, .shelf-stage", {
      y: 28, opacity: 0, stagger: 0.07, duration: 0.7, ease: "power4.out",
    });
  });
});
onBeforeUnmount(() => gsapCtx?.revert());

const fmt = (n) => (n || 0).toLocaleString("vi-VN") + " ₫";
</script>

<template>
  <div class="shelf-page">
    <section class="shelf-hero">
      <div class="shelf-hero__bg" aria-hidden="true"><span class="shelf-hero__word">SNACK</span></div>
      <div class="shelf-wrap shelf-hero__grid">
        <div class="shelf-hero__left">
          <div class="shelf-hero__ticket">DOP SHELF · TẦNG {{ floor.floor }}</div>
          <h1 class="shelf-hero__title"><span class="line1">CHỌN MÓN</span><span class="line2">BẢN LĨNH</span></h1>
          <p class="shelf-hero__lead">Cả kệ snack của DOP Mart gói trong một trang. Lọc theo cơn thèm, thêm vào giỏ, năm phút sau có người mang lên tầng.</p>
          <div class="shelf-hero__facts">
            <span class="shelf-fact">{{ total }} MÓN ĐANG BÁN</span>
            <span class="shelf-fact">GIAO 5 PHÚT</span>
            <span class="shelf-fact">LẠNH 4°C</span>
          </div>
          <div class="shelf-hero__cta">
            <RouterLink to="/deals" class="shelf-btn shelf-btn--yellow">Xem combo hôm nay <ArrowRight class="size-4" /></RouterLink>
            <RouterLink to="/how-it-works" class="shelf-btn shelf-btn--ghost">Cách đặt hàng</RouterLink>
          </div>
        </div>
        <div class="shelf-stage-mobile" aria-hidden="true">
          <img v-for="(p, i) in heroPacks" :key="'m'+p.id" :src="p.image" :alt="''" />
        </div>
        <div class="shelf-stage" aria-hidden="true">
          <div class="shelf-stage__disc"></div>
          <div class="shelf-stage__ring"></div>
          <img v-for="(p, i) in heroPacks" :key="p.id" :src="p.image" :alt="''" class="shelf-stage__pack" :class="`pack-${i}`" />
          <span class="shelf-star s1">✦</span><span class="shelf-star s2">✦</span><span class="shelf-star s3">✦</span>
          <div class="shelf-stage__sticker">-25%</div>
        </div>
      </div>
      <div class="shelf-marquee" aria-hidden="true">
        <div class="shelf-marquee__track">
          <span>GIÒN RỤM ✦ CAY NỒNG ✦ NGỌT NGÀO ✦ MÌ NÓNG 3 PHÚT ✦ LẠNH 4°C ✦ RANG MỘC ✦</span>
          <span>GIÒN RỤM ✦ CAY NỒNG ✦ NGỌT NGÀO ✦ MÌ NÓNG 3 PHÚT ✦ LẠNH 4°C ✦ RANG MỘC ✦</span>
        </div>
      </div>
    </section>

    <div class="shelf-filterbar">
      <div class="shelf-wrap shelf-filterbar__inner">
        <span class="shelf-filterbar__label"><span class="shelf-filterbar__bar"></span>LỌC THEO KỆ</span>
        <div class="shelf-chips">
          <button type="button" class="shelf-chip" :class="{ active: category === 'all' }" :aria-pressed="category === 'all'" @click="category = 'all'">Tất cả <em>{{ shelfProducts.length }}</em></button>
          <button v-for="c in cats" :key="c.slug" type="button" class="shelf-chip" :class="{ active: category === c.slug }" :aria-pressed="category === c.slug" @click="category = c.slug">
            {{ c.icon }} {{ c.name }} <em>{{ countByCategory(c.slug) }}</em>
          </button>
        </div>
        <div class="shelf-tools">
          <div class="shelf-search">
            <Search class="size-4" />
            <label class="sr-only" for="shelf-q">Tìm món</label>
            <input id="shelf-q" v-model="query" type="text" placeholder="Tìm món…" />
            <button v-if="query" type="button" class="shelf-clear" @click="query = ''" aria-label="Xoá tìm kiếm"><X class="size-4" /></button>
          </div>
          <button type="button" class="shelf-switch" :class="{ on: stockOnly }" role="switch" :aria-checked="stockOnly" @click="stockOnly = !stockOnly">
            <span class="shelf-switch__track" aria-hidden="true"><span class="shelf-switch__knob"></span></span>
            <span class="slbl">Còn hàng {{ floor.floor }}F</span>
          </button>
          <label class="sr-only" for="shelf-sort">Sắp xếp</label>
          <select id="shelf-sort" v-model="sort" class="shelf-select">
            <option value="default">Kệ mặc định</option>
            <option value="best">Bán chạy</option>
            <option value="rating">Đánh giá cao</option>
            <option value="price-asc">Giá thấp → cao</option>
            <option value="price-desc">Giá cao → thấp</option>
            <option value="newest">Mới lên kệ</option>
          </select>
        </div>
        <div class="shelf-result" aria-live="polite">
          <b>{{ total }}</b> món <span class="muted">đang bày trên kệ</span>
          <button v-if="query || category !== 'all' || stockOnly || sort !== 'default'" type="button" class="shelf-reset" @click="resetFilters">Xoá lọc</button>
        </div>
      </div>
    </div>

    <section class="shelf-gridsec">
      <div class="shelf-wrap">
        <div ref="gridHeader" class="shelf-gridhead">
          <div>
            <span class="shelf-kicker">DANH SÁCH MÓN</span>
            <h2>{{ catName }} <em>· {{ list.length }} món</em></h2>
          </div>
          <span class="shelf-sortnote">SẮP THEO: {{ sortLabel }}</span>
        </div>
        <div class="shelf-rule"></div>
        <div v-if="list.length" class="shelf-grid">
          <ShelfPosterCard
            v-for="(p, i) in list"
            :key="p.id"
            :product="p"
            :index="Math.min(i, 10)"
            :stock="stockOf(p)"
            :floor="floor.floor"
            :featured="isFeatured(i)"
            :favorited="favorites.has(p.id)"
            @quick="s.openQuick(p)"
            @toggle-favorite="favorites.toggle(p.id)"
            :class="isFeatured(i) ? 'shelf-grid__feat' : ''"
          />
        </div>
        <div v-else class="shelf-empty">
          <div class="shelf-empty__word" aria-hidden="true">HẾT MÓN</div>
          <p>Chưa có món nào khớp bộ lọc. Bỏ bớt một điều kiện là kệ mở lại ngay.</p>
          <button type="button" class="shelf-btn shelf-btn--yellow" @click="resetFilters">Bỏ lọc hết</button>
        </div>
        <div v-if="pages > 1" class="shelf-pager">
          <button type="button" class="shelf-pgbtn" :disabled="page === 1" @click="onPrev" aria-label="Trang trước"><ChevronLeft class="size-4" /></button>
          <button v-for="n in pages" :key="n" type="button" class="shelf-pgnum" :class="{ active: n === page }" :aria-current="n === page ? 'page' : null" @click="goTo(n)">{{ n }}</button>
          <button type="button" class="shelf-pgbtn" :disabled="page === pages" @click="onNext" aria-label="Trang sau"><ChevronRight class="size-4" /></button>
        </div>
      </div>
    </section>

    <section class="shelf-cta">
      <div class="shelf-wrap shelf-cta__inner">
        <div>
          <span class="shelf-sticker">COMBO TIẾT KIỆM</span>
          <h3 class="shelf-cta__title">3 MÓN LẺ <span class="hollow">ĐẮT HƠN</span> 1 COMBO.</h3>
          <p class="shelf-cta__body">Gom ba món hay mua thành một combo, giá mềm hơn mua lẻ và có người mang lên tầng trong 5 phút.</p>
          <RouterLink to="/deals" class="shelf-btn shelf-btn--yellow">Xem combo hôm nay</RouterLink>
        </div>
        <div class="shelf-cta__collage" aria-hidden="true">
          <div class="shelf-cta__disc"></div>
          <img v-for="(p, i) in heroPacks" :key="'c' + p.id" :src="p.image" :alt="''" class="shelf-cta__pack" :class="`cp-${i}`" />
        </div>
      </div>
      <div class="shelf-footnote">DOP MART · TẦNG 14 & 20 · GIAO TRONG 5 PHÚT</div>
    </section>
  </div>
</template>

<style scoped>
.shelf-page { background: var(--cream); color: var(--ink); overflow-x: clip; }
.shelf-wrap { width: 100%; max-width: 1440px; margin: 0 auto; padding-inline: clamp(16px, 4vw, 56px); }
.shelf-hero { padding-top: 112px; min-height: 520px; position: relative; overflow: hidden; padding-bottom: 0; }
.shelf-hero__bg { position: absolute; inset: 0; pointer-events: none; }
.shelf-hero__word { position: absolute; top: 10%; left: -2%; font-family: "Barlow Condensed", sans-serif; font-weight: 900; font-style: italic; font-size: 26vw; line-height: 1; color: transparent; -webkit-text-stroke: 2px var(--ink); opacity: .08; transform: rotate(-4deg); white-space: nowrap; }
.shelf-hero__grid { display: grid; grid-template-columns: 1.1fr .9fr; gap: 24px; align-items: end; position: relative; padding: 0; }
.shelf-hero__ticket { display: inline-block; background: #fff; border: 2px solid var(--ink); box-shadow: 4px 4px 0 var(--ink); padding: 6px 14px; border-radius: var(--r-pill); font-weight: 800; font-size: 12px; transform: rotate(-2deg); margin-bottom: 16px; }
.shelf-hero__title { font-family: "Barlow Condensed", sans-serif; font-weight: 900; font-style: italic; font-size: clamp(54px, 9.5vw, 132px); line-height: .82; letter-spacing: -.01em; transform: rotate(-1.5deg); margin: 0 0 16px; text-transform: uppercase; }
.shelf-hero__title .line1 { display: block; color: var(--ink); }
.shelf-hero__title .line2 { display: block; margin-left: .35em; color: transparent; -webkit-text-stroke: clamp(2px, .3vw, 4px) var(--red-ink); }
.shelf-hero__lead { max-width: 46ch; font-size: 17px; color: var(--on-cream); margin: 0 0 16px; }
.shelf-hero__facts { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
.shelf-fact { background: #fff; border: 2px solid var(--ink); box-shadow: 3px 3px 0 var(--ink); padding: 6px 12px; border-radius: var(--r-pill); font-weight: 800; font-size: 12px; transform: rotate(-2deg); }
.shelf-hero__facts .shelf-fact:nth-child(2) { transform: rotate(2deg); }
.shelf-hero__facts .shelf-fact:nth-child(3) { transform: rotate(-1deg); }
.shelf-hero__cta { display: flex; gap: 12px; flex-wrap: wrap; }
.shelf-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border: 2px solid var(--ink); border-radius: var(--r-pill); font-weight: 800; font-size: 14px; text-decoration: none; color: var(--ink); background: #fff; box-shadow: 3px 3px 0 var(--ink); transition: transform .15s; cursor: pointer; }
.shelf-btn--yellow { background: var(--yellow); color: var(--on-yellow); }
.shelf-btn--yellow:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 var(--ink); }
.shelf-btn--ghost { background: transparent; }
.shelf-stage { position: relative; min-height: 400px; }
.shelf-stage__disc { position: absolute; right: 10%; top: 20%; width: 260px; height: 260px; border-radius: 50%; background: var(--red-ink); }
.shelf-stage__disc::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: repeating-conic-gradient(var(--cream) 0 10deg, transparent 10deg 20deg); mask: radial-gradient(circle, black 40%, transparent 75%); opacity: .35; animation: shelf-spin 18s linear infinite; }
.shelf-stage__ring { position: absolute; right: 10%; top: 20%; width: 260px; height: 260px; border-radius: 50%; border: 2px dashed var(--cream); transform: scale(1.15); }
.shelf-stage__pack { position: absolute; height: auto; object-fit: contain; border: 0; background: none; filter: drop-shadow(2px 10px 6px rgba(0,0,0,.16)) drop-shadow(14px 26px 22px rgba(0,0,0,.18)); }
.pack-0 { width: 180px; top: 8%; left: 4%; transform: rotate(-9deg); animation: shelf-float 6s ease-in-out infinite alternate; }
.pack-1 { width: 125px; top: 48%; left: 50%; transform: rotate(5deg); animation: shelf-float 6s ease-in-out infinite alternate; animation-delay: 1s; }
.pack-2 { width: 110px; top: 12%; left: 66%; transform: rotate(11deg); animation: shelf-float 6s ease-in-out infinite alternate; animation-delay: 2s; }
.shelf-star { position: absolute; color: var(--yellow); font-size: 22px; animation: shelf-twinkle 2s ease-in-out infinite alternate; }
.s1 { top: 4%; right: 16%; } .s2 { top: 22%; right: 20%; } .s3 { bottom: 6%; right: 26%; }
.shelf-stage__sticker {
  position: absolute;
  bottom: 8%;
  right: 6%;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  background: var(--yellow);
  color: var(--ink);
  border: 2px solid var(--ink);
  border-radius: 50%;
  font-family: "Barlow Condensed", "Arial Narrow", Impact, sans-serif;
  font-weight: 900;
  font-size: 15px;
  line-height: 1;
  transform: rotate(10deg);
  box-shadow: 4px 4px 0 var(--ink);
}
.shelf-stage__sticker::before {
  content: "";
  position: absolute;
  inset: -10px;
  z-index: -1;
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
  transform: rotate(-10deg);
}
.shelf-marquee { margin-top: 28px; background: var(--ink); color: var(--yellow); border-block: 2px solid var(--ink); overflow: hidden; }
.shelf-marquee__track { display: flex; width: max-content; animation: shelf-scroll 26s linear infinite; }
.shelf-marquee__track span { font-family: "Barlow Condensed", sans-serif; font-style: italic; font-weight: 700; font-size: 16px; padding: 10px 0; white-space: nowrap; margin-right: 40px; }
.shelf-marquee:hover .shelf-marquee__track { animation-play-state: paused; }
@keyframes shelf-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes shelf-spin { to { transform: rotate(360deg); } }
@keyframes shelf-float { from { transform: translateY(0); } to { transform: translateY(-12px); } }
@keyframes shelf-twinkle { from { opacity: .4; transform: scale(.8); } to { opacity: 1; transform: scale(1.2); } }

.shelf-filterbar { position: sticky; top: 76px; z-index: 40; background: var(--cream); border-bottom: 2px solid var(--ink); border-top: 3px solid var(--yellow); padding: 14px 0; }
.shelf-filterbar__inner { display: flex; flex-wrap: wrap; gap: 12px 18px; align-items: center; justify-content: space-between; }
.shelf-filterbar__label { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; }
.shelf-filterbar__bar { width: 4px; height: 16px; background: var(--red-ink); }
.shelf-chips { display: flex; gap: 8px; overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none; flex: 1 1 420px; min-width: 0; -webkit-mask-image: linear-gradient(90deg,#000 92%,transparent); mask-image: linear-gradient(90deg,#000 92%,transparent); padding-block: 3px; }
.shelf-chips::-webkit-scrollbar { display: none; }
.shelf-chip { background: #fff; border: 2px solid var(--ink); border-radius: var(--r-pill); padding: 8px 14px; font-size: 12px; font-weight: 700; box-shadow: 2px 2px 0 var(--ink); cursor: pointer; white-space: nowrap; scroll-snap-align: start; transition: transform .15s, box-shadow .15s; }
.shelf-chip em { font-style: normal; font-size: 10px; background: var(--cream); border: 1px solid var(--ink); border-radius: var(--r-pill); padding: 1px 6px; margin-left: 4px; }
.shelf-chip.active { background: var(--ink); color: var(--cream); transform: translate(-2px, -2px); box-shadow: 4px 4px 0 var(--yellow); }
.shelf-chip:hover:not(.active) { background: var(--yellow); color: var(--on-yellow); }
.shelf-tools { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; flex: 0 1 auto; }
.shelf-search { display: inline-flex; align-items: center; gap: 8px; background: #fff; border: 2px solid var(--ink); border-radius: var(--r-pill); padding: 6px 12px; }
.shelf-search input { border: none; background: transparent; font-size: 14px; min-width: 140px; }
.shelf-clear { background: none; border: none; cursor: pointer; padding: 0; }
.shelf-switch { display: inline-flex; align-items: center; gap: 8px; background: #fff; border: 2px solid var(--ink); border-radius: var(--r-pill); padding: 6px 12px; cursor: pointer; font-size: 12px; font-weight: 700; }
.shelf-switch__track { width: 38px; height: 20px; border: 1.5px solid var(--ink); border-radius: 999px; background: #efe6d2; padding: 2px; display: inline-flex; align-items: center; }
.shelf-switch__knob { width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 1.5px solid var(--ink); transition: transform .2s; }
.shelf-switch.on .shelf-switch__track { background: var(--green-ink); }
.shelf-switch.on .shelf-switch__knob { transform: translateX(18px); }
.shelf-select { width: 200px; max-width: 100%; padding: 8px 32px 8px 12px; border: 2px solid var(--ink); border-radius: 12px; background: #fff; font-size: 13px; font-weight: 700; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%231a1a1a' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-size: 16px; }
.shelf-result { width: 100%; display: flex; align-items: center; gap: 8px; font-size: 14px; }
.shelf-result b { font-family: "Barlow Condensed", sans-serif; font-weight: 800; font-size: 20px; }
.shelf-result .muted { color: var(--on-cream); }
.shelf-reset { background: none; border: none; color: var(--red-ink); font-weight: 800; cursor: pointer; text-decoration: underline; }

.shelf-gridsec { padding: 40px 0 20px; }
.shelf-gridhead { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; margin-bottom: 12px; scroll-margin-top: 150px; }
.shelf-kicker { font-size: 11px; font-weight: 800; letter-spacing: .2em; color: var(--red-ink); text-transform: uppercase; }
.shelf-gridhead h2 { font-family: var(--font-display); font-weight: 800; font-size: clamp(28px, 4vw, 46px); margin: 4px 0 0; }
.shelf-gridhead h2 em { font-family: "Barlow Condensed", sans-serif; font-style: italic; font-weight: 700; font-size: .7em; color: var(--on-cream); }
.shelf-sortnote { font-size: 12px; font-weight: 700; transform: rotate(2deg); display: inline-block; }
@media (max-width: 700px) { .shelf-sortnote { display: none; } }
.shelf-rule { border-top: 2px dashed var(--ink); margin-bottom: 20px; }
.shelf-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px 18px; align-items: stretch; grid-auto-rows: 280px; }
@media (max-width: 1280px) { .shelf-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 980px) { .shelf-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: 260px; } }
@media (max-width: 600px) { .shelf-grid { grid-template-columns: 1fr; grid-auto-rows: auto; } }
@media (min-width: 981px) {
  .shelf-grid__feat { grid-column: span 2; grid-row: span 2; }
}
.shelf-empty { text-align: center; padding: 60px 20px; }
.shelf-empty__word { font-family: "Barlow Condensed", sans-serif; font-weight: 900; font-style: italic; font-size: clamp(60px, 12vw, 140px); color: transparent; -webkit-text-stroke: 2px var(--ink); opacity: .25; }
.shelf-empty p { color: var(--on-cream); max-width: 40ch; margin: 12px auto 20px; }

.shelf-pager { display: flex; gap: 8px; justify-content: center; align-items: center; margin-top: 28px; }
.shelf-pgbtn, .shelf-pgnum { width: 44px; height: 44px; border: 2px solid var(--ink); background: #fff; box-shadow: 3px 3px 0 var(--ink); border-radius: 10px; font-weight: 800; cursor: pointer; }
.shelf-pgnum.active { background: var(--ink); color: var(--cream); transform: translateY(-2px); box-shadow: 3px 3px 0 var(--yellow); }
.shelf-pgbtn:disabled { opacity: .4; cursor: not-allowed; }

.shelf-cta { margin: 40px clamp(16px, 4vw, 56px) 24px; background: var(--ink); color: var(--on-black); border-radius: 30px; overflow: hidden; padding: clamp(24px, 4vw, 48px); }
.shelf-cta__inner { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: center; }
.shelf-sticker { display: inline-block; background: var(--yellow); color: var(--on-yellow); padding: 4px 12px; border-radius: var(--r-pill); font-weight: 900; font-size: 12px; margin-bottom: 12px; }
.shelf-cta__title { font-family: "Barlow Condensed", sans-serif; font-weight: 900; font-style: italic; font-size: clamp(30px, 4.6vw, 62px); line-height: .9; color: var(--yellow); margin: 0 0 12px; text-transform: uppercase; }
.shelf-cta__title .hollow { color: transparent; -webkit-text-stroke: 2px var(--cream); }
.shelf-cta__body { color: var(--on-black); max-width: 46ch; margin: 0 0 16px; }
.shelf-cta__collage { position: relative; min-height: 220px; }
.shelf-cta__disc { position: absolute; right: 20%; top: 10%; width: 180px; height: 180px; border-radius: 50%; background: var(--red); background-image: repeating-conic-gradient(var(--cream) 0 12deg, transparent 12deg 24deg); }
.shelf-cta__pack { position: absolute; width: 90px; height: auto; object-fit: contain; border: 0; background: none; filter: drop-shadow(2px 8px 4px rgba(0,0,0,.18)) drop-shadow(10px 22px 16px rgba(0,0,0,.16)); }
.cp-0 { width: 104px; top: 5%; left: 10%; transform: rotate(-8deg); }
.cp-1 { width: 90px; top: 35%; left: 40%; transform: rotate(6deg); }
.cp-2 { width: 86px; top: 10%; left: 65%; transform: rotate(12deg); }
.shelf-footnote { text-align: center; font-size: 11px; letter-spacing: .18em; color: var(--on-black); opacity: .7; margin-top: 20px; border-top: 1px dashed var(--cream); padding-top: 12px; }

@media (max-width: 900px) { .shelf-stage { display: none; } .shelf-stage-mobile { display: flex; } }
.shelf-stage-mobile { display: none; gap: 8px; justify-content: center; margin-top: 16px; }
.shelf-stage-mobile img { width: 78px; height: auto; object-fit: contain; border: 0; background: none; filter: drop-shadow(2px 6px 4px rgba(0,0,0,.15)); }
@media (max-width: 760px) { .shelf-cta__collage { display: none; } .shelf-cta__inner { grid-template-columns: 1fr; } }
@media (max-width: 650px) { .shelf-filterbar { top: 72px; } }
@media (max-width: 600px) {
  .shelf-filterbar__label { display: none; }
  .shelf-chips { flex: 1 1 100%; }
  .shelf-tools { width: 100%; flex-wrap: wrap; }
  .shelf-select { width: 100%; }
  .shelf-search { flex: 1 1 100%; min-width: 0; }
  .shelf-search input { min-width: 0; }
}
@media (max-width: 360px) { .shelf-wrap { padding-inline: 12px; } }
@media (prefers-reduced-motion: reduce) { .shelf-marquee__track, .shelf-stage__disc::after, .shelf-stage__pack, .shelf-star, .shelf-stage-mobile img, .shelf-cta__pack { animation: none !important; } }

.shelf-chip:focus-visible,
.shelf-btn:focus-visible,
.shelf-switch:focus-visible,
.shelf-clear:focus-visible,
.shelf-reset:focus-visible,
.shelf-pgbtn:focus-visible,
.shelf-pgnum:focus-visible,
.shelf-select:focus-visible {
  outline: 3px solid var(--ink);
  outline-offset: 2px;
}
.shelf-search:focus-within { box-shadow: 3px 3px 0 var(--yellow); }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (max-width: 900px) { .shelf-hero__grid { grid-template-columns: 1fr; } }
</style>