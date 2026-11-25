import { defineStore } from "pinia"
import { ref } from "vue"
import { isSupabaseReady, supabase, getCurrentUser } from "@/lib/supabase"

export const FLOORS = [14, 20]
const KEY = "dopmart-floor"

export const useFloorStore = defineStore("floor", () => {
  const floor = ref(readFloor())
  const loading = ref(false)
  const error = ref<string | null>(null)
  const _useSupabase = isSupabaseReady

  function readFloor(): number {
    try {
      const saved = Number(localStorage.getItem(KEY))
      return FLOORS.includes(saved) ? saved : 20
    } catch {
      return 20
    }
  }

  async function init() {
    _useSupabase = isSupabaseReady
    if (!_useSupabase) {
      floor.value = readFloor()
      loading.value = false
      return
    }
    const user = await getCurrentUser()
    if (!user) {
      floor.value = 20
      loading.value = false
      return
    }
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase!
      .from("profiles")
      .select("floor")
      .eq("id", user.id)
      .maybeSingle()
    if (err) {
      error.value = err.message
      floor.value = 20
    } else if (data && FLOORS.includes(data.floor)) {
      floor.value = data.floor
    } else {
      floor.value = 20
    }
    loading.value = false
  }

  async function setFloor(v: number) {
    const f = Number(v)
    if (!FLOORS.includes(f)) return
    floor.value = f
    try {
      localStorage.setItem(KEY, String(f))
    } catch {}
    if (!_useSupabase) return
    const user = await getCurrentUser()
    if (user) {
      const { error: err } = await supabase!
        .from("profiles")
        .update({ floor: f, updated_at: new Date().toISOString() })
        .eq("id", user.id)
      if (err) error.value = err.message
    }
  }

  return {
    floor,
    loading,
    error,
    init,
    setFloor,
  }
})
