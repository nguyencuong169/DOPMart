<script setup>
import { Heart, Plus, Flame } from "lucide-vue-next";
import { useCartStore } from "../../stores/cartStore";
import { useFavoriteStore } from "../../stores/favoriteStore";
import { useProductStore } from "../../stores/productStore";
import { useFloorStore } from "../../stores/floorStore";
defineProps({ product: Object, rank: { type: Number, default: null } });
const cart = useCartStore(),
  fav = useFavoriteStore(),
  products = useProductStore(),
  floor = useFloorStore();
</script>
<template>
  <article class="product-card polished-card">
    <div class="card-media">
      <button class="card-quick" @click="products.openQuick(product)">
        <img :src="product.image" :alt="product.name" loading="lazy" />
      </button>
      <div class="card-top-left">
        <span v-if="rank" class="compact-rank">#{{ rank }}</span
        ><span v-if="product.isNew" class="badge new">NEW</span
        ><span v-if="product.hot" class="badge hot"><Flame :size="12" /> HOT</span>
      </div>
      <button
        class="heart card-heart"
        :class="{ liked: fav.has(product.id) }"
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
      <div class="card-stock" :class="{ low: product.stock[floor.floor] <= 3 }">
        <i></i
        >{{
          product.stock[floor.floor] > 0
            ? `Còn ${product.stock[floor.floor]} tại ${floor.floor}F`
            : `Hết hàng ${floor.floor}F`
        }}
      </div>
      <div class="price-row">
        <strong>{{ product.price.toLocaleString("vi-VN") }} ₫</strong
        ><button class="add" @click="cart.add(product)"><Plus :size="20" /></button>
      </div>
    </div>
  </article>
</template>
