<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger.js'
import { ArrowRight } from 'lucide-vue-next'
import QuickAdd from './QuickAdd.vue'
import { useProductStore } from '../../stores/productStore'
import { useFloorStore } from '../../stores/floorStore'
gsap.registerPlugin(ScrollTrigger)
const store = useProductStore()
const floor = useFloorStore()
const root = ref(null)
/* stock is per floor; a product without stock data keeps the control live */
const stockOf = (p) => p?.stock?.[floor.floor] ?? null
/* one champion + a compact Top 2-5 instead of a 950px block for a single can */
const ranked = computed(() => store.bestSellers.slice(0, 5))
const top = computed(() => ranked.value[0])
const rest = computed(() => ranked.value.slice(1))
let ctx
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  ctx = gsap.context(() => {
    const panel = root.value?.querySelector('.spotlight-panel')
    if (!panel) return
    const product = panel.querySelector('.spotlight-product')
    const info = panel.querySelector('.spotlight-info')
    gsap
      .timeline({
        scrollTrigger: { trigger: panel, start: 'top 82%', end: 'center 55%', scrub: 1 },
      })
      .fromTo(
        product,
        { x: window.innerWidth * 0.45, rotation: 8, scale: 0.78, opacity: 0.2 },
        { x: 0, rotation: 0, scale: 1, opacity: 1, ease: 'none' }
      )
      .fromTo(info, { x: 110, opacity: 0 }, { x: 0, opacity: 1, ease: 'none' }, 0.18)
    const rows = gsap.utils.toArray('.top-row')
    if (rows.length) {
      gsap.from(rows, {
        y: 26,
        opacity: 0,
        stagger: 0.08,
        scrollTrigger: { trigger: '.top-list', start: 'top 92%', end: 'top 62%', scrub: 1 },
      })
    }
  }, root.value)
})
onBeforeUnmount(() => ctx?.revert())
</script>
<template>
  <section ref="root" class="bestseller-story">
    <div class="story-intro">
      <span>OFFICE FAVORITE · TOP 1</span>
      <h2>Món được<br />săn nhiều nhất.</h2>
      <p>Món đứng đầu bảng tuần này — kèm tồn kho thật tại tầng bạn nhận.</p>
    </div>
    <article v-if="top" class="spotlight-panel" :style="{ '--spot-color': top.color }">
      <div class="spotlight-rank"><small>OFFICE FAVORITE</small><b>#1</b></div>
      <div class="spotlight-stage">
        <div class="spotlight-word" aria-hidden="true">DOP<br />PICK</div>
        <img
          class="spotlight-product"
          :src="top.image"
          :alt="top.name"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div class="spotlight-info">
        <span>{{ top.categoryName }} · TOP 1</span>
        <h3>{{ top.name }}</h3>
        <div class="spotlight-rating">
          <span aria-hidden="true">★★★★★</span>
          <small>{{ top.rating }} · {{ top.sold }} đã bán</small>
        </div>
        <p>{{ top.description }}</p>
        <strong>{{ top.price.toLocaleString('vi-VN') }} ₫</strong>
        <div class="spotlight-actions">
          <QuickAdd :product="top" :stock="stockOf(top)" />
          <RouterLink :to="`/product/${top.slug}`">Xem chi tiết <ArrowRight :size="16" /></RouterLink>
        </div>
      </div>
    </article>
    <ol v-if="rest.length" class="top-list">
      <li v-for="(product, i) in rest" :key="product.id" class="top-row">
        <b class="top-rank">#{{ i + 2 }}</b>
        <img :src="product.image" :alt="product.name" loading="lazy" decoding="async" />
        <span class="top-name">
          <b>{{ product.name }}</b>
          <small>{{ product.categoryName }} · {{ product.sold }} đã bán</small>
        </span>
        <span class="top-price">{{ product.price.toLocaleString('vi-VN') }} ₫</span>
        <QuickAdd :product="product" :stock="stockOf(product)" variant="icon" />
      </li>
    </ol>
    <RouterLink class="spotlight-all" to="/best-sellers">
      Bảng bán chạy đầy đủ <ArrowRight />
    </RouterLink>
  </section>
</template>
