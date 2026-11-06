<script setup>
defineProps({ page: { type: Number, default: 1 }, pages: { type: Number, default: 1 } });
defineEmits(["change"]);
</script>
<template>
  <div class="pagination">
    <button
      v-for="n in pages"
      :key="n"
      :class="{ active: n === page }"
      @click="$emit('change', n)"
    >
      {{ n }}
    </button>
  </div>
</template>
