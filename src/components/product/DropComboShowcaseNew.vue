<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-vue-next'
// Font tiêu đề: npm i @fontsource/barlow-condensed
import '@fontsource/barlow-condensed/latin-800.css'
import '@fontsource/barlow-condensed/vietnamese-800.css'
import '@fontsource/barlow-condensed/latin-800-italic.css'
import '@fontsource/barlow-condensed/vietnamese-800-italic.css'
import { useCartStore } from '../../stores/cartStore'
import drinkImg from '../../assets/products/drinks.webp'
import noodleImg from '../../assets/products/noodles.webp'
import seaweedImg from '../../assets/products/healthy.webp'
import spicyImg from '../../assets/products/spicy.webp'

// Bấm "Xem giỏ hàng →" sau khi thêm: gắn vào route giỏ hàng của bạn ở nơi dùng component
const emit = defineEmits(['view-cart'])

// Dữ liệu thật: truyền prop `combos` (mảng). Mỗi phần tử:
//   { id, kicker, name, price, accent, copy, items: [{ id, name, price, image }] }
// "Mua lẻ" luôn = tổng giá các món, nên chỉ đúng khi price của món lấy từ store thật.
// Không truyền prop thì dùng DEFAULT_COMBOS (dummy) bên dưới.
const props = defineProps({ combos: { type: Array, default: null } })

const AUTO_MS = 9000
const cart = useCartStore()
const root = ref(null)
const ctaWrap = ref(null)
const index = ref(0)
// Thiết bị cảm ứng / bật "giảm chuyển động": không tự chuyển combo
const calm =
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none), (prefers-reduced-motion: reduce)').matches
const auto = ref(!calm)
const paused = ref(false) // nút "Tạm dừng chuyển động" (dừng tự chuyển + mọi hiệu ứng nền)
const inView = ref(false)
const anyView = ref(false)
const ctaVisible = ref(true)
const addedFeedback = ref(false)
const addedIds = ref({})
const confetti = ref([])
let feedbackTimer
let rootObserver
let ctaObserver

const vnd = n => `${n.toLocaleString('vi-VN')}₫`

// DUMMY DATA: thay bằng productStore.products khi có dữ liệu thật
const PRODUCTS = {
  noodle: {
    id: 'noodle',
    name: 'Mì ly vị tôm cay',
    price: 28000,
    image: noodleImg,
  },
  drink: {
    id: 'drink',
    name: 'Soda trái cây 330ml',
    price: 16000,
    image: drinkImg,
  },
  seaweed: {
    id: 'seaweed',
    name: 'Snack rong biển 40g',
    price: 18000,
    image: seaweedImg,
  },
  spicy: {
    id: 'spicy',
    name: 'Khoai tây chiên cay 50g',
    price: 20000,
    image: spicyImg,
  },
}

// Vị trí từng món trong khung sân khấu (% của khung). Món đầu tiên của combo là món chính.
// x: lệch trái · b: cách đáy (món nâng cao = món phía sau) · w: bề rộng · z: lớp · r: độ nghiêng
const LAYOUTS = {
  1: [{ x: 14, b: 5, w: 72, z: 3, r: -3 }],
  2: [
    { x: 0, b: 5, w: 60, z: 3, r: -4 },
    { x: 40, b: 11, w: 56, z: 2, r: 5 },
  ],
  3: [
    { x: 0, b: 5, w: 52, z: 3, r: -4 },
    { x: 26, b: 22, w: 48, z: 2, r: 3 },
    { x: 50, b: 5, w: 50, z: 4, r: 6 },
  ],
  4: [
    { x: 0, b: 5, w: 45, z: 3, r: -5 },
    { x: 18, b: 31, w: 43, z: 1, r: 2 },
    { x: 38, b: 5, w: 45, z: 4, r: -2 },
    { x: 58, b: 29, w: 42, z: 2, r: 6 },
  ],
}

// Dòng 1 của tiêu đề luôn là "COMBO"; kicker là dòng 2. accent = màu nền section.
const DEFAULT_COMBOS = [
  {
    id: 'cuu-doi-giua-ca',
    kicker: 'OFFER',
    name: 'CỨU ĐÓI GIỮA CA',
    items: [PRODUCTS.noodle, PRODUCTS.drink],
    price: 35000,
    accent: '#D31E1A',
    copy: 'Mì tôm cay nóng hổi + soda mát lạnh. Xong bữa trong 5 phút.',
  },
  {
    id: 'chill-buoi-chieu',
    kicker: 'SNACK',
    name: 'CHILL BUỔI CHIỀU',
    items: [PRODUCTS.spicy, PRODUCTS.seaweed, PRODUCTS.drink],
    price: 42000,
    accent: '#7A2BBF',
    copy: 'Cay giòn, thanh nhẹ, thêm soda để cân vị.',
  },
  {
    id: 'nhe-bung-du-vi',
    kicker: 'HEALTHY',
    name: 'NHẸ BỤNG ĐỦ VỊ',
    items: [PRODUCTS.seaweed, PRODUCTS.drink],
    price: 29000,
    accent: '#1F7A3A',
    copy: 'Rong biển giòn ít béo, không bột ngọt, kèm soda trái cây.',
  },
  {
    id: 'hop-chia-team',
    kicker: 'PARTY',
    name: 'HỘP CHIA TEAM',
    items: [PRODUCTS.noodle, PRODUCTS.drink, PRODUCTS.seaweed, PRODUCTS.spicy],
    price: 69000,
    accent: '#C8440A',
    copy: 'Đủ 4 món best-seller cho cả nhóm.',
  },
]

const COMBOS = computed(() =>
  (props.combos?.length ? props.combos : DEFAULT_COMBOS).map(c => {
    const old = c.items.reduce((sum, p) => sum + p.price, 0)
    const save = Math.max(0, old - c.price)
    return { ...c, old, save, pct: old ? Math.round((save / old) * 100) : 0 }
  })
)

const maxSavePct = computed(() => Math.max(...COMBOS.value.map(c => c.pct)))
const tapeText = computed(() =>
  `COMBO GIÁ NHẸ ★ MUA CẢ BỮA, RẺ HƠN MUA LẺ ★ BẤM MỘT LẦN, ĐỦ CẢ BỮA ★ TIẾT KIỆM TỚI ${maxSavePct.value}% ★ `.repeat(
    3
  )
)

// Ngôi sao 16 cánh cho huy hiệu giảm giá
const STAR = Array.from({ length: 32 }, (_, k) => {
  const a = (k / 32) * Math.PI * 2 - Math.PI / 2
  const r = k % 2 ? 41 : 48
  return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`
}).join(' ')

const SPARKS = [
  { l: '46%', t: '5%', s: 'calc(2.2 * var(--u))', d: '0s' },
  { l: '94%', t: '36%', s: 'calc(1.6 * var(--u))', d: '1.1s' },
  { l: '4%', t: '58%', s: 'calc(1.8 * var(--u))', d: '2s' },
]

const CONFETTI_COLORS = ['#FFD62E', '#FFFFFF', '#171717', '#FF8A3D']

const current = computed(() => COMBOS.value[index.value] ?? COMBOS.value[0])
const kickerLines = computed(() => ['COMBO', current.value.kicker])
const hasAdded = computed(() => !!addedIds.value[current.value.id])
const showSticky = computed(() => anyView.value && !ctaVisible.value)

function move(d, manual = true) {
  if (manual) auto.value = false
  index.value = (index.value + d + COMBOS.value.length) % COMBOS.value.length
}
function select(i) {
  auto.value = false
  index.value = i
}
// Thanh tiến độ chạy xong thì tự sang combo kế tiếp
function advance() {
  if (auto.value) move(1, false)
}
function toggleMotion() {
  paused.value = !paused.value
  auto.value = paused.value ? false : !calm
}

function itemStyle(i) {
  const set = LAYOUTS[current.value.items.length] ?? LAYOUTS[4]
  const l = set[i] ?? set[set.length - 1]
  return {
    left: `${l.x}%`,
    bottom: `${l.b}%`,
    width: `${l.w}%`,
    zIndex: l.z,
    '--r': `${l.r}deg`,
    '--i': i,
  }
}

function burst() {
  confetti.value = Array.from({ length: 18 }, (_, k) => {
    const a = (k / 18) * Math.PI * 2 + Math.random() * 0.4
    const dist = 90 + Math.random() * 100
    return {
      id: `${Date.now()}-${k}`,
      style: {
        '--dx': `${Math.cos(a) * dist}px`,
        '--dy': `${Math.sin(a) * dist - 24}px`,
        '--rot': `${Math.round(Math.random() * 720 - 360)}deg`,
        background: CONFETTI_COLORS[k % CONFETTI_COLORS.length],
      },
    }
  })
}

function add() {
  const c = current.value
  auto.value = false
  // Một dòng "combo" trong giỏ, đúng giá combo (không cộng lẻ từng món)
  cart.add(
    {
      id: `combo-${c.id}`,
      name: `Combo ${c.name}`,
      price: c.price,
      oldPrice: c.old,
      image: c.items[0].image,
      isCombo: true,
      items: c.items.map(({ id, name, price }) => ({ id, name, price })),
    },
    1
  )
  addedIds.value = { ...addedIds.value, [c.id]: true }
  addedFeedback.value = true
  burst()
  clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    addedFeedback.value = false
    confetti.value = []
  }, 1700)
}

onMounted(() => {
  // Tự chuyển combo chỉ chạy khi section thật sự nằm trong màn hình
  rootObserver = new IntersectionObserver(
    ([e]) => {
      anyView.value = e.isIntersecting
      inView.value = e.intersectionRatio >= 0.35
    },
    { threshold: [0, 0.35] }
  )
  rootObserver.observe(root.value)
  // Thanh mua cố định (mobile) chỉ hiện khi nút CTA chính đã cuộn khỏi màn hình
  ctaObserver = new IntersectionObserver(([e]) => (ctaVisible.value = e.isIntersecting), {
    threshold: 0.6,
  })
  watch(
    ctaWrap,
    async (el, old) => {
      await nextTick()
      if (old) ctaObserver.unobserve(old)
      if (el) ctaObserver.observe(el)
    },
    { immediate: true }
  )
})
onBeforeUnmount(() => {
  clearTimeout(feedbackTimer)
  rootObserver?.disconnect()
  ctaObserver?.disconnect()
})
</script>

<template>
  <section
    ref="root"
    class="fp-combo"
    :class="{ 'is-inview': inView, 'is-visible': anyView, 'is-paused': paused }"
    :style="{ '--fp-accent': current.accent, '--fp-auto': `${AUTO_MS}ms` }"
    tabindex="0"
    aria-roledescription="carousel"
    aria-label="Combo ưu đãi"
    @keydown.left.prevent="move(-1)"
    @keydown.right.prevent="move(1)"
  >
    <!-- Nền -->
    <div class="fp-combo__bg" aria-hidden="true">
      <svg viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="#fff" stroke-width="2" opacity="0.13">
          <path
            v-for="n in 20"
            :key="n"
            :d="`M -100 ${n * 46 - 200} Q 250 ${n * 46 - 110}, 600 ${n * 46 - 40} T 1350 ${n * 46 + 140}`"
          />
        </g>
      </svg>
      <div class="fp-combo__dots"></div>
    </div>

    <!-- Hai dải băng chữ chạy: dấu hiệu nhận biết riêng của section combo (rê chuột để dừng) -->
    <div class="fp-combo__tape fp-combo__tape--top" aria-hidden="true">
      <div class="fp-combo__tape-track">
        <span v-for="n in 2" :key="n">{{ tapeText }}</span>
      </div>
    </div>
    <div class="fp-combo__tape fp-combo__tape--bottom" aria-hidden="true">
      <div class="fp-combo__tape-track">
        <span v-for="n in 2" :key="n">{{ tapeText }}</span>
      </div>
    </div>

    <div class="fp-combo__inner">
      <span class="fp-sr-only" aria-live="polite">
        Combo {{ index + 1 }} trên {{ COMBOS.length }}: {{ current.name }}
      </span>

      <div class="fp-combo__hero">
        <Transition name="fp-fade" mode="out-in">
          <div :key="index" class="fp-combo__grid">
            <!-- Đầu trang: tiêu đề 3D (dòng 1 luôn là COMBO) + tên combo -->
            <div class="fp-combo__head">
              <h2 class="fp-combo__title">
                <span class="fp-combo__kicker">
                  <span v-for="(word, w) in kickerLines" :key="w" class="fp-combo__kicker-line">{{
                    word
                  }}</span>
                </span>
                <span class="fp-combo__name">{{ current.name }}</span>
              </h2>
            </div>

            <!-- Sân khấu sản phẩm -->
            <div class="fp-combo__visual">
              <div class="fp-combo__burst" aria-hidden="true"></div>
              <div class="fp-combo__disc" aria-hidden="true"></div>
              <div class="fp-combo__ring" aria-hidden="true"></div>
              <div class="fp-combo__floor" aria-hidden="true"></div>
              <span
                v-for="(s, k) in SPARKS"
                :key="k"
                class="fp-combo__spark"
                aria-hidden="true"
                :style="{
                  left: s.l,
                  top: s.t,
                  width: s.s,
                  height: s.s,
                  animationDelay: s.d,
                }"
              ></span>

              <div class="fp-combo__cluster">
                <div
                  v-for="(item, idx) in current.items"
                  :key="item.id"
                  class="fp-combo__product"
                  :style="itemStyle(idx)"
                >
                  <img
                    :src="item.image"
                    :alt="item.name"
                    decoding="async"
                    width="600"
                    height="450"
                    loading="lazy"
                  />
                </div>
              </div>

              <div class="fp-combo__sticker" aria-hidden="true">
                <svg viewBox="0 0 100 100"><polygon :points="STAR" /></svg>
                <span
                  ><small>GIẢM</small><b>{{ current.pct }}%</b></span
                >
              </div>
            </div>

            <!-- Khối mua hàng -->
            <div class="fp-combo__buy">
              <p class="fp-combo__desc">{{ current.copy }}</p>

              <ul class="fp-combo__items" aria-label="Combo gồm">
                <li v-for="item in current.items" :key="item.id">
                  <img :src="item.image" alt="" width="48" height="48" loading="lazy" />
                  <span
                    ><strong>{{ item.name }}</strong> {{ vnd(item.price) }}</span
                  >
                </li>
              </ul>

              <div class="fp-combo__price">
                <span class="fp-combo__price-small">CHỈ</span>
                <strong class="fp-combo__price-big">{{ vnd(current.price) }}</strong>
                <span class="fp-combo__price-small">THÔI</span>
              </div>

              <div class="fp-combo__cta-row">
                <div
                  ref="ctaWrap"
                  class="fp-combo__cta-wrap"
                  :class="{ 'is-added': addedFeedback }"
                >
                  <button
                    type="button"
                    class="fp-combo__cta"
                    :class="{ 'is-added': addedFeedback }"
                    aria-live="polite"
                    @click="add"
                  >
                    <template v-if="addedFeedback"
                      ><CheckCircle2 :size="22" /> Đã thêm vào giỏ</template
                    >
                    <template v-else>Thêm combo vào giỏ <ArrowRight :size="22" /></template>
                  </button>
                  <i
                    v-for="c in confetti"
                    :key="c.id"
                    class="fp-confetti"
                    :style="c.style"
                    aria-hidden="true"
                  ></i>
                </div>
                <button
                  v-if="hasAdded"
                  type="button"
                  class="fp-combo__link"
                  @click="emit('view-cart')"
                >
                  Xem giỏ hàng <ArrowRight :size="18" />
                </button>
                <p v-else class="fp-combo__meta">
                  <span
                    >Mua lẻ <s>{{ vnd(current.old) }}</s></span
                  >
                  <span class="fp-combo__save">Tiết kiệm {{ vnd(current.save) }}</span>
                </p>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Chọn combo: thấy cả 4 combo cùng lúc, thanh tiến độ tự chuyển -->
      <div class="fp-combo__picker">
        <button type="button" class="fp-combo__arrow" aria-label="Combo trước" @click="move(-1)">
          <ChevronLeft :size="24" />
        </button>

        <div class="fp-combo__tabs" role="group" aria-label="Danh sách combo">
          <button
            v-for="(c, i) in COMBOS"
            :key="c.id"
            type="button"
            class="fp-combo__tab"
            :class="{ 'is-active': i === index }"
            :aria-current="i === index ? 'true' : undefined"
            @click="select(i)"
          >
            <span class="fp-combo__tab-thumbs">
              <img
                v-for="p in c.items.slice(0, 3)"
                :key="p.id"
                :src="p.image"
                alt=""
                width="46"
                height="46"
                loading="lazy"
              />
            </span>
            <span class="fp-combo__tab-text">
              <strong>{{ c.name }}</strong>
              <span
                >{{ vnd(c.price) }} <em>-{{ c.pct }}%</em></span
              >
            </span>
            <span
              v-if="i === index && auto"
              :key="`p${index}`"
              class="fp-combo__tab-progress"
              aria-hidden="true"
              @animationend="advance"
            ></span>
          </button>
        </div>

        <button type="button" class="fp-combo__arrow" aria-label="Combo tiếp theo" @click="move(1)">
          <ChevronRight :size="24" />
        </button>

        <button
          type="button"
          class="fp-combo__motion"
          :aria-pressed="paused"
          aria-label="Tạm dừng chuyển động"
          :title="paused ? 'Bật lại chuyển động' : 'Tạm dừng chuyển động'"
          @click="toggleMotion"
        >
          <Play v-if="paused" :size="20" />
          <Pause v-else :size="20" />
        </button>
      </div>
    </div>

    <!-- Thanh mua cố định (chỉ mobile): giá + CTA luôn trong tầm tay khi CTA chính đã cuộn đi -->
    <div class="fp-combo__sticky-wrap">
      <div class="fp-combo__sticky" :class="{ 'is-on': showSticky }" :inert="!showSticky">
        <div class="fp-combo__sticky-price">
          <strong>{{ vnd(current.price) }}</strong>
          <s>{{ vnd(current.old) }}</s>
        </div>
        <button
          type="button"
          class="fp-combo__cta fp-combo__cta--sm"
          :class="{ 'is-added': addedFeedback }"
          @click="add"
        >
          <template v-if="addedFeedback"><CheckCircle2 :size="20" /> Đã thêm</template>
          <template v-else>Thêm vào giỏ <ArrowRight :size="20" /></template>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.fp-combo {
  --dop-yellow: #ffd62e;
  --dop-ink: #171717;
  --fp-accent: #d31e1a;
  /* Font tiêu đề condensed. Muốn dùng font có sẵn của site: đặt --fp-display ở nơi gọi component */
  --fp-display: 'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif;

  position: relative;
  isolation: isolate;
  width: 100%;
  overflow: clip; /* clip (không phải hidden) để thanh mua cố định còn dính được */
  padding: clamp(80px, 6.4vw, 94px) 0 clamp(88px, 8vw, 112px);
  background-color: var(--paper);
  color: var(--on-cream);
  font-family: var(--font-ui, system-ui, -apple-system, 'Segoe UI', sans-serif);
  outline: none;
}
.fp-combo:focus-visible {
  outline: 3px solid var(--dop-ink);
  outline-offset: 4px;
}
.fp-combo__inner {
  width: min(100% - 2 * var(--edge, 24px), var(--fp-max, 2400px));
  margin-inline: auto;
}
.fp-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* ---------- Nền ---------- */
.fp-combo__bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(70% 80% at 68% 45%, rgb(255 255 255 / 0.26), transparent 62%),
    radial-gradient(120% 100% at 50% 125%, rgb(0 0 0 / 0.4), transparent 62%),
    radial-gradient(90% 60% at 0% 0%, rgb(0 0 0 / 0.24), transparent 60%);
}
.fp-combo__bg svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.fp-combo__dots {
  position: absolute;
  inset: 0;
  background: radial-gradient(rgb(255 255 255 / 0.16) 1.6px, transparent 1.7px) 0 0 / 15px 15px;
  -webkit-mask-image: radial-gradient(55% 55% at 100% 100%, #000, transparent);
  mask-image: radial-gradient(55% 55% at 100% 100%, #000, transparent);
}

/* ---------- Dải băng chữ chạy ---------- */
.fp-combo__tape {
  position: absolute;
  left: -4%;
  width: 108%;
  z-index: 5;
  overflow: hidden;
  font-family: var(--fp-display);
  font-size: clamp(0.95rem, 1.4vw, 1.25rem);
  font-style: italic;
  font-weight: 800;
  letter-spacing: 0.1em;
  box-shadow: 0 6px 16px rgb(0 0 0 / 0.25);
}
.fp-combo__tape--top {
  top: 22px;
  background: var(--dop-ink);
  color: #fff;
  transform: rotate(-1.4deg);
}
.fp-combo__tape--bottom {
  bottom: 22px;
  background: #fff3d6;
  color: var(--dop-ink);
  transform: rotate(1.2deg);
}
.fp-combo__tape-track {
  display: flex;
  width: max-content;
  padding: 9px 0;
  animation: fp-marquee 60s linear infinite;
}
.fp-combo__tape--bottom .fp-combo__tape-track {
  animation-direction: reverse;
}
.fp-combo__tape:hover .fp-combo__tape-track {
  animation-play-state: paused;
}
.fp-combo__tape-track span {
  white-space: nowrap;
}
@keyframes fp-marquee {
  to {
    transform: translateX(-50%);
  }
}

/* ---------- Hero ---------- */
.fp-combo__hero {
  container-type: inline-size;
  width: 100%;
}
.fp-combo__grid {
  --u: min(1cqw, 14px); /* 1 đơn vị = 1% bề rộng hero, tối đa 14px */
  display: grid;
  /* Cột sản phẩm tối đa 960px: ở màn siêu rộng chữ vẫn nằm sát lề container, ảnh không phình vô hạn */
  grid-template-columns: minmax(0, 1fr) minmax(0, min(58.3%, 960px));
  grid-template-areas:
    'head visual'
    'buy visual';
  grid-template-rows: auto 1fr;
  align-content: start;
  column-gap: calc(3 * var(--u));
  row-gap: calc(1.4 * var(--u));
}
.fp-combo__head {
  grid-area: head;
  align-self: end;
  position: relative;
  z-index: 2;
}
.fp-combo__buy {
  grid-area: buy;
  align-self: start;
  position: relative;
  z-index: 2;
}
.fp-combo__visual {
  grid-area: visual;
  position: relative;
  aspect-ratio: 1.32;
  align-self: center;
  justify-self: end;
  width: 100%;
}

/* Tiêu đề 3D: viền đen + bóng cứng. Vàng dành riêng cho giá và CTA */
.fp-combo__title {
  margin: 0;
  font-family: var(--fp-display);
  font-style: italic;
  font-weight: 800;
  text-transform: uppercase;
}
.fp-combo__kicker {
  display: block;
}
.fp-combo__kicker-line {
  display: block;
  font-size: calc(7.4 * var(--u));
  line-height: 1.05;
  color: var(--red);
  letter-spacing: -0.02em;
  paint-order: stroke fill;
  text-wrap: balance;
  text-shadow:
    calc(0.45 * var(--u)) calc(0.55 * var(--u)) 0 var(--dop-yellow),
    calc(0.9 * var(--u)) calc(1.1 * var(--u)) 0 rgb(0 0 0 / 0.35);
}
.fp-combo__name {
  display: inline-block;
  margin-top: calc(1.1 * var(--u));
  padding: 0.3em 0.9em;
  background: var(--dop-ink);
  color: #fff;
  font-size: max(17px, calc(2.1 * var(--u)));
  line-height: 1;
  letter-spacing: 0.06em;
  transform: rotate(-2deg) skewX(-8deg);
  box-shadow: calc(0.35 * var(--u)) calc(0.35 * var(--u)) 0 rgb(0 0 0 / 0.3);
  text-shadow: calc(0.25 * var(--u)) calc(0.25 * var(--u)) 0 var(--dop-ink);
}

/* ---------- Sân khấu sản phẩm ---------- */
.fp-combo__burst,
.fp-combo__disc,
.fp-combo__ring,
.fp-combo__floor,
.fp-combo__spark,
.fp-combo__sticker {
  pointer-events: none;
}
.fp-combo__burst {
  position: absolute;
  top: 47%;
  left: 50%;
  width: 125%;
  aspect-ratio: 1;
  translate: -50% -50%;
  background: repeating-conic-gradient(rgb(255 255 255 / 0.15) 0 7.5deg, transparent 7.5deg 15deg);
  -webkit-mask-image: radial-gradient(closest-side, #000 22%, transparent 70%);
  mask-image: radial-gradient(closest-side, #000 22%, transparent 70%);
  animation: fp-spin 120s linear infinite;
}
/* Đĩa kem đặc: tách sản phẩm khỏi nền dù nền có màu gì */
.fp-combo__disc {
  position: absolute;
  top: 47%;
  left: 50%;
  width: 70%;
  aspect-ratio: 1;
  translate: -50% -50%;
  border-radius: 50%;
  background: radial-gradient(
    closest-side,
    color-mix(in srgb, var(--fp-accent) 6%, #fff8e6) 0 76%,
    color-mix(in srgb, var(--fp-accent) 20%, #f6dfb0) 100%
  );
  box-shadow:
    inset 0 0 0 calc(0.5 * var(--u)) rgb(255 255 255 / 0.65),
    0 calc(2 * var(--u)) calc(4 * var(--u)) rgb(0 0 0 / 0.28);
}
.fp-combo__ring {
  position: absolute;
  top: 47%;
  left: 50%;
  width: 82%;
  aspect-ratio: 1;
  translate: -50% -50%;
  border: calc(0.3 * var(--u)) dashed rgb(255 255 255 / 0.55);
  border-radius: 50%;
}
.fp-combo__floor {
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: 1%;
  height: 9%;
  background: radial-gradient(closest-side, rgb(0 0 0 / 0.4), transparent);
}
@keyframes fp-spin {
  to {
    transform: rotate(360deg);
  }
}
.fp-combo__spark {
  position: absolute;
  z-index: 4;
  background: #fff;
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  animation: fp-twinkle 3.2s ease-in-out infinite;
}
@keyframes fp-twinkle {
  0%,
  100% {
    opacity: 0.35;
    scale: 0.7;
  }
  50% {
    opacity: 1;
    scale: 1.1;
  }
}

.fp-combo__cluster {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}
.fp-combo__product {
  position: absolute;
  transform: rotate(var(--r, 0deg));
  animation:
    fp-pop 0.65s cubic-bezier(0.2, 0.9, 0.3, 1.2) backwards,
    fp-float 4.2s ease-in-out infinite alternate;
  animation-delay: calc(var(--i, 0) * 100ms), calc(var(--i, 0) * -0.9s);
}
.fp-combo__product img {
  display: block;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 calc(1.4 * var(--u)) calc(1.8 * var(--u)) rgb(0 0 0 / 0.38));
}
@keyframes fp-pop {
  from {
    opacity: 0;
    transform: translateY(10%) rotate(var(--r, 0deg)) scale(0.9);
  }
}
@keyframes fp-float {
  to {
    translate: 0 -2.5%;
  }
}

/* Huy hiệu giảm giá: sao trắng viền đen, chữ theo màu nền */
.fp-combo__sticker {
  position: absolute;
  top: -2%;
  left: 0;
  z-index: 7;
  display: grid;
  place-items: center;
  width: 19%;
  aspect-ratio: 1;
  rotate: -10deg;
  filter: drop-shadow(calc(0.3 * var(--u)) calc(0.4 * var(--u)) 0 var(--dop-ink));
}
.fp-combo__sticker svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  fill: var(--fp-accent);
  stroke: var(--fp-accent);
  stroke-width: 2.4;
  stroke-linejoin: round;
}
.fp-combo__sticker span {
  position: relative;
  display: grid;
  justify-items: center;
  color: var(--dop-yellow);
  font-family: var(--fp-display);
  font-weight: 800;
  line-height: 0.9;
  text-shadow: calc(0.3 * var(--u)) calc(0.4 * var(--u)) 0 var(--dop-ink);
  transition: color 400ms cubic-bezier(0.23, 1, 0.32, 1);
}
.fp-combo__sticker small {
  font-size: max(12px, calc(1.5 * var(--u)));
  letter-spacing: 0.1em;
}
.fp-combo__sticker b {
  font-size: calc(4.2 * var(--u));
}

/* ---------- Khối mua hàng ---------- */
.fp-combo__desc {
  margin: calc(0.9 * var(--u)) 0 calc(1 * var(--u));
  font-size: max(15px, calc(1.15 * var(--u)));
  line-height: 1.5;
  max-width: 65ch;
  text-wrap: pretty;
}
.fp-combo__items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 calc(1.2 * var(--u));
  padding: 0;
  list-style: none;
}
.fp-combo__items li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 14px 4px 6px;
  border-radius: 99px;
  background: #fff;
  color: var(--dop-ink);
  font-size: max(14px, calc(1 * var(--u)));
  font-weight: 600;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.fp-combo__items img {
  width: max(30px, calc(2.6 * var(--u)));
  height: max(30px, calc(2.6 * var(--u)));
  object-fit: contain;
}
.fp-combo__price {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px calc(0.8 * var(--u));
  font-family: var(--fp-display);
  font-weight: 800;
  text-transform: uppercase;
}
.fp-combo__price-small {
  font-size: calc(2.3 * var(--u));
  align-self: flex-end;
  padding-bottom: 0.25em;
  color: var(--red);
  font-variant-numeric: tabular-nums;
}
.fp-combo__price-big {
  font-size: calc(6.2 * var(--u));
  line-height: 1.05;
  color: var(--red);
  paint-order: stroke fill;
  text-shadow:
    calc(0.3 * var(--u)) calc(0.4 * var(--u)) 0 #fff7df,
    calc(0.6 * var(--u)) calc(0.8 * var(--u)) 0 rgb(0 0 0 / 0.35);
  font-variant-numeric: tabular-nums;
}
/* Mua lẻ + Tiết kiệm nằm cạnh nút CTA (desktop) để bớt một hàng dọc */
.fp-combo__meta {
  display: grid;
  gap: 5px;
  margin: 0;
  font-family: var(--font-ui, system-ui, sans-serif);
  font-size: max(14px, calc(1.05 * var(--u)));
  font-weight: 400;
  text-transform: none;
}
.fp-combo__meta span:first-child {
  font-size: max(15px, calc(1.15 * var(--u)));
  color: var(--red-ink);
  font-variant-numeric: tabular-nums;
}
.fp-combo__meta s {
  color: var(--red-ink);
  font-variant-numeric: tabular-nums;
}
.fp-combo__save {
  padding: 3px 12px;
  border-radius: 99px;
  background: #fff;
  color: var(--red);
  font-weight: 900;
  line-height: 1;
  box-shadow: calc(0.2 * var(--u)) calc(0.2 * var(--u)) 0 var(--ink);
  transition: color 400ms cubic-bezier(0.23, 1, 0.32, 1);
}

/* CTA: nút vàng lớn, có xung nhịp + vệt sáng */
.fp-combo__cta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
  margin-top: calc(1.2 * var(--u));
}
.fp-combo__cta-wrap {
  position: relative;
  isolation: isolate;
  display: inline-block;
}
.fp-combo__cta-wrap::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: 99px;
  background: var(--dop-yellow);
  opacity: 0;
  animation: fp-pulse 2.4s ease-out infinite;
}
.fp-combo__cta-wrap:hover::before,
.fp-combo__cta-wrap.is-added::before {
  animation: none;
}
.fp-combo__cta {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  overflow: hidden;
  padding: max(14px, calc(1 * var(--u))) max(28px, calc(2.6 * var(--u)));
  border: 2px solid var(--dop-ink);
  border-radius: 99px;
  background: var(--dop-yellow);
  color: var(--dop-ink);
  font: inherit;
  font-size: max(17px, calc(1.45 * var(--u)));
  line-height: 1;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 0 var(--dop-ink);
  transition:
    transform 150ms cubic-bezier(0.23, 1, 0.32, 1),
    background-color 300ms cubic-bezier(0.23, 1, 0.32, 1),
    color 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.fp-combo__cta::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    110deg,
    transparent 35%,
    rgb(255 255 255 / 0.65) 50%,
    transparent 65%
  );
  transform: translateX(-120%);
  animation: fp-shine 3.2s linear infinite;
}
.fp-combo__cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 9px 0 var(--dop-ink);
}
.fp-combo__cta:active {
  transform: scale(0.97);
  box-shadow: 2px 2px 0 var(--dop-ink);
}
.fp-combo__cta:focus-visible {
  outline: 3px solid var(--dop-ink);
  outline-offset: 2px;
}
.fp-combo__cta.is-added {
  background: #fff;
  color: var(--green-ink);
}
.fp-combo__cta.is-added::after {
  display: none;
}
@keyframes fp-pulse {
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  70%,
  100% {
    transform: scale(1.13, 1.5);
    opacity: 0;
  }
}
@keyframes fp-shine {
  0%,
  55% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(120%);
  }
}
.fp-combo__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
  border: 0;
  background: none;
  color: var(--red);
  font: inherit;
  font-size: max(15px, calc(1.1 * var(--u)));
  line-height: 1.2;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 4px;
  cursor: pointer;
}
.fp-combo__link:focus-visible {
  outline: 3px solid var(--dop-ink);
  outline-offset: 2px;
}

.fp-confetti {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 8;
  width: 12px;
  height: 18px;
  border: 1.5px solid var(--dop-ink);
  border-radius: 3px;
  pointer-events: none;
  animation: fp-confetti 1s cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
}
@keyframes fp-confetti {
  0% {
    transform: translate(0, 0) rotate(0) scale(0.5);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(1);
    opacity: 0;
  }
}

/* ---------- Chọn combo ---------- */
.fp-combo__picker {
  position: relative;
  z-index: 6;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 14px;
  margin-top: clamp(24px, 3vw, 44px);
}
/* Nút điều khiển dạng "ghost": không tranh màu vàng với CTA */
.fp-combo__arrow,
.fp-combo__motion {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border: 2px solid rgb(255 255 255 / 0.8);
  border-radius: 50%;
  background: rgb(0 0 0 / 0.22);
  color: #fff;
  cursor: pointer;
  transition:
    background-color 200ms cubic-bezier(0.23, 1, 0.32, 1),
    color 200ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 150ms cubic-bezier(0.23, 1, 0.32, 1);
}
.fp-combo__arrow:hover,
.fp-combo__motion:hover {
  background: #fff;
  color: var(--fp-accent);
}
.fp-combo__arrow:active {
  transform: scale(0.94);
}
.fp-combo__arrow:focus-visible,
.fp-combo__motion:focus-visible {
  outline: 3px solid var(--dop-ink);
  outline-offset: 2px;
}
.fp-combo__motion {
  width: 44px;
  height: 44px;
}
.fp-combo__tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  padding: 8px 4px 10px;
}
.fp-combo__tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 10px 16px 14px 12px;
  border: 2px solid rgb(255 255 255 / 0.6);
  border-radius: 18px;
  background: rgb(0 0 0 / 0.18);
  color: #fff;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    transform 200ms cubic-bezier(0.23, 1, 0.32, 1),
    background-color 200ms cubic-bezier(0.23, 1, 0.32, 1),
    box-shadow 200ms cubic-bezier(0.23, 1, 0.32, 1),
    border-color 200ms cubic-bezier(0.23, 1, 0.32, 1);
}
.fp-combo__tab:hover {
  background: rgb(0 0 0 / 0.3);
}
.fp-combo__tab.is-active {
  border-color: var(--dop-ink);
  background: #fff;
  color: var(--dop-ink);
  box-shadow: 0 6px 0 var(--dop-ink);
  transform: translateY(-4px);
}
.fp-combo__tab:focus-visible {
  outline: 3px solid var(--dop-ink);
  outline-offset: 2px;
  border-color: var(--dop-ink);
}
.fp-combo__tab-thumbs {
  display: flex;
  flex: none;
}
.fp-combo__tab-thumbs img {
  width: 46px;
  height: 46px;
  margin-left: -14px;
  object-fit: contain;
  filter: drop-shadow(0 2px 3px rgb(0 0 0 / 0.3));
}
.fp-combo__tab-thumbs img:first-child {
  margin-left: 0;
}
.fp-combo__tab-text {
  display: grid;
  gap: 2px;
  min-width: 0;
  font-size: 0.875rem;
}
.fp-combo__tab-text strong {
  display: -webkit-box;
  overflow: hidden;
  font-size: 0.95rem;
  line-height: 1.2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.fp-combo__tab-text em {
  margin-left: 4px;
  padding: 1px 7px;
  border-radius: 99px;
  background: #fff;
  color: var(--dop-ink);
  font-size: 0.875rem;
  font-style: normal;
  font-weight: 800;
}
.fp-combo__tab.is-active .fp-combo__tab-text em {
  background: var(--fp-accent);
  color: #fff;
}
.fp-combo__tab-progress {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 6px;
  height: 4px;
  border-radius: 4px;
  background: var(--fp-accent);
  transform-origin: left;
  animation: fp-progress var(--fp-auto, 9s) linear forwards;
  animation-play-state: paused;
}
.fp-combo.is-inview .fp-combo__tab-progress {
  animation-play-state: running;
}
.fp-combo.is-inview:hover .fp-combo__tab-progress,
.fp-combo.is-inview:focus-within .fp-combo__tab-progress {
  animation-play-state: paused;
}
@keyframes fp-progress {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

/* ---------- Thanh mua cố định (mobile) ---------- */
.fp-combo__sticky-wrap {
  display: none;
}

/* ---------- Chuyển combo ---------- */
.fp-fade-enter-active,
.fp-fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.fp-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.fp-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ---------- Ngoài màn hình: dừng hiệu ứng nền để không tốn pin/GPU ---------- */
.fp-combo:not(.is-visible) .fp-combo__tape-track,
.fp-combo:not(.is-visible) .fp-combo__burst,
.fp-combo:not(.is-visible) .fp-combo__spark,
.fp-combo:not(.is-visible) .fp-combo__product,
.fp-combo:not(.is-visible) .fp-combo__cta-wrap::before,
.fp-combo:not(.is-visible) .fp-combo__cta::after {
  animation-play-state: paused;
}

/* ---------- Tạm dừng chuyển động ---------- */
.fp-combo.is-paused .fp-combo__tape-track,
.fp-combo.is-paused .fp-combo__burst,
.fp-combo.is-paused .fp-combo__spark,
.fp-combo.is-paused .fp-combo__product {
  animation-play-state: paused;
}
.fp-combo.is-paused .fp-combo__cta-wrap::before,
.fp-combo.is-paused .fp-combo__cta::after {
  animation: none;
}

/* ---------- Màn hình hẹp: xếp dọc (tiêu đề → sản phẩm → mua hàng) ---------- */
@container (max-width: 820px) {
  .fp-combo__grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'head'
      'visual'
      'buy';
    grid-template-rows: auto auto auto;
    row-gap: calc(4 * var(--u));
  }
  .fp-combo__visual {
    aspect-ratio: 1.15;
  }
  .fp-combo__kicker-line {
    font-size: calc(17 * var(--u));
  }
  .fp-combo__name {
    font-size: calc(5.4 * var(--u));
    margin-top: calc(3 * var(--u));
  }
  .fp-combo__desc {
    max-width: none;
    margin: 0 0 calc(3 * var(--u));
    font-size: 15px;
  }
  .fp-combo__items {
    margin-bottom: 18px;
  }
  .fp-combo__meta {
    order: -1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    width: 100%;
    font-size: 14px;
  }
  .fp-combo__cta-row {
    margin-top: 14px;
  }
  .fp-combo__price-small {
    font-size: calc(7 * var(--u));
  }
  .fp-combo__price-big {
    font-size: calc(16 * var(--u));
  }
  .fp-combo__sticker small {
    font-size: max(12px, calc(3.4 * var(--u)));
  }
  .fp-combo__sticker b {
    font-size: calc(9 * var(--u));
  }
  .fp-combo__sticker {
    width: 23%;
  }
  .fp-combo__cta-wrap,
  .fp-combo__cta-row > .fp-combo__cta-wrap .fp-combo__cta {
    display: flex;
    width: 100%;
  }
  .fp-combo__cta {
    font-size: 17px;
  }
  .fp-combo__link {
    margin-inline: auto;
    font-size: 15px;
  }
}
@media (max-width: 900px) {
  .fp-combo__picker {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .fp-combo__arrow {
    display: none;
  }
  .fp-combo__tabs {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding-inline: 4px;
  }
  .fp-combo__tab {
    flex: 0 0 min(78%, 270px);
    scroll-snap-align: start;
  }
}
@media (max-width: 720px) {
  .fp-combo__burst {
    animation: none;
  }
  .fp-combo__sticky-wrap {
    display: block;
    position: sticky;
    bottom: 0;
    z-index: 30;
    height: 0;
  }
  .fp-combo__sticky {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px var(--edge, 16px) calc(10px + env(safe-area-inset-bottom, 0px));
    background: var(--dop-ink);
    box-shadow: 0 -6px 20px rgb(0 0 0 / 0.35);
    transform: translateY(110%);
    transition: transform 0.3s ease;
  }
  .fp-combo__sticky.is-on {
    transform: none;
  }
  .fp-combo__sticky-price {
    display: grid;
    line-height: 1.1;
  }
  .fp-combo__sticky-price strong {
    color: var(--dop-yellow);
    font-size: 1.35rem;
    font-variant-numeric: tabular-nums;
  }
  .fp-combo__sticky-price s {
    color: #fff;
    font-size: 0.875rem;
  }
  .fp-combo__cta--sm {
    padding: 12px 20px;
    font-size: 16px;
    box-shadow: 0 4px 0 #000;
    animation: none;
  }
  .fp-combo__cta--sm::after {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .fp-combo__tape-track,
  .fp-combo__burst,
  .fp-combo__spark,
  .fp-combo__product,
  .fp-combo__cta-wrap::before,
  .fp-combo__cta::after {
    animation: none;
  }
  .fp-combo__tab-progress {
    display: none;
  }
  .fp-fade-enter-active,
  .fp-fade-leave-active,
  .fp-combo__sticky {
    transition: none;
  }
}
</style>
