<script setup>
import { MapPin, ChevronDown } from "lucide-vue-next";
import { useFloorStore } from "../../stores/floorStore";
const store = useFloorStore();
function change(e) {
  store.setFloor(e.target.value);
}
</script>
<template>
  <label class="floor floor-select"
    ><MapPin :size="16" /><span>Nhận tại</span><strong>Tầng {{ store.floor }}</strong
    ><select :value="store.floor" @change="change" aria-label="Chọn tầng nhận hàng">
      <option :value="14">Tầng 14</option>
      <option :value="20">Tầng 20</option></select
    ><ChevronDown class="floor-chevron" :size="15"
  /></label>
</template>
