import { defineStore } from "pinia"
import { ref, computed } from "vue"
import {
  isSupabaseReady,
  supabase,
  getCurrentUser,
  ensureCartForUser,
} from "@/lib/supabase"
import type { CartItemRow } from "@/types/database.types"

interface CartItemProduct {
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
  description: string
  tags: string[]
  notes: string[][]
  stock: { 14: number; 20: number }
  image: string | null
  createdAt: string | null
  updatedAt: string | null
}

interface CartItem {
  product: CartItemProduct
  cartItemId: string
  qty: number
  stock: { 14: number; 20: number }
}

const KEY = "dopmart-cart-v1"

export const useCartStore = defineStore("cart", () => {
  const items = ref<CartItem[]>([])
  const open = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const _cartId = ref<string | null>(null)
  const _useSupabase = isSupabaseReady

  const count = computed(() =>
    items.value.reduce((n, i) => n + i.qty, 0)
  )
  const total = computed(() =>
    items.value.reduce((n, i) => n + i.product.price * i.qty, 0)
  )

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(items.value))
    } catch {}
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as CartItem[]) : []
    } catch {
      return []
    }
  }

  async function init() {
    _useSupabase = isSupabaseReady
    if (!_useSupabase) {
      items.value = loadLocal()
      loading.value = false
      return
    }
    const user = await getCurrentUser()
    if (!user) {
      error.value = "Not authenticated"
      items.value = []
      loading.value = false
      return
    }
    _cartId.value = await ensureCartForUser(user.id)
    await fetchItems()
  }

  async function fetchItems() {
    if (!_useSupabase || !_cartId.value) return
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase!
      .from("cart_items")
      .select(
        `
        id,
        qty,
        created_at,
        updated_at,
        products (
          id, slug, name, format_slug, shelf_slug, category_name,
          price, rating, sold, is_new, hot, color, tint,
          description, tags, notes, stock_floor_14, stock_floor_20,
          stock, image, created_at, updated_at
        )
      `
      )
      .eq("cart_id", _cartId.value)
      .order("created_at", { ascending: true })
    if (err) {
      error.value = err.message
      items.value = []
    } else {
      items.value = (data || []).map((row: CartItemRow) => ({
        product: {
          ...(row.products as any),
          format: (row.products as any).format_slug,
          category: (row.products as any).shelf_slug,
          categoryName: (row.products as any).category_name,
          isNew: (row.products as any).is_new,
          stock: {
            14: (row.products as any).stock_floor_14 ?? 0,
            20: (row.products as any).stock_floor_20 ?? 0,
          },
          createdAt: (row.products as any).created_at,
          updatedAt: (row.products as any).updated_at,
        } as CartItemProduct,
        cartItemId: row.id,
        qty: row.qty,
        stock: {
          14: (row.products as any).stock_floor_14 ?? 0,
          20: (row.products as any).stock_floor_20 ?? 0,
        },
      }))
    }
    loading.value = false
    persist()
  }

  async function add(product: any, qty = 1) {
    if (!_useSupabase) {
      const existing = items.value.find((i) => i.product.id === product.id)
      if (existing) {
        existing.qty += qty
      } else {
        items.value.push({
          product: {
            ...product,
            format: product.format_slug,
            category: product.shelf_slug,
            categoryName: product.category_name,
            isNew: product.is_new,
            stock: {
              14: product.stock_floor_14 ?? 0,
              20: product.stock_floor_20 ?? 0,
            },
            createdAt: product.created_at,
            updatedAt: product.updated_at,
          } as CartItemProduct,
          cartItemId: `local-${Date.now()}`,
          qty,
          stock: {
            14: product.stock_floor_14 ?? 0,
            20: product.stock_floor_20 ?? 0,
          },
        })
      }
      persist()
      return
    }
    if (!_cartId.value) return
    loading.value = true
    const { data, error: err } = await supabase!
      .from("cart_items")
      .upsert(
        { cart_id: _cartId.value, product_id: product.id, qty },
        { onConflict: "cart_id,product_id" }
      )
      .select("id")
      .single()
    if (err) {
      error.value = err.message
    } else {
      await fetchItems()
    }
    loading.value = false
  }

  async function remove(productId: number) {
    if (!_useSupabase) {
      items.value = items.value.filter((i) => i.product.id !== productId)
      persist()
      return
    }
    if (!_cartId.value) return
    loading.value = true
    const { error: err } = await supabase!
      .from("cart_items")
      .delete()
      .eq("cart_id", _cartId.value)
      .eq("product_id", productId)
    if (err) error.value = err.message
    else await fetchItems()
    loading.value = false
  }

  async function setQty(productId: number, qty: number) {
    if (qty <= 0) {
      await remove(productId)
      return
    }
    if (!_useSupabase) {
      const item = items.value.find((i) => i.product.id === productId)
      if (item) item.qty = qty
      persist()
      return
    }
    if (!_cartId.value) return
    loading.value = true
    const { error: err } = await supabase!
      .from("cart_items")
      .update({ qty })
      .eq("cart_id", _cartId.value)
      .eq("product_id", productId)
    if (err) error.value = err.message
    else await fetchItems()
    loading.value = false
  }

  async function clear() {
    items.value = []
    persist()
    if (!_useSupabase || !_cartId.value) return
    loading.value = true
    const { error: err } = await supabase!
      .from("cart_items")
      .delete()
      .eq("cart_id", _cartId.value)
    if (err) error.value = err.message
    loading.value = false
  }

  function toggle() {
    open.value = !open.value
  }

  return {
    items,
    open,
    loading,
    error,
    count,
    total,
    init,
    fetchItems,
    add,
    remove,
    setQty,
    clear,
    toggle,
    persist,
  }
})
