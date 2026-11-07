<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { MapPin, ChevronDown } from "lucide-vue-next";
import { useFloorStore } from "../../stores/floorStore";
const store = useFloorStore();
const now = ref(new Date());
const isOpen = computed(() => {
  const h = now.value.getHours() + now.value.getMinutes() / 60;
  return h >= 8.5 && h < 17.5;
});
let clock = null;
onMounted(() => {
  clock = setInterval(() => {
    now.value = new Date();
  }, 60000);
});
onBeforeUnmount(() => {
  if (clock) clearInterval(clock);
});
function change(e) {
  store.setFloor(e.target.value);
}
</script>
<template>
  <div class="floor-wrap">
    <label class="floor floor-select"
      ><MapPin :size="16" /><span>Nhận tại</span><strong>Tầng {{ store.floor }}</strong
      ><select :value="store.floor" @change="change" aria-label="Chọn tầng nhận hàng">
        <option :value="14">Tầng 14</option>
        <option :value="20">Tầng 20</option></select
      ><ChevronDown class="floor-chevron" :size="15"
    /></label>
    <p class="floor-state" :class="{ closed: !isOpen }">
      {{ isOpen ? "Đang mở · đến 17:30" : "Đã đóng · mở lại 08:30" }}
    </p>
  </div>
</template>


