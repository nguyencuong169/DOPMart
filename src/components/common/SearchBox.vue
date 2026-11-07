<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Search } from "lucide-vue-next";
const router = useRouter();
const q = ref("");
const inputEl = ref(null);
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
function go() {
  router.push({ name: "search", query: { q: q.value } });
}
function onKeydown(event) {
  if (!(event.metaKey || event.ctrlKey)) return;
  if (event.key.toLowerCase() !== "k") return;
  const el = inputEl.value;
  if (!el || !el.getClientRects().length) return;
  event.preventDefault();
  el.focus();
  el.select();
}
onMounted(() => document.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
</script>
<template>
  <form class="search" role="search" @submit.prevent="go">
    <Search :size="17" /><input
      ref="inputEl"
      v-model="q"
      aria-label="Tìm món ngon"
      placeholder="Tìm món ngon..."
    /><kbd class="search-kbd" aria-hidden="true">{{ isMac ? "⌘K" : "Ctrl K" }}</kbd>
  </form>
</template>
