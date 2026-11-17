// ============================================================
// DOPMart → Supabase database types
// Génrated từ src/data/products.js, src/stores/* sử dụng
// Supabase Postgres Best Practices skill.
// ============================================================

export type ShelvesSlug =
  | 'snack-man'
  | 'do-cay'
  | 'ngot'
  | 'healthy'
  | 'bua-nhanh'
  | 'do-uong';

export type FormatsSlug =
  | 'chips'
  | 'noodles'
  | 'instant'
  | 'chocolate'
  | 'drinks'
  | 'spicy'
  | 'candy'
  | 'healthy';

export interface PhotoKeywords {
  shows: string;
  keywords: string[];
}

export interface FormatRow {
  slug: FormatsSlug;
  name: string;
  icon: string;
  color: string;
  image: string;
  photo_shows: string;
  photo_keywords: string[];
}

export interface ShelfRow {
  slug: ShelvesSlug;
  name: string;
  tagline: string | null;
  icon: string;
  color: string;
  formats: FormatsSlug[];
}

export interface ProductRow {
  id: number;
  slug: string;
  name: string;
  format_slug: FormatsSlug;
  shelf_slug: ShelvesSlug;
  category_name: string;
  price: number;
  rating: number;
  sold: number;
  is_new: boolean;
  hot: boolean;
  color: string;
  tint: string;
  description: string;
  tags: string[];
  notes: string[][];
  stock_floor_14: number;
  stock_floor_20: number;
  created_at: string;
  updated_at: string;
}

export interface CartRow {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CartItemRow {
  id: string;
  cart_id: string;
  product_id: number;
  qty: number;
  created_at: string;
  updated_at: string;
  products: ProductRow; // nested via foreign-table select
}

export interface FavoriteRow {
  user_id: string;
  product_id: number;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  floor: number;
  updated_at: string;
}

// ============================================================
// Client-facing shape used by Pinia stores / Vue components
// (UI still reads camelCase / nested shape, so the mapping
//  happens in the store, not in the DB.)
// ============================================================

export interface Format {
  slug: FormatsSlug;
  name: string;
  icon: string;
  color: string;
  image: string;
  photo: PhotoKeywords;
}

export interface Shelf {
  slug: ShelvesSlug;
  name: string;
  tagline: string;
  icon: string;
  color: string;
  formats: FormatsSlug[];
  // UI convenience: alias of bookends.shelves
  name_alias?: string;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  format: FormatsSlug;
  category: ShelvesSlug;
  categoryName: string;
  price: number;
  rating: number;
  sold: number;
  isNew: boolean;
  hot: boolean;
  color: string;
  tint: string;
  description: string;
  tags: string[];
  notes: string[][];
  // UI convenience: stock floored per floor
  stock: { 14: number; 20: number };
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  cartItemId: string;
  id: number;
  name: string;
  format: FormatsSlug;
  category_name: string;
  price: number;
  rating: number;
  sold: number;
  is_new: boolean;
  hot: boolean;
  color: string;
  tint: string;
  description: string;
  tags: string[];
  notes: string[][];
  stock_floor_14: number;
  stock_floor_20: number;
  qty: number;
  created_at: string;
  updated_at: string;
  stock: { 14: number; 20: number };
}

export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface FavoritesRow {
  user_id: string;
  product_id: number;
}

export interface UserProfile {
  id: string;
  floor: number;
  updated_at: string;
}
