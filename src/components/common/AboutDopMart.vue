<script setup>
import { Zap, Users, HeartHandshake, MapPin, ArrowRight } from "lucide-vue-next";
</script>
<template>
  <section class="about-dop">
    <div class="about-visual">
      <div class="about-word">ABOUT<br />DOP</div>
      <div class="about-orbit o1"></div>
      <div class="about-orbit o2"></div>
      <div class="about-pill p1"><Zap /> Nhanh</div>
      <div class="about-pill p2"><Users /> Trẻ trung</div>
      <div class="about-pill p3"><HeartHandshake /> Thấu hiểu</div>
      <div class="about-floor"><MapPin /> 14F ↔ 20F</div>
    </div>
    <div class="about-copy">
      <span class="kicker">WHY DOP MART EXISTS</span>
      <h2>Bận rộn không có nghĩa là phải bỏ qua món mình thích.</h2>
      <p>
        Giữa một ngày làm việc liên tục, không phải ai cũng có thời gian rời văn phòng để
        mua một gói snack, một ly mì hay một thức uống mát lạnh. Đói giữa giờ? Khát vào
        buổi chiều? Cần thêm năng lượng trước một cuộc họp? DOP Mart được tạo ra để xử lý
        những nhu cầu nhỏ nhưng rất thật đó.
      </p>
      <p>
        DOP Mart được đồng sáng lập bởi một nhóm co-founder trẻ trung, năng động và nhiệt
        tình. Từ chính trải nghiệm làm việc tại văn phòng, nhóm đã thấu hiểu khoảng thời
        gian quý giá của đồng nghiệp và xây dựng một mini mart nội bộ: gần hơn, nhanh hơn
        và vui hơn.
      </p>
      <div class="about-values">
        <span><b>02</b> tầng phục vụ</span><span><b>04</b> bước đặt hàng</span
        ><span><b>01</b> mục tiêu: Big happy</span>
      </div>
      <RouterLink to="/products" class="primary"
        >Khám phá DOP Mart <ArrowRight
      /></RouterLink>
    </div>
  </section>
</template>
