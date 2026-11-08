<script setup>
import { useCartStore } from "../../stores/cartStore";
import { useFavoriteStore } from "../../stores/favoriteStore";
import { useFloorStore } from "../../stores/floorStore";
import { useProductStore } from "../../stores/productStore";
import CatalogCard from "./CatalogCard.vue";
import CatalogCardSkeleton from "./CatalogCardSkeleton.vue";

/* One grid for every catalogue surface (home fresh drop, products, category, search).
   It renders the standard card, and it can hold the card's exact footprint while the
   data is on its way, so a pending shelf is grey tiles instead of a cream hole. */
defineProps({
  products: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  skeletonCount: { type: Number, default: 8 },
});

const store = useProductStore();
const cart = useCartStore();
const favorites = useFavoriteStore();
const floor = useFloorStore();

/* stock is per floor: a product without stock data still gets a card, just no row */
const stockOf = (p) => p?.stock?.[floor.floor] ?? null;
const add = (p) => {
  const stock = stockOf(p);
  if (stock !== null && stock <= 0) return;
  cart.add(p);
};
</script>
<template>
  <div v-if="loading" class="product-grid" role="status" aria-live="polite">
    <span class="sr-only">Đang tải sản phẩm…</span>
    <CatalogCardSkeleton v-for="n in skeletonCount" :key="n" />
  </div>
  <div v-else-if="products.length" class="product-grid">
    <CatalogCard
      v-for="(p, i) in products"
      :key="p.id ?? p.slug"
      :product="p"
      :index="i"
      variant="grid"
      :favorited="favorites.has(p.id)"
      :stock="stockOf(p)"
      :floor="floor.floor"
      @add="add(p)"
      @quick="store.openQuick(p)"
      @toggle-favorite="favorites.toggle(p.id)"
    />
  </div>
  <p v-else class="empty">Chưa tìm thấy món phù hợp.</p>
</template>

