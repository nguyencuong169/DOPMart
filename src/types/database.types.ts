// ============================================================
// DOPMart → Supabase database types
// Génrated từ src/data/products.js, src/stores/* sử dụng
// Supabase Postgres Best Practices skill.
// ============================================================

export type ShelvesSlug = 'snack-man' | 'do-cay' | 'ngot' | 'healthy' | 'bua-nhanh' | 'do-uong'

export type FormatsSlug =
  'chips' | 'noodles' | 'instant' | 'chocolate' | 'drinks' | 'spicy' | 'candy' | 'healthy'

export interface PhotoKeywords {
  shows: string
  keywords: string[]
}

export interface FormatRow {
  slug: FormatsSlug
  name: string
  icon: string
  color: string
  image: string
  photo_shows: string
  photo_keywords: string[]
}

export interface ShelfRow {
  slug: ShelvesSlug
  name: string
  tagline: string | null
  icon: string
  color: string
  formats: FormatsSlug[]
}

export interface ProductRow {
  id: number
  slug: string
  name: string
  format_slug: FormatsSlug
  shelf_slug: ShelvesSlug
  category_name: string
  price: number
  rating: number
  sold: number
  is_new: boolean
  hot: boolean
  color: string
  tint: string
  description: string
  tags: string[]
  notes: string[][]
  stock_floor_14: number
  stock_floor_20: number
  created_at: string
  updated_at: string
}

export interface CartRow {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface CartItemRow {
  id: string
  cart_id: string
  product_id: number
  qty: number
  created_at: string
  updated_at: string
  products: ProductRow // nested via foreign-table select
}

export interface FavoriteRow {
  user_id: string
  product_id: number
  created_at: string
}

export interface ProfileRow {
  id: string
  floor: number
  role: 'admin' | 'customer'
  updated_at: string
}

export interface OrderRow {
  id: string
  user_id: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  total: number
  shipping_address: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItemRow {
  id: string
  order_id: string
  product_id: number
  qty: number
  price_snapshot: number
  created_at: string
  products?: ProductRow // nested via foreign-table select
}

export interface PromotionRow {
  id: string
  code: string
  description: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_order: number
  max_uses: number
  used_count: number
  starts_at: string
  ends_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PromotionUsageRow {
  id: string
  promotion_id: string
  user_id: string
  order_id: string | null
  used_at: string
}

// ============================================================
// Client-facing shape used by Pinia stores / Vue components
// (UI still reads camelCase / nested shape, so the mapping
//  happens in the store, not in the DB.)
// ============================================================

export interface Format {
  slug: FormatsSlug
  name: string
  icon: string
  color: string
  image: string
  photo: PhotoKeywords
}

export interface Shelf {
  slug: ShelvesSlug
  name: string
  tagline: string
  icon: string
  color: string
  formats: FormatsSlug[]
  // UI convenience: alias of bookends.shelves
  name_alias?: string
}

export interface Product {
  id: number
  slug: string
  name: string
  format: FormatsSlug
  category: ShelvesSlug
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
  // UI convenience: stock floored per floor
  stock: { 14: number; 20: number }
  created_at: string
  updated_at: string
}

export interface CartItem {
  cartItemId: string
  id: number
  name: string
  format: FormatsSlug
  category_name: string
  price: number
  rating: number
  sold: number
  is_new: boolean
  hot: boolean
  color: string
  tint: string
  description: string
  tags: string[]
  notes: string[][]
  stock_floor_14: number
  stock_floor_20: number
  qty: number
  created_at: string
  updated_at: string
  stock: { 14: number; 20: number }
}

export interface Cart {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface FavoritesRow {
  user_id: string
  product_id: number
}

export interface UserProfile {
  id: string
  floor: number
  role: 'admin' | 'customer'
  updated_at: string
}

// ============================================================
// Admin client-facing shapes (camelCase for Vue components)
// ============================================================

export interface Order {
  id: string
  userId: string
  userName?: string
  status: OrderRow['status']
  total: number
  shippingAddress: string
  notes: string | null
  items?: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: number
  productName?: string
  qty: number
  priceSnapshot: number
  createdAt: string
}

export interface Promotion {
  id: string
  code: string
  description: string
  discountType: PromotionRow['discount_type']
  discountValue: number
  minOrder: number
  maxUses: number
  usedCount: number
  startsAt: string
  endsAt: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PromotionUsage {
  id: string
  promotionId: string
  promotionCode?: string
  userId: string
  userName?: string
  orderId: string | null
  usedAt: string
}

export interface AdminUser {
  id: string
  floor: number
  role: 'admin' | 'customer'
  updatedAt: string
  orderCount?: number
  totalSpent?: number
}
