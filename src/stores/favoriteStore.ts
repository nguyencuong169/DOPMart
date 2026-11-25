import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { isSupabaseReady, supabase, getCurrentUser } from "@/lib/supabase"

const KEY = "dopmart-favorites-v1"

export const useFavoriteStore = defineStore("favorites", () => {
  const ids = ref<number[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const _useSupabase = isSupabaseReady

  const count = computed(() => ids.value.length)

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids.value))
    } catch {}
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as number[]) : []
    } catch {
      return []
    }
  }

  async function init() {
    _useSupabase = isSupabaseReady
    if (!_useSupabase) {
      ids.value = loadLocal()
      loading.value = false
      return
    }
    const user = await getCurrentUser()
    if (!user) {
      ids.value = []
      loading.value = false
      return
    }
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase!
      .from("favorites")
      .select("product_id")
      .eq("user_id", user.id)
    if (err) {
      error.value = err.message
      ids.value = []
    } else {
      ids.value = (data || []).map((row: { product_id: number }) => row.product_id)
    }
    loading.value = false
  }

  async function toggle(id: number) {
    if (!_useSupabase) {
      if (ids.value.includes(id)) {
        ids.value = ids.value.filter((x) => x !== id)
      } else {
        ids.value = [...ids.value, id]
      }
      persist()
      return
    }
    const user = await getCurrentUser()
    if (!user) {
      error.value = "Not authenticated"
      return
    }
    if (ids.value.includes(id)) {
      const { error: err } = await supabase!
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", id)
      if (err) error.value = err.message
      else ids.value = ids.value.filter((x) => x !== id)
    } else {
      const { error: err } = await supabase!
        .from("favorites")
        .insert({ user_id: user.id, product_id: id })
      if (err) error.value = err.message
      else ids.value = [...ids.value, id]
    }
  }

  function has(id: number) {
    return ids.value.includes(id)
  }

  async function clear() {
    ids.value = []
    persist()
    if (!_useSupabase) return
    const user = await getCurrentUser()
    if (user) {
      const { error: err } = await supabase!
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
      if (err) error.value = err.message
    }
  }

  return {
    ids,
    loading,
    error,
    count,
    init,
    toggle,
    has,
    clear,
    persist,
  }
})
