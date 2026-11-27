import { supabase } from '../lib/supabase'
import type { MartOrderStatus, MartOrderSummary } from '../types/mart-order'

export interface MartAdminSummary {
  kpis: {
    paidRevenue: number
    paidOrders: number
    activeOrders: number
    lowStockCount: number
  }
  lowStock: Array<{
    productId: number
    name: string
    sku: string
    onHandQty: number
    reservedQty: number
    availableQty: number
  }>
  recentOrders: Array<{
    id: string
    orderNumber: string
    status: string
    grandTotal: number
    fulfillmentMethod: string
    createdAt: string
  }>
}

export interface MartAdminOrder extends MartOrderSummary {
  customerId: string
  floor?: number
}

export interface MartAdminProduct {
  id: number
  name: string
  slug: string
  formatSlug: string
  shelfSlug: string
  categoryName: string
  price: number
  rating: number
  sold: number
  isNew: boolean
  hot: boolean
  color: string
  tint: string
  description: string
  onHandQty: number
  reservedQty: number
  availableQty: number
}

export interface MartAdminPromotion {
  id: string
  code: string
  description: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_order: number
  max_uses: number
  used_count: number
  starts_at: string
  ends_at?: string
  is_active: boolean
}

export interface MartAdminUser {
  userId: string
  floor: number
  role: 'admin' | 'customer'
  createdAt?: string
  orderCount: number
  totalSpent: number
}

function assertSupabase() {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.')
  return supabase
}

export async function getMartAdminSummary(): Promise<MartAdminSummary> {
  const { data, error } = await assertSupabase().rpc('get_mart_admin_summary')
  if (error) throw error
  return data as MartAdminSummary
}

export async function getMartAdminOrders(status?: MartOrderStatus): Promise<MartAdminOrder[]> {
  const { data, error } = await assertSupabase().rpc('get_mart_admin_orders', {
    p_status: status ?? null,
  })
  if (error) throw error
  return (data ?? []) as MartAdminOrder[]
}

export async function getMartAdminProducts(): Promise<MartAdminProduct[]> {
  const { data, error } = await assertSupabase().rpc('get_mart_admin_products')
  if (error) throw error
  return (data ?? []) as MartAdminProduct[]
}

export async function upsertMartProduct(product: Record<string, unknown>) {
  const { data, error } = await assertSupabase().rpc('upsert_mart_product', {
    p_product: product,
  })
  if (error) throw error
  return data
}

export async function deleteMartProduct(productId: number) {
  const { data, error } = await assertSupabase().rpc('delete_mart_product', {
    p_product_id: productId,
  })
  if (error) throw error
  return data
}

export async function getMartAdminPromotions(): Promise<MartAdminPromotion[]> {
  const { data, error } = await assertSupabase().rpc('get_mart_admin_promotions')
  if (error) throw error
  return (data ?? []) as MartAdminPromotion[]
}

export async function upsertMartPromotion(promotion: Record<string, unknown>) {
  const { data, error } = await assertSupabase().rpc('upsert_mart_promotion', {
    p_promotion: promotion,
  })
  if (error) throw error
  return data
}

export async function deleteMartPromotion(promotionId: string) {
  const { data, error } = await assertSupabase().rpc('delete_mart_promotion', {
    p_promotion_id: promotionId,
  })
  if (error) throw error
  return data
}

export async function getMartAdminUsers(): Promise<MartAdminUser[]> {
  const { data, error } = await assertSupabase().rpc('get_mart_admin_users')
  if (error) throw error
  return (data ?? []) as MartAdminUser[]
}

export async function updateMartUserRole(userId: string, role: 'admin' | 'customer') {
  const { data, error } = await assertSupabase().rpc('update_mart_user_role', {
    p_user_id: userId,
    p_role: role,
  })
  if (error) throw error
  return data
}

export async function receiveMartStock(productId: number, quantity: number, note: string) {
  const { data, error } = await assertSupabase().rpc('receive_mart_stock', {
    p_items: [{ product_id: productId, quantity }],
    p_note: note,
  })
  if (error) throw error
  return data
}

export async function updateMartOrderStatus(orderId: string, status: string, reason?: string) {
  const { data, error } = await assertSupabase().rpc('update_mart_order_status', {
    p_order_id: orderId,
    p_to_status: status,
    p_reason: reason ?? null,
  })
  if (error) throw error
  return data
}
