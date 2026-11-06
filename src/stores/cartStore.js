import { defineStore } from "pinia";
const KEY = "dopmart-cart-v1";
function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
export const useCartStore = defineStore("cart", {
  state: () => ({ items: load(), open: false }),
  getters: {
    count: (s) => s.items.reduce((n, i) => n + i.qty, 0),
    total: (s) => s.items.reduce((n, i) => n + i.price * i.qty, 0),
  },
  actions: {
    persist() {
      localStorage.setItem(KEY, JSON.stringify(this.items));
    },
    add(p, qty = 1) {
      const i = this.items.find((x) => x.id === p.id);
      i ? (i.qty += qty) : this.items.push({ ...p, qty });
      this.persist();
      this.open = true;
    },
    change(id, d) {
      const i = this.items.find((x) => x.id === id);
      if (!i) return;
      i.qty += d;
      if (i.qty <= 0) this.items = this.items.filter((x) => x.id !== id);
      this.persist();
    },
    remove(id) {
      this.items = this.items.filter((x) => x.id !== id);
      this.persist();
    },
    clear() {
      this.items = [];
      this.persist();
    },
  },
});
