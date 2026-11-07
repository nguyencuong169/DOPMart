<script setup>
import { computed, ref } from "vue";
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles } from "lucide-vue-next";
import { useProductStore } from "../../stores/productStore";
import { useCartStore } from "../../stores/cartStore";
const store = useProductStore(),
  cart = useCartStore(),
  index = ref(0);
/* prices are never typed twice: `old` is the sum of the items and `save` is the
   difference, so the badge cannot advertise a discount that does not exist */
const combos = computed(() =>
  [
    {
      name: "Cứu deadline",
      tag: "MÌ + NƯỚC + SNACK",
      ids: [3, 22, 1],
      price: 39000,
      color: "#ef3340",
      copy: "Cứu đói nhanh trước một buổi họp dài.",
    },
    {
      name: "Sạc lại buổi chiều",
      tag: "HẠT + NƯỚC",
      ids: [26, 23],
      price: 37000,
      color: "#137c58",
      copy: "Nhẹ bụng nhưng vẫn đủ năng lượng cho buổi chiều.",
    },
    {
      name: "Hộp chia team",
      tag: "4 MÓN CHIA SẺ",
      ids: [5, 13, 19, 24],
      price: 55000,
      color: "#7a32a8",
      copy: "Một combo vui vẻ để chia cùng đồng đội.",
    },
  ].map((c) => {
    const items = c.ids.map((id) => store.products.find((p) => p.id === id)).filter(Boolean);
    const old = items.reduce((sum, p) => sum + p.price, 0);
    return { ...c, items, old, save: old - c.price };
  })
);
const current = computed(() => combos.value[index.value]);
function move(d) {
  index.value = (index.value + d + combos.value.length) % combos.value.length;
}
function add() {
  current.value.items.forEach((p) => cart.add(p, 1));
}
</script>
<template>
  <section class="dop-combo" :style="{ '--combo-color': current.color }">
    <div class="combo-pattern">DOP MIX · LOVE PRICE · DOP MIX · LOVE PRICE</div>
    <div class="combo-copy">
      <span><Sparkles /> DOP COMBO</span>
      <h2>Mix đúng mood.<br />Giá thật yêu.</h2>
      <p>DOP chọn sẵn những món hợp nhau để bạn không mất thời gian suy nghĩ.</p>
      <div class="combo-nav">
        <button type="button" aria-label="Combo trước" @click="move(-1)"><ChevronLeft /></button>
        <span aria-live="polite"
          >0{{ index + 1 }} / 0{{ combos.length }} · {{ current.name }}</span
        >
        <button type="button" aria-label="Combo tiếp theo" @click="move(1)"><ChevronRight /></button>
      </div>
    </div>
    <div class="combo-stage">
      <div class="combo-burst"></div>
      <TransitionGroup name="combo-pop" tag="div" class="combo-products">
        <img
          v-for="(item, i) in current.items"
          :key="current.name + item.id"
          :src="item.image"
          :alt="item.name"
          :style="{ '--i': i, '--total': current.items.length }"
          loading="lazy"
          decoding="async"
        />
      </TransitionGroup>
      <div class="combo-badge">
        SAVE<br /><b>{{ current.save.toLocaleString("vi-VN") }}₫</b>
      </div>
    </div>
    <div class="combo-info">
      <small>{{ current.tag }}</small>
      <h3>{{ current.name }}</h3>
      <p>{{ current.copy }}</p>
      <ul>
        <li v-for="item in current.items" :key="item.id">
          {{ item.name }}
          <span>{{ item.price.toLocaleString("vi-VN") }} ₫</span>
        </li>
      </ul>
      <span
        ><s>{{ current.old.toLocaleString("vi-VN") }} ₫</s
        ><b>{{ current.price.toLocaleString("vi-VN") }} ₫</b></span
      >
      <button @click="add">Thêm cả combo <ShoppingBag /></button>
    </div>
  </section>
</template>
