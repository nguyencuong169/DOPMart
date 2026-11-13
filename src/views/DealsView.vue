<script setup>
import { computed, onMounted } from "vue";
import { ArrowRight, Clock3, MapPin, ShoppingBag, Sparkles, Tag } from "lucide-vue-next";
import { useProductStore } from "../stores/productStore";
import { useCartStore } from "../stores/cartStore";
import { useFloorStore } from "../stores/floorStore";
import DopComboShowcase from "../components/product/DopComboShowcase.vue";

const s = useProductStore();
const cart = useCartStore();
const floor = useFloorStore();
onMounted(() => {
  s.init();
  cart.init();
  floor.init();
});

const offers = computed(() => s.offers);
const maxDiscount = computed(() => Math.max(...offers.value.map((o) => o.discount)));
const saving = computed(() => offers.value.reduce((n, o) => n + (o.oldPrice - o.price), 0));
</script>
<template>
  <main class="deals-view">
    <header class="view-hero">
      <div class="view-hero__copy">
        <span class="kicker"><Tag :size="14" /> HAPPY DEALS · {{ offers.length }} ƯU ĐÃI</span>
        <h1>Giá nhỏ hơn.<br /><em>Vui lớn hơn.</em></h1>
        <p>
          Ưu đãi giờ nghỉ dành cho dân văn phòng — áp dụng theo tồn kho tại tầng
          {{ floor.floor }}, hết hàng là hết deal.
        </p>
        <div class="view-hero__meta">
          <span><Clock3 :size="14" /> Cập nhật mỗi thứ Hai</span>
          <span><MapPin :size="14" /> Nhận tại Tầng 14 / Tầng 20</span>
        </div>
      </div>
      <div class="deals-score">
        <small>GIẢM SÂU NHẤT</small>
        <b>{{ maxDiscount }}<i>%</i></b>
        <span>tiết kiệm {{ saving.toLocaleString("vi-VN") }} ₫</span>
      </div>
    </header>
    <section class="deal-shelf" aria-label="Sản phẩm đang khuyến mãi">
      <article
        v-for="offer in offers"
        :key="offer.id"
        class="deal-card"
        :style="{ '--deal-color': offer.color }"
      >
        <span class="deal-flag">-{{ offer.discount }}%</span>
        <div class="deal-media"><img :src="offer.image" :alt="offer.name" loading="lazy" decoding="async" /></div>
        <div class="deal-body">
          <small>{{ offer.categoryName }}</small>
          <h3>{{ offer.name }}</h3>
          <p class="deal-rating">★ {{ offer.rating }} · {{ offer.sold }} đã bán</p>
          <div class="deal-price">
            <b>{{ offer.price.toLocaleString("vi-VN") }} ₫</b>
            <s>{{ offer.oldPrice.toLocaleString("vi-VN") }} ₫</s>
          </div>
          <div class="deal-actions">
            <button type="button" @click="cart.add(offer)">
              Thêm vào giỏ <ShoppingBag :size="16" />
            </button>
            <RouterLink :to="`/product/${offer.slug}`">
              Chi tiết <ArrowRight :size="16" />
            </RouterLink>
          </div>
        </div>
      </article>
    </section>
    <DopComboShowcase />
    <section class="deal-note">
      <Sparkles :size="18" />
      <p>
        <b>Deal có giới hạn.</b> Mỗi tầng chỉ áp dụng cho số lượng tồn thực tế, giá sẽ trở
        lại bình thường khi hết suất ưu đãi.
      </p>
      <RouterLink to="/products" class="primary">Xem tủ snack <ArrowRight :size="16" /></RouterLink>
    </section>
  </main>
</template>
