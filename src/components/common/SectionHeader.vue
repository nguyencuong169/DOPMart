<script setup>
import { ArrowRight } from "lucide-vue-next";

defineProps({
  kicker: { type: String, default: "" },
  title: { type: String, required: true },
  /* optional hard line breaks: one entry per clause, so a long headline breaks on the
     rhythm of the sentence instead of wherever the measure happens to end */
  lines: { type: Array, default: null },
  lead: { type: String, default: "" },
  cta: { type: String, default: "" },
  to: { type: [String, Object], default: "" },
});
</script>
<template>
  <div class="section-head">
    <div class="section-head__copy">
      <span v-if="kicker" class="kicker">{{ kicker }}</span>
      <h2 v-if="lines && lines.length">
        <template v-for="(line, i) in lines" :key="i"
          >{{ line }}<br v-if="i < lines.length - 1"
        /></template>
      </h2>
      <h2 v-else>{{ title }}</h2>
      <p v-if="lead">{{ lead }}</p>
    </div>
    <RouterLink v-if="cta && to" :to="to">{{ cta }} <ArrowRight :size="16" /></RouterLink>
  </div>
</template>
