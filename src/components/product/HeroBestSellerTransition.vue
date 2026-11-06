<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger.js";
import { ArrowDown } from "lucide-vue-next";
import { useProductStore } from "../../stores/productStore";
gsap.registerPlugin(ScrollTrigger);
const store = useProductStore();
const root = ref(null);
let ctx;
onMounted(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;
  ctx = gsap.context(() => {
    gsap
      .timeline({
        scrollTrigger: {
          trigger: root.value,
          start: "top bottom",
          end: "top 15%",
          scrub: 1.05,
        },
      })
      .fromTo(
        ".transition-chip",
        { y: -150, scale: 1.55, rotation: -9, opacity: 0 },
        { y: 15, scale: 0.58, rotation: 4, opacity: 1, ease: "none" },
        0
      )
      .fromTo(
        ".transition-brand",
        { y: -70, scale: 1.2, opacity: 0.18 },
        { y: 0, scale: 1, opacity: 1, ease: "none" },
        0
      )
      .fromTo(
        ".transition-copy",
        { y: 90, opacity: 0 },
        { y: 0, opacity: 1, ease: "none" },
        0.2
      )
      .fromTo(
        ".transition-ring",
        { scale: 0.55, opacity: 0 },
        { scale: 1.1, opacity: 1, ease: "none" },
        0
      );
    gsap
      .timeline({
        scrollTrigger: {
          trigger: root.value,
          start: "top 60%",
          end: "bottom 45%",
          scrub: 0.8,
        },
      })
      .to(".transition-chip", {
        x: "-31vw",
        y: "44vh",
        scale: 0.22,
        rotation: -13,
        ease: "none",
      })
      .to(".transition-brand", { y: 70, opacity: 0.06, ease: "none" }, 0);
  }, root.value);
});
onBeforeUnmount(() => ctx?.revert());
</script>
<template>
  <section
    ref="root"
    class="hero-to-best"
    aria-label="Chuyển từ thương hiệu sang sản phẩm bán chạy"
  >
    <div class="transition-brand">DOP<br />MART</div>
    <div class="transition-ring"></div>
    <img
      class="transition-chip"
      :src="store.bestSellers[0].image"
      :alt="store.bestSellers[0].name"
    />
    <div class="transition-copy">
      <span>FROM HAPPY HERO</span><ArrowDown /><b>TO OFFICE FAVORITES</b>
    </div>
    <div class="transition-floor">14F <i>•</i> 20F</div>
  </section>
</template>
