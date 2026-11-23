<script setup>
import { ArrowRight, QrCode } from "lucide-vue-next";
import OrderProcess from "../components/common/OrderProcess.vue";

const faqs = [
  {
    q: "Đặt hàng mất bao lâu?",
    a: "Từ lúc chọn món đến khi nhận trung bình dưới 2 phút, vì đơn được chuẩn bị ngay tại tầng bạn chọn.",
  },
  {
    q: "Thanh toán bằng cách nào?",
    a: "Quét QR chuyển khoản hoặc ví điện tử. Đơn chỉ được giữ khi thanh toán thành công.",
  },
  {
    q: "Nhận hàng ở đâu?",
    a: "Chọn tầng 14 hoặc tầng 20 ở thanh header. Tồn kho và giá hiển thị theo đúng tầng nhận.",
  },
];
</script>
<template>
  <main class="how-view">
    <header class="view-hero">
      <div class="view-hero__copy">
        <span class="kicker">HOW IT WORKS</span>
        <h1>Đói → chọn → quét → nhận.</h1>
        <p>
          Bốn nhịp, không form dài, không địa chỉ giao hàng. Mọi thứ diễn ra trong giờ nghỉ
          của bạn.
        </p>
      </div>
      <div class="how-pill"><QrCode :size="18" /> QR trong 30 giây</div>
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
