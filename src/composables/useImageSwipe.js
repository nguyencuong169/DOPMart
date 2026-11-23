import { ref } from "vue";
import { useSwipe } from "@vueuse/core";

export function useImageSwipe(changeSlide) {
  const surface = ref(null);
  useSwipe(surface, {
    onSwipeEnd(event, direction) {
      if (event.type !== "touchend" || event.touches.length) return;
      if (direction === "left") changeSlide(1);
      if (direction === "right") changeSlide(-1);
    },
  });
  return surface;
}
