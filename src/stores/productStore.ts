import { defineStore } from "pinia"
import {
  imageOfFormat,
  products as seedProducts,
  categories as seedCategories,
} from "../data/products"

/* Chuẩn hoá một row từ bảng products (snake_case, phẳng) về shape
   mà các component đang dùng: image, stock{14,20},
   category (shelf_slug), categoryName, isNew, tags, notes... */
export interface Product {
  id: number
  slug: string
  name: string
  format: string
  category: string
  categoryName: string
  price: number
  rating: number
  sold: number
    isNew: boolean
    is_new?: boolean
    hot: boolean
  color: string
  tint: string
  image: string | null
  description: string
  tags: string[]
  notes: string[][]
  stock: { 14: number; 20: number }
  createdAt?: string | null
  updatedAt?: string | null
  [key: string]: any
}

export interface Shelf {
  slug: string
  name: string
  tagline: string
  icon: string
  color: string
  formats: string[]
}

export interface Format {
  slug: string
  name: string
  icon: string
  color: string
  image: string
  photo: { shows: string; keywords: string[] }
}

function mapProduct(row: any): Product {
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
  }
}

function mapShelf(row: any): Shelf {
  return {
    ...row,
    tagline: row.tagline ?? "",
    formats: row.formats ?? [],
  }
}

function mapFormat(row: any): Format {
  return {
    ...row,
    photo: {
      shows: row.photo_shows,
      keywords: row.photo_keywords ?? [],
    },
  }
}

export const useProductStore = defineStore("products", {
  state: () => ({
    products: [] as Product[],
    categories: [] as Shelf[],
    formats: [] as Format[],
    query: "",
    page: 1,
    pageSize: 8,
    quickProduct: null as Product | null,
    loading: Boolean(
      Boolean(import.meta.env.VITE_SUPABASE_URL) &&
        Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
    ),
    error: null as string | null,
    _initialized: false,
    newProductsList: [] as Product[],
    bestSellersList: [] as Product[],
    weeklyRankingList: [] as Product[],
    shopByMood: {} as Record<string, Product[]>,
  }),
  getters: {
    filtered: (s) =>
      s.products.filter(
        (p) =>
          (p.name +
            " " +
            (s.categories.find((c) => c.slug === p.category)?.name || ""))
            .toLowerCase()
            .includes(s.query.toLowerCase()),
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
          const p = s.products.find((x) => x.id === id)
          if (!p) return null
          return {
            ...p,
            discount,
            oldPrice: Math.round((p.price / (1 - discount / 100)) / 1000) * 1000,
          }
        })
        .filter(Boolean),
    bySlug: (s) => (slug: string) => s.products.find((p) => p.slug === slug),
    byCategory: (s) => (slug: string) => s.products.filter((p) => p.category === slug),
  },
  actions: {
    /* Nếu Supabase chưa sẵn sàng / không trả dữ liệu, dùng seed cục bộ
       để giao diện không bị trống. */
    useSeedFallback() {
      if (!this.products.length) this.products = seedProducts
      if (!this.categories.length) this.categories = seedCategories
    },
    async init() {
      if (this._initialized && this.products.length) return
      this._initialized = true
      const isReady =
        Boolean(import.meta.env.VITE_SUPABASE_URL) &&
        Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
      if (!isReady) {
        this.loading = false
        this.useSeedFallback()
        return
      }
      this.loading = true
      this.error = null
      await Promise.all([
        this.fetchProducts(),
        this.fetchCategories(),
        this.fetchFormats(),
      ])
      this.useSeedFallback()
      this.loading = false
    },
    async fetchProducts() {
      const isReady =
        Boolean(import.meta.env.VITE_SUPABASE_URL) &&
        Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
      if (!isReady) return
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { supabase } = await import("../lib/supabase")
      const { data, error } = await supabase!
        .from("products")
        .select("*")
        .order("id", { ascending: true })
      if (error) {
        this.error = error.message
        if (!this.products.length) this.products = seedProducts
      } else {
        this.products = (data || []).map(mapProduct)
      }
    },
    async fetchCategories() {
      const isReady =
        Boolean(import.meta.env.VITE_SUPABASE_URL) &&
        Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
      if (!isReady) return
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { supabase } = await import("../lib/supabase")
      const { data, error } = await supabase!
        .from("shelves")
        .select("*")
        .order("name")
      if (error) {
        this.error = error.message
        if (!this.categories.length) this.categories = seedCategories
      } else {
        this.categories = (data || []).map(mapShelf)
      }
    },
    async fetchFormats() {
      const isReady =
        Boolean(import.meta.env.VITE_SUPABASE_URL) &&
        Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
      if (!isReady) return
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { supabase } = await import("../lib/supabase")
      const { data, error } = await supabase!
        .from("formats")
        .select("*")
        .order("name")
      if (error) {
        this.error = error.message
      } else {
        this.formats = (data || []).map(mapFormat)
      }
    },
    /* ── Section queries trực tiếp từ DB (mỗi section tự lấy đúng dữ liệu cần thiết) ── */
    async fetchNewProducts(limit = 4) {
      const isReady =
        Boolean(import.meta.env.VITE_SUPABASE_URL) &&
        Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
      if (!isReady) {
        this.newProductsList = seedProducts
          .filter((p) => p.isNew)
          .slice(0, limit)
        return
      }
      this.loading = true
      this.error = null
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { supabase } = await import("../lib/supabase")
      const { data, error } = await supabase!
        .from("products")
        .select("*")
        .eq("is_new", true)
        .order("created_at", { ascending: false })
        .limit(limit)
      if (error) {
        this.error = error.message
        this.newProductsList = seedProducts
          .filter((p) => p.isNew)
          .slice(0, limit)
      } else {
        this.newProductsList = (data || []).map(mapProduct)
      }
      this.loading = false
    },
    async fetchBestSellers(limit = 5) {
      const isReady =
        Boolean(import.meta.env.VITE_SUPABASE_URL) &&
        Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
      if (!isReady) {
        this.bestSellersList = [...seedProducts]
          .sort((a, b) => b.sold - a.sold)
          .slice(0, limit)
        return
      }
      this.loading = true
      this.error = null
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { supabase } = await import("../lib/supabase")
      const { data, error } = await supabase!
        .from("products")
        .select("*")
        .order("sold", { ascending: false })
        .limit(limit)
      if (error) {
        this.error = error.message
        this.bestSellersList = [...seedProducts]
          .sort((a, b) => b.sold - a.sold)
          .slice(0, limit)
      } else {
        this.bestSellersList = (data || []).map(mapProduct)
      }
      this.loading = false
    },
    async fetchWeeklyRanking(limit = 6) {
      const isReady =
        Boolean(import.meta.env.VITE_SUPABASE_URL) &&
        Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
      if (!isReady) {
        this.weeklyRankingList = [...seedProducts]
          .sort((a, b) => b.sold - a.sold)
          .slice(0, limit)
        return
      }
      this.loading = true
      this.error = null
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { supabase } = await import("../lib/supabase")
      const { data, error } = await supabase!
        .from("products")
        .select("*")
        .order("sold", { ascending: false })
        .limit(limit)
      if (error) {
        this.error = error.message
        this.weeklyRankingList = [...seedProducts]
          .sort((a, b) => b.sold - a.sold)
          .slice(0, limit)
      } else {
        this.weeklyRankingList = (data || []).map(mapProduct)
      }
      this.loading = false
    },
    async fetchShopByMood() {
      const MAX = 4 // số món đại diện tối đa mỗi category
      const result: Record<string, Product[]> = {}
      const isReady =
        Boolean(import.meta.env.VITE_SUPABASE_URL) &&
        Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
      if (!isReady) {
        this.categories.forEach((c) => {
          result[c.slug] = [...seedProducts]
            .filter((p) => p.category === c.slug)
            .sort((a, b) => b.sold - a.sold)
            .slice(0, MAX)
        })
        this.shopByMood = result
        return
      }
      this.loading = true
      this.error = null
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { supabase } = await import("../lib/supabase")
      await Promise.all(
        this.categories.map(async (c) => {
          const { data, error } = await supabase!
            .from("products")
            .select("*")
            .eq("shelf_slug", c.slug)
            .order("sold", { ascending: false })
            .limit(MAX)
          if (error) {
            this.error = error.message
            result[c.slug] = [...seedProducts]
              .filter((p) => p.category === c.slug)
              .sort((a, b) => b.sold - a.sold)
              .slice(0, MAX)
          } else {
            result[c.slug] = (data || []).map(mapProduct)
          }
        }),
      )
      this.shopByMood = result
      this.loading = false
    },
    openQuick(product: Product) {
      this.quickProduct = product
    },
    closeQuick() {
      this.quickProduct = null
    },
    setQuery(q: string) {
      this.query = q
    },
  },
})
