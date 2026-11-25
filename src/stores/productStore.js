// ============================================================
// DOPMart → Supabase product store
// Dữ liệu lấy từ Supabase (shelves / formats / products).
// Khi Supabase chưa cấu hình hoặc trả về rỗng, tự fallback về seed
// trong src/data/products.js để kệ hàng luôn có món.
// ============================================================

import { defineStore } from "pinia";
import { isSupabaseReady, supabase } from "../lib/supabase";
import {
  imageOfFormat,
  products as seedProducts,
  categories as seedCategories,
} from "../data/products";

/* Chuẩn hoá một row từ bảng products (snake_case, phẳng) về shape
   mà các component đang dùng (products.js): image, stock{14,20},
   category (shelf_slug), categoryName, isNew, tags, notes... */
function mapProduct(row) {
  return {
    ...row,
    // giữ nguyên các field gốc từ DB
    format: row.format_slug,
    category: row.shelf_slug,
    categoryName: row.category_name,
    isNew: Boolean(row.is_new),
    is_new: Boolean(row.is_new),
    hot: Boolean(row.hot),
    // ảnh đóng gói lấy từ map format cục bộ (DB chỉ lưu tên file)
    image: imageOfFormat[row.format_slug] ?? null,
    // tồn kho theo tầng
    stock: {
      14: row.stock_floor_14 ?? 0,
      20: row.stock_floor_20 ?? 0,
    },
    // chuẩn hoá mảng phòng khi Postgres trả null
    tags: row.tags ?? [],
    notes: row.notes ?? [],
  };
}

function mapShelf(row) {
  return {
    ...row,
    tagline: row.tagline ?? "",
    formats: row.formats ?? [],
  };
}

function mapFormat(row) {
  return {
    ...row,
    photo: {
      shows: row.photo_shows,
      keywords: row.photo_keywords ?? [],
    },
  };
}

export const useProductStore = defineStore("products", {
  state: () => ({
    products: [],
    categories: [],
    formats: [],
    query: "",
    page: 1,
    pageSize: 8,
    quickProduct: null,
    loading: isSupabaseReady,
    error: null,
    _initialized: false,
    newProductsList: [],
    bestSellersList: [],
    weeklyRankingList: [],
    shopByMood: {},
  }),
  getters: {
    filtered: (s) =>
      s.products.filter(
        (p) =>
          (p.name +
            " " +
            (s.categories.find((c) => c.slug === p.category)?.name || ""))
            .toLowerCase()
            .includes(s.query.toLowerCase())
      ),
    newProducts: (s) => s.products.filter((p) => p.is_new || p.isNew),
    bestSellers: (s) => [...s.products].sort((a, b) => b.sold - a.sold),
    offers: (s) =>
      [
        { id: 1, discount: 20 },
        { id: 6, discount: 15 },
        { id: 4, discount: 10 },
        { id: 3, discount: 25 },
        { id: 7, discount: 18 },
        { id: 8, discount: 12 },
        { id: 5, discount: 8 },
        { id: 2, discount: 10 },
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
    byCategory: (s) => (slug) => s.products.filter((p) => p.category === slug),
  },
  actions: {
    /* Nếu Supabase chưa sẵn sàng / không trả dữ liệu, dùng seed cục bộ
       để giao diện không bị trống. */
    useSeedFallback() {
      if (!this.products.length) this.products = seedProducts;
      if (!this.categories.length) this.categories = seedCategories;
    },
    async init() {
      if (this._initialized && this.products.length) return;
      this._initialized = true;
      if (!isSupabaseReady) {
        this.loading = false;
        this.useSeedFallback();
        return;
      }
      this.loading = true;
      this.error = null;
      await Promise.all([
        this.fetchProducts(),
        this.fetchCategories(),
        this.fetchFormats(),
      ]);
      this.useSeedFallback();
      this.loading = false;
    },
    async fetchProducts() {
      if (!isSupabaseReady) return;
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });
      if (error) {
        this.error = error.message;
        if (!this.products.length) this.products = seedProducts;
      } else {
        this.products = (data || []).map(mapProduct);
      }
    },
    async fetchCategories() {
      if (!isSupabaseReady) return;
      const { data, error } = await supabase
        .from("shelves")
        .select("*")
        .order("name");
      if (error) {
        this.error = error.message;
        if (!this.categories.length) this.categories = seedCategories;
      } else {
        this.categories = (data || []).map(mapShelf);
      }
    },
    async fetchFormats() {
      if (!isSupabaseReady) return;
      const { data, error } = await supabase
        .from("formats")
        .select("*")
        .order("name");
      if (error) {
        this.error = error.message;
      } else {
        this.formats = (data || []).map(mapFormat);
      }
    },
    /* ── Section queries trực tiếp từ DB (mỗi section tự lấy đúng dữ liệu cần thiết) ── */
    async fetchNewProducts(limit = 4) {
      if (!isSupabaseReady) {
        this.newProductsList = seedProducts
          .filter((p) => p.isNew)
          .slice(0, limit);
        return;
      }
      this.loading = true;
      this.error = null;
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_new", true)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) {
        this.error = error.message;
        this.newProductsList = seedProducts
          .filter((p) => p.isNew)
          .slice(0, limit);
      } else {
        this.newProductsList = (data || []).map(mapProduct);
      }
      this.loading = false;
    },
    async fetchBestSellers(limit = 5) {
      if (!isSupabaseReady) {
        this.bestSellersList = [...seedProducts]
          .sort((a, b) => b.sold - a.sold)
          .slice(0, limit);
        return;
      }
      this.loading = true;
      this.error = null;
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sold", { ascending: false })
        .limit(limit);
      if (error) {
        this.error = error.message;
        this.bestSellersList = [...seedProducts]
          .sort((a, b) => b.sold - a.sold)
          .slice(0, limit);
      } else {
        this.bestSellersList = (data || []).map(mapProduct);
      }
      this.loading = false;
    },
    async fetchWeeklyRanking(limit = 6) {
      if (!isSupabaseReady) {
        this.weeklyRankingList = [...seedProducts]
          .sort((a, b) => b.sold - a.sold)
          .slice(0, limit);
        return;
      }
      this.loading = true;
      this.error = null;
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sold", { ascending: false })
        .limit(limit);
      if (error) {
        this.error = error.message;
        this.weeklyRankingList = [...seedProducts]
          .sort((a, b) => b.sold - a.sold)
          .slice(0, limit);
      } else {
        this.weeklyRankingList = (data || []).map(mapProduct);
      }
      this.loading = false;
    },
    async fetchShopByMood() {
      const MAX = 4; // số món đại diện tối đa mỗi category
      const result = {};
      if (!isSupabaseReady) {
        this.categories.forEach((c) => {
          result[c.slug] = [...seedProducts]
            .filter((p) => p.category === c.slug)
            .sort((a, b) => b.sold - a.sold)
            .slice(0, MAX);
        });
        this.shopByMood = result;
        return;
      }
      this.loading = true;
      this.error = null;
      await Promise.all(
        this.categories.map(async (c) => {
          const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("shelf_slug", c.slug)
            .order("sold", { ascending: false })
            .limit(MAX);
          if (error) {
            this.error = error.message;
            result[c.slug] = [...seedProducts]
              .filter((p) => p.category === c.slug)
              .sort((a, b) => b.sold - a.sold)
              .slice(0, MAX);
          } else {
            result[c.slug] = (data || []).map(mapProduct);
          }
        }),
      );
      this.shopByMood = result;
      this.loading = false;
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
