<script setup>
import { computed, ref, watch } from "vue";
import { ChevronLeft, ChevronRight, Heart, ShoppingBag, Plus } from "lucide-vue-next";
import { useFavoriteStore } from "../../stores/favoriteStore";
import { useProductStore } from "../../stores/productStore";
import { useCartStore } from "../../stores/cartStore";
const fav = useFavoriteStore(),
  products = useProductStore(),
  cart = useCartStore(),
  index = ref(0);
const items = computed(() =>
  fav.ids.map((id) => products.products.find((p) => p.id === id)).filter(Boolean)
);
const current = computed(() => items.value[index.value] || null);
const next = computed(() =>
  items.value.length > 1 ? items.value[(index.value + 1) % items.value.length] : null
);
watch(
  () => items.value.length,
  (n) => {
    if (!n) index.value = 0;
    else if (index.value >= n) index.value = n - 1;
  }
);
function move(d) {
  if (items.value.length)
    index.value = (index.value + d + items.value.length) % items.value.length;
}
</script>
<template>
  <section class="favorite-focus">
    <div class="favorite-head">
      <div>
        <span class="kicker">SAVED FOR LATER · LOCAL FAVORITES</span>
        <h2>Góc yêu thích của bạn</h2>
        <p>
          Sản phẩm được lưu trên trình duyệt này, không phụ thuộc vào bảng xếp hạng bán
          chạy.
        </p>
      </div>
      <div v-if="items.length" class="favorite-count"><Heart /> {{ items.length }}</div>
    </div>
    <div v-if="current" class="favorite-stage">
      <article class="favorite-main" :style="{ '--favorite-color': current.color }">
        <div class="favorite-image">
          <div class="favorite-giant">LOVE IT</div>
          <img :src="current.image" :alt="current.name" loading="lazy" decoding="async" />
        </div>
        <div class="favorite-copy">
          <span>{{ current.categoryName }}</span>
          <h3>{{ current.name }}</h3>
          <div class="quick-rating">
            ★★★★★ <small>{{ current.rating }} · Đã bán {{ current.sold }}</small>
          </div>
          <p>{{ current.description }}</p>
          <b>{{ current.price.toLocaleString("vi-VN") }} ₫</b>
          <div>
            <button class="checkout" @click="cart.add(current)">
              Thêm vào giỏ <ShoppingBag /></button
            ><button class="favorite-remove" @click="fav.toggle(current.id)">
              <Heart /> Bỏ lưu
            </button>
          </div>
        </div>
      </article>
      <button v-if="next" class="favorite-peek" @click="move(1)">
        <small>TIẾP THEO</small
        ><img :src="next.image" :alt="next.name" loading="lazy" decoding="async" /><b>{{
          next.name
        }}</b
        ><span>{{ next.price.toLocaleString("vi-VN") }} ₫</span>
      </button>
      <div v-if="items.length > 1" class="favorite-controls">
        <button type="button" aria-label="Món yêu thích trước" @click="move(-1)">
          <ChevronLeft /></button
        ><span
          >{{ String(index + 1).padStart(2, "0") }} /
          {{ String(items.length).padStart(2, "0") }}</span
        ><button type="button" aria-label="Món yêu thích tiếp theo" @click="move(1)">
          <ChevronRight />
        </button>
      </div>
    </div>
    <div v-else class="favorite-empty">
      <div><Heart /><Plus /></div>
      <h3>Chưa có món yêu thích</h3>
      <p>
        Nhấn biểu tượng trái tim trên Product Card. DOP Mart sẽ lưu lựa chọn ngay trên
        trình duyệt này.
      </p>
      <RouterLink to="/products" class="primary">Khám phá sản phẩm</RouterLink>
    </div>
  </section>
</template>
