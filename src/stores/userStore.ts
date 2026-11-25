import { defineStore } from "pinia"
import { ref, computed } from "vue"
import {
  isSupabaseReady,
  supabase,
  getCurrentUserWithProfile,
  isAdmin,
} from "@/lib/supabase"
import type { UserProfile, AdminUser } from "@/types/database.types"

interface AuthState {
  user: any | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

export const useUserStore = defineStore("user", () => {
  const state = ref<AuthState>({
    user: null,
    profile: null,
    loading: false,
    error: null,
  })

  const isLoggedIn = computed(() => !!state.value.user)
  const isAdminUser = computed(() =>
    Boolean(state.value.profile?.role === "admin")
  )

  async function init() {
    state.value.loading = true
    state.value.error = null
    try {
      const result = await getCurrentUserWithProfile()
      if (result) {
        state.value.user = result.user
        state.value.profile = result.profile
      } else {
        state.value.user = null
        state.value.profile = null
      }
    } catch (err: any) {
      state.value.error = err?.message ?? "Unknown error"
      state.value.user = null
      state.value.profile = null
    } finally {
      state.value.loading = false
    }
  }

  async function login(email: string, password: string) {
    if (!isSupabaseReady) throw new Error("Supabase not configured")
    state.value.loading = true
    state.value.error = null
    try {
      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      state.value.user = data.user

      const { data: profile } = await supabase!
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single()
      state.value.profile = profile
      return { user: data.user, error: null }
    } catch (err: any) {
      state.value.error = err.message
      return { user: null, error: err.message }
    } finally {
      state.value.loading = false
    }
  }

  async function register(email: string, password: string) {
    if (!isSupabaseReady) throw new Error("Supabase not configured")
    state.value.loading = true
    state.value.error = null
    try {
      const { data, error } = await supabase!.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      state.value.user = data.user
      return { user: data.user, error: null }
    } catch (err: any) {
      state.value.error = err.message
      return { user: null, error: err.message }
    } finally {
      state.value.loading = false
    }
  }

  async function logout() {
    if (!isSupabaseReady) return
    state.value.loading = true
    try {
      await supabase!.auth.signOut()
      state.value.user = null
      state.value.profile = null
    } catch (err: any) {
      state.value.error = err.message
    } finally {
      state.value.loading = false
    }
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!isSupabaseReady || !state.value.user) {
      throw new Error("Chưa đăng nhập hoặc Supabase chưa cấu hình")
    }
    state.value.loading = true
    state.value.error = null
    try {
      const { data, error } = await supabase!
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", state.value.user.id)
        .select()
        .single()
      if (error) throw error
      state.value.profile = { ...state.value.profile, ...data }
      return { data, error: null }
    } catch (err: any) {
      state.value.error = err.message
      return { data: null, error: err.message }
    } finally {
      state.value.loading = false
    }
  }

  return {
    ...state,
    isLoggedIn,
    isAdminUser: isAdminUser,
    init,
    login,
    register,
    logout,
    updateProfile,
  }
})
