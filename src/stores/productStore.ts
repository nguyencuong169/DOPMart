import { defineStore } from "pinia"
import { ref, computed } from "vue"
import {
  isSupabaseReady,
  supabase,
} from "@/lib/supabase"
import type {
  ProductRow,
  ShelfRow,
  FormatRow,
} from "@/types/database.types"
import { seedProducts } from "@/data/products"

interface ProductUI {
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
  hot: boolean
  color: string
  tint: string
  image: string | null
  description: string
  tags: string[]
  notes: string[][]
  stock: { 14: number; 20: number }
  createdAt: string | null
  updatedAt: string | null
}

export const useProductStore = defineStore("product", () => {
  const products = ref<ProductUI[]>([])
  const categories = ref<string[]>([])
  const formats = ref<string[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const _initialized = ref(false)
  const quickProduct = ref<ProductUI | null>(null)
  const query = ref("")

  const bySlug = computed(() => (slug: string) =>
    products.value.find((p) => p.slug === slug) ?? null
  )

  const byCategory = computed(() => (slug: string) =>
    products.value.filter((p) => p.category === slug)
  )

  const filtered = computed(() => {
    const list = [...products.value]
    if (query.value) {
      const q = query.value.toLowerCase()
      return list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return list
  })

  function mapProduct(
    row: ProductRow & {
      stock_floor_14?: number
      stock_floor_20?: number
    }
  ): ProductUI {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      format: row.format_slug,
      category: row.shelf_slug,
      categoryName: row.category_name,
      price: row.price,
      rating: row.rating,
      sold: row.sold,
      isNew: row.is_new,
      hot: row.hot,
      color: row.color,
      tint: row.tint,
      image: (row as any).image ?? null,
      description: row.description,
      tags: row.tags ?? [],
      notes: row.notes ?? [],
      stock: {
        14: (row as any).stock_floor_14 ?? 0,
        20: (row as any).stock_floor_20 ?? 0,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  function useSeedFallback() {
    if (!products.value.length) products.value = seedProducts as ProductUI[]
    if (!categories.value.length) categories.value = [
      "snack-man", "do-cay", "ngot", "suc-khoe", "bua-nhanh", "do-uong",
    ]
    if (!formats.value.length) formats.value = [
      "chips", "noodles", "instant", "chocolate", "drinks", "spicy", "candy", "healthy",
    ]
  }

  async function init() {
    if (_initialized.value && products.value.length) return
    _initialized.value = true
    if (!isSupabaseReady) {
      useSeedFallback()
      loading.value = false
      return
    }
    loading.value = true
    error.value = null
    await Promise.all([fetchProducts(), fetchCategories(), fetchFormats()])
    useSeedFallback()
    loading.value = false
  }

  async function fetchProducts() {
    if (!isSupabaseReady) return
    const { data, error: err } = await supabase!
      .from("products")
      .select("*")
      .order("id", { ascending: true })
    if (err) {
      error.value = err.message
      if (!products.value.length) useSeedFallback()
    } else {
      products.value = (data || []).map((row: ProductRow) => mapProduct(row))
    }
  }

  async function fetchCategories() {
    if (!isSupabaseReady) return
    const { data, error: err } = await supabase!
      .from("shelves")
      .select("name")
      .order("name")
    if (err) {
      error.value = err.message
    } else {
      categories.value = (data || []).map((row: ShelfRow) => row.name)
    }
  }

  async function fetchFormats() {
    if (!isSupabaseReady) return
    const { data, error: err } = await supabase!
      .from("formats")
      .select("name")
      .order("name")
    if (err) {
      error.value = err.message
    } else {
      formats.value = (data || []).map((row: FormatRow) => row.name)
    }
  }

  function openQuick(product: ProductUI) {
    quickProduct.value = product
  }

  function closeQuick() {
    quickProduct.value = null
  }

  function setQuery(q: string) {
    query.value = q
  }

  return {
    products,
    categories,
    formats,
    loading,
    error,
    quickProduct,
    query,
    bySlug,
    byCategory,
    filtered,
    init,
    fetchProducts,
    fetchCategories,
    fetchFormats,
    openQuick,
    closeQuick,
    setQuery,
    useSeedFallback,
    mapProduct,
  }
})
