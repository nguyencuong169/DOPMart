<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger.js'
import { ArrowRight, Trophy } from 'lucide-vue-next'
import { cn } from 'cn'
import QuickAdd from './QuickAdd.vue'
import { Card } from '@/components/ui/card'
import { CardContent } from '@/components/ui/card'
import { CardHeader } from '@/components/ui/card'
import { CardTitle } from '@/components/ui/card'
import { CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useProductStore } from '../../stores/productStore'
import { useFloorStore } from '../../stores/floorStore'
gsap.registerPlugin(ScrollTrigger)

const store = useProductStore()
const floor = useFloorStore()
const root = ref(null)
const stockOf = (p) => p?.stock?.[floor.floor] ?? null
const ranked = computed(() => store.bestSellers.slice(0, 5))
const top = computed(() => ranked.value[0])
const rest = computed(() => ranked.value.slice(1))

let ctx
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  ctx = gsap.context(() => {
    const track = root.value?.querySelector('.bs-rank__track')
    if (!track) return
    const cards = gsap.utils.toArray('.bs-rank__card')
    if (cards.length) {
      gsap.from(cards, {
        y: 60,
        opacity: 0,
        rotation: 8,
        stagger: 0.1,
        scrollTrigger: {
          trigger: track,
          start: 'top 88%',
          end: 'top 55%',
          scrub: 1,
        },
      })
    }
  }, root.value)
})
onBeforeUnmount(() => ctx?.revert())
</script>
<template>
  <section ref="root" class="bs-rank">
    <header class="bs-rank__intro">
      <span class="bs-rank__kicker"><Trophy :size="13" /> BẢNG XẾP HẠNG TUẦN NÀY</span>
      <h2 class="bs-rank__title">Món được<br />săn nhiều nhất.</h2>
      <p class="bs-rank__lead">#1 nổi bật chính giữa — những hạng sau xếp ngang nhau bên cạnh.</p>
    </header>

    <div class="bs-rank__track" aria-label="Top 5 bán chạy tuần này">
      <article v-if="top" class="bs-rank__card bs-rank__card--champ" :style="{ '--c': top.color }">
        <div class="bs-rank__champ-badge">#1</div>
        <Card class="bs-rank__champ-card" :class="cn('relative z-10')">
          <CardHeader class="bs-rank__champ-header">
            <div class="flex items-center gap-4">
              <Badge class="bs-rank__champ-rank-badge">#1 BEST SELLER</Badge>
              <span class="bs-rank__champ-cat">{{ top.categoryName }}</span>
            </div>
            <CardTitle class="bs-rank__champ-title">{{ top.name }}</CardTitle>
          </CardHeader>
          <CardContent class="bs-rank__champ-content">
            <div class="flex flex-col gap-3">
              <img class="bs-rank__champ-img" :src="top.image" :alt="top.name" loading="lazy" decoding="async" />
              <div class="bs-rank__champ-meta">
                <span class="bs-rank__champ-rating">
                  <span aria-hidden="true">★★★★★</span>
                  <small>{{ top.rating }} · {{ top.sold }} đã bán</small>
                </span>
                <strong class="bs-rank__champ-price">{{ top.price.toLocaleString('vi-VN') }} <small>₫</small></strong>
              </div>
            </div>
          </CardContent>
          <CardFooter class="bs-rank__champ-footer">
            <div class="flex items-center justify-between gap-3">
              <QuickAdd :product="top" :stock="stockOf(top)" />
              <Button as="a" :href="`/product/${top.slug}`" class="bs-rank__champ-detail">
                Xem chi tiết <ArrowRight :size="14" data-icon="inline-end" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </article>

      <article
        v-for="(product, i) in rest"
        :key="product.id"
        class="bs-rank__card bs-rank__card--runner"
        :style="{ '--c': product.color }"
      >
        <Card class="bs-rank__runner-card" :class="cn('relative z-10')">
          <CardHeader class="bs-rank__runner-header">
            <div class="flex items-center gap-2">
              <Badge class="bs-rank__runner-rank-badge">#{{ i + 2 }}</Badge>
              <span class="bs-rank__runner-cat">{{ product.categoryName }}</span>
            </div>
          </CardHeader>
          <CardContent class="bs-rank__runner-content">
            <div class="flex flex-col gap-2">
              <img class="bs-rank__runner-img" :src="product.image" :alt="product.name" loading="lazy" decoding="async" />
              <CardTitle class="bs-rank__runner-title">{{ product.name }}</CardTitle>
              <div class="bs-rank__runner-meta">
                <strong class="bs-rank__runner-price">{{ product.price.toLocaleString('vi-VN') }} ₫</strong>
              </div>
            </div>
          </CardContent>
          <CardFooter class="bs-rank__runner-footer">
            <QuickAdd :product="product" :stock="stockOf(product)" variant="icon" />
          </CardFooter>
        </Card>
      </article>
    </div>

    <Separator class="bs-rank__sep" />
    <Button class="bs-rank__all" as="a" to="/best-sellers">
      Xem bảng bán chạy đầy đủ <ArrowRight :size="14" data-icon="inline-end" />
    </Button>
  </section>
</template>

<style scoped>
/* ── Section ── */
.bs-rank {
  position: relative;
  overflow: hidden;
  background: var(--cream);
  color: var(--ink);
  padding: calc(var(--section-y) - 16px) var(--edge) var(--section-y);
}
.bs-rank__intro {
  margin-bottom: var(--s5);
  position: relative;
  z-index: 50;
}
.bs-rank__kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--fs-meta);
  font-weight: 900;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--sun);
}
.bs-rank__title {
  margin: 14px 0 6px;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(56px, 10vw, 120px);
  line-height: 0.82;
  letter-spacing: -0.08em;
  text-transform: uppercase;
  color: var(--ink);
  transform: rotate(-1.5deg);
}
.bs-rank__lead {
  margin: 0;
  font-size: var(--fs-sm);
  line-height: var(--lh-body);
  color: var(--on-cream);
  max-width: 48ch;
}

/* ── Track: horizontal row ── */
.bs-rank__track {
  display: flex;
  gap: var(--s3);
  overflow-x: auto;
  padding-bottom: 24px;
  scrollbar-width: none;
  margin-top: var(--s4);
}
.bs-rank__track::-webkit-scrollbar {
  display: none;
}

/* ── #1 Champion card ── */
.bs-rank__card--champ {
  flex: 0 0 auto;
  width: min(460px, 94vw);
  position: relative;
  overflow: hidden;
}
.bs-rank__champ-badge {
  position: absolute;
  top: -14px;
  left: -14px;
  background: var(--sun);
  color: var(--ink);
  border: var(--bw-bold) solid var(--ink);
  border-radius: var(--r-pill);
  padding: 7px 22px;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(24px, 5vw, 36px);
  letter-spacing: -0.02em;
  box-shadow: 5px 5px 0 var(--ink);
  z-index: 20;
  transform: rotate(-3deg);
}
.bs-rank__champ-card {
  background: var(--paper) !important;
  border: var(--bw-bold) solid var(--ink) !important;
  border-radius: var(--radius) !important;
  box-shadow: 12px 12px 0 var(--ink) !important;
  overflow: visible !important;
}
.bs-rank__champ-header {
  gap: 8px !important;
  padding-bottom: 0 !important;
}
.bs-rank__champ-rank-badge {
  background: var(--sun) !important;
  color: var(--ink) !important;
  border: var(--bw-bold) solid var(--ink) !important;
  font-family: var(--font-display);
  font-weight: 900;
  box-shadow: 3px 3px 0 var(--ink);
}
.bs-rank__champ-cat {
  font-size: var(--fs-xs);
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--on-cream);
  margin-top: 2px;
}
.bs-rank__champ-title {
  font-family: var(--font-display) !important;
  font-weight: 900 !important;
  font-size: clamp(24px, 5vw, 40px) !important;
  line-height: 1.08 !important;
  letter-spacing: -0.03em !important;
  color: var(--ink) !important;
  margin: 6px 0 0 !important;
  transform: rotate(-0.5deg);
}
.bs-rank__champ-content {
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 0 !important;
}
.bs-rank__champ-img {
  width: 100%;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 20px 20px #0005);
  transform: rotate(-2deg);
  margin-bottom: 8px;
}
.bs-rank__champ-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bs-rank__champ-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ink);
}
.bs-rank__champ-rating small {
  color: var(--on-cream);
}
.bs-rank__champ-price {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(22px, 4vw, 30px);
  letter-spacing: -0.02em;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.bs-rank__champ-price small {
  font-size: 0.55em;
  font-weight: 800;
}
.bs-rank__champ-footer {
  padding-top: 0 !important;
  border-top: none !important;
  background: transparent !important;
  border-radius: 0 0 var(--radius) var(--radius) !important;
}
.bs-rank__champ-detail {
  min-height: 46px;
  padding: 0 16px;
  font-size: var(--fs-sm);
  font-weight: 900;
  text-decoration: underline;
  text-underline-offset: 3px;
  color: var(--ink);
  background: var(--sun) !important;
  border: var(--bw-bold) solid var(--ink) !important;
  box-shadow: 4px 4px 0 var(--ink) !important;
}
.bs-rank__champ-detail:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--ink);
}

/* ── Runners: same row, smaller ── */
.bs-rank__card--runner {
  flex: 0 0 auto;
  width: min(260px, 84vw);
  position: relative;
  overflow: hidden;
}
.bs-rank__runner-card {
  background: var(--paper) !important;
  border: var(--bw-bold) solid var(--ink) !important;
  border-radius: var(--radius) !important;
  box-shadow: 7px 7px 0 var(--ink) !important;
  overflow: visible !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.bs-rank__runner-card:hover {
  transform: translateY(-4px);
  box-shadow: 11px 11px 0 var(--ink);
}
.bs-rank__runner-header {
  gap: 6px !important;
  padding-bottom: 0 !important;
}
.bs-rank__runner-rank-badge {
  background: color-mix(in srgb, var(--ink) 75%, transparent) !important;
  color: #fff !important;
  border: var(--bw-bold) solid var(--ink) !important;
  font-family: var(--font-display);
  font-weight: 900;
  box-shadow: 3px 3px 0 var(--ink);
}
.bs-rank__runner-cat {
  font-size: var(--fs-xs);
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--on-cream);
  margin-top: 1px;
}
.bs-rank__runner-content {
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 0 !important;
}
.bs-rank__runner-img {
  width: 100%;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 12px 12px #0004);
  margin-bottom: 6px;
}
.bs-rank__runner-title {
  font-family: var(--font-display) !important;
  font-weight: 900 !important;
  font-size: clamp(16px, 2.8vw, 20px) !important;
  line-height: 1.15 !important;
  letter-spacing: -0.02em !important;
  color: var(--ink) !important;
  margin: 0 !important;
}
.bs-rank__runner-meta {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 4px;
}
.bs-rank__runner-price {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(15px, 2.6vw, 19px);
  letter-spacing: -0.01em;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.bs-rank__runner-footer {
  padding-top: 0 !important;
  border-top: none !important;
  background: transparent !important;
  border-radius: 0 0 var(--radius) var(--radius) !important;
  padding-bottom: 12px !important;
}

/* ── Separator ── */
.bs-rank__sep {
  margin: var(--s5) 0 var(--s3);
  border: none !important;
  border-top: var(--bw-bold) solid var(--ink) !important;
  background: transparent !important;
}

/* ── CTA ── */
.bs-rank__all {
  min-height: 52px;
  padding: 0 26px;
  border: var(--bw-bold) solid var(--ink) !important;
  border-radius: var(--r-pill) !important;
  background: var(--sun) !important;
  color: var(--ink) !important;
  font-weight: 900 !important;
  text-decoration: none;
  box-shadow: 4px 4px 0 var(--ink) !important;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.bs-rank__all:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--ink);
}
.bs-rank__all:active {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 var(--ink);
}

/* ── Responsive ── */
@media (max-width: 1100px) {
  .bs-rank__track {
    gap: var(--s2);
    margin-top: var(--s3);
  }
  .bs-rank__card--champ {
    width: min(380px, 94vw);
  }
  .bs-rank__card--runner {
    width: min(230px, 88vw);
  }
}
@media (max-width: 750px) {
  .bs-rank__title {
    font-size: clamp(40px, 14vw, 72px);
  }
  .bs-rank__track {
    gap: 14px;
    margin-top: var(--s2);
  }
  .bs-rank__card--champ {
    width: min(300px, 96vw);
  }
  .bs-rank__card--runner {
    width: min(200px, 96vw);
  }
  .bs-rank__champ-title {
    font-size: clamp(20px, 5vw, 30px) !important;
  }
  .bs-rank__runner-title {
    font-size: clamp(15px, 2.6vw, 18px) !important;
  }
}
@media (prefers-reduced-motion: reduce) {
  .bs-rank__runner-card {
    transition: none;
  }
  .bs-rank__runner-card:hover {
    transform: none;
    box-shadow: 7px 7px 0 var(--ink);
  }
}
</style>
