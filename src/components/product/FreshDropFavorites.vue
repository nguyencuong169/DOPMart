<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import { ChevronLeft, ChevronRight, Heart, ShoppingBag, Sparkles } from "lucide-vue-next";
import { useProductStore } from "../../stores/productStore";
import { useFavoriteStore } from "../../stores/favoriteStore";
import { useCartStore } from "../../stores/cartStore";
const products = useProductStore(),
  fav = useFavoriteStore(),
  cart = useCartStore(),
  index = ref(0);
const items = computed(() => {
  const saved = fav.ids
    .map((id) => products.products.find((p) => p.id === id))
    .filter(Boolean);
  return saved.length ? saved : products.newProducts.slice(0, 5);
});
const current = computed(() => items.value[index.value] || products.newProducts[0]);
const next = computed(() => items.value[(index.value + 1) % items.value.length]);
let timer;
function move(d = 1) {
  index.value = (index.value + d + items.value.length) % items.value.length;
  restart();
}
function restart() {
  clearInterval(timer);
  timer = setInterval(() => move(1), 5200);
}
watch(
  () => items.value.length,
  () => (index.value = 0)
);
onMounted(restart);
onBeforeUnmount(() => clearInterval(timer));
</script>
<template>
  <section class="fresh-fullbleed" :style="{ '--fresh-color': current.color }">
    <div class="fresh-giant">FRESH<br />DROP</div>
    <div class="fresh-copy">
      <span><Sparkles /> FRESH DROP · YOUR FAVORITES</span>
      <h2>{{ current.name }}</h2>
      <div class="fresh-rating">
        ★★★★★ <small>{{ current.rating }} · {{ current.sold }} đã bán</small>
      </div>
      <p>{{ current.description }}</p>
      <b>{{ current.price.toLocaleString("vi-VN") }} ₫</b>
      <div class="fresh-actions">
        <button class="fresh-buy" @click="cart.add(current)">
          Thêm vào giỏ <ShoppingBag /></button
        ><button
          class="fresh-heart"
          :class="{ liked: fav.has(current.id) }"
          @click="fav.toggle(current.id)"
        >
          <Heart />
        </button>
      </div>
    </div>
    <div class="fresh-stage">
      <Transition name="fresh-swap" mode="out-in"
        ><img
          :key="current.id"
          class="fresh-main-product"
          :src="current.image"
          :alt="current.name" /></Transition
      ><button v-if="items.length > 1" class="fresh-next-card" @click="move(1)">
        <small>UP NEXT</small><img :src="next.image" :alt="next.name" /><span>{{
          next.name
        }}</span
        ><b>{{ next.price.toLocaleString("vi-VN") }} ₫</b>
      </button>
    </div>
    <div class="fresh-controls">
      <button @click="move(-1)"><ChevronLeft /></button
      ><span
        >{{ String(index + 1).padStart(2, "0") }} /
        {{ String(items.length).padStart(2, "0") }}</span
      ><button @click="move(1)"><ChevronRight /></button>
    </div>
  </section>
</template>
