import { defineStore } from "pinia";
import { isSupabaseReady, supabase, getCurrentUser } from "../lib/supabase";

export const FLOORS = [14, 20];
const KEY = "dopmart-floor";
function readFloor() {
  try {
    const saved = Number(localStorage.getItem(KEY));
    return FLOORS.includes(saved) ? saved : 20;
  } catch {
    return 20;
  }
}

export const useFloorStore = defineStore("floor", {
  state: () => ({
    floor: readFloor(),
    loading: false,
    error: null,
    _useSupabase: isSupabaseReady,
  }),
  actions: {
    async init() {
      this._useSupabase = isSupabaseReady;
      if (!this._useSupabase) {
        this.floor = readFloor();
        this.loading = false;
        return;
      }
      this.loading = true;
      this.error = null;
      const user = await getCurrentUser();
      if (!user) {
        this.floor = 20;
        this.loading = false;
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("floor")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        this.error = error.message;
        this.floor = 20;
      } else if (data && FLOORS.includes(data.floor)) {
        this.floor = data.floor;
      } else {
        this.floor = 20;
      }
      this.loading = false;
    },
    async setFloor(v) {
      const floor = Number(v);
      if (!FLOORS.includes(floor)) return;
      this.floor = floor;
      try {
        localStorage.setItem(KEY, String(this.floor));
      } catch {
        /* ignore — the choice just won't survive a reload */
      }
      if (this._useSupabase) {
        const user = await getCurrentUser();
        if (user) {
          const { error } = await supabase
            .from("profiles")
            .upsert({ id: user.id, floor, updated_at: new Date().toISOString() });
          if (error) this.error = error.message;
        }
      }
    },
  },
});
