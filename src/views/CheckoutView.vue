<script setup>
import { ref, onMounted } from "vue";
import { useCartStore } from "../stores/cartStore";
import { useFloorStore } from "../stores/floorStore";
const cart = useCartStore(),
  floor = useFloorStore(),
  name = ref(""),
  method = ref("pickup");
onMounted(() => {
  cart.init();
  floor.init();
});
</script>
<template>
  <main class="page checkout-page">
    <div>
      <span class="kicker">QUICK CHECKOUT</span>
      <h1>Thanh toán</h1>
      <label>Họ tên<input v-model="name" placeholder="Nguyễn Văn A" /></label
      ><label
        >Vị trí nhận<select v-model="floor.floor">
          <option :value="14">Tầng 14</option>
          <option :value="20">Tầng 20</option>
        </select></label
      >
      <div class="choice">
        <button :class="{ active: method === 'pickup' }" @click="method = 'pickup'">
          🏪 Tự lấy</button
        ><button :class="{ active: method === 'desk' }" @click="method = 'desk'">
          🚶 Giao tại bàn
        </button>
      </div>
      <label v-if="method === 'desk'"
        >Khu vực / chỗ ngồi<input placeholder="A123 · Tầng 20"
      /></label>
    </div>
    <aside class="order-summary">
      <h2>Đơn hàng</h2>
      <p v-for="i in cart.items" :key="i.id">
        {{ i.name }} × {{ i.qty }}
        <b>{{ (i.price * i.qty).toLocaleString("vi-VN") }} ₫</b>
      </p>
      <div class="total">
        <span>Tổng</span><b>{{ cart.total.toLocaleString("vi-VN") }} ₫</b>
      </div>
      <button class="checkout" :disabled="!cart.items.length || !name">Tạo mã QR</button>
    </aside>
  </main>
</template>
