<script setup>
import { Mail, MapPin, Clock, ArrowUpRight } from "lucide-vue-next";
</script>
<template>
  <footer class="site-footer">
    <div class="footer-top">
      <div class="footer-brand">
        <div class="footer-logo">DOP <i>mart</i></div>
        <p>Mini mart - Big happy</p>
        <span
          >Snack station dành riêng cho văn phòng, phục vụ nhanh tại tầng 14 và tầng
          20.</span
        >
      </div>
      <div class="footer-col">
        <h4>Khám phá</h4>
        <RouterLink to="/products">Tất cả sản phẩm</RouterLink
        ><RouterLink to="/new">Sản phẩm mới</RouterLink
        ><RouterLink to="/best-sellers">Bán chạy</RouterLink
        ><RouterLink to="/products">Danh mục</RouterLink>
      </div>
      <div class="footer-col">
        <h4>Hỗ trợ</h4>
        <RouterLink to="/how-it-works">Cách đặt hàng</RouterLink
        ><RouterLink to="/checkout">Thanh toán QR</RouterLink
        ><RouterLink to="/about">Về DOP Mart</RouterLink>
      </div>
      <div class="footer-col footer-contact">
        <h4>Snack station</h4>
        <span><MapPin /> Tầng 14 &amp; Tầng 20</span
        ><span><Clock /> 08:30 – 17:30, Thứ 2 – Thứ 6</span
        ><a class="footer-mail" href="mailto:dopmart@internal.local"
          ><Mail /> dopmart@internal.local</a
        >
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 DOP Mart. Internal office mini mart.</span>
      <a href="#top">Lên đầu trang <ArrowUpRight /></a>
    </div>
  </footer>
</template>
