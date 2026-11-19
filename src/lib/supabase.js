import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseReady = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseReady
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function ensureCartForUser(userId) {
  if (!supabase) throw new Error("Supabase not configured");
  const { data: existing } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (error) throw error;
  return created.id;
}

// ============================================================
// Admin helpers
// ============================================================

/** Lấy user hiện tại kèm profile (bao gồm is_admin) từ bảng profiles */
export async function getCurrentUserWithProfile() {
  if (!supabase) return null;
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return { user, profile: null };
  return { user, profile };
}

/** Kiểm tra user hiện tại có quyền admin hay không */
export async function isAdmin() {
  if (!supabase) return false;
  const result = await getCurrentUserWithProfile();
  return Boolean(result?.profile?.role === 'admin');
}

/** Lấy tất cả đơn hàng (admin only, RLS sẽ từ chối nếu không phải admin) */
export async function fetchOrders() {
  if (!supabase) throw new Error("Supabase not configured");
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
          price,
          image_url
        )
      ),
      profiles (
        id,
        floor,
        is_admin
      )
    `)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Cập nhật trạng thái đơn hàng (admin only) */
export async function updateOrderStatus(orderId, status) {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Lấy tất cả khuyến mãi (admin only) */
export async function fetchPromotions() {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Tạo khuyến mãi mới (admin only) */
export async function createPromotion(promotion) {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("promotions")
    .insert(promotion)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Cập nhật khuyến mãi (admin only) */
export async function updatePromotion(promotionId, updates) {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("promotions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", promotionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Xóa khuyến mãi (admin only) */
export async function deletePromotion(promotionId) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("promotions")
    .delete()
    .eq("id", promotionId);
  if (error) throw error;
}

/** Lấy tất cả người dùng / profiles (admin only) */
export async function fetchUsers() {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

/** Cập nhật quyền admin của người dùng (admin only) */
export async function updateUserRole(userId, isAdmin) {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("profiles")
    .update({ role: isAdmin ? 'admin' : 'customer', updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Lấy lịch sử sử dụng mã giảm giá (admin only) */
export async function fetchPromotionUsage() {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("promotion_usage")
    .select(`
      *,
      promotions ( code ),
      profiles ( id, floor, is_admin )
    `)
    .order("used_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Upload ảnh sản phẩm lên storage bucket product-images (admin only) */
export async function uploadProductImage(filePath, file) {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(filePath, file);
  if (error) throw error;
  return data;
}

/** Lấy URL công khai của ảnh sản phẩm */
export function getProductImageUrl(filePath) {
  if (!supabase) return null;
  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath);
  return data.publicUrl;
}
