import { defineStore } from "pinia";
import { isSupabaseReady, supabase, getCurrentUser, ensureCartForUser } from "../lib/supabase";

const KEY = "dopmart-cart-v1";
function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: load(),
    open: false,
    loading: false,
    error: null,
    _cartId: null,
    _useSupabase: isSupabaseReady,
  }),
  getters: {
    count: (s) => s.items.reduce((n, i) => n + i.qty, 0),
    total: (s) => s.items.reduce((n, i) => n + i.price * i.qty, 0),
  },
  actions: {
    persist() {
      try {
        localStorage.setItem(KEY, JSON.stringify(this.items));
      } catch {
        /* private mode / quota — the cart still works for this session */
      }
    },
    async init() {
      this._useSupabase = isSupabaseReady;
      if (!this._useSupabase) {
        this.items = load();
        this.loading = false;
        return;
      }
      const user = await getCurrentUser();
      if (!user) {
        this.error = "Not authenticated";
        this.items = [];
        this.loading = false;
        return;
      }
      this._cartId = await ensureCartForUser(user.id);
      await this.fetchItems();
    },
    async fetchItems() {
      if (!this._useSupabase || !this._cartId) return;
      this.loading = true;
      this.error = null;
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          qty,
          created_at,
          updated_at,
          products (
            id,
            slug,
            name,
            format_slug,
            shelf_slug,
            category_name,
            price,
            rating,
            sold,
            is_new,
            hot,
            color,
            tint,
            description,
            tags,
            notes,
            stock_floor_14,
            stock_floor_20,
            created_at,
            updated_at
          )
        `)
        .eq("cart_id", this._cartId)
        .order("created_at", { ascending: true });

      if (error) {
        this.error = error.message;
        this.items = [];
      } else {
        this.items = (data || []).map((row) => ({
          ...row.products,
          cartItemId: row.id,
          qty: row.qty,
          stock: { 14: row.products.stock_floor_14, 20: row.products.stock_floor_20 },
        }));
      }
      this.loading = false;
    },
    async add(p, qty = 1) {
      if (!this._useSupabase) {
        const i = this.items.find((x) => x.id === p.id);
        i ? (i.qty += qty) : this.items.push({ ...p, qty });
        this.persist();
        this.open = true;
        return;
      }
      if (!this._cartId) {
        const user = await getCurrentUser();
        if (!user) {
          this.error = "Not authenticated";
          return;
        }
        this._cartId = await ensureCartForUser(user.id);
      }
      const existing = this.items.find((x) => x.id === p.id);
      if (existing) {
        await supabase
          .from("cart_items")
          .update({ qty: existing.qty + qty })
          .eq("id", existing.cartItemId);
      } else {
        await supabase.from("cart_items").insert({
          cart_id: this._cartId,
          product_id: p.id,
          qty,
        });
      }
      await this.fetchItems();
      this.open = true;
    },
    async change(id, d) {
      if (!this._useSupabase) {
        const i = this.items.find((x) => x.id === id);
        if (!i) return;
        i.qty += d;
        if (i.qty <= 0) this.items = this.items.filter((x) => x.id !== id);
        this.persist();
        return;
      }
      const item = this.items.find((x) => x.id === id);
      if (!item) return;
      const newQty = item.qty + d;
      if (newQty <= 0) {
        await this.remove(id);
        return;
      }
      await supabase.from("cart_items").update({ qty: newQty }).eq("id", item.cartItemId);
      await this.fetchItems();
    },
    async remove(id) {
      if (!this._useSupabase) {
        this.items = this.items.filter((x) => x.id !== id);
        this.persist();
        return;
      }
      const item = this.items.find((x) => x.id === id);
      if (!item) return;
      await supabase.from("cart_items").delete().eq("id", item.cartItemId);
      await this.fetchItems();
    },
    async clear() {
      if (!this._useSupabase) {
        this.items = [];
        this.persist();
        return;
      }
      if (!this._cartId) return;
      await supabase.from("cart_items").delete().eq("cart_id", this._cartId);
      this.items = [];
    },
    toggleDrawer() {
      this.open = !this.open;
    },
    closeDrawer() {
      this.open = false;
    },
  },
});
