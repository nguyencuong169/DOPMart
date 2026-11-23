<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Pause,
  Play,
  Star,
} from "lucide-vue-next";
import { useSwipe } from "@vueuse/core";
import QuickAdd from "./QuickAdd.vue";
import { useProductStore } from "../../stores/productStore.js";

const store = useProductStore();
const slides = computed(() => store.products.slice(0, 4));
const current = ref(0);
const active = computed(() => slides.value[current.value]);

const emphasizedEndings = [
  "phô mai",
  "bùng vị",
  "nhiệt đới",
  "ăn liền",
  "trái cây",
  "mini",
  "mộc",
  "cay",
];
const nameParts = computed(() => {
  const name = slides.value[current.value]?.name || "";
  const words = name.split(/\s+/).filter(Boolean);
  const normalized = name.toLocaleLowerCase("vi-VN");
  const ending =
    emphasizedEndings.find((phrase) => normalized.endsWith(phrase)) ||
    words[words.length - 1] ||
    "";
  return {
    head: ending ? name.slice(0, -ending.length).trim() : name,
    accent: ending ? name.slice(-ending.length) : "",
  };
});

const stage = ref(null);
useSwipe(stage, {
  threshold: 40,
  onSwipeEnd(_, direction) {
    if (direction === "left") go(current.value + 1);
    if (direction === "right") go(current.value - 1);
  },
});

const prefersReduced = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const playing = ref(!prefersReduced);
const hovering = ref(false);
const focusing = ref(false);
const held = computed(() => hovering.value || focusing.value);
const autoplay = computed(() => playing.value && slides.value.length > 1);

const vnd = (n) => `${Number(n).toLocaleString("vi-VN")} ₫`;

/* Giờ mở cửa */
const clock = ref(new Date());
const isOpen = computed(() => {
  const h = clock.value.getHours() + clock.value.getMinutes() / 60;
  return h >= 8.5 && h < 17.5;
});
let clockTimer = null;

function go(i) {
  const total = slides.value.length;
  if (total) current.value = (i + total) % total;
}
/* Thanh tiến trình của mục đang chọn chính là đồng hồ tự chuyển slide:
   chạy hết thì sang slide kế, tạm dừng khi hover/focus mà không cần timer riêng. */
function onProgressEnd() {
  if (autoplay.value) go(current.value + 1);
}
function toggle() {
  playing.value = !playing.value;
}
function onFocusOut(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    focusing.value = false;
  }
}

onMounted(() => {
  clockTimer = setInterval(() => {
    clock.value = new Date();
  }, 60000);
});
onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer);
});
</script>

<template>
  <section
    class="dm-hero"
    :class="{ 'is-playing': autoplay, 'is-held': held }"
    aria-roledescription="carousel"
    aria-label="Sản phẩm nổi bật tại DOP Mart"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
    @focusin="focusing = true"
    @focusout="onFocusOut"
  >
    <span class="dm-hero__plane" aria-hidden="true" />

    <!-- Nội dung sản phẩm -->
    <div
      v-if="active"
      class="dm-hero__copy"
      :aria-live="playing ? 'off' : 'polite'"
    >
      <Transition name="copy" mode="out-in" appear>
        <div :key="active.id" class="dm-copy">
          <p class="dm-copy__cat"><RouterLink :to="`/category/${active.category}`">{{ active.categoryName }} ↗</RouterLink></p>
          <h2 class="dm-copy__name">
            <RouterLink :to="`/product/${active.slug}`">{{ nameParts.head }} <span class="cutout">{{ nameParts.accent }}</span></RouterLink>
          </h2>
          <p class="dm-copy__desc">{{ active.description }}</p>
          <div class="dm-copy__meta">
            <b class="dm-copy__price">{{ vnd(active.price) }}</b>
            <span class="dm-copy__stat">
              <Star :size="16" fill="currentColor" aria-hidden="true" />
              <span class="sr-only">Đánh giá</span>{{ active.rating }}
            </span>
            <span class="dm-copy__stat">{{ active.sold }} đã bán</span>
          </div>
          <div class="dm-copy__actions">
            <QuickAdd :product="active" />
          </div>
        </div>
      </Transition>
    </div>

    <!-- Ảnh sản phẩm: xếp chồng, chỉ đổi lớp is-active -->
    <div ref="stage" class="dm-hero__stage">
      <span class="dm-stage__shadow" aria-hidden="true" />
      <img
        v-for="(p, i) in slides"
        :key="p.id"
        class="dm-stage__img"
        :class="{ 'is-active': i === current, 'is-next': i !== current && i === (current + 1) % slides.length }"
        :src="p.image"
        :alt="i === current ? p.name : ''"
        :aria-hidden="i !== current"
        :loading="i === 0 ? 'eager' : 'lazy'"
        :fetchpriority="i === 0 ? 'high' : 'auto'"
        decoding="async"
        width="560"
        height="560"
      />
    </div>

    <!-- Giới thiệu + giờ mở cửa -->
    <div class="dm-hero__intro">
      <h1 class="dm-intro__title">DOP <em>mart</em></h1>
      <p class="dm-intro__slogan">Small Money – Big Happy</p>
      <p class="dm-intro__promise">Ở nhà có vợ, ở công ty có DOP.</p>
      <p class="dm-intro__meta">
        <span><MapPin :size="16" aria-hidden="true" />Tầng 14 &amp; 20</span>
        <span><Clock :size="16" aria-hidden="true" />08:30–17:30</span>
        <span class="dm-status" :class="{ 'is-closed': !isOpen }">{{
          isOpen ? "Đang mở" : "Đã đóng"
        }}</span>
      </p>
    </div>

    <!-- Danh sách nổi bật + điều khiển -->
    <aside class="dm-hero__queue" aria-label="Danh sách sản phẩm nổi bật">
      <div class="dm-queue__head">
        <div class="dm-queue__controls">
          <button
            type="button"
            class="dm-ctl"
            aria-label="Xem sản phẩm trước"
            @click="go(current - 1)"
          >
            <ChevronLeft :size="18" />
          </button>
          <button
            type="button"
            class="dm-ctl"
            aria-label="Xem sản phẩm tiếp theo"
            @click="go(current + 1)"
          >
            <ChevronRight :size="18" />
          </button>
          <button
            type="button"
            class="dm-ctl"
            :aria-label="
              playing
                ? 'Tạm dừng tự động chuyển slide'
                : 'Bật tự động chuyển slide'
            "
            :aria-pressed="!playing"
            @click="toggle"
          >
            <Pause v-if="playing" :size="18" /><Play v-else :size="18" />
          </button>
        </div>
      </div>

      <ol class="dm-queue__list">
        <li v-for="(p, i) in slides" :key="p.id">
          <button
            type="button"
            class="dm-item"
            :aria-label="p.name"
            :class="{ 'is-active': i === current }"
            :aria-current="i === current ? 'true' : undefined"
            @click="go(i)"
          >
            <span
              v-if="i === current"
              class="dm-item__bar"
              aria-hidden="true"
              @animationend="onProgressEnd"
            />
          </button>
        </li>
      </ol>
      <b class="slide-count">{{ String(current + 1).padStart(2, "0") }}/{{ String(slides.length).padStart(2, "0") }}</b>
    </aside>
  </section>
</template>

<style scoped>
/* Màu nền và màu chữ đổi mượt theo sản phẩm (trình duyệt cũ sẽ đổi tức thì) */
@property --hero-accent {
  syntax: "<color>";
  inherits: true;
  initial-value: #ffd338;
}
@property --hero-fg {
  syntax: "<color>";
  inherits: true;
  initial-value: #1a1a1a;
}

.dm-hero {
  /* alias tới design-tokens.css, có giá trị dự phòng nếu chưa import */
  --ink: var(--ds-ink, #1a1a1a);
  --ok: var(--ds-ok, #1b7f45);
  --off: var(--ds-off, #595959);
  --font: var(
    --ds-font-sans,
    "Be Vietnam Pro",
    system-ui,
    -apple-system,
    "Segoe UI",
    sans-serif
  );
  --r-sm: var(--ds-radius-sm, 0.5rem);
  --r-md: var(--ds-radius-md, 0.875rem);
  --r-pill: var(--ds-radius-pill, 999px);
  --ease: var(--ds-ease, cubic-bezier(0.22, 0.8, 0.24, 1));
  --gutter: var(--ds-gutter, clamp(1.25rem, 5vw, 5rem));
  --fg-soft: color-mix(in srgb, var(--hero-fg) 82%, transparent);
  --hairline: color-mix(in srgb, var(--hero-fg) 22%, transparent);
  /* Nếu header/nav cố định có khai báo --ds-header-h thì trừ đi; mặc định 0px */
  --header-h: var(--ds-header-h, 0px);

  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-height: calc(100vh - var(--header-h));
  min-height: calc(100svh - var(--header-h));
  align-content: space-between;
  padding: clamp(1.5rem, 3vw, 2.5rem) var(--gutter) 0;
  overflow: hidden;
  color: var(--hero-fg);
  font-family: var(--font);
  background: var(--hero-accent);
  /* Full page: lấp đầy viewport còn lại bên dưới header */
  min-height: calc(100vh - var(--header-h));
  min-height: calc(100svh - var(--header-h));
  transition:
    --hero-accent 0.7s var(--ease),
    --hero-fg 0.7s var(--ease);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.dm-hero :where(a, button):focus-visible {
  outline: 3px solid var(--ring, var(--hero-fg));
  outline-offset: 3px;
}

.dm-hero__plane {
  display: none;
}

/* ---------- Copy ---------- */
.dm-copy__cat {
  display: inline-flex;
  margin: 0 0 1rem;
  padding: 0.35rem 0.85rem;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.2;
  background: color-mix(in srgb, var(--hero-fg) 10%, transparent);
  border-radius: var(--r-pill);
}
.dm-copy__name {
  margin: 0 0 1rem;
  font-size: var(--ds-text-display, clamp(2.25rem, 4.6vw, 4.5rem));
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.025em;
  text-wrap: balance;
}
.dm-copy__name a {
  color: inherit;
  text-decoration: none;
}
.dm-copy__name a:hover {
  text-decoration: underline;
  text-decoration-thickness: 3px;
  text-underline-offset: 0.12em;
}
.dm-copy__desc {
  max-width: 46ch;
  margin: 0;
  color: var(--fg-soft);
  font-size: 1rem;
  line-height: 1.6;
  text-wrap: pretty;
}
.dm-copy__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem 1.25rem;
  margin-top: 1.5rem;
}
.dm-copy__price {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.dm-copy__stat {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--fg-soft);
  font-size: 0.9375rem;
}
.dm-copy__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.5rem;
  margin-top: 1.75rem;
}
.dm-link {
  color: inherit;
  font-weight: 600;
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 0.3em;
}
.dm-link:hover {
  text-decoration-thickness: 3px;
}

/* ---------- Stage ---------- */
.dm-hero__stage {
  position: relative;
  z-index: 1;
  order: -1;
  width: min(100%, 24rem);
  aspect-ratio: 1;
  margin: 0 auto 0.5rem;
}
.dm-stage__shadow {
  position: absolute;
  left: 12%;
  right: 12%;
  bottom: 4%;
  height: 8%;
  background: radial-gradient(closest-side, rgb(0 0 0 / 0.28), transparent);
  filter: blur(4px);
}
.dm-stage__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  transform: translateY(3%) scale(0.95);
  transition:
    opacity 0.45s var(--ease),
    transform 0.7s var(--ease);
}
.dm-stage__img.is-active {
  opacity: 1;
  transform: none;
}

/* ---------- Intro ---------- */
.dm-hero__intro {
  order: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1.5rem;
  margin-top: 2rem;
  padding: 1.25rem 0;
  border-top: 1px solid var(--hairline);
}
.dm-intro__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
}
.dm-intro__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1.25rem;
  margin: 0;
  color: var(--fg-soft);
  font-size: 0.9375rem;
}
.dm-intro__meta > span {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.dm-status {
  padding: 0.2rem 0.65rem;
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 600;
  background: var(--ok);
  border-radius: var(--r-pill);
}
.dm-status.is-closed {
  background: var(--off);
}

/* ---------- Queue (mobile: dải ngang trên nền ink) ---------- */
.dm-hero__queue {
  --ring: #fff;
  order: 2;
  margin: 0 calc(var(--gutter) * -1);
  padding: 2.75rem var(--gutter) 1.75rem;
  color: #fff;
  background: var(--ink);
  clip-path: polygon(0 1.25rem, 100% 0, 100% 100%, 0 100%);
}
.dm-queue__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.dm-queue__title {
  margin: 0;
  color: rgb(255 255 255 / 0.82);
  font-size: 0.9375rem;
  font-weight: 600;
}
.dm-queue__controls {
  display: flex;
  gap: 0.5rem;
}
.dm-ctl {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  color: #fff;
  background: transparent;
  border: 1px solid rgb(255 255 255 / 0.3);
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.18s var(--ease);
}
.dm-ctl:hover {
  background: rgb(255 255 255 / 0.14);
}

.dm-queue__list {
  display: flex;
  gap: 0.75rem;
  margin: 0 calc(var(--gutter) * -1);
  padding: 0 var(--gutter);
  overflow-x: auto;
  list-style: none;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}
.dm-queue__list > li {
  flex: 0 0 min(16rem, 78%);
  scroll-snap-align: start;
}

.dm-item {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.875rem;
  width: 100%;
  padding: 0.625rem 0.625rem 0.875rem;
  color: rgb(255 255 255 / 0.78);
  font: inherit;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: var(--r-md);
  cursor: pointer;
  transition:
    background-color 0.18s var(--ease),
    color 0.18s var(--ease);
}
.dm-item:hover {
  background: rgb(255 255 255 / 0.06);
}
.dm-item.is-active {
  color: #fff;
  background: rgb(255 255 255 / 0.1);
}
.dm-item__thumb {
  display: grid;
  place-items: center;
  width: 3.75rem;
  height: 3.75rem;
  border-radius: var(--r-sm);
}
.dm-item__thumb img {
  width: 88%;
  height: 88%;
  object-fit: contain;
}
.dm-item__body {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}
.dm-item__name {
  display: -webkit-box;
  overflow: hidden;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.3;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.dm-item__price {
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.8;
}
.dm-item__bar {
  position: absolute;
  left: 0.625rem;
  right: 0.625rem;
  bottom: 0.3rem;
  height: 2px;
  background: var(--hero-accent);
  border-radius: 1px;
  transform: scaleX(0);
  transform-origin: left;
}
.is-playing .dm-item__bar {
  animation: dm-fill 5.6s linear forwards;
}
.is-held .dm-item__bar {
  animation-play-state: paused;
}
@keyframes dm-fill {
  to {
    transform: scaleX(1);
  }
}

/* ---------- Chuyển nội dung khi đổi slide ---------- */
.copy-enter-active,
.copy-leave-active {
  transition:
    opacity 0.28s var(--ease),
    transform 0.45s var(--ease);
}
.copy-enter-from {
  opacity: 0;
  transform: translateY(14px);
}
.copy-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}


.dm-hero { --hero-accent:#ffbf38; --hero-fg:#191919; width:100%; max-width:none; box-sizing:border-box; min-height:100svh; align-content:center; gap:1rem; grid-template-columns:minmax(0, 40fr) minmax(0,60fr); grid-template-areas:"intro stage" "copy stage" ". controls"; padding: max(84px,8vh) var(--gutter) 2rem; }
.dm-hero__intro { grid-area:intro; display:grid; justify-content:start; gap:.45rem; padding:0; margin:0; border:0; }
.dm-intro__meta { gap:.35rem .75rem; opacity:1; font-size:.85rem; }
.dm-intro__title { font:800 clamp(1rem,1.4vw,1.4rem)/1.2 var(--font-display); }
.dm-hero__copy { grid-area:copy; align-self:start; }
.dm-copy__cat { display:block; padding:0; background:none; font-weight:800; text-transform:uppercase; letter-spacing:.08em; margin-bottom:.6rem; }
.dm-copy__cat a { color:inherit; text-underline-offset:.2em; }
.dm-copy__name { font:900 clamp(1.5rem,2.7vw,2.8rem)/1.12 var(--font-display); letter-spacing:-.04em; text-transform:uppercase; }
.cutout { display:inline-block; transform:rotate(-2deg); padding:0 .16em; border:2px solid; color:#191919; background:#fff8e8; box-shadow:3px 3px #191919; }
.dm-copy__meta { align-items:center; margin-top:.85rem; gap:.55rem 1rem; }
.dm-copy__price { padding:.25em .5em; background:#fff8e8; color:#191919; border:2px solid; border-radius:.4em; box-shadow:3px 3px #191919; }
.dm-copy__actions { margin-top:1.15rem; }
.dm-copy__actions :deep(.qa--row) { flex-direction:row; }
.dm-hero__stage { grid-area:stage; width:100%; height:clamp(250px,44svh,470px); margin:0; aspect-ratio:auto; touch-action:pan-y; }
.dm-hero__plane { position:absolute; display:block; inset:0; z-index:-1; background:#277348; clip-path:polygon(80% 0,100% 0,100% 100%,50% 100%); }
.dm-stage__img { width:85%; transform:translateX(-80%) scale(.65); }
.dm-stage__img.is-next { opacity:.88; transform:translateX(80%) scale(.47); }
.dm-stage__shadow { left:8%; right:18%; }
.dm-hero__queue { grid-area:controls; justify-self:center; display:flex; align-items:center; gap:.4rem; margin:0; padding:.12rem .45rem; border:2px solid #191919; border-radius:2rem; background:#fff8e8; color:#191919; clip-path:none; }
.dm-queue__head { order:2; margin:0; }
.dm-queue__controls { gap:0; }
.dm-ctl,.dm-item { color:#191919; width:44px; height:44px; }
.dm-queue__list { margin:0; padding:0; gap:0; overflow:visible; }
.dm-queue__list > li { flex:0 0 auto; }
.dm-item { display:grid; place-items:center; grid-template-columns:1fr; width:28px; padding:0; }
.dm-item::before { content:""; width:7px; height:7px; background:#8c8172; border-radius:10px; }
.dm-item.is-active::before { width:18px; background:#191919; }
.dm-item__bar { opacity:0; }
.slide-count { font:800 .8rem var(--font-ui); }
@media(max-width:900px) {
 .dm-hero { grid-template-columns:1fr; grid-template-areas:"intro" "stage" "controls" "copy"; align-content:center; gap:.65rem; padding:78px var(--gutter) 2rem; }
 .dm-hero__copy,.dm-hero__intro { width:min(100%,38rem); margin-inline:auto; }
 .dm-hero__stage { height:clamp(190px,32svh,350px); width:min(100%,42rem); }
 .dm-stage__img { width:100%; }
 .dm-stage__img.is-next { transform:translateX(64%) scale(.48); }
 .dm-hero__plane { clip-path:polygon(100% 5%,100% 100%,36% 100%); }
 .dm-copy__name { margin-bottom:.6rem; }
 .dm-queue__controls .dm-ctl:nth-child(-n+2) { display:none; }
 .dm-copy__actions :deep(.qa) { width:100%; }
 .dm-copy__actions :deep(.qa__go) { flex:1; }
}
@media(max-width:600px) {
 .dm-hero { align-content:start; padding:68px 20px 80px; gap:.45rem; }
 .dm-intro__meta svg { display:none; }
 .dm-intro__meta { font-size:.76rem; }
 .dm-hero__stage { height:clamp(140px,21svh,220px); }
 .dm-hero__plane { clip-path:polygon(100% 18%,100% 100%,61% 100%); }
}

.dm-intro__title { margin:0; font:900 clamp(4rem,7.7vw,8rem)/.96 var(--font-display); letter-spacing:-.075em; }
.dm-intro__title em { color:#a23213; font-style:normal; }
.dm-intro__slogan { margin:0; font:800 clamp(1.2rem,2.4vw,2.3rem)/1.2 var(--font-display); letter-spacing:-.04em; }
.dm-intro__promise { margin:.2rem 0; font-weight:600; }
.dm-copy__price { border:0; box-shadow:none; background:transparent; padding:0; font-size:1.45rem; }
.dm-copy__actions :deep(.qa__go) { box-shadow:none; background:#fff6de; }
.dm-copy__desc { font-size:.94rem; }
.dm-hero__stage { justify-self:center; }
@media(max-width:900px) {
 .dm-hero__copy { background:#fff6de; padding:1rem 1.2rem; border-radius:1rem; }
 .dm-copy__actions :deep(.qa) { width:auto; max-width:100%; }
 .dm-intro__title { font-size:clamp(3.3rem,8vw,5rem); }
 .dm-intro__meta { margin-top:.25rem; }
}
@media(max-width:600px) {
 .dm-hero__intro { gap:.18rem; }
 .dm-hero__copy { padding:.8rem 1rem; }
 .dm-copy__actions { margin-top:.65rem; }
}
@media(prefers-reduced-motion:reduce) {
 .dm-hero,.dm-stage__img,.copy-enter-active,.copy-leave-active { transition:none; }
}
</style>