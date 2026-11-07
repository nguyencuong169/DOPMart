<script setup>
import { ref, watch } from "vue";
import { X, ShoppingBag, MapPin, ArrowUpRight } from "lucide-vue-next";
import { useProductStore } from "../../stores/productStore";
import { useCartStore } from "../../stores/cartStore";
import { useFloorStore } from "../../stores/floorStore";
import QuantitySelector from "./QuantitySelector.vue";
const products = useProductStore(),
  cart = useCartStore(),
  floor = useFloorStore(),
  qty = ref(1);
watch(
  () => products.quickProduct,
  () => (qty.value = 1)
);
function add() {
  cart.add(products.quickProduct, qty.value);
  products.closeQuick();
}
</script>
<template>
  <Teleport to="body"
    ><Transition name="quick"
      ><div
        v-if="products.quickProduct"
        class="quick-backdrop"
        @click.self="products.closeQuick()"
      >
        <article
          class="quick-dialog"
          :style="{ '--product-color': products.quickProduct.color }"
        >
          <button class="quick-close" aria-label="Đóng xem nhanh" @click="products.closeQuick()"><X /></button>
          <section class="quick-visual">
            <div class="quick-brand">DOP<br />MART</div>
            <div class="quick-orbit"></div>
            <img
              :src="products.quickProduct.image"
              :alt="products.quickProduct.name"
            /><span class="quick-index"
              >DOP SELECT · {{ products.quickProduct.categoryName }}</span
            >
          </section>
          <section class="quick-info">
            <span class="kicker">{{ products.quickProduct.categoryName }}</span>
            <h2>{{ products.quickProduct.name }}</h2>
            <div class="quick-rating">
              ★★★★★
              <span
                >{{ products.quickProduct.rating }} · Đã bán
                {{ products.quickProduct.sold }}</span
              >
            </div>
            <p>{{ products.quickProduct.description }}</p>
            <div class="quick-stock">
              <span
                ><MapPin /> Tầng 14
                <b>{{ products.quickProduct.stock[14] }} sản phẩm</b></span
              ><span
                ><MapPin /> Tầng 20
                <b>{{ products.quickProduct.stock[20] }} sản phẩm</b></span
              >
            </div>
            <div class="quick-price">
              {{ products.quickProduct.price.toLocaleString("vi-VN") }} ₫
            </div>
            <div class="quick-buy">
              <QuantitySelector v-model="qty" /><button class="checkout" @click="add">
                Thêm vào giỏ <ShoppingBag />
              </button>
            </div>
            <RouterLink
              :to="`/product/${products.quickProduct.slug}`"
              class="full-detail"
              @click="products.closeQuick()"
              >Xem đầy đủ thông tin <ArrowUpRight /></RouterLink
            ><small>Điểm nhận hiện tại: tầng {{ floor.floor }}</small>
          </section>
        </article>
      </div></Transition
    ></Teleport
  >
</template>
