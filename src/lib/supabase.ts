import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseReady = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseReady
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
