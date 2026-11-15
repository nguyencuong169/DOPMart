<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger.js'
import { products } from '../../data/products.js'

gsap.registerPlugin(ScrollTrigger)

const root = ref(null)
const editorialSlugs = [
  'chocolate-sua-mini',
  'keo-deo-trai-cay',
  'que-khoai-tay-cay',
  'xuc-xich-an-lien',
]

const items = editorialSlugs.map((slug, index) => {
  const product = products.find((entry) => entry.slug === slug)

  if (!product) {
    throw new Error(`Editorial product "${slug}" is missing from the product catalog.`)
  }

  return {
    ...product,
    number: String(index + 1).padStart(2, '0'),
    desc: product.notes[0][1],
  }
})

let context

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  context = gsap.context(() => {
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: root.value,
        start: 'top 78%',
        once: true,
      },
    })
    const sectionBounds = root.value.getBoundingClientRect()
    const reveals = [
      { delay: 0, direction: 'bottom' },
      { delay: 0.15, direction: 'top' },
      { delay: 0.27, direction: 'bottom' },
      { delay: 0.36, direction: 'top' },
    ]

    reveals.forEach(({ delay, direction }, index) => {
      const card = `.efs-item--${index + 1}`
      const panelWindow = root.value.querySelector(`${card} .efs-panel-window`)
      const panel = panelWindow.querySelector('.efs-panel')
      const panelBounds = panel.getBoundingClientRect()
      const fromY =
        direction === 'bottom'
          ? sectionBounds.bottom - panelBounds.bottom + 24
          : sectionBounds.top - panelBounds.top - 24

      timeline.fromTo(
        panelWindow,
        { y: fromY },
        { y: 0, duration: 1, ease: 'power3.inOut' },
        delay,
      )
      timeline.fromTo(
        `${card} .efs-img-wrap`,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.36, ease: 'power3.out' },
        delay + 0.5,
      )
      timeline.fromTo(
        `${card} .efs-annotation`,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.36, ease: 'power3.out' },
        delay + 0.64,
      )
    })
  }, root.value)
})

onBeforeUnmount(() => context?.revert())
</script>

<template>
  <section ref="root" class="efs-section" aria-labelledby="efs-title">
    <div class="efs-wrap">
      <div class="efs-bg" aria-hidden="true"></div>

      <div class="efs-header">
        <p class="efs-kicker">DOP MART · SẢN PHẨM MỚI</p>
        <h2 id="efs-title" class="efs-headline">
          <span class="efs-headline__line">NEW</span>
          <span class="efs-headline__line">RELEASE</span>
        </h2>
      </div>

      <div class="efs-brand" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <path d="M24 3.75 44.25 24 24 44.25 3.75 24 24 3.75Z" />
          <path d="M12 24h24M24 12v24" />
        </svg>
      </div>

      <ul class="efs-gallery" aria-label="Sản phẩm mới tại DOP Mart">
        <li
          v-for="(item, index) in items"
          :key="item.slug"
          class="efs-item"
          :class="`efs-item--${index + 1}`"
        >
          <div class="efs-panel-window" aria-hidden="true">
            <div class="efs-panel"></div>
          </div>
          <RouterLink
            class="efs-product"
            :to="{ name: 'product', params: { slug: item.slug } }"
          >
            <figure class="efs-img-wrap">
              <img
                class="efs-img"
                :src="item.image"
                :alt="`Bao bì ${item.name}`"
                :loading="index === 0 ? 'eager' : 'lazy'"
                decoding="async"
                width="900"
                height="900"
              />
            </figure>
            <span class="efs-annotation">
              <span class="efs-number">{{ item.number }}</span>
              <span class="efs-name">{{ item.name }}</span>
              <span class="efs-desc">{{ item.desc }}</span>
            </span>
          </RouterLink>
        </li>
      </ul>

      <div class="efs-sign">
        <span class="efs-sign-text">DOP MART</span>
        <span class="efs-sign-loc">Đồ ăn vặt · Mì ăn liền · Nước uống</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.efs-section {
  position: relative;
  width: 100%;
  height: clamp(640px, 47.222vw, 680px);
  overflow: hidden;
  background: #f4ebdd;
  color: #1c1b1a;
}

.efs-wrap {
  position: relative;
  isolation: isolate;
  width: 100%;
  max-width: 1440px;
  height: 100%;
  margin: 0 auto;
  overflow: hidden;
}

.efs-bg {
  position: absolute;
  z-index: -2;
  inset: 0;
  background-color: #f4ebdd;
  pointer-events: none;
}

.efs-bg::before,
.efs-bg::after {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
}

.efs-bg::before {
  opacity: 0.075;
  background-image: url("data:image/svg+xml,%3Csvg width='24' height='28' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 0 24 7v14l-12 7L0 21V7L12 0Z' fill='none' stroke='%231c1b1a' stroke-width='.45'/%3E%3C/svg%3E");
  background-repeat: repeat;
}

.efs-bg::after {
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg width='5' height='5' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='.35' fill='%231c1b1a'/%3E%3C/svg%3E");
  background-repeat: repeat;
}

.efs-panel-window {
  position: absolute;
  z-index: 0;
  inset: 0;
  pointer-events: none;
}

.efs-panel {
  position: absolute;
  top: 5%;
  left: -4%;
  width: 108%;
  height: 90%;
  border-radius: 0 999px 999px 0;
  background: #1c1b1a;
  transform: rotate(-4deg);
}

.efs-header {
  position: absolute;
  z-index: 4;
  top: 96px;
  left: clamp(24px, 4.45vw, 64px);
  display: block;
  width: max-content;
  max-width: 52%;
  height: auto;
  padding: 0;
  border: 0;
  background: transparent;
}

.efs-kicker {
  margin: 0 0 12px;
  color: #1c1b1a;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1.2;
  text-transform: uppercase;
}

.efs-headline {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  color: #1c1b1a;
  font-family: 'Barlow Condensed', var(--font-display), sans-serif;
  font-size: clamp(88px, 9vw, 132px);
  font-style: normal;
  font-weight: 900;
  letter-spacing: -0.045em;
  line-height: 0.88;
  text-transform: uppercase;
}

.efs-headline__line {
  display: block;
  overflow: hidden;
}

.efs-brand {
  position: absolute;
  z-index: 4;
  top: 96px;
  right: clamp(24px, 4.45vw, 64px);
  width: 36px;
  height: 36px;
  color: #c6a15b;
}

.efs-brand svg {
  display: block;
  width: 100%;
  height: 100%;
  stroke: currentColor;
  stroke-width: 1.35;
  stroke-linecap: square;
  stroke-linejoin: miter;
}

.efs-gallery {
  position: absolute;
  z-index: 2;
  inset: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.efs-item {
  position: absolute;
  display: grid;
}

.efs-product {
  position: relative;
  z-index: 1;
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 0;
  grid-template-rows: minmax(0, 1fr);
  align-items: center;
  color: #1c1b1a;
  text-decoration: none;
}

.efs-img-wrap {
  display: flex;
  min-width: 0;
  min-height: 0;
  height: 100%;
  align-items: center;
  justify-content: center;
  margin: 0;
}

.efs-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 18px 16px rgb(0 0 0 / 25%));
  transition:
    transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1),
    filter 500ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.efs-annotation {
  display: block;
  min-width: 0;
  text-align: left;
}

.efs-number {
  display: block;
  margin-bottom: 5px;
  font-family: 'Barlow Condensed', var(--font-display), sans-serif;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.025em;
  line-height: 1;
}

.efs-name {
  display: block;
  font-family: var(--font-display);
  font-size: clamp(15px, 1.25vw, 18px);
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.1;
  text-transform: uppercase;
}

.efs-desc {
  display: block;
  margin-top: 6px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

.efs-item--1 {
  top: 10%;
  left: 34%;
  width: 30%;
  height: 39%;
}

.efs-item--1 .efs-product {
  grid-template-columns: 45% 55%;
}

.efs-item--1 .efs-img-wrap {
  grid-column: 2;
  grid-row: 1;
}

.efs-item--1 .efs-annotation {
  grid-column: 1;
  grid-row: 1;
  align-self: end;
  margin: 0 0 12px;
  padding-left: 18px;
  color: #f4ebdd;
}

.efs-item--2 {
  top: 59%;
  left: 36%;
  width: 32%;
  height: 35%;
}

.efs-item--2 .efs-product {
  grid-template-columns: 52% 48%;
}

.efs-item--2 .efs-img-wrap {
  grid-column: 1;
  grid-row: 1;
}

.efs-item--2 .efs-annotation {
  grid-column: 2;
  grid-row: 1;
  padding-right: 18px;
  color: #f4ebdd;
}

.efs-item--3 {
  top: 52%;
  left: 2%;
  width: 28%;
  height: 34%;
}

.efs-item--3 .efs-product {
  grid-template-columns: 46% 54%;
}

.efs-item--3 .efs-img-wrap {
  grid-column: 1;
  grid-row: 1;
}

.efs-item--3 .efs-annotation {
  grid-column: 2;
  grid-row: 1;
  padding-right: 18px;
  color: #f4ebdd;
}

.efs-item--4 {
  top: 33%;
  right: 3%;
  width: 24%;
  height: 34%;
}

.efs-item--4 .efs-product {
  grid-template-columns: 54% 46%;
}

.efs-item--4 .efs-img-wrap {
  grid-column: 2;
  grid-row: 1;
}

.efs-item--4 .efs-annotation {
  grid-column: 1;
  grid-row: 1;
  padding-left: 18px;
  color: #f4ebdd;
}

.efs-sign {
  position: absolute;
  z-index: 4;
  right: clamp(24px, 4.45vw, 64px);
  bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  color: #1c1b1a;
  text-align: right;
}

.efs-sign-text {
  font-family: 'Barlow Condensed', var(--font-display), sans-serif;
  font-size: 23px;
  font-weight: 900;
  letter-spacing: 0.02em;
  line-height: 1;
}

.efs-sign-loc {
  margin-top: 5px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
}

.efs-product:focus-visible {
  position: relative;
  z-index: 5;
  outline: 3px solid #c6a15b;
  outline-offset: 3px;
}

@media (hover: hover) and (pointer: fine) {
  .efs-product:hover {
    transform: translateY(-2px);
  }

  .efs-product:hover .efs-img {
    transform: scale(1.04);
    filter: drop-shadow(0 22px 20px rgb(0 0 0 / 30%));
  }
}

@media (max-width: 1100px) and (min-width: 761px) {
  .efs-section {
    height: 640px;
  }

  .efs-header {
    top: 92px;
    left: 40px;
  }

  .efs-headline {
    font-size: clamp(82px, 10.8vw, 108px);
  }

  .efs-brand {
    top: 92px;
    right: 40px;
  }

  .efs-item--1 {
    top: 10%;
    left: 34%;
    width: 30%;
    height: 39%;
  }

  .efs-item--2 {
    top: 59%;
    left: 36%;
    width: 32%;
    height: 35%;
  }

  .efs-item--3 {
    top: 52%;
    left: 2%;
    width: 28%;
    height: 34%;
  }

  .efs-item--4 {
    top: 33%;
    right: 3%;
    width: 24%;
    height: 34%;
  }

  .efs-number {
    font-size: 24px;
  }

  .efs-name {
    font-size: 15px;
  }

  .efs-desc {
    font-size: 13px;
  }

  .efs-sign {
    right: 40px;
    bottom: 20px;
  }
}

@media (max-width: 760px) {
  .efs-section {
    height: auto;
    min-height: 0;
    padding: 80px 20px 60px;
  }

  .efs-wrap {
    height: auto;
    min-height: 0;
    overflow: visible;
  }

  .efs-header {
    position: relative;
    top: auto;
    left: auto;
    width: max-content;
    max-width: 80%;
    margin: 0 0 16px;
  }

  .efs-kicker {
    margin-bottom: 9px;
    font-size: 12px;
  }

  .efs-headline {
    font-size: clamp(72px, 18vw, 94px);
    line-height: 0.74;
  }

  .efs-brand {
    top: 3px;
    right: 0;
    width: 30px;
    height: 30px;
  }

  .efs-gallery {
    position: relative;
    inset: auto;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px 16px;
  }

  .efs-item {
    position: relative;
    top: auto;
    right: auto;
    bottom: auto;
    left: auto;
    width: auto;
    height: auto;
    inset: auto;
    min-width: 0;
    min-height: 270px;
  }

  .efs-panel-window {
    transform: none;
  }

  .efs-panel {
    top: 2%;
    left: -2%;
    width: 104%;
    height: 96%;
    border-radius: 0 24px 24px 0;
    transform: rotate(-2deg);
  }

  .efs-product,
  .efs-item--1 .efs-product,
  .efs-item--2 .efs-product,
  .efs-item--3 .efs-product,
  .efs-item--4 .efs-product {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 148px auto;
    align-content: start;
    gap: 8px;
  }

  .efs-img-wrap,
  .efs-item--1 .efs-img-wrap,
  .efs-item--2 .efs-img-wrap,
  .efs-item--3 .efs-img-wrap,
  .efs-item--4 .efs-img-wrap {
    grid-column: 1;
    grid-row: 1;
    height: 148px;
  }

  .efs-annotation,
  .efs-item--1 .efs-annotation,
  .efs-item--2 .efs-annotation,
  .efs-item--3 .efs-annotation,
  .efs-item--4 .efs-annotation {
    grid-column: 1;
    grid-row: 2;
    align-self: start;
    margin: 0;
    padding: 0 12px;
    color: #f4ebdd;
  }

  .efs-number {
    margin-bottom: 3px;
    font-size: 22px;
  }

  .efs-name {
    font-size: clamp(14px, 4vw, 16px);
    line-height: 1.15;
  }

  .efs-desc {
    margin-top: 4px;
    font-size: 14px;
    line-height: 1.35;
  }

  .efs-product:focus-visible,
  .efs-item--2 .efs-product:focus-visible,
  .efs-item--4 .efs-product:focus-visible {
    outline-color: #c6a15b;
  }

  .efs-sign {
    display: none;
  }
}

@media (max-width: 360px) {
  .efs-section {
    padding-right: 16px;
    padding-left: 16px;
  }

  .efs-gallery {
    gap: 16px 10px;
  }

  .efs-item {
    min-height: 274px;
  }

  .efs-name {
    font-size: 14px;
  }

  .efs-desc {
    font-size: 13px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .efs-product,
  .efs-img {
    transition: none;
  }

  .efs-product:hover,
  .efs-product:hover .efs-img {
    transform: none;
    filter: drop-shadow(0 18px 16px rgb(0 0 0 / 25%));
  }
}
</style>
