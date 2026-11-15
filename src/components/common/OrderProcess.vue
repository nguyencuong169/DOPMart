<script setup>
import { Search, ShoppingBag, QrCode, PackageCheck } from "lucide-vue-next";
const steps = [
  {
    n: "01",
    icon: Search,
    title: "Chọn món",
    text: "Chọn món theo mood hoặc tầng nhận.",
  },
  {
    n: "02",
    icon: ShoppingBag,
    title: "Thêm vào giỏ",
    text: "Thêm nhanh, chỉnh số lượng trong một chạm.",
  },
  {
    n: "03",
    icon: QrCode,
    title: "Quét QR",
    text: "Quét QR và xác nhận thanh toán.",
  },
  {
    n: "04",
    icon: PackageCheck,
    title: "Nhận hàng",
    text: "Nhận món tại Tầng 14 hoặc Tầng 20.",
  },
];
</script>
<template>
  <section id="how-it-works" class="process-lab">
    <div class="process-lab-head">
      <span>HOW IT WORKS</span>
      <h2>Đói → chọn → quét → nhận.</h2>
    </div>
    <div class="process-path">
      <svg viewBox="0 0 1200 260" preserveAspectRatio="none" aria-hidden="true">
        <path d="M40 150 C220 20 330 235 500 110 S800 30 930 145 S1080 220 1160 85" />
      </svg>
      <article
        v-for="step in steps"
        :key="step.n"
        class="process-node"
      >
        <b class="process-node__n" aria-hidden="true">{{ step.n }}</b>
        <div class="node-orb">
          <component :is="step.icon" width="24" height="24" /><span>{{ step.n }}</span>
        </div>
        <h3>{{ step.title }}</h3>
        <p>{{ step.text }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.process-node:focus-visible {
  outline: 3px solid var(--ink, #1a1a1a);
  outline-offset: 2px;
}
.process-node h3 {
  line-height: 1.1;
}
.process-node p {
  line-height: 1.5;
  max-width: 45ch;
  text-wrap: pretty;
}
</style>

