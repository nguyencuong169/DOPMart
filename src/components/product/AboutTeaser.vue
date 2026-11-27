<script setup>
import { computed } from 'vue'
import { useProductStore } from '../../stores/productStore'
import { FLOORS } from '../../stores/floorStore'
import { ArrowRight } from 'lucide-vue-next'

const catalog = useProductStore()
const stats = computed(() => {
  const pad = n => String(n).padStart(2, '0')
  return [
    { n: pad(FLOORS.length), label: 'tầng phục vụ' },
    { n: pad(catalog.categories.length), label: 'kệ hàng' },
    { n: String(catalog.products.length), label: 'món sẵn kệ' },
  ]
})
const titleWords = computed(() =>
  'Bận rộn không có nghĩa là phải bỏ qua món mình thích.'.split(' ')
)
</script>

<template>
  <section class="about-teaser">
    <div class="about-teaser__noise" aria-hidden="true"></div>
    <div class="about-teaser__inner">
      <div class="about-teaser__copy">
        <h1 class="about-teaser__title">
          <span v-for="(word, i) in titleWords" :key="i" :style="{ '--i': i }">{{ word }} </span>
        </h1>
        <p class="about-teaser__lead">
          Snack station nội bộ cho dân văn phòng: chọn trong 30 giây, nhận ngay tại tầng 14 hoặc 20
          — không shipper, không chờ đợi.
        </p>
        <div class="about-teaser__stats">
          <span v-for="s in stats" :key="s.label" :style="{ '--i': s.label }">
            <b>{{ s.n }}</b> {{ s.label }}
          </span>
        </div>
        <div class="about-teaser__cta-group">
          <a href="/about" class="about-teaser__cta about-teaser__cta--story" @click.self>
            Câu chuyện DOP Mart <ArrowRight :size="20" />
          </a>
          <button type="button" class="about-teaser__cta about-teaser__cta--order" @click.self>
            Đặt hàng ngay <ArrowRight :size="20" />
          </button>
        </div>
      </div>
      <div class="about-teaser__image">
        <img
          src="@/assets/products/drinks.webp"
          alt="Soda trái cây 330ml — một trong các món sẵn có tại DOP Mart"
          width="640"
          height="640"
          loading="eager"
          fetchpriority="high"
          decoding="async"
        />
      </div>
    </div>
  </section>
</template>
<style scoped>
.about-teaser {
  position: relative;
  isolation: isolate;
  background: var(--cream);
  color: var(--ink);
  padding: var(--sp-6) 0;
  overflow: hidden;
}

.about-teaser__noise {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.03;
  pointer-events: none;
  background-image: radial-gradient(#1a1a1a 0.6px, transparent 0.6px);
  background-size: 14px 14px;
}

.about-teaser__inner {
  position: relative;
  z-index: 2;
  max-width: var(--container);
  margin: 0 auto;
  padding: 0 var(--edge);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-5);
  align-items: center;
}

/* ---------- Headline ---------- */
.about-teaser__title {
  margin: 0 0 var(--sp-3) 0;
  font-family: var(--font-display);
  font-size: clamp(var(--fs-xl), 7vw, var(--fs-hero));
  font-weight: 900;
  line-height: var(--lh-display);
  letter-spacing: -0.02em;
  text-transform: uppercase;
  color: var(--ink);
  max-width: 65ch;
  opacity: 1;
  transition:
    opacity 400ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 400ms cubic-bezier(0.23, 1, 0.32, 1);
  transition-delay: 300ms;

  @starting-style {
    opacity: 0;
    transform: translateY(12%);
  }

  span {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    min-width: 48px;
    text-align: center;
    padding: 6px 10px;
    font-family: var(--font-ui);
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--ink);
    border-radius: var(--r-sm);
    transition-delay: calc(var(--i) * 50ms);
  }
}

/* ---------- Lead ---------- */
.about-teaser__lead {
  margin: 0 0 var(--sp-3) 0;
  font-size: var(--fs-lg);
  line-height: var(--lh-body);
  color: var(--ink);
  max-width: 60ch;
  opacity: 1;
  transition:
    opacity 400ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 400ms cubic-bezier(0.23, 1, 0.32, 1);
  transition-delay: 360ms;

  @starting-style {
    opacity: 0;
    transform: translateY(12%);
  }
}

/* ---------- Stats ---------- */
.about-teaser__stats {
  display: flex;
  gap: var(--sp-3);
  flex-wrap: wrap;
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 400ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 400ms cubic-bezier(0.23, 1, 0.32, 1);
  transition-delay: 420ms;

  @starting-style {
    opacity: 0;
    transform: translateY(12%);
  }

  span {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    min-width: 48px;
    text-align: center;
    padding: 6px 10px;
    font-family: var(--font-ui);
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--ink);
    border-radius: var(--r-sm);
    transition-delay: calc(var(--i) * 50ms);
  }

  b {
    font-family: var(--font-display);
    font-size: clamp(var(--fs-lg), 3vw, var(--fs-xl));
    font-weight: 900;
    color: var(--red);
    line-height: 1;
    margin-bottom: 2px;
  }
}
/* ---------- CTAs ---------- */
.about-teaser__cta-group {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 400ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 400ms cubic-bezier(0.23, 1, 0.32, 1);
  transition-delay: 420ms;

  @starting-style {
    opacity: 0;
    transform: translateY(12%);
  }
}

.about-teaser__cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: var(--sp-2) var(--sp-4);
  border-radius: var(--r-md);
  font-family: var(--font-ui);
  font-weight: 700;
  font-size: var(--fs-lg);
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 160ms cubic-bezier(0.23, 1, 0.32, 1),
    box-shadow 160ms cubic-bezier(0.23, 1, 0.32, 1);
}

.about-teaser__cta--story {
  border: var(--storefront-border);
  background: var(--ink);
  color: #fff;
  box-shadow: var(--shadow);
}

.about-teaser__cta--order {
  border: none;
  background: var(--red);
  color: #fff;
  box-shadow: var(--shadow);
}

.about-teaser__cta:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--ink);
}

.about-teaser__cta:active {
  transform: scale(0.97);
  box-shadow: 2px 2px 0 var(--ink);
}

.about-teaser__cta:focus-visible {
  outline: 3px solid var(--ink);
  outline-offset: 2px;
}

/* ---------- Image ---------- */
.about-teaser__image {
  position: relative;
  z-index: 2;
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 500ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 500ms cubic-bezier(0.23, 1, 0.32, 1);
  transition-delay: 480ms;

  @starting-style {
    opacity: 0;
    transform: translateY(14%);
  }

  img {
    width: 100%;
    height: auto;
    border-radius: var(--r-md);
    box-shadow: var(--e3);
    display: block;
    transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1);
  }

  img:hover {
    transform: scale(1.02);
  }
}

@media (prefers-reduced-motion: reduce) {
  .about-teaser__title,
  .about-teaser__title > span,
  .about-teaser__lead,
  .about-teaser__stats,
  .about-teaser__cta-group,
  .about-teaser__image {
    transition: none;
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 900px) {
  .about-teaser__inner {
    grid-template-columns: 1fr;
  }
  .about-teaser__image {
    order: -1;
  }
  .about-teaser__cta-group {
    flex-direction: column;
  }
  .about-teaser__cta--story,
  .about-teaser__cta--order {
    width: 100%;
    justify-content: center;
  }
}
</style>
