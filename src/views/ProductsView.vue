<script setup>
import { computed, ref, watch } from "vue";
import { SlidersHorizontal } from "lucide-vue-next";
import { useProductStore } from "../stores/productStore";
import { useFloorStore } from "../stores/floorStore";
import { applyCatalogFilters, paginate } from "../data/catalog";
import ProductGrid from "../components/product/ProductGrid.vue";
import ProductShowcase from "../components/product/ProductShowcase.vue";
import Pagination from "../components/common/Pagination.vue";

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
    title: "Bán chạy nhất",
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
</script>
<template>
  <main class="catalog-page">
    <ProductShowcase v-if="mode === 'new' && s.newProducts[0]" :product="s.newProducts[0]" />
    <div class="page">
      <div class="page-title catalog-title">
        <div>
          <span class="kicker">{{ view.kicker }}</span>
          <h1>{{ view.title }}</h1>
          <p>{{ view.lead(filtered.length) }}</p>
        </div>
        <div class="catalog-stat">
          <b>{{ base.length }}</b><span>sản phẩm</span>
        </div>
      </div>
      <section class="catalog-toolbar">
        <div class="filter-label"><SlidersHorizontal /> BỘ LỌC</div>
        <div class="category-chips">
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
        <div class="catalog-actions">
          <label><input v-model="stockOnly" type="checkbox" /> Còn hàng {{ floor.floor }}F</label>
          <select v-model="sort">
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

