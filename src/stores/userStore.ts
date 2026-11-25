import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { getCurrentUserWithProfile, supabase } from "../lib/supabase"

export const useUserStore = defineStore("user", () => {
  const user = ref<any | null>(null)
  const profile = ref<any | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Lấy user hiện tại kèm profile từ Supabase Auth
  async function init() {
    await fetchCurrentUser()
  }

  async function fetchCurrentUser() {
    if (!supabase) {
      error.value = "Chưa cấu hình Supabase (thiếu VITE_SUPABASE_ANON_KEY)"
      return
    }
    loading.value = true
    error.value = null
    try {
      const result = await getCurrentUserWithProfile()
      user.value = result ? result.user : null
      profile.value = result ? result.profile : null
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  // Đăng nhập
  async function login(email: string, password: string) {
    if (!supabase) throw new Error("Chưa cấu hình Supabase")
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (err) throw err
      user.value = data.user
      if (data.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()
        profile.value = prof
      }
      return { user: data.user, error: null }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      return { user: null, error: err }
    } finally {
      loading.value = false
    }
  }

  // Đăng ký
  async function register(email: string, password: string) {
    if (!supabase) throw new Error("Chưa cấu hình Supabase")
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
      })
      if (err) throw err
      user.value = data.user
      // Trigger handle_new_user sẽ tự tạo profile trong DB
      return { user: data.user, error: null }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      return { user: null, error: err }
    } finally {
      loading.value = false
    }
  }

  // Đăng xuất
  async function logout() {
    if (!supabase) return
    loading.value = true
    try {
      await supabase.auth.signOut()
      user.value = null
      profile.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  // Cập nhật profile (floor, ...)
  async function updateProfile(updates: any) {
    if (!supabase || !user.value) throw new Error("Chưa đăng nhập")
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", user.value.id)
        .select()
        .single()
      if (err) throw err
      profile.value = { ...profile.value, ...data }
      return { data, error: null }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      return { data: null, error: err }
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    profile,
    loading,
    error,
    isLoggedIn: computed(() => !!user.value),
    isAdmin: computed(() => profile.value?.role === "admin"),
    fetchCurrentUser,
    init,
    login,
    register,
    logout,
    updateProfile,
  }
})
