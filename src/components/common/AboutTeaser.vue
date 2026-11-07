<script setup>
import SectionHeader from "./SectionHeader.vue";
</script>
<template>
  <section class="about-teaser">
    <div class="about-teaser__mark" aria-hidden="true">DOP<span>mart</span></div>
    <div class="about-teaser__body">
      <SectionHeader
        kicker="WHY DOP MART EXISTS"
        title="Bận rộn không có nghĩa là phải bỏ qua món mình thích."
        lead="Snack station nội bộ cho dân văn phòng: chọn trong 30 giây, nhận ngay tại tầng 14 hoặc 20 — không shipper, không chờ đợi."
        cta="Đọc chuyện DOP"
        to="/about"
      />
      <div class="about-teaser__stats">
        <span><b>02</b> tầng phục vụ</span>
        <span><b>08</b> kệ hàng</span>
        <span><b>32</b> món sẵn kệ</span>
      </div>
    </div>
  </section>
</template>
