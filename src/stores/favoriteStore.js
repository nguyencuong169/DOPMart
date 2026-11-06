import { defineStore } from "pinia";
const KEY = "dopmart-favorites-v1";
function load() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
export const useFavoriteStore = defineStore("favorites", {
  state: () => ({ ids: load() }),
  getters: { count: (s) => s.ids.length },
  actions: {
    persist() {
      localStorage.setItem(KEY, JSON.stringify(this.ids));
    },
    toggle(id) {
      this.ids = this.ids.includes(id)
        ? this.ids.filter((x) => x !== id)
        : [...this.ids, id];
      this.persist();
    },
    has(id) {
      return this.ids.includes(id);
    },
    clear() {
      this.ids = [];
      this.persist();
    },
  },
});
