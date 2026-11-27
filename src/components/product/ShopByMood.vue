<script setup>
import { computed, shallowRef, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import SectionHeader from '../common/SectionHeader.vue'
import NewCatalogCard from './NewCatalogCard.vue'
import { useProductStore } from '../../stores/productStore'

const MAX = 4 // số món đại diện tối đa mỗi category
const store = useProductStore()
const active = shallowRef('all')
const focusedSlug = shallowRef('all') // roving tabindex: tracks which tab is keyboard-reachable
const uid = Math.random().toString(36).slice(2, 7)

// chọn màu chữ (đen/trắng) theo độ sáng của màu sản phẩm
const onColor = hex => {
  const n = parseInt(hex.replace('#', ''), 16)
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return l > 0.62 ? '#1a1a1a' : '#ffffff'
}

// --- accent color handling ---------------------------------------------
// Raw product-art colors vary wildly in saturation/lightness (a pale latte
// vs. a neon soda can), so using them directly made every tab compete for
// attention at a different volume. Clamping into a fixed sat/light band
// keeps every category reading at the same visual "weight" no matter which
// product happens to be this week's bestseller. Pin a slug in BRAND_COLORS
// to lock an exact color instead of the auto-normalized one.
const BRAND_COLORS = {
  all: '#ffc72c',
}
const ACCENT_SAT = [58, 74] // %
const ACCENT_LIGHT = [46, 58] // %

const hexToHsl = hex => {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d) % 6
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h *= 60
    if (h < 0) h += 360
  }
  return [h, s * 100, l * 100]
}

const hslToHex = (h, s, l) => {
  s /= 100
  l /= 100
  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = x =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}

const clamp = (v, [min, max]) => Math.min(max, Math.max(min, v))

const toAccent = hex => {
  const [h, s, l] = hexToHsl(hex)
  return hslToHex(h, clamp(s, ACCENT_SAT), clamp(l, ACCENT_LIGHT))
}

const resolveColor = (slug, fallbackHex) => BRAND_COLORS[slug] ?? toAccent(fallbackHex)

const tabs = computed(() => {
  const cats = store.categories
    .map(c => ({
      ...c,
      items: store.shopByMood[c.slug] ?? [],
    }))
    .filter(c => c.items.length)
  const all = {
    slug: 'all',
    name: 'Tất cả',
    tagline: 'Bán chạy nhất tuần này',
    items: store.bestSellersList,
  }
  return [all, ...cats].map(t => ({
    ...t,
    color: resolveColor(t.slug, t.items[0]?.color),
    imgs: t.items.slice(0, t.slug === 'all' ? 3 : 2).map(p => p.image),
  }))
})
const current = computed(() => tabs.value.find(t => t.slug === active.value) ?? tabs.value[0])
const shown = computed(() => current.value.items.slice(0, MAX))
const link = computed(() =>
  current.value.slug === 'all' ? '/products' : `/category/${current.value.slug}`
)

function select(slug) {
  active.value = slug
  focusedSlug.value = slug
}

function onTabFocus(slug) {
  focusedSlug.value = slug
}

function onTabKeydown(e) {
  const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End']
  if (!keys.includes(e.key)) return
  e.preventDefault()
  const list = Array.from(e.currentTarget.parentElement.children)
  const idx = list.indexOf(e.currentTarget)
  let nextIdx = idx
  if (e.key === 'ArrowRight') nextIdx = (idx + 1) % list.length
  else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + list.length) % list.length
  else if (e.key === 'Home') nextIdx = 0
  else if (e.key === 'End') nextIdx = list.length - 1
  list[nextIdx].focus() // fires @focus -> onTabFocus, which moves the roving tabindex
}

// --- scroll affordance ---------------------------------------------------
// The row fades at the edge when it overflows, which is too subtle for
// mouse/trackpad users (no natural horizontal-scroll gesture). Chevron
// buttons appear only when there's somewhere to scroll to; touch devices
// already have swipe, so the buttons hide themselves there (see CSS).
const tabsEl = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function updateScrollState() {
  const el = tabsEl.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 4
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

function scrollByTabs(dir) {
  const el = tabsEl.value
  if (!el) return
  el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
}

let resizeObserver
onMounted(async () => {
  await store.init()
  await store.fetchShopByMood()
  updateScrollState()
  tabsEl.value?.addEventListener('scroll', updateScrollState, {
    passive: true,
  })
  resizeObserver = new ResizeObserver(updateScrollState)
  if (tabsEl.value) resizeObserver.observe(tabsEl.value)
})
onBeforeUnmount(() => {
  tabsEl.value?.removeEventListener('scroll', updateScrollState)
  resizeObserver?.disconnect()
})
watch(tabs, () => nextTick(updateScrollState))
</script>

<template>
  <section class="cat-stage" :style="{ '--ac': current.color }">
    <div class="cat-inner">
      <SectionHeader
        kicker="CHỌN NHANH THEO DANH MỤC"
        title="Hôm nay bạn thèm gì?"
        lead="Lướt nhanh các món đang được yêu thích nhất theo từng danh mục."
        cta="Xem tủ snack"
        to="/products"
      />

      <div class="cat-tabs-wrap">
        <button
          v-if="canScrollLeft"
          type="button"
          class="cat-scroll cat-scroll--left"
          aria-label="Xem danh mục trước đó"
          @click="scrollByTabs(-1)"
        >
          <ChevronLeft :size="20" />
        </button>

        <div class="cat-tabs" role="tablist" ref="tabsEl">
          <button
            v-for="t in tabs"
            :key="t.slug"
            type="button"
            class="cat-tab"
            role="tab"
            :id="`${uid}-tab-${t.slug}`"
            :aria-controls="`${uid}-panel`"
            :aria-selected="t.slug === active"
            :tabindex="focusedSlug === t.slug ? 0 : -1"
            :style="{ '--c': t.color, '--on': onColor(t.color) }"
            :data-slug="t.slug"
            @click="select(t.slug)"
            @focus="onTabFocus(t.slug)"
            @keydown="onTabKeydown($event)"
          >
            <span class="cat-tab__name">{{ t.name }}</span>
            <span class="cat-tab__count">{{ t.items.length }} món</span>
            <span class="cat-tab__pop" aria-hidden="true">
              <img v-for="(src, i) in t.imgs" :key="i" :src="src" alt="" />
            </span>
          </button>
        </div>

        <button
          v-if="canScrollRight"
          type="button"
          class="cat-scroll cat-scroll--right"
          aria-label="Xem danh mục tiếp theo"
          @click="scrollByTabs(1)"
        >
          <ChevronRight :size="20" />
        </button>
      </div>

      <div v-if="current.items.length > MAX" class="cat-bar">
        <RouterLink :to="link" class="cat-more">
          Xem toàn bộ ({{ current.items.length }}) <ArrowRight :size="16" />
          <ChevronDown :size="14" class="cat-more__down" />
        </RouterLink>
      </div>

      <div
        class="cat-grid"
        :key="current.slug"
        role="tabpanel"
        :id="`${uid}-panel`"
        :aria-labelledby="`${uid}-tab-${current.slug}`"
      >
        <NewCatalogCard
          v-for="(p, i) in shown"
          :key="p.id ?? p.slug"
          :product="p"
          :index="i"
          @quick="store.openQuick(p)"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.cat-stage {
  --fd: var(--font-display);
  width: 100vw;
  margin-left: calc(50% - 50vw);
  position: relative;
  background: var(--cream);
  background: color-mix(in srgb, var(--ac) 10%, var(--cream));
  border-top: 6px solid var(--ac);
  padding: var(--sp-4) 0 var(--sp-6);
  transition: border-color 0.45s;
}
.cat-inner {
  max-width: var(--container, 1920px);
  margin: 0 auto;
  padding: 0 var(--gutter, 12px);
}
.cat-tabs-wrap {
  position: relative;
  isolation: isolate;
}
.cat-scroll {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: var(--bw-bold) solid var(--ink);
  background: #fff;
  color: var(--ink);
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--ink);
  transition: transform 0.15s;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
.cat-scroll:focus-visible {
  outline: 3px solid var(--ink);
  outline-offset: 3px;
}
.cat-scroll--left {
  left: var(--gutter, 12px);
}
.cat-scroll--right {
  right: var(--gutter, 12px);
}
/* Touch devices already scroll this row by swipe; the buttons exist to help
   mouse/trackpad users discover that it scrolls at all. */
@media (hover: none) {
  .cat-scroll {
    display: none;
  }
}
/* Atmospheric noise texture to remove digital sterility */
.cat-stage::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.03), transparent 40%),
    repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.02),
      rgba(0, 0, 0, 0.02) 1px,
      transparent 1px,
      transparent 2px
    );
  opacity: 0.6;
  pointer-events: none;
  z-index: 0;
  mix-blend-mode: overlay;
}
.cat-tabs {
  display: flex;
  gap: var(--sp-3);
  overflow-x: auto;
  width: 100%;
  padding: var(--sp-4) 0 var(--sp-3);
  scroll-padding-inline: var(--gutter, 12px);
  mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 72px), transparent 100%);
  scroll-snap-type: x proximity;
  scrollbar-width: none;
}
.cat-tabs::after {
  content: '';
  flex: none;
  width: 72px;
}
.cat-tabs::-webkit-scrollbar {
  display: none;
}
.cat-tab {
  --cd: color-mix(in srgb, var(--c) 60%, #000);
  --cd: var(--cd, #000);
  position: relative;
  isolation: isolate;
  flex: none;
  scroll-snap-align: start;
  width: clamp(212px, 13vw, 264px);
  height: clamp(88px, 5.2vw, 104px);
  border: 0;
  border-radius: var(--r-md);
  padding: 0 0 0 var(--sp-2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
  color: var(--on);
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  background: var(--c);
  background: linear-gradient(160deg, color-mix(in srgb, var(--c) 90%, #fff), var(--c) 70%);
  box-shadow:
    0 6px 0 var(--cd),
    0 16px 18px -6px rgba(0, 0, 0, 0.35);
  transition: transform 0.3s cubic-bezier(0.3, 1.5, 0.5, 1);
}
.cat-tab:active {
  transform: translateY(2px);
  box-shadow:
    0 2px 0 var(--cd),
    0 14px 16px -6px rgba(0, 0, 0, 0.4);
}
.cat-tab:focus-visible {
  outline: 3px solid var(--ink);
  outline-offset: 4px;
  border-radius: var(--r-md);
}
.cat-tab[aria-selected='true'] {
  transform: translateY(-8px);
  box-shadow:
    0 0 0 3px #fff,
    0 0 0 5.5px var(--ink),
    0 13px 0 3px var(--cd),
    0 24px 26px -8px rgba(0, 0, 0, 0.4);
}
.cat-tab[aria-selected='true']:after {
  content: '';
  position: absolute;
  left: 50%;
  top: calc(100% + var(--sp-2));
  transform: translateX(-50%);
  border: 15px solid transparent;
  border-bottom: 0;
  border-top: 18px solid var(--c);
}
.cat-tab__name,
.cat-tab__count {
  position: relative;
  z-index: 4;
}
.cat-tab__name {
  font: 800 var(--fs-lg) / 1.1 var(--font-display);
  max-width: 46%;
}
.cat-tab__count {
  font-size: var(--fs-xs);
  opacity: 0.9;
  margin-top: var(--sp-1);
}
.cat-tab__pop {
  position: absolute;
  isolation: isolate;
  right: var(--sp-1);
  bottom: var(--sp-1);
  width: 50%;
  height: 150%;
  pointer-events: none;
  transition: transform 0.3s cubic-bezier(0.3, 1.5, 0.5, 1);
}
.cat-tab__pop:before {
  content: '';
  position: absolute;
  inset: -4% -14% -2%;
  background: radial-gradient(closest-side, rgba(255, 255, 255, 0.55), transparent);
  z-index: 0;
}
.cat-tab[aria-selected='true'] .cat-tab__pop {
  transform: translateY(-7px) scale(1.1);
}
.cat-tab__pop img {
  position: absolute;
  bottom: 0;
  right: 0;
  height: 78%;
  max-width: 100%;
  object-fit: contain;
  z-index: 3;
  filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.25)) drop-shadow(0 9px 6px rgba(0, 0, 0, 0.25));
}
.cat-tab__pop img:nth-child(2) {
  right: 30%;
  height: 56%;
  z-index: 2;
  transform: rotate(-9deg);
}
.cat-tab__pop img:nth-child(3) {
  right: 56%;
  height: 42%;
  z-index: 1;
  transform: rotate(-16deg);
}
.cat-bar {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  gap: var(--sp-1);
  flex-wrap: wrap;
}
.cat-bar__title {
  margin: 0;
  font: 800 var(--fs-xl) / 1.1 var(--font-display);
  letter-spacing: var(--tracking-display);
}
.cat-bar__lead {
  margin: var(--sp-1) 0 0;
  color: var(--on-cream);
  font-size: var(--fs-sm);
}
.cat-more {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  background: var(--cream);
  color: var(--ink);
  border: var(--bw-bold) solid var(--ink);
  border-radius: var(--r-pill);
  padding: 10px 48px 10px var(--sp-2);
  font-weight: 700;
  text-decoration: none;
  box-shadow: 3px 3px 0 var(--ink);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  position: relative;
}
.cat-more__down {
  position: absolute;
  bottom: 10px;
  right: 12px;
  transform: translateY(0);
  transition: transform 0.15s;
  display: inline-block;
}
.cat-more:active {
  transform: translate(2px, 8px);
  box-shadow: 10px 10px 0 var(--ink);
}
.cat-more:active .cat-more__down {
  transform: translateY(8px);
}
.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  justify-content: center;
  gap: var(--sp-3);
  padding: var(--sp-3) 0 var(--sp-1);
  max-width: 100%;
}
@media (max-width: 980px) {
  .cat-grid {
    grid-template-columns: repeat(2, minmax(0, 456px));
    gap: 96px var(--sp-3);
  }
}
@media (max-width: 520px) {
  .cat-grid {
    gap: 84px var(--sp-2);
  }
  .cat-tab {
    width: 196px;
  }
}

/* Respect reduced-motion preference: disable transitions/animations */
@media (prefers-reduced-motion: reduce) {
  .cat-scroll,
  .cat-tab,
  .cat-tab__pop,
  .cat-more,
  .cat-more__down,
  .cat-stage {
    transition: none !important;
    animation: none !important;
  }
  .cat-tab:hover {
    transform: none;
  }
  .cat-tab:active {
    transform: none;
  }
  .cat-tab[aria-selected='true'] {
    transform: none;
  }
  .cat-tab[aria-selected='true'] .cat-tab__pop {
    transform: none;
  }
  .cat-scroll:hover {
    transform: translateY(-50%);
  }
  .cat-more:active {
    transform: none;
    box-shadow: 3px 3px 0 var(--ink);
  }
  .cat-more:active .cat-more__down {
    transform: none;
  }
}

/* Hover only on devices that can actually hover (mouse/trackpad). Touch devices use :active instead. */
@media (hover: hover) and (pointer: fine) {
  .cat-scroll:hover {
    transform: translateY(-50%) translate(-1px, -1px);
    box-shadow: 4px 4px 0 var(--ink);
  }
  .cat-tab:hover {
    transform: translateY(-4px);
    box-shadow:
      0 8px 0 var(--cd),
      0 24px 28px -8px rgba(0, 0, 0, 0.4);
  }
  .cat-more:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 var(--ink);
  }
}
</style>
