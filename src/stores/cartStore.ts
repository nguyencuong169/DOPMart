import { defineStore } from "pinia"
import { isSupabaseReady, supabase, getCurrentUser, ensureCartForUser } from "../lib/supabase"

const KEY = "dopmart-cart-v1"
function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]")
  } catch {
    return []
  }
}

interface CartItem {
  id: number | string
  name: string
  price: number
  image: string | null
  qty: number
  cartItemId?: string | number
  stock: { 14: number; 20: number }
  [key: string]: any
}

interface CartState {
  items: CartItem[]
  open: boolean
  loading: boolean
  error: string | null
  _cartId: string | null
  _useSupabase: boolean
}

export const useCartStore = defineStore("cart", {
  state: (): CartState => ({
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
        localStorage.setItem(KEY, JSON.stringify(this.items))
      } catch {
        /* private mode / quota — the cart still works for this session */
      }
    },
    async init() {
      this._useSupabase = isSupabaseReady
      if (!this._useSupabase) {
        this.items = load()
        this.loading = false
        return
      }
      const user = await getCurrentUser()
      if (!user) {
        /* Chưa đăng nhập: dùng localStorage làm giỏ tạm.
           Khi đăng nhập xong, giỏ sẽ được đồng bộ từ Supabase. */
        this.items = load()
        this.error = null
        this.loading = false
        return
      }
      this._cartId = await ensureCartForUser(user.id)
      await this.fetchItems()
    },
    async fetchItems() {
      if (!this._useSupabase || !this._cartId) return
      this.loading = true
      this.error = null
      const { data, error } = await supabase!
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
        .order("created_at", { ascending: true })

      if (error) {
        this.error = error.message
        this.items = []
      } else {
        this.items = (data || []).map((row: any) => ({
          ...(row.products as any),
          cartItemId: row.id,
          qty: row.qty,
          stock: { 14: (row.products as any).stock_floor_14 ?? 0, 20: (row.products as any).stock_floor_20 ?? 0 },
        }))
      }
      this.loading = false
    },
    async add(p: CartItem, qty = 1) {
      if (!this._useSupabase || !this._cartId) {
        /* Guest cart (localStorage) hoặc chưa đăng nhập */
        const i = this.items.find((x) => x.id === p.id)
        i ? (i.qty += qty) : this.items.push({ ...p, qty })
        this.persist()
        this.open = true
        return
      }
      const existing = this.items.find((x) => x.id === p.id)
      if (existing) {
        await supabase!
          .from("cart_items")
          .update({ qty: existing.qty + qty })
          .eq("id", existing.cartItemId)
      } else {
        await supabase!!.from("cart_items").insert({
          cart_id: this._cartId,
          product_id: p.id,
          qty,
        })
      }
      await this.fetchItems()
      this.open = true
    },
    async change(id: number | string, d: number) {
      if (!this._useSupabase || !this._cartId) {
        const i = this.items.find((x) => x.id === id)
        if (!i) return
        i.qty += d
        if (i.qty <= 0) this.items = this.items.filter((x) => x.id !== id)
        this.persist()
        return
      }
      const item = this.items.find((x) => x.id === id)
      if (!item) return
      const newQty = item.qty + d
      if (newQty <= 0) {
        await this.remove(id)
        return
      }
      await supabase!!.from("cart_items").update({ qty: newQty }).eq("id", item.cartItemId)
      await this.fetchItems()
    },
    async remove(id: number | string) {
      if (!this._useSupabase || !this._cartId) {
        this.items = this.items.filter((x) => x.id !== id)
        this.persist()
        return
      }
      const item = this.items.find((x) => x.id === id)
      if (!item) return
      await supabase!!.from("cart_items").delete().eq("id", item.cartItemId)
      await this.fetchItems()
    },
    async clear() {
      if (!this._useSupabase || !this._cartId) {
        this.items = []
        this.persist()
        return
      }
      if (!this._cartId) return
      await supabase!!.from("cart_items").delete().eq("cart_id", this._cartId)
      this.items = []
    },
    toggleDrawer() {
      this.open = !this.open
    },
    closeDrawer() {
      this.open = false
    },
  },
})
