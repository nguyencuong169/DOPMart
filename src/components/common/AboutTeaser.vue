<script setup>
import { computed } from "vue";
import SectionHeader from "./SectionHeader.vue";
import { useProductStore } from "../../stores/productStore";
import { FLOORS } from "../../stores/floorStore";
const catalog = useProductStore();
/* the chips read live numbers instead of hard-coded 02 / 08 / 32 */
const stats = computed(() => {
  const pad = (n) => String(n).padStart(2, "0");
  return [
    { n: pad(FLOORS.length), label: "tầng phục vụ" },
    { n: pad(catalog.categories.length), label: "kệ hàng" },
    { n: String(catalog.products.length), label: "món sẵn kệ" },
  ];
});
</script>
<template>
  <section class="about-teaser">
    <div class="about-teaser__mark" aria-hidden="true">DOP<span>mart</span></div>
    <div class="about-teaser__body">
      <SectionHeader
        kicker="WHY DOP MART EXISTS"
        title="Bận rộn không có nghĩa là phải bỏ qua món mình thích."
        :lines="['Bận rộn không có nghĩa', 'là phải bỏ qua', 'món mình thích.']"
        lead="Snack station nội bộ cho dân văn phòng: chọn trong 30 giây, nhận ngay tại tầng 14 hoặc 20 — không shipper, không chờ đợi."
        cta="Đọc chuyện DOP"
        to="/about"
      />
      <div class="about-teaser__stats">
        <span v-for="s in stats" :key="s.label"><b>{{ s.n }}</b> {{ s.label }}</span>
      </div>
    </div>
  </section>
</template>
