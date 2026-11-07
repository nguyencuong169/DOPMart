import { defineStore } from "pinia";
/* one source for the pickup floors — the store validates against it and the UI
   (floor select, brand stats) reads it instead of repeating the numbers */
export const FLOORS = [14, 20];
/* localStorage throws in private mode / when quota is full — never let that break the app */
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
  state: () => ({ floor: readFloor() }),
  actions: {
    setFloor(v) {
      this.floor = Number(v);
      try {
        localStorage.setItem(KEY, String(this.floor));
      } catch {
        /* ignore — the choice just won't survive a reload */
      }
    },
  },
});
