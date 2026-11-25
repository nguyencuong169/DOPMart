import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseReady = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient | null = isSupabaseReady
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export async function getCurrentUser() {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function getCurrentUserWithProfile() {
  if (!supabase) return null
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (error) return { user, profile: null }
  return { user, profile }
}

export async function isAdmin() {
  if (!supabase) return false
  const result = await getCurrentUserWithProfile()
  return Boolean(result?.profile?.role === "admin")
}

export async function ensureCartForUser(userId: string) {
  if (!supabase) throw new Error("Supabase not configured")

  const { data: existing } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single()

  if (error) throw error
  return created.id
}

// ============================================================
// Admin helpers
// ============================================================

/** Lấy tất cả đơn hàng (admin only, RLS sẽ từ chối nếu không phải admin) */
export async function fetchOrders() {
  if (!supabase) throw new Error("Supabase not configured")
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        product_id,
        qty,
        price_snapshot,
        created_at,
        products (
          id,
          name,
          slug,
          format_slug,
          shelf_slug,
          category_name,
          price
        )
      ),
      profiles (
        id,
        floor,
        is_admin
      )
    `)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

/** Cập nhật trạng thái đơn hàng (admin only) */
export async function updateOrderStatus(orderId: string, status: string) {
  if (!supabase) throw new Error("Supabase not configured")
  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Lấy tất cả khuyến mãi (admin only) */
export async function fetchPromotions() {
  if (!supabase) throw new Error("Supabase not configured")
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

/** Tạo khuyến mãi mới (admin only) */
export async function createPromotion(promotion: any) {
  if (!supabase) throw new Error("Supabase not configured")
  const { data, error } = await supabase
    .from("promotions")
    .insert(promotion)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Cập nhật khuyến mãi (admin only) */
export async function updatePromotion(promotionId: string, updates: any) {
  if (!supabase) throw new Error("Supabase not configured")
  const { data, error } = await supabase
    .from("promotions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", promotionId)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Xóa khuyến mãi (admin only) */
export async function deletePromotion(promotionId: string) {
  if (!supabase) throw new Error("Supabase not configured")
  const { error } = await supabase
    .from("promotions")
    .delete()
    .eq("id", promotionId)
  if (error) throw error
}

/** Lấy tất cả người dùng / profiles (admin only) */
export async function fetchUsers() {
  if (!supabase) throw new Error("Supabase not configured")
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true })
  if (error) throw error
  return data || []
}

/** Cập nhật quyền admin của người dùng (admin only) */
export async function updateUserRole(userId: string, isAdmin: boolean) {
  if (!supabase) throw new Error("Supabase not configured")
  const { data, error } = await supabase
    .from("profiles")
    .update({ role: isAdmin ? "admin" : "customer", updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Lấy lịch sử sử dụng mã giảm giá (admin only) */
export async function fetchPromotionUsage() {
  if (!supabase) throw new Error("Supabase not configured")
  const { data, error } = await supabase
    .from("promotion_usage")
    .select(`
      *,
      promotions ( code ),
      profiles ( id, floor, is_admin )
    `)
    .order("used_at", { ascending: false })
  if (error) throw error
  return data || []
}

/** Lấy danh sách sản phẩm admin (có phân trang, lọc, sắp xếp) */
export async function fetchAdminProducts({
  page = 1,
  pageSize = 20,
  search = "",
  shelfSlug = "",
  formatSlug = "",
  sortBy = "created_at",
  sortDir = "desc",
} = {}) {
  if (!supabase) throw new Error("Supabase not configured")
  let query = supabase.from("products").select("*", { count: "exact" })
  if (search) query = query.ilike("name", `%${search}%`)
  if (shelfSlug) query = query.eq("shelf_slug", shelfSlug)
  if (formatSlug) query = query.eq("format_slug", formatSlug)
  query = query.order(sortBy, { ascending: sortDir === "asc" })
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)
  const { data, error, count } = await query
  if (error) throw error
  return { data: data || [], count: count || 0 }
}

/** Cập nhật tồn kho chung của sản phẩm (không phân tầng) */
export async function updateProductStock(productId: string | number, stock: number) {
  if (!supabase) throw new Error("Supabase not configured")
  const { data, error } = await supabase
    .from("products")
    .update({ stock, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Upload ảnh sản phẩm lên storage bucket product-images */
export async function uploadProductImage(filePath: string, file: File) {
  if (!supabase) throw new Error("Supabase not configured")
  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(filePath, file, { upsert: true })
  if (error) throw error
  return data
}

/** Lấy URL công khai của ảnh sản phẩm */
export function getProductImageUrl(filePath: string): string | null {
  if (!supabase) return null
  const { data } = supabase.storage.from("product-images").getPublicUrl(filePath)
  return data.publicUrl
}
