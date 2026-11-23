<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-vue-next";
import QuickAdd from "./QuickAdd.vue";
import { useProductStore } from "../../stores/productStore";

const store = useProductStore();
const slides = computed(() => store.products.slice(0, 4));
const current = ref(0);
const product = computed(() => slides.value[current.value]);
const playing = ref(false);
const hovered = ref(false);
const focused = ref(false);
const clock = ref(new Date());
const isOpen = computed(() => {
  const minutes = clock.value.getHours() * 60 + clock.value.getMinutes();
  return minutes >= 510 && minutes < 1050;
});
const price = new Intl.NumberFormat("vi-VN");

let slideTimer;
let clockTimer;
let motion;

function go(index) {
  const total = slides.value.length;
  if (!total) return;
  current.value = (index + total) % total;
  scheduleSlide();
}

function selectSlide(index) {
  playing.value = false;
  go(index);
}

function scheduleSlide() {
  clearTimeout(slideTimer);
  if (playing.value && !hovered.value && !focused.value && !document.hidden && slides.value.length > 1) {
    slideTimer = setTimeout(() => go(current.value + 1), 5600);
  }
}

function onFocusOut(event) {
  focused.value = event.currentTarget.contains(event.relatedTarget);
}

function syncMotion() {
  if (motion.matches) playing.value = false;
}

watch([playing, hovered, focused, () => slides.value.length], () => {
  if (current.value >= slides.value.length) current.value = 0;
  scheduleSlide();
});

onMounted(() => {
  motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  playing.value = !motion.matches;
  motion.addEventListener("change", syncMotion);
  clockTimer = setInterval(() => { clock.value = new Date(); }, 60000);
  document.addEventListener("visibilitychange", scheduleSlide);
});

onBeforeUnmount(() => {
  clearTimeout(slideTimer);
  clearInterval(clockTimer);
  motion?.removeEventListener("change", syncMotion);
  document.removeEventListener("visibilitychange", scheduleSlide);
});
</script>

<template>
  <section
    class="store-hero"
    aria-roledescription="carousel"
    aria-label="Sản phẩm nổi bật tại DOP Mart"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @focusin="focused = true"
    @focusout="onFocusOut"
  >
    <div class="store-hero__inner">
      <div class="store-hero__copy">
        <p class="store-hero__hours">
          Tầng 14 &amp; 20 · 08:30–17:30
          <span class="store-hero__status" :class="{ 'is-open': isOpen }">
            {{ isOpen ? "Đang mở" : "Đã đóng" }}
          </span>
        </p>
        <h1>Món ngon, <span>ngay trong văn phòng.</span></h1>
        <p class="store-hero__intro">Snack và đồ uống cho giờ nghỉ. Chọn món bạn thích rồi ghé DOP Mart.</p>
        <div class="store-hero__links">
          <RouterLink to="/shop" class="store-hero__primary">
            Khám phá cửa hàng <ArrowUpRight :size="18" aria-hidden="true" />
          </RouterLink>
          <RouterLink to="/deals" class="store-hero__secondary">Xem khuyến mãi</RouterLink>
        </div>
      </div>

      <div class="store-hero__showcase">
        <div class="store-hero__stage">
          <Transition name="store-hero-pack">
            <img
              v-if="product?.image"
              :key="product.id"
              :src="product.image"
              :alt="product.name"
              width="560"
              height="560"
              :fetchpriority="current === 0 ? 'high' : 'auto'"
              decoding="async"
            />
          </Transition>
          <span v-if="product && !product.image" class="store-hero__image-fallback">{{ product.name }}</span>
        </div>
        <div v-if="slides.length > 1" class="store-hero__controls" role="group" aria-label="Điều khiển carousel">
          <button
            type="button"
            :aria-label="playing ? 'Tạm dừng tự động chuyển slide' : 'Bật tự động chuyển slide'"
            @click="playing = !playing"
          >
            <Pause v-if="playing" :size="18" aria-hidden="true" />
            <Play v-else :size="18" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Xem sản phẩm trước" @click="selectSlide(current - 1)">
            <ChevronLeft aria-hidden="true" />
          </button>
          <button type="button" aria-label="Xem sản phẩm tiếp theo" @click="selectSlide(current + 1)">
            <ChevronRight aria-hidden="true" />
          </button>
          <div class="store-hero__dots">
            <button
              v-for="(slide, index) in slides"
              :key="slide.id"
              type="button"
              :aria-label="`Xem sản phẩm: ${slide.name}`"
              :aria-current="index === current ? 'true' : undefined"
              @click="selectSlide(index)"
            ><span></span></button>
          </div>
        </div>
      </div>

      <div v-if="product" class="store-hero__item" :aria-live="playing && !hovered && !focused ? 'off' : 'polite'">
        <div>
          <h2><RouterLink :to="`/product/${product.slug}`">{{ product.name }}</RouterLink></h2>
          <p>{{ product.description }}</p>
          <div class="store-hero__meta">
            <strong>{{ price.format(product.price) }} ₫</strong>
            <span v-if="product.rating != null">★ {{ product.rating }}</span>
            <span v-if="product.sold != null">{{ product.sold }} đã bán</span>
          </div>
        </div>
        <QuickAdd :key="product.id" :product="product" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.store-hero {
  background: var(--cream);
  color: var(--ink);
}
.store-hero__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  grid-template-areas:
    "copy showcase"
    "item showcase";
  grid-template-rows: auto auto;
  align-content: center;
  align-items: center;
  column-gap: clamp(28px, 5vw, 80px);
  max-width: 1520px;
  margin-inline: auto;
  padding: clamp(24px, 5vw, 80px);
}
.store-hero__copy { grid-area: copy; align-self: end; }
.store-hero__showcase { grid-area: showcase; }
.store-hero__hours,
.store-hero__links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 18px;
}
.store-hero__hours {
  margin: 0 0 20px;
  color: var(--on-cream);
  font-size: var(--fs-sm);
  font-weight: 650;
}
.store-hero__status {
  padding: 3px 9px;
  border: 1px solid currentColor;
  border-radius: var(--r-pill);
}
.store-hero__status.is-open { color: var(--green-ink); }
.store-hero h1 {
  margin: 0 0 22px;
  font: 800 clamp(2.5rem, 5.55vw, 5.5rem)/var(--lh-display) var(--font-display);
  letter-spacing: -.065em;
  text-wrap: balance;
}
.store-hero h1 span { color: var(--red-ink); }
.store-hero__intro {
  margin: 0 0 22px;
  max-width: 37ch;
  color: var(--on-cream);
  font-size: clamp(var(--fs-md), 1.4vw, var(--fs-lg));
  line-height: var(--lh-body);
}
.store-hero__links a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  font-weight: 750;
}
.store-hero__primary {
  padding-inline: 18px;
  border-radius: var(--r-pill);
  background: var(--ink);
  color: var(--cream);
}
.store-hero__primary:hover {
  background: var(--red-ink);
}
.store-hero__secondary,
.store-hero__item h2 a:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}
.store-hero__item {
  --qa-step-size: var(--touch);
  grid-area: item;
  display: flex;
  align-self: start;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #1a1a1a40;
}
.store-hero__item > div:first-child { flex: 1 1 180px; }
.store-hero__item h2 { margin: 0; font-size: var(--fs-lg); line-height: var(--lh-h2); }
.store-hero__item p { margin: 4px 0; color: var(--on-cream); font-size: var(--fs-sm); }
.store-hero__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  color: var(--on-cream);
  font-size: var(--fs-sm);
}
.store-hero__meta strong {
  color: var(--ink);
  font-size: var(--fs-md);
}
.store-hero__stage {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1.12;
  border: var(--storefront-border);
  border-radius: var(--r-md);
  background: radial-gradient(circle at center, #fff0a1 0 43%, transparent 43.4%), var(--yellow);
  box-shadow: var(--e1);
}
.store-hero__stage img {
  position: absolute;
  inset: 8%;
  width: 84%;
  height: 84%;
  object-fit: contain;
  filter: drop-shadow(8px 16px 14px #65401352);
}
.store-hero__image-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  text-align: center;
  font-weight: 800;
}
.store-hero__controls,
.store-hero__dots {
  display: flex;
  justify-content: center;
  align-items: center;
}
.store-hero__controls { margin-top: 16px; gap: 4px; flex-wrap: wrap; }
.store-hero__controls button {
  display: grid;
  place-items: center;
  min-width: var(--touch);
  min-height: var(--touch);
  background: none;
  color: inherit;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}
.store-hero__controls button:hover { background: #1a1a1a12; }
.store-hero__dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid currentColor;
}
.store-hero__dots [aria-current="true"] { color: var(--red-ink); }
.store-hero__dots [aria-current="true"] span { background: currentColor; }
.store-hero :is(a, button):focus-visible {
  outline: 3px solid var(--green-ink);
  outline-offset: 3px;
}
@media (prefers-reduced-motion: no-preference) {
  .store-hero-pack-enter-active, .store-hero-pack-leave-active { transition: opacity .3s ease; }
  .store-hero-pack-enter-from, .store-hero-pack-leave-to { opacity: 0; }
}
@media (max-width: 760px) {
  .store-hero__inner {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto;
    grid-template-areas: "copy" "showcase" "item";
    row-gap: 20px;
  }
  .store-hero__item { margin-top: 0; }
  .store-hero__stage { aspect-ratio: 1.24; }
}
@media (max-width: 380px) {
  .store-hero__dots { flex-basis: 100%; }
}
</style>
