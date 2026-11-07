<script setup>
import { Search, ShoppingBag, QrCode, PackageCheck, ArrowRight } from "lucide-vue-next";
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
      <p>
        Không form dài. Không địa chỉ giao hàng phức tạp. Chỉ bốn nhịp đúng với văn phòng.
      </p>
      <RouterLink to="/how-it-works" class="process-lab-link">
        Bốn nhịp đặt hàng <ArrowRight :size="15" />
      </RouterLink>
    </div>
    <div class="process-path">
      <svg viewBox="0 0 1200 260" preserveAspectRatio="none" aria-hidden="true">
        <path d="M40 150 C220 20 330 235 500 110 S800 30 930 145 S1080 220 1160 85" />
      </svg>
      <article
        v-for="(step, i) in steps"
        :key="step.n"
        class="process-node"
        :class="`node-${i + 1}`"
      >
        <div class="node-orb">
          <component :is="step.icon" /><span>{{ step.n }}</span>
        </div>
        <h3>{{ step.title }}</h3>
        <p>{{ step.text }}</p>
      </article>
    </div>
    <RouterLink to="/products" class="process-final"
      >Bắt đầu với món đầu tiên <ArrowRight
    /></RouterLink>
  </section>
</template>
