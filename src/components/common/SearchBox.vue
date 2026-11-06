<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Search } from "lucide-vue-next";
const router = useRouter();
const q = ref("");
function go() {
  router.push({ name: "search", query: { q: q.value } });
}
</script>
<template>
  <form class="search" @submit.prevent="go">
    <Search :size="18" /><input v-model="q" placeholder="Tìm món ngon..." />
  </form>
</template>
