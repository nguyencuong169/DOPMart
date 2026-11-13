<script setup>
import SectionHeader from "../common/SectionHeader.vue";
import ProductGrid from "./ProductGrid.vue";
defineProps({ products: { type: Array, default: () => [] } });
</script>
<template>
  <section class="new-strip">
    <SectionHeader
      kicker="FRESH DROP · MỚI LÊN KỆ"
      title="Thử trước đồng nghiệp"
      lead="Những món vừa cập bến kệ DOP Mart trong tuần này — số lượng còn ít."
      cta="Bắt món mới"
      to="/new"
    />
    <div class="new-strip__stage">
      <ProductGrid :products="products.slice(0, 4)" variant="shelf" />
    </div>
  </section>
</template>

<style scoped>
.new-strip {
  --ink: #1a1a1a;
  --cream: #fffaf0;
  --fd: var(--font-display, "Bricolage Grotesque", system-ui, sans-serif);
  --fresh-ink: #17251b;
  --fresh-green: #0e5934;
  --fresh-paper: #fff9ed;
  --fresh-yellow: #ffd338;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding-top: clamp(32px, 4vw, 56px);
  color: var(--fresh-paper);
  background:
    radial-gradient(ellipse at 50% 38%, #469344 0%, #1c713f 30%, transparent 68%),
    repeating-conic-gradient(
      from -7deg at 50% 40%,
      #f3ffe015 0deg 5deg,
      transparent 5deg 12deg
    ),
    linear-gradient(145deg, #0d6038 0%, #08452d 76%, #063b28 100%);
}

.new-strip::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.48;
  background-image:
    radial-gradient(#f5ffe7 1.1px, transparent 1.4px),
    radial-gradient(#f5ffe7 1.1px, transparent 1.4px);
  background-size: 180px 220px, 210px 240px;
  background-position: top left, bottom right;
  background-repeat: no-repeat;
}

.new-strip :deep(.section-head) {
  position: relative;
  z-index: 1;
  align-items: center;
  gap: clamp(20px, 3vw, 40px);
  margin: 0 var(--edge, clamp(20px, 5vw, 76px)) clamp(18px, 2.5vw, 32px);
}

.new-strip :deep(.section-head__copy) {
  position: relative;
  z-index: 0;
  max-width: 700px;
  padding: clamp(16px, 2.2vw, 26px) clamp(22px, 3vw, 38px);
  color: var(--fresh-ink);
}

.new-strip :deep(.section-head__copy)::before {
  content: "";
  position: absolute;
  inset: 0 -10px;
  z-index: -1;
  background: var(--fresh-paper);
  clip-path: polygon(1% 9%, 11% 5%, 25% 7%, 40% 1%, 61% 5%, 78% 0, 99% 7%, 96% 88%, 83% 92%, 67% 88%, 48% 98%, 28% 91%, 12% 100%, 0 87%);
  filter: drop-shadow(4px 5px 0 #062d20);
}

.new-strip :deep(.section-head .kicker) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 7px;
  color: var(--fresh-green);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.16em;
}

.new-strip :deep(.section-head .kicker)::before {
  content: "✳";
  color: #d34b2b;
  font-size: 17px;
}

.new-strip :deep(.section-head h2) {
  color: var(--fresh-green);
  font-family: "Barlow Condensed", var(--font-display), sans-serif;
  font-size: clamp(38px, 5.2vw, 68px);
  font-style: italic;
  font-weight: 900;
  letter-spacing: -0.035em;
  line-height: 0.94;
  text-transform: uppercase;
  text-wrap: balance;
}

.new-strip :deep(.section-head p) {
  max-width: 48ch;
  margin-top: 8px;
  color: #344536;
  font-weight: 600;
}

.new-strip :deep(.section-head > a) {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  border-color: var(--fresh-ink);
  background: var(--fresh-yellow);
  color: var(--fresh-ink);
  box-shadow: 4px 4px 0 var(--fresh-ink);
}

.new-strip :deep(.section-head > a:hover) {
  background: #fff2bd;
}

.new-strip :deep(.product-grid) {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 456px));
  justify-content: center;
  gap: 24px;
  max-width: min(100%, 1600px);
  margin: 0 auto;
  padding: 0 var(--edge, clamp(20px, 5vw, 76px)) 8px;
}

.new-strip__stage {
  position: relative;
  z-index: 1;
  padding-bottom: clamp(28px, 4vw, 48px);
}

.new-strip :deep(.cat-card__stage) {
  padding-top: 132%;
}

.new-strip :deep(.cat-card__shot) {
  top: 15cqw;
  width: 78%;
}

.new-strip :deep(.cat-card__ground) {
  top: 82cqw;
}

.new-strip :deep(.cat-card__line:last-child) {
  top: 78cqw;
}

.new-strip :deep(.cat-card__tag--new) {
  background: var(--fresh-yellow);
  color: var(--ink);
}

@media (max-width: 980px) {
  .new-strip :deep(.product-grid) {
    grid-template-columns: repeat(2, minmax(0, 456px));
    gap: 52px 24px;
  }
}

@media (max-width: 760px) {
  .new-strip :deep(.section-head) {
    align-items: flex-start;
    flex-direction: column;
    gap: 20px;
  }

  .new-strip :deep(.section-head__copy) {
    padding: 18px 22px;
  }
}

@media (max-width: 520px) {
  .new-strip :deep(.section-head) {
    margin-bottom: 14px;
  }

  .new-strip :deep(.product-grid) {
    gap: 36px 14px;
    padding-inline: 16px;
  }
}
</style>
