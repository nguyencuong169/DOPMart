import { defineStore } from "pinia";
const saved = Number(localStorage.getItem("dopmart-floor"));
export const useFloorStore = defineStore("floor", {
  state: () => ({ floor: [14, 20].includes(saved) ? saved : 20 }),
  actions: {
    setFloor(v) {
      this.floor = Number(v);
      localStorage.setItem("dopmart-floor", String(this.floor));
    },
  },
});
