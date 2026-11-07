<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger.js";
import { ArrowRight } from "lucide-vue-next";
import { useProductStore } from "../../stores/productStore";
gsap.registerPlugin(ScrollTrigger);
defineProps({ product: Object });
const store = useProductStore();
const root = ref();
let ctx;
onMounted(() => {
  if (!root.value) return;
  ctx = gsap.context(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: root.value,
        start: "top 75%",
        end: "bottom 35%",
        scrub: 0.9,
      },
    });
    tl.fromTo(
      ".story-word",
      { y: 120, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.08 },
      0
    )
      .fromTo(
        ".story-product",
        { y: 160, rotation: -12, scale: 0.72 },
        { y: -15, rotation: 3, scale: 1.08 },
        0
      )
      .fromTo(
        ".story-pill",
        { x: 80, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.12 },
        0.15
      )
      .fromTo(".story-bg-text", { x: -160, opacity: 0 }, { x: 0, opacity: 0.12 }, 0);
  }, root.value);
});
onBeforeUnmount(() => ctx?.revert());
</script>
<template>
  <section v-if="product" ref="root" class="story-showcase">
    <div class="story-bg-text">FRESH DROP</div>
    <div class="story-copy">
      <span class="kicker">SCROLL TO DISCOVER · JUST DROPPED</span>
      <h2>
        <span class="story-word">Snack</span><span class="story-word accent">nhẹ,</span
        ><span class="story-word">mood lớn.</span>
      </h2>
      <p>{{ product.description }}</p>
      <button class="primary" @click="store.openQuick(product)">
        Khám phá sản phẩm <ArrowRight />
      </button>
    </div>
    <div class="story-scene">
      <div class="story-sun"></div>
      <img
        class="story-product"
        :src="product.image"
        :alt="product.name"
        loading="lazy"
        decoding="async"
      /><span
        class="story-pill p1"
        >HIGH FIBER</span
      ><span class="story-pill p2">LOW FAT</span><span class="story-pill p3">NO MSG</span>
    </div>
  </section>
</template>
