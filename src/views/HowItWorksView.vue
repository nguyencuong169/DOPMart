<script setup>
import { ArrowRight, MapPin } from "lucide-vue-next";
import OrderProcess from "../components/common/OrderProcess.vue";

const faqs = [
  {
    q: "Làm sao để kiểm tra đơn?",
    a: "Mở giỏ hàng để xem lại món, số lượng và tổng tiền trước khi chọn điểm nhận.",
  },
  {
    q: "Thanh toán bằng cách nào?",
    a: "Thanh toán QR trên DOP Mart chưa khả dụng. Bạn vẫn có thể xem giỏ hàng và tổng tiền.",
  },
  {
    q: "Nhận hàng ở đâu?",
    a: "Bạn có thể chọn tầng 14 hoặc tầng 20 ở mục Vị trí nhận trên trang thanh toán.",
  },
];
</script>
<template>
  <main class="how-view">
    <header class="view-hero">
      <div class="view-hero__copy">
        <span class="kicker">HOW IT WORKS</span>
        <h1>Cách đặt hàng</h1>
        <p>Chọn món, kiểm tra giỏ hàng và chọn tầng nhận tại DOP Mart.</p>
      </div>
      <div class="how-pill"><MapPin :size="18" /> Tầng 14 &amp; 20</div>
    </header>
    <OrderProcess />
    <section class="how-faq">
      <div class="how-faq__head">
        <span class="kicker">CÂU HỎI NHANH</span>
        <h2>Trước khi bạn bấm đặt</h2>
      </div>
      <div class="how-faq__list">
        <article v-for="(item, i) in faqs" :key="item.q">
          <span>{{ String(i + 1).padStart(2, "0") }}</span>
          <h3>{{ item.q }}</h3>
          <p>{{ item.a }}</p>
        </article>
      </div>
      <RouterLink to="/products" class="primary">
        Bắt đầu với món đầu tiên <ArrowRight :size="16" />
      </RouterLink>
    </section>
  </main>
</template>
