<script setup>
import { computed, onMounted, ref } from "vue";
import { ArrowRight, Flame, ShoppingBag } from "lucide-vue-next";
import { useProductStore } from "../../stores/productStore";
import { useCartStore } from "../../stores/cartStore";
import { useFloorStore } from "../../stores/floorStore";

const store = useProductStore();
const cart = useCartStore();
const floor = useFloorStore();

const ranked = computed(() => store.weeklyRankingList);
const topSix = computed(() => ranked.value.slice(0, 6));

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");

const onColor = (hex) => {
  const n = parseInt(String(hex || "#000000").replace("#", ""), 16);
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.62 ? "#0f172a" : "#ffffff";
};

function addToCart(product) {
  cart.add(product, 1);
}

onMounted(async () => {
  store.init();
  cart.init();
  floor.init();
  await store.fetchWeeklyRanking(6);
});
</script>

<template>
  <main class="wr-page">
    <!-- Header (left) -->
    <header class="wr-header">
      <div class="wr-header__ghost" aria-hidden="true">
        <h1 class="wr-ghost-title">DOP MART</h1>
      </div>
      <div class="wr-header__content">
        <div class="wr-header__rule">
          <div class="wr-header__line"></div>
          <span class="wr-header__kicker">DOP MART EXCLUSIVE</span>
          <div class="wr-header__line"></div>
        </div>
        <span class="wr-header__badge">Món ngon mỗi ngày</span>
        <h2 class="wr-header__title">
          TOP <span class="wr-header__glow">SNACK</span> BÁN CHẠY
        </h2>
        <p class="wr-header__lead">
          Khám phá những hương vị độc bản tại DOP Mart. Mỗi sản phẩm là một hành trình cảm xúc từ nguyên liệu tự nhiên nhất.
        </p>
      </div>
    </header>

    <!-- Leaderboard (right, full height) -->
    <section aria-label="Danh sách sản phẩm bán chạy" class="wr-shelf">
      <div class="wr-track carousel-scrollbar">
        <article
          v-for="(product, i) in topSix"
          :key="product.id"
          class="wr-card skew-card group stagger-in"
          :style="{
            '--card-color': product.tint || product.color,
            '--card-text': onColor(product.tint || product.color),
            animationDelay: `${(i + 1) * 0.1}s`,
          }"
        >
          <div class="wr-card__divider" aria-hidden="true"></div>
          <div class="wr-card__pattern" aria-hidden="true"></div>
          <div v-if="product.hot" class="wr-card__badge">
            <span class="wr-card__badge-inner">
              <Flame class="wr-card__flame" /> BEST SELLER
            </span>
          </div>
          <h3 class="wr-card__name font-display">{{ product.name }}</h3>
          <div class="wr-card__price-block">
            <span class="wr-card__price font-display">{{ fmt(product.price) }} ₫</span>
            <button
              type="button"
              class="wr-card__cta"
              :aria-label="`Mua ${product.name} giá ${fmt(product.price)} đồng`"
              @click="addToCart(product)"
            >
              MUA NGAY
            </button>
          </div>
          <div class="wr-card__media shine-effect">
            <img
              :src="product.image"
              :alt="product.name"
              loading="lazy"
              decoding="async"
              class="wr-card__img floating"
              :style="{ animationDelay: `${(i + 1) * 0.5}s` }"
            />
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped src="./WeeklyRanking.css"></style>
