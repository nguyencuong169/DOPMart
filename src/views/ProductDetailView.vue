<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, MapPin } from 'lucide-vue-next'
import { useProductStore } from '../stores/productStore'
import { useCartStore } from '../stores/cartStore'
import { useFloorStore } from '../stores/floorStore'
import ProductGallery from '../components/product/ProductGallery.vue'
import QuickAdd from '../components/product/QuickAdd.vue'

const route = useRoute()
const router = useRouter()
const products = useProductStore()
const floor = useFloorStore()
const cart = useCartStore()
const product = computed(() => products.bySlug(route.params.slug))

onMounted(() => {
  products.init()
  floor.init()
  cart.init()
})

function goBack() {
  const previous = window.history.state?.back
  if (typeof previous === 'string' && previous !== route.fullPath) {
    router.back()
    return
  }
  router.push({ name: 'products' })
}
</script>

<template>
  <main v-if="product" class="detail-page">
    <button type="button" class="back" @click="goBack">
      <ChevronLeft aria-hidden="true" /> Quay lại
    </button>
    <ProductGallery :product="product" />
    <section class="detail-copy">
      <span class="kicker">{{ product.categoryName }}</span>
      <h1>{{ product.name }}</h1>
      <div class="detail-rating">
        ★★★★★ <span>{{ product.rating }} · Đã bán {{ product.sold }}</span>
      </div>
      <strong class="detail-price tabular-nums"
        >{{ product.price.toLocaleString('vi-VN') }} ₫</strong
      >
      <div class="buy-row">
        <QuickAdd :product="product" :stock="product.stock[floor.floor]" />
      </div>
      <small>Đang chọn điểm nhận ở tầng {{ floor.floor }}</small>
      <p>{{ product.description }}</p>
      <div class="stock">
        <span><MapPin aria-hidden="true" /> Tầng 14: còn {{ product.stock[14] }}</span>
        <span><MapPin aria-hidden="true" /> Tầng 20: còn {{ product.stock[20] }}</span>
      </div>
    </section>
  </main>
  <main v-else class="page">
    <h1>Không tìm thấy sản phẩm</h1>
    <RouterLink to="/products">Quay lại danh sách</RouterLink>
  </main>
</template>
