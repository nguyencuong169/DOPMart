<script setup>
import { ArrowRight, MapPin, Sparkles } from "lucide-vue-next";
import AboutDopMart from "../components/common/AboutDopMart.vue";
import FeedbackSection from "../components/common/FeedbackSection.vue";
</script>
<template>
  <main class="about-view">
    <header class="view-hero view-hero--ink">
      <div class="view-hero__copy">
        <span class="kicker">ABOUT DOP MART</span>
        <h1>Mini mart.<br /><em>Big happy.</em></h1>
        <p>
          DOP Mart là snack station nội bộ cho dân văn phòng: 32 món được chọn lọc, đặt trong
          30 giây và nhận ngay tại tầng — không shipper, không chờ đợi.
        </p>
        <div class="view-hero__meta">
          <span><MapPin :size="14" /> Tầng 14 &amp; tầng 20</span>
          <span><Sparkles :size="14" /> 32 món · 8 danh mục</span>
        </div>
      </div>
    </header>
    <AboutDopMart />
    <FeedbackSection />
    <section class="view-cta">
      <h2>Sẵn sàng cho giờ nghỉ ngon hơn?</h2>
      <RouterLink to="/products" class="primary">Mở tủ snack <ArrowRight :size="16" /></RouterLink>
    </section>
  </main>
</template>
