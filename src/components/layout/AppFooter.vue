<script setup>
import { Instagram, Facebook, Mail, MapPin, Clock, ArrowUpRight } from "lucide-vue-next";
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
        ><RouterLink to="/products?filter=new">Sản phẩm mới</RouterLink
        ><RouterLink to="/products?sort=best">Bán chạy</RouterLink
        ><RouterLink to="/category/chips">Danh mục</RouterLink>
      </div>
      <div class="footer-col">
        <h4>Hỗ trợ</h4>
        <a href="#">Cách đặt hàng</a><a href="#">Thanh toán QR</a
        ><a href="#">Chính sách đổi trả</a><a href="#">Liên hệ DOP Mart</a>
      </div>
      <div class="footer-col footer-contact">
        <h4>Snack station</h4>
        <span><MapPin /> Tầng 14 & tầng 20</span
        ><span><Clock /> 08:30 - 17:30, Thứ 2 - Thứ 6</span
        ><span><Mail /> dopmart@internal.local</span>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 DOP Mart. Internal office mini mart.</span>
      <div class="social">
        <a href="#" aria-label="Instagram"><Instagram /></a
        ><a href="#" aria-label="Facebook"><Facebook /></a
        ><a href="#" aria-label="Email"><Mail /></a>
      </div>
      <a href="#top">Lên đầu trang <ArrowUpRight /></a>
    </div>
  </footer>
</template>
