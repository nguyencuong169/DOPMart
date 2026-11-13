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
  color: var(--fresh-ink);
  background:
    radial-gradient(ellipse 120% 65% at 50% 62%, #ffffff 0%, #ffffff 48%, transparent 78%),
    repeating-conic-gradient(
      from -7deg at 50% 40%,
      #315e360a 0deg 5deg,
      transparent 5deg 12deg
    ),
    #ffffff;
}

.new-strip::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.13;
  background-image:
    radial-gradient(#315e36 1.1px, transparent 1.4px),
    radial-gradient(#315e36 1.1px, transparent 1.4px);
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
  content: none;
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
  background: transparent;
}

.new-strip :deep(.cat-card) {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 22px;
  background: transparent;
  box-shadow: none;
}

.new-strip :deep(.cat-card)::before,
.new-strip :deep(.cat-card)::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.new-strip :deep(.cat-card)::before {
  inset: 58% -10% -8%;
  z-index: 0;
  background: linear-gradient(155deg, #33754a 0%, var(--fresh-green) 100%);
  clip-path: polygon(0 18%, 15% 11%, 34% 16%, 51% 5%, 68% 13%, 84% 8%, 100% 14%, 100% 100%, 0 100%);
  filter: drop-shadow(0 6px 6px #001b1466);
}

.new-strip :deep(.cat-card)::after {
  z-index: 1;
  opacity: 0.56;
  filter: blur(1.5px);
  background:
    radial-gradient(circle at 8% 69%, transparent 0 4px, #f8d68b 4.5px 5.5px, #e94d3c 6px 14px, transparent 15px),
    radial-gradient(circle at 92% 54%, transparent 0 3px, #f8d68b 3.5px 4.5px, #e94d3c 5px 11px, transparent 12px),
    radial-gradient(ellipse at 91% 77%, #b4d45a 0 6px, transparent 7px),
    radial-gradient(ellipse at 5% 48%, #b4d45a 0 8px, transparent 9px);
}

.new-strip :deep(.cat-card__head) {
  z-index: 1;
  opacity: 1;
}

.new-strip :deep(.cat-card__line:first-child) {
  top: max(0px, calc(4cqw - 12px));
  transform: none;
  color: color-mix(in srgb, var(--c) 86%, var(--ink));
}

.new-strip :deep(.cat-card__line:last-child) {
  top: max(0px, calc(28cqw - 12px));
  transform: none;
  color: transparent;
  -webkit-text-stroke: clamp(1.5px, 0.5cqw, 3.5px) var(--ink);
}

.new-strip :deep(.cat-card__stage) {
  padding-top: 132%;
}

.new-strip :deep(.cat-card__shot) {
  top: calc(32cqw + 12px);
  width: 76%;
}

.new-strip :deep(.cat-card__ground) {
  top: 112cqw;
}

.new-strip :deep(.cat-card__stage)::after {
  content: "vừa lên kệ";
  position: absolute;
  top: 56cqw;
  right: 7%;
  z-index: 3;
  color: var(--fresh-green);
  font-family: "Segoe Script", "Comic Sans MS", cursive;
  font-size: clamp(10px, 3.4cqw, 15px);
  font-style: italic;
  transform: rotate(-8deg);
  pointer-events: none;
}

.new-strip :deep(.cat-card__tag--new) {
  border-color: #eaf3c9;
  border-radius: 999px 999px 999px 5px;
  background: #4f7f35;
  color: #fffdf2;
  box-shadow: 2px 3px 0 #102719;
  transform: rotate(-6deg);
}

.new-strip :deep(.cat-card__tag--new::before),
.new-strip :deep(.cat-card__tag--new::after) {
  content: none;
}

.new-strip :deep(.cat-card__tag--price) {
  border-color: #eaf3c9;
  border-radius: 999px 999px 5px 999px;
  background: #a7ca43;
  color: #172b1e;
  box-shadow: 2px 3px 0 #102719;
}

.new-strip :deep(.cat-card__buy) {
  bottom: 1cqw;
  z-index: 6;
}

.new-strip :deep(.cat-card__buy .qa--row) {
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

@container (max-width: 280px) {
  .new-strip :deep(.cat-card__buy .qa__qty) {
    gap: 2px;
    padding: 2px 4px;
  }

  .new-strip :deep(.cat-card__buy .qa__step) {
    width: 24px;
    height: 24px;
  }

  .new-strip :deep(.cat-card__buy .qa__n) {
    min-width: 16px;
    font-size: 12px;
  }

  .new-strip :deep(.cat-card__buy .qa__go) {
    width: 38px;
    height: 38px;
    padding: 0;
    font-size: 0;
  }
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
