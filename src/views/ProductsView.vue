<script setup>
import { computed, ref, watch, onMounted } from "vue";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SlidersHorizontal } from "lucide-vue-next";
import { useProductStore } from "../stores/productStore";
import { useFloorStore } from "../stores/floorStore";
import { applyCatalogFilters, paginate } from "../data/catalog";
import ProductGrid from "../components/product/ProductGrid.vue";
import ProductShowcase from "../components/product/ProductShowcase.vue";
import Pagination from "../components/common/Pagination.vue";

gsap.registerPlugin(ScrollTrigger);

const props = defineProps({ mode: { type: String, default: "all" } });

const s = useProductStore();
const floor = useFloorStore();
const page = ref(1);
const category = ref("all");
const stockOnly = ref(false);
const pageSize = 8;

const views = {
  all: {
    kicker: "DOP SHELF · 32 PICKS",
    title: "Tủ snack hôm nay",
    lead: (n) => `${n} món đang chờ bạn tại tầng ${floor.floor}.`,
    sort: "default",
  },
  new: {
    kicker: "FRESH DROP · MỚI LÊN KỆ",
    title: "Món mới tuần này",
    lead: (n) => `${n} món vừa cập bến kệ DOP Mart, thử trước đồng nghiệp.`,
    sort: "default",
  },
  best: {
    kicker: "BEST SELLERS · OFFICE FAVORITES",
    title: "Bán nổi nhất",
    lead: (n) => `${n} món được săn nhiều nhất tại tầng ${floor.floor}.`,
    sort: "best",
  },
};

const view = computed(() => views[props.mode] || views.all);
const sort = ref(view.value.sort);
const base = computed(() =>
  props.mode === "new" ? s.newProducts : props.mode === "best" ? s.bestSellers : s.products
);
const filtered = computed(() =>
  applyCatalogFilters(base.value, {
    category: category.value,
    stockOnly: stockOnly.value,
    floor: floor.floor,
    sort: sort.value,
  })
);
const pagination = computed(() => paginate(filtered.value, page.value, pageSize));
const pages = computed(() => pagination.value.pages);
const list = computed(() => pagination.value.items);

watch([category, sort, stockOnly], () => (page.value = 1));
watch(
  () => props.mode,
  () => {
    sort.value = view.value.sort;
    category.value = "all";
    page.value = 1;
  }
);
watch(pages, (v) => {
  if (page.value > v) page.value = v;
});

const entrance = ref();
const fullBleed = ref(false);

onMounted(() => {
  s.init();
  floor.init();
  if (!entrance.value) return;
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: entrance.value,
      start: "top 90%",
      toggleActions: "play none none reverse",
    },
  });
  tl.set(entrance.value, { opacity: 0, y: 24 });
  tl.from(
    ".catalog-title",
    {
      opacity: 0,
      y: 32,
      duration: 0.6,
      ease: "power4.out",
    },
    0
  )
    .from(
      ".catalog-toolbar",
      {
        opacity: 0,
        y: 12,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.06,
      },
      "<0.1"
    )
    .from(
      ".product-grid",
      {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: "back.out(1.4)",
        stagger: 0.05,
      },
      "<0.2"
    );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          fullBleed.value = true;
          observer.disconnect();
        }
      });
    },
    { threshold: 0.25 }
  );
  observer.observe(entrance.value);
});
</script>
<template>
  <main class="page catalog-page" :class="{ 'is-entering': entrance, 'full-bleed': fullBleed }">
    <ProductShowcase v-if="props.mode === 'new' && s.newProducts[0]" :product="s.newProducts[0]" />
    <div class="page" ref="entrance">
      <div class="page-title catalog-title">
        <div>
          <span class="kicker">{{ view.kicker }}</span>
          <h1>{{ view.title }}</h1>
          <p class="lead">{{ view.lead(base.length) }}</p>
        </div>
        <div class="catalog-stat">
          <b>{{ base.length }}</b> sản phẩm
        </div>
      </div>

      <section class="catalog-toolbar">
        <div class="filter-group flex items-center gap-2">
          <SlidersHorizontal class="size-4 shrink-0" />
          <span class="label">BỘ LỌC</span>
        </div>
        <div class="category-chips flex flex-wrap gap-2">
          <button :class="{ active: category === 'all' }" @click="category = 'all'">Tất cả</button>
          <button
            v-for="c in s.categories"
            :key="c.slug"
            :class="{ active: category === c.slug }"
            @click="category = c.slug"
          >
            {{ c.icon }} {{ c.name }}
          </button>
        </div>
        <div class="filter-actions flex items-center gap-4">
          <label class="stock-checkbox flex items-center gap-2 cursor-pointer">
            <input v-model="stockOnly" type="checkbox" class="checkbox" />
            <span>Còn hàng {{ floor.floor }}F</span>
          </label>
          <select v-model="sort" class="sort-select">
            <option value="default">Mặc định</option>
            <option value="best">Bán chạy</option>
            <option value="rating">Đánh giá cao</option>
            <option value="price-asc">Giá thấp → cao</option>
            <option value="price-desc">Giá cao → thấp</option>
          </select>
        </div>
      </section>

      <ProductGrid :products="list" />
      <Pagination :page="page" :pages="pages" @change="page = $event" />
    </div>
  </main>
</template>

<style scoped>
/* Page title — matches .page-title / .kicker from style.css, extended for catalog */
.catalog-title {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 42px;
}
.catalog-title > div {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.catalog-title .lead {
  margin: 0;
  font-size: var(--fs-lead);
  line-height: var(--lh-body);
  max-width: 65ch;
  color: #5d554d;
  text-wrap: pretty;
}
.catalog-title h1 {
  font-size: clamp(42px, 6vw, 76px);
  line-height: var(--lh-display);
  margin: 12px 0;
  letter-spacing: var(--tracking-display);
  font-family: var(--font-display);
  font-weight: 800;
  text-wrap: balance;
}

/* Stat pill — mirrors .category-strip button / .choice button aesthetic */
.catalog-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 2px solid var(--ink);
  border-radius: 999px;
  background: #fff;
  font-weight: 800;
  font-size: var(--fs-lg);
  color: var(--ink);
  box-shadow: 4px 4px 0 var(--ink);
}
.catalog-stat b {
  font-variant-numeric: tabular-nums;
}

/* Filter toolbar — consistent with .section-head / .choice patterns */
.catalog-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 0;
  border-bottom: 2px solid var(--ink);
  margin-bottom: 32px;
}
.catalog-toolbar .filter-group .label {
  font-size: var(--fs-kicker);
  font-weight: 800;
  letter-spacing: var(--tracking-kicker);
  text-transform: uppercase;
  color: var(--ink);
}
.catalog-toolbar .filter-group .size-4 {
  width: 18px;
  height: 18px;
  color: var(--ink);
}

/* Category chips — mirrors .category-strip button */
.catalog-toolbar .category-chips button {
  padding: 10px 20px;
  border: 2px solid var(--ink);
  border-radius: 999px;
  background: #fff;
  font-weight: 700;
  font-size: var(--fs-sm);
  color: var(--ink);
  cursor: pointer;
  transition: all 0.2s;
}
.catalog-toolbar .category-chips button:hover {
  background: #ffd338;
}
.catalog-toolbar .category-chips button.active {
  background: var(--ink);
  color: #fff;
  box-shadow: 4px 4px 0 var(--ink);
}

/* Stock checkbox — mirrors .choice button border/radius */
.catalog-toolbar .stock-checkbox {
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--ink);
}
.catalog-toolbar .stock-checkbox .checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--ink);
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  accent-color: var(--ink);
}

/* Sort select — mirrors .search-page-input border/radius */
.catalog-toolbar .sort-select {
  width: 220px;
  padding: 12px 16px;
  border: 2px solid var(--ink);
  border-radius: 14px;
  background: #fff;
  font-size: var(--fs-sm);
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%231a1a1a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
}
.catalog-toolbar .sort-select::-ms-expand {
  display: none;
}

/* Full-bleed variant — matches catalog-page.full-bleed intent from original */
.catalog-page.full-bleed .catalog-title {
  margin-left: calc(var(--edge) * -1);
  margin-right: calc(var(--edge) * -1);
  padding-left: var(--edge);
  padding-right: var(--edge);
  background: var(--cream);
}
.catalog-page.full-bleed .catalog-title h1 {
  color: var(--ink);
}
.catalog-page.full-bleed .catalog-toolbar {
  background: var(--cream);
  border-bottom-color: var(--ink);
}
</style>

