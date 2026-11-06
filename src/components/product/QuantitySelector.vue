<script setup>
import { Minus, Plus } from "lucide-vue-next";
defineProps({ modelValue: Number });
defineEmits(["update:modelValue"]);
</script>
<template>
  <div class="quantity">
    <button @click="$emit('update:modelValue', Math.max(1, modelValue - 1))">
      <Minus /></button
    ><span>{{ modelValue }}</span
    ><button @click="$emit('update:modelValue', modelValue + 1)"><Plus /></button>
  </div>
</template>
