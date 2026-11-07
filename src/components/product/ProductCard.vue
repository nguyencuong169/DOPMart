<script setup>
import { computed } from "vue";
import { AlertTriangle, Flame, Heart, PackageCheck, PackageX, Plus } from "lucide-vue-next";
import { useCartStore } from "../../stores/cartStore";
import { useFavoriteStore } from "../../stores/favoriteStore";
import { useProductStore } from "../../stores/productStore";
import { useFloorStore } from "../../stores/floorStore";
const props = defineProps({ product: Object, rank: { type: Number, default: null } });
const cart = useCartStore(),
  fav = useFavoriteStore(),
  products = useProductStore(),
  floor = useFloorStore();

/* stock is per floor and drives three distinct states — text + icon, never colour alone */
const stock = computed(() => props.product?.stock?.[floor.floor] ?? 0);
const soldOut = computed(() => stock.value <= 0);
const lowStock = computed(() => stock.value > 0 && stock.value <= 3);
const stockLabel = computed(() => {
  const at = `Tầng ${floor.floor}`;
  if (soldOut.value) return `Hết hàng · ${at}`;
  if (lowStock.value) return `Chỉ còn ${stock.value} · ${at}`;
  return `Còn ${stock.value} · ${at}`;
});
function add() {
  if (soldOut.value) return;
  cart.add(props.product);
}
</script>
<template>
  <article class="product-card polished-card" :class="{ 'is-sold-out': soldOut }">
    <div class="card-media">
      <button
        class="card-quick"
        :aria-label="`Xem nhanh ${product.name}`"
        @click="products.openQuick(product)"
      >
        <img :src="product.image" :alt="product.name" loading="lazy" decoding="async" />
      </button>
      <div class="card-top-left">
        <span v-if="rank" class="compact-rank">#{{ rank }}</span
        ><span v-if="product.isNew" class="badge new">NEW</span
        ><span v-if="product.hot" class="badge hot"><Flame :size="12" /> HOT</span>
      </div>
      <button
        class="heart card-heart"
        :class="{ liked: fav.has(product.id) }"
        :aria-label="fav.has(product.id) ? `Bỏ lưu ${product.name}` : `Lưu ${product.name}`"
        :aria-pressed="fav.has(product.id)"
        @click="fav.toggle(product.id)"
      >
        <Heart :size="19" />
      </button>
    </div>
    <div class="product-info card-body">
      <div class="card-category">{{ product.categoryName }}</div>
      <button class="product-title-button" @click="products.openQuick(product)">
        <h3>{{ product.name }}</h3>
      </button>
      <div class="card-meta">
        <span>★ {{ product.rating }}</span
        ><span>{{ product.sold }} đã bán</span>
      </div>
      <div class="card-stock" :class="{ low: lowStock, out: soldOut }">
        <PackageX v-if="soldOut" :size="14" />
        <AlertTriangle v-else-if="lowStock" :size="14" />
        <PackageCheck v-else :size="14" />
        <span>{{ stockLabel }}</span>
      </div>
      <div class="price-row">
        <strong>{{ product.price.toLocaleString("vi-VN") }} ₫</strong
        ><button
          class="add"
          :disabled="soldOut"
          :aria-label="soldOut ? `${product.name} đã hết hàng` : `Thêm ${product.name} vào giỏ`"
          @click="add"
        >
          <Plus :size="20" />
        </button>
      </div>
    </div>
  </article>
</template>
