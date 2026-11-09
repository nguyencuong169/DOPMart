<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import gsap from "gsap";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-vue-next";
import QuickAdd from "./QuickAdd.vue";
import { useProductStore } from "../../stores/productStore";
import { relativeLuminance, surfaceTone, tintOn } from "../../utils/color";

const store = useProductStore();
/* split the name into: filled head · outlined middle · accent last word */
const nameParts = computed(() => {
  const words = (slides.value[current.value]?.name || "").split(/\s+/).filter(Boolean);
  if (words.length < 2) return { head: words.join(" "), tail: "", last: "" };
  const last = words[words.length - 1];
  const rest = words.slice(0, -1);
  const half = Math.ceil(rest.length / 2);
  return { head: rest.slice(0, half).join(" "), tail: rest.slice(half).join(" "), last };
});

/* four packs on a ring: slot 0 = centre (focused), 1..3 = waiting points */
const ringSlots = computed(() =>
  slides.value.map((product, index) => ({
    product,
    index,
    slot: (index - current.value + slides.value.length) % slides.value.length,
  }))
);
const slides = computed(() => store.products.slice(0, 4));
/* the depth layer that travels with the product: crumbs, grains, bubbles, steam */
const fx = computed(() => {
  const cat = slides.value[current.value]?.category ?? "";
  if (cat === "noodles" || cat === "instant")
    return { kind: "noodles", steam: true, bits: 8 };
  if (cat === "drinks") return { kind: "drinks", steam: false, bits: 9 };
  if (cat === "healthy") return { kind: "grain", steam: false, bits: 10 };
  if (cat === "spicy") return { kind: "spicy", steam: false, bits: 9 };
  return { kind: "chips", steam: false, bits: 8 };
});
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const current = ref(0);
/* the plane the copy stands on is the current product's colour, so the tokens are
   derived from that exact value — the same one that paints the left diagonal */
const accent = computed(() => slides.value[current.value]?.color || "#ffd338");
/* the right diagonal previews what is coming next: the ring order is the queue */
const accentNext = computed(() => {
  const list = slides.value;
  if (!list.length) return accent.value;
  return list[(current.value + 1) % list.length].color;
});
/* three tones, but the deep/mid split is measured (cream vs ink, whichever wins):
   green and purple are "cream" planes, sun/orange/berry stay "ink" planes */
const tone = computed(() => {
  if (surfaceTone(accent.value) === "is-dark") return "tone-deep";
  return relativeLuminance(accent.value) >= 0.45 ? "tone-sun" : "tone-mid";
});
/* secondary copy and the accent word keep the product hue, but only as far as the
   contrast floor allows: 4.5:1 for 14px copy, 3:1 for the 84px name (WCAG large text) */
const softInk = computed(() => tintOn(accent.value, accent.value, 4.5));
const nameAccent = computed(() => tintOn(accent.value, accent.value, 3));
/* opening hours: the introduction block is on screen for every slide */
const clock = ref(new Date());
const isOpen = computed(() => {
  const h = clock.value.getHours() + clock.value.getMinutes() / 60;
  return h >= 8.5 && h < 17.5;
});
let clockTimer = null;

const playing = ref(!prefersReduced);
const paused = ref(false);
let timer = null;

function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
function runTimer() {
  clearTimer();
  if (!playing.value || paused.value || document.hidden) return;
  timer = setInterval(() => go(current.value + 1), 5600);
}
function go(i) {
  const total = slides.value.length;
  if (!total) return;
  current.value = (i + total) % total;
  runTimer();
}
/* a far pack must not teleport: clicking it walks the ring one slot per beat,
   so the motion is exactly the one the ‹ › buttons produce */
const spinning = ref(false);
let stepTimer = null;
let settleTimer = null;

function clearSteps() {
  if (stepTimer) clearTimeout(stepTimer);
  if (settleTimer) clearTimeout(settleTimer);
  stepTimer = null;
  settleTimer = null;
  spinning.value = false;
}
function goTo(target) {
  const total = slides.value.length;
  if (!total) return;
  clearSteps();
  const steps = (((target - current.value) % total) + total) % total;
  if (steps === 0) return;
  if (steps === 1) {
    go(current.value + 1);
    return;
  }
  spinning.value = true;
  let left = steps;
  const beat = () => {
    left -= 1;
    go(current.value + 1);
    if (left > 0) {
      stepTimer = setTimeout(beat, 400);
    } else {
      stepTimer = null;
      settleTimer = setTimeout(() => {
        spinning.value = false;
        settleTimer = null;
      }, 460);
    }
  };
  beat();
}
function onPackClick(s) {
  /* the focused pack acts like › */
  if (s.slot === 0) go(current.value + 1);
  else goTo(s.index);
}
function toggle() {
  playing.value = !playing.value;
  runTimer();
}
function pause() {
  paused.value = true;
  clearTimer();
}
function resume() {
  paused.value = false;
  runTimer();
}
function onVisibility() {
  if (document.hidden) clearTimer();
  else runTimer();
}
function onFocusOut(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) resume();
}
function preloadNext() {
  const next = slides.value[(current.value + 1) % slides.value.length];
  if (!next) return;
  const img = new Image();
  img.src = next.image;
}
let rafId = 0;
const pointer = { x: 0, y: 0 };

function applyParallax() {
  rafId = 0;
  const { x, y } = pointer;
  gsap.to(".hero-ring__item.slot-0 img", {
    x: x * 24,
    y: y * 18 - 6,
    rotation: y * 3,
    duration: 0.7,
    ease: "power2.out",
    overwrite: "auto",
  });
  /* garnish travels further than the pack = depth */
  gsap.to(".hero-fx", {
    x: x * 46,
    y: y * 34,
    duration: 0.8,
    ease: "power2.out",
    overwrite: "auto",
  });
  /* the type block drifts the other way = counter depth */
  gsap.to(".hero-side-top", {
    x: x * -20,
    y: y * -10,
    duration: 0.9,
    ease: "power2.out",
    overwrite: "auto",
  });
}
function parallax(event) {
  if (prefersReduced) return;
  const box = event.currentTarget.getBoundingClientRect();
  pointer.x = (event.clientX - box.left) / box.width - 0.5;
  pointer.y = (event.clientY - box.top) / box.height - 0.5;
  if (rafId) return;
  rafId = requestAnimationFrame(applyParallax);
}
function resetParallax() {
  if (prefersReduced) return;
  pointer.x = 0;
  pointer.y = 0;
  gsap.to(".hero-ring__item.slot-0 img,.hero-side-top,.hero-fx", {
    x: 0,
    y: 0,
    rotation: 0,
    duration: 0.9,
    ease: "power3.out",
    overwrite: "auto",
  });
}
/* the ring packs are positioned entirely by their .slot-N CSS transform —
   an inline transform left behind by GSAP would override it and freeze the ring */
function clearRingInline() {
  document.querySelectorAll(".hero-ring__item").forEach((el) => {
    el.style.transform = "";
    el.style.opacity = "";
  });
}
/* one orchestrated entrance instead of pieces popping in at random */
function playIntro() {
  if (prefersReduced) return;
  gsap
    .timeline({
      defaults: { ease: "power3.out", overwrite: "auto" },
      onComplete: clearRingInline,
    })
    .from(".hero-side-copy > *", { y: 40, opacity: 0, stagger: 0.1, duration: 0.7 })
    .from(
      ".hero-ring__item",
      { opacity: 0, duration: 0.7, stagger: 0.1, clearProps: "opacity" },
      "-=0.85"
    )
    .from(
      ".hero-ring__item img",
      {
        scale: 0.92,
        duration: 0.8,
        stagger: 0.1,
        ease: "back.out(1.4)",
        clearProps: "transform",
      },
      "<"
    )
    .from(".hero-controls", { y: 18, opacity: 0, duration: 0.45 }, "-=0.45");
}

watch(current, () =>
  nextTick(() => {
    preloadNext();
    /* the parallax offset must not stick to a pack that just changed slot */
    gsap.set(".hero-ring__item img", { x: 0, y: 0, rotation: 0 });
    if (prefersReduced) return;
    gsap.fromTo(
      ".hero-kicker, .hero-product-name, .hero-desc, .hero-price, .hero-specs",
      { y: 34, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.66, stagger: 0.06, ease: "power3.out" }
    );
  })
);
onMounted(() => {
  runTimer();
  clockTimer = setInterval(() => {
    clock.value = new Date();
  }, 60000);
  /* wipe anything a hot-reloaded previous instance may have left inline */
  clearRingInline();
  playIntro();
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  idle(() => preloadNext());
  document.addEventListener("visibilitychange", onVisibility);
});
onBeforeUnmount(() => {
  clearTimer();
  clearSteps();
  if (clockTimer) clearInterval(clockTimer);
  if (rafId) cancelAnimationFrame(rafId);
  document.removeEventListener("visibilitychange", onVisibility);
});
</script>
<template>
  <section
    class="brand-hero"
    :class="tone"
    aria-roledescription="carousel"
    aria-label="Sản phẩm nổi bật tại DOP Mart"
    @mousemove="parallax"
    @mouseenter="pause"
    @mouseleave="
      resume();
      resetParallax();
    "
    @focusin="pause"
    @focusout="onFocusOut"
    :style="{
      '--accent': accent,
      '--accent-next': accentNext,
      '--hero-text-soft': softInk,
      '--hero-name-accent': nameAccent,
    }"
  >
    <div class="hero-intro">
      <h1 class="hero-intro__title">Món ngon, ngay trong văn phòng</h1>
      <p class="hero-intro__meta">
        <span>Tầng 14 &amp; 20 · 08:30–17:30</span>
        <span class="hero-open" :class="{ closed: !isOpen }">{{
          isOpen ? "Đang mở" : "Đã đóng"
        }}</span>
      </p>
    </div>
    <div class="hero-side-copy">
      <div class="hero-side-top">
        <span class="hero-kicker">
          <b>DOP Mart</b> · {{ slides[current].categoryName }}
        </span>
        <h2 class="hero-product-name">
          <RouterLink :to="`/product/${slides[current].slug}`"
            ><span class="np-fill">{{ nameParts.head }}</span
            ><span v-if="nameParts.tail" class="np-outline"> {{ nameParts.tail }}</span
            ><span class="np-accent"> {{ nameParts.last }}</span></RouterLink
          >
        </h2>
        <p class="hero-desc">{{ slides[current].description }}</p>
      </div>
      <div class="hero-side-bottom">
        <b class="hero-price">{{ slides[current].price.toLocaleString("vi-VN") }} ₫</b>
        <p class="hero-specs">
          <span>★ {{ slides[current].rating }}</span>
          <span>{{ slides[current].sold }} đã bán</span>
        </p>
        <div class="hero-actions">
          <div class="hero-buy">
            <QuickAdd :product="slides[current]" />
          </div>
          <RouterLink to="/deals" class="hero-deal"
            >Khuyến mãi hôm nay <ArrowRight :size="13"
          /></RouterLink>
        </div>
      </div>
    </div>
    <div
      class="hero-ring"
      :class="{ 'is-spinning': spinning }"
      aria-label="Vòng sản phẩm nổi bật"
    >
      <div class="hero-orbit" aria-hidden="true" />
      <div class="hero-plate" aria-hidden="true" />
      <div class="hero-ground" aria-hidden="true" />
      <div class="hero-ground hero-ground--s1" aria-hidden="true" />
      <div class="hero-ground hero-ground--s2" aria-hidden="true" />
      <div class="hero-ground hero-ground--s3" aria-hidden="true" />
      <button
        v-for="s in ringSlots"
        :key="`ring-${s.product.id}`"
        type="button"
        class="hero-ring__item"
        :class="`slot-${s.slot}`"
        :aria-current="s.slot === 0 ? 'true' : undefined"
        :aria-label="
          s.slot === 0 ? `${s.product.name} — đang xem` : `Chuyển tới ${s.product.name}`
        "
        :tabindex="s.slot === 0 ? -1 : 0"
        @click="onPackClick(s)"
      >
        <img
          :src="s.product.image"
          alt=""
          :loading="s.slot === 0 ? 'eager' : 'lazy'"
          :fetchpriority="s.slot === 0 ? 'high' : 'auto'"
          decoding="async"
        />
      </button>
    </div>
    <div class="hero-product-zone">
      <div class="hero-halo"></div>
      <div class="hero-fx" :class="`fx-${fx.kind}`" aria-hidden="true">
        <i
          v-for="n in fx.bits"
          :key="`${slides[current].id}-${n}`"
          :style="{ '--i': n - 1 }"
        />
      </div>
      <div v-if="fx.steam" class="hero-steam" aria-hidden="true"><i /><i /><i /></div>
    </div>

    <div class="hero-controls">
      <button type="button" aria-label="Xem sản phẩm trước" @click="go(current - 1)">
        <ChevronLeft />
      </button>
      <div class="hero-dots">
        <button
          v-for="(p, i) in slides"
          :key="p.id"
          type="button"
          :class="{ active: i === current }"
          :aria-label="`Xem sản phẩm: ${p.name}`"
          :aria-current="i === current ? 'true' : undefined"
          @click="goTo(i)"
        >
          <span></span>
        </button>
      </div>
      <button type="button" aria-label="Xem sản phẩm tiếp theo" @click="go(current + 1)">
        <ChevronRight /></button
      ><span class="hero-count" aria-hidden="true"
        ><b>0{{ current + 1 }}</b
        >/0{{ slides.length }}</span
      ><button
        type="button"
        class="play"
        :aria-label="
          playing ? 'Tạm dừng tự động chuyển slide' : 'Bật tự động chuyển slide'
        "
        :aria-pressed="!playing"
        @click="toggle"
      >
        <Pause v-if="playing" /><Play v-else />
      </button>
    </div>
  </section>
</template>
