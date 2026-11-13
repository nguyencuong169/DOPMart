import { defineStore } from "pinia";
import { isSupabaseReady, supabase, getCurrentUser } from "../lib/supabase";

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
  state: () => ({
    ids: load(),
    loading: false,
    error: null,
    _useSupabase: isSupabaseReady,
  }),
  getters: {
    count: (s) => s.ids.length,
  },
  actions: {
    persist() {
      localStorage.setItem(KEY, JSON.stringify(this.ids));
    },
    async init() {
      this._useSupabase = isSupabaseReady;
      if (!this._useSupabase) {
        this.ids = load();
        this.loading = false;
        return;
      }
      this.loading = true;
      this.error = null;
      const user = await getCurrentUser();
      if (!user) {
        this.ids = [];
        this.loading = false;
        return;
      }
      const { data, error } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", user.id);
      if (error) {
        this.error = error.message;
        this.ids = [];
      } else {
        this.ids = (data || []).map((row) => row.product_id);
      }
      this.loading = false;
    },
    async toggle(id) {
      if (!this._useSupabase) {
        this.ids = this.ids.includes(id)
          ? this.ids.filter((x) => x !== id)
          : [...this.ids, id];
        this.persist();
        return;
      }
      const user = await getCurrentUser();
      if (!user) {
        this.error = "Not authenticated";
        return;
      }
      if (this.ids.includes(id)) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", id);
        this.ids = this.ids.filter((x) => x !== id);
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, product_id: id });
        if (error) {
          this.error = error.message;
          return;
        }
        this.ids = [...this.ids, id];
      }
    },
    has(id) {
      return this.ids.includes(id);
    },
    async clear() {
      if (!this._useSupabase) {
        this.ids = [];
        this.persist();
        return;
      }
      const user = await getCurrentUser();
      if (!user) {
        this.ids = [];
        return;
      }
      await supabase.from("favorites").delete().eq("user_id", user.id);
      this.ids = [];
    },
  },
});
