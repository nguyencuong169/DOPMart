<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger.js";
import { ArrowRight, Clock3, Tag } from "lucide-vue-next";
import { useProductStore } from "../../stores/productStore";
import { useCartStore } from "../../stores/cartStore";
gsap.registerPlugin(ScrollTrigger);
const products = useProductStore(),
  cart = useCartStore(),
  root = ref();
const offers = computed(() => products.offers.slice(0, 3));
let animation;
onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  animation = gsap.context(() => {
    gsap
      .timeline({
        scrollTrigger: {
          trigger: root.value,
          start: "top 78%",
          end: "center 48%",
          scrub: 0.8,
        },
      })
      .from(".promo-copy > *", { x: -100, opacity: 0, stagger: 0.12 })
      .from(".promo-card", { y: 100, rotation: 6, opacity: 0, stagger: 0.12 }, 0);
  }, root.value);
});
onBeforeUnmount(() => animation?.revert());
</script>
<template>
  <section ref="root" class="promo-showcase">
    <div class="promo-copy">
      <span class="promo-kicker"><Tag /> HAPPY DEALS</span>
      <h2>Giá nhỏ hơn.<br /><em>Niềm vui lớn hơn.</em></h2>
      <p>
        Ưu đãi giới hạn cho giờ nghỉ văn phòng. Số lượng khuyến mãi được áp dụng theo tồn
        kho tại tầng nhận hàng.
      </p>
      <div class="promo-time"><Clock3 /> Ưu đãi trong tuần này</div>
      <RouterLink to="/deals" class="primary">Săn deal ngay <ArrowRight /></RouterLink>
    </div>
    <div class="promo-list">
      <article
        v-for="offer in offers"
        :key="offer.id"
        class="promo-card"
        :style="{ '--promo-color': offer.color }"
      >
        <div class="promo-discount">-{{ offer.discount }}%</div>
        <img :src="offer.image" :alt="offer.name" loading="lazy" decoding="async" />
        <div>
          <small>{{ offer.categoryName }}</small>
          <h3>{{ offer.name }}</h3>
          <span
            ><s>{{ offer.oldPrice.toLocaleString("vi-VN") }} ₫</s
            ><b>{{ offer.price.toLocaleString("vi-VN") }} ₫</b></span
          ><button @click="cart.add(offer)" :aria-label="`Thêm ${offer.name} vào giỏ`">
            Thêm nhanh <ArrowRight /></button
          >
        </div>
      </article>
    </div>
  </section>
</template>
