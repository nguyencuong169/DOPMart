<script setup>
import { computed } from "vue";
import { X, MapPin, ArrowUpRight } from "lucide-vue-next";
import { useProductStore } from "../../stores/productStore";
import { useFloorStore } from "../../stores/floorStore";
import QuickAdd from "./QuickAdd.vue";
import { headWords } from "../../data/products";
const products = useProductStore(),
  floor = useFloorStore();
/* the poster lines behind the pack read as a shelf slogan, never the name */
const lines = computed(() => {
  const p = products.quickProduct;
  return headWords[p?.category] ?? [(p?.categoryName ?? "").toUpperCase(), ""];
});
/* same luminance rule as the shelf cards: the tag keeps AA on any colour */
const onColor = (hex) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const l =
    (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.62 ? "#191919" : "#ffffff";
};
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
            <div class="quick-head" aria-hidden="true">
              <span class="quick-head__line">{{ lines[0] }}</span>
              <span class="quick-head__line quick-head__line--hollow">{{
                lines[1]
              }}</span>
            </div>
            <img
              :src="products.quickProduct.image"
              :alt="products.quickProduct.name"
            />
            <span
              class="quick-tag"
              aria-hidden="true"
              :style="{
                background: products.quickProduct.color,
                color: onColor(products.quickProduct.color),
              }"
              ><b
                >{{
                  products.quickProduct.price.toLocaleString("vi-VN")
                }}
                ₫</b
              ></span
            >
            <span class="quick-index"
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
              <QuickAdd
                :product="products.quickProduct"
                :stock="products.quickProduct.stock[floor.floor]"
                size="md"
                @added="products.closeQuick()"
              />
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
