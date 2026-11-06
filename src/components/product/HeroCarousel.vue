<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import gsap from "gsap";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-vue-next";
import { useProductStore } from "../../stores/productStore";
const store = useProductStore();
const slides = computed(() => store.products.slice(0, 4));
const current = ref(0),
  playing = ref(true);
let timer;
function restart() {
  clearInterval(timer);
  if (playing.value)
    timer = setInterval(
      () => (current.value = (current.value + 1) % slides.value.length),
      5200
    );
}
function go(i) {
  current.value = (i + slides.value.length) % slides.value.length;
  restart();
}
function toggle() {
  playing.value = !playing.value;
  restart();
}
function parallax(e) {
  const r = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  gsap.to(".hero-product-main", {
    x: x * 24,
    y: y * 18 - 6,
    rotation: y * 3,
    duration: 0.7,
    ease: "power2.out",
  });
  gsap.to(".brand-wordmark", {
    x: x * -24,
    y: y * -12,
    duration: 0.9,
    ease: "power2.out",
  });
  gsap.to(".brand-tagline", { x: x * -12, y: y * -6, duration: 1, ease: "power2.out" });
}
function resetParallax() {
  gsap.to(".hero-product-main,.brand-wordmark,.brand-tagline", {
    x: 0,
    y: 0,
    rotation: 0,
    duration: 0.9,
    ease: "power3.out",
  });
}
watch(current, () =>
  nextTick(() => {
    gsap.fromTo(
      ".brand-wordmark",
      { y: 55, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.75, ease: "power3.out" }
    );
    gsap.fromTo(
      ".brand-tagline",
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.65, delay: 0.12 }
    );
    gsap.fromTo(
      ".hero-product-main",
      { y: 45, rotation: -7, scale: 0.88, opacity: 0 },
      { y: 0, rotation: 0, scale: 1, opacity: 1, duration: 0.9, ease: "back.out(1.35)" }
    );
  })
);
onMounted(restart);
onBeforeUnmount(() => clearInterval(timer));
</script>
<template>
  <section
    class="brand-hero"
    @mousemove="parallax"
    @mouseleave="resetParallax"
    :style="{ '--accent': slides[current].color }"
  >
    <div class="hero-brand-layer" aria-hidden="true">
      <div class="brand-wordmark"><span>DOP</span><span>MART</span></div>
      <div class="brand-tagline"><b>MINI MART</b><i>BIG HAPPY</i></div>
    </div>
    <div class="hero-side-copy">
      <span>SNACK STATION · 14F / 20F</span>
      <p>Món ngon ngay trong văn phòng.</p>
      <RouterLink to="/products" class="hero-shop"
        >Chọn món ngay <ArrowRight
      /></RouterLink>
    </div>
    <div class="hero-product-zone">
      <div class="hero-halo"></div>
      <div class="snack-float sf1">✦</div>
      <div class="snack-float sf2">●</div>
      <div class="snack-float sf3">✦</div>
      <div class="snack-float sf4">●</div>
      <Transition name="product-pop" mode="out-in"
        ><img
          :key="slides[current].id"
          class="hero-product-main"
          :src="slides[current].image"
          :alt="slides[current].name"
      /></Transition>
      <div class="hero-product-meta">
        <small>0{{ current + 1 }} / 0{{ slides.length }}</small
        ><b>{{ slides[current].name }}</b
        ><span>{{ slides[current].price.toLocaleString("vi-VN") }} ₫</span>
      </div>
    </div>

    <div class="hero-controls">
      <button @click="go(current - 1)"><ChevronLeft /></button>
      <div class="hero-dots">
        <button
          v-for="(p, i) in slides"
          :key="p.id"
          :class="{ active: i === current }"
          @click="go(i)"
        >
          <span></span>
        </button>
      </div>
      <button @click="go(current + 1)"><ChevronRight /></button
      ><button class="play" @click="toggle">
        <Pause v-if="playing" /><Play v-else />
      </button>
    </div>
  </section>
</template>
