import { defineStore } from "pinia";
import { products as seedProducts, categories as seedCategories } from "../data/products";
import { isSupabaseReady, supabase } from "../lib/supabase";

export const useProductStore = defineStore("products", {
  state: () => ({
    products: isSupabaseReady ? [] : seedProducts,
    categories: isSupabaseReady ? [] : seedCategories,
    formats: [],
    query: "",
    page: 1,
    pageSize: 8,
    quickProduct: null,
    loading: isSupabaseReady,
    error: null,
  }),
  getters: {
    filtered: (s) =>
      s.products.filter(
        (p) =>
          (p.name + " " + (s.categories.find((c) => c.slug === p.shelf_slug)?.name || ""))
            .toLowerCase()
            .includes(s.query.toLowerCase())
      ),
    newProducts: (s) => s.products.filter((p) => p.is_new || p.isNew),
    bestSellers: (s) => [...s.products].sort((a, b) => b.sold - a.sold),
    offers: (s) => [
      { id: 1, discount: 20 },
      { id: 6, discount: 15 },
      { id: 4, discount: 10 },
    ]
      .map(({ id, discount }) => {
        const p = s.products.find((x) => x.id === id);
        if (!p) return null;
        return {
          ...p,
          discount,
          oldPrice: Math.round((p.price / (1 - discount / 100)) / 1000) * 1000,
        };
      })
      .filter(Boolean),
    bySlug: (s) => (slug) => s.products.find((p) => p.slug === slug),
    byCategory: (s) => (slug) => s.products.filter((p) => p.shelf_slug === slug),
  },
  actions: {
    async init() {
      if (!isSupabaseReady) {
        this.loading = false;
        return;
      }
      this.loading = true;
      this.error = null;
      await Promise.all([this.fetchProducts(), this.fetchCategories(), this.fetchFormats()]);
    },
    async fetchProducts() {
      if (!isSupabaseReady) return;
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        this.error = error.message;
      } else {
        this.products = data || [];
      }
    },
    async fetchCategories() {
      if (!isSupabaseReady) return;
      const { data, error } = await supabase.from("shelves").select("*").order("name");
      if (error) {
        this.error = error.message;
      } else {
        this.categories = data || [];
      }
    },
    async fetchFormats() {
      if (!isSupabaseReady) return;
      const { data, error } = await supabase.from("formats").select("*").order("name");
      if (error) {
        this.error = error.message;
      } else {
        this.formats = data || [];
      }
    },
    openQuick(product) {
      this.quickProduct = product;
    },
    closeQuick() {
      this.quickProduct = null;
    },
    setQuery(q) {
      this.query = q;
    },
  },
});
