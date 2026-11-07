<script setup>
import { ArrowRight } from "lucide-vue-next";

defineProps({
  kicker: { type: String, default: "" },
  title: { type: String, required: true },
  lead: { type: String, default: "" },
  cta: { type: String, default: "" },
  to: { type: [String, Object], default: "" },
});
</script>
<template>
  <div class="section-head">
    <div class="section-head__copy">
      <span v-if="kicker" class="kicker">{{ kicker }}</span>
      <h2>{{ title }}</h2>
      <p v-if="lead">{{ lead }}</p>
    </div>
    <RouterLink v-if="cta && to" :to="to">{{ cta }} <ArrowRight :size="16" /></RouterLink>
  </div>
</template>
