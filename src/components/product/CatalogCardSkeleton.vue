<template>
  <div class="cat-skel" aria-hidden="true">
    <span class="cat-skel__stage"></span>
    <span class="cat-skel__line" style="--w: 32%; --d: 40ms"></span>
    <span class="cat-skel__line cat-skel__line--title" style="--w: 84%; --d: 80ms"></span>
    <span class="cat-skel__line cat-skel__line--title" style="--w: 56%; --d: 120ms"></span>
    <span class="cat-skel__line" style="--w: 48%; --d: 160ms"></span>
    <span class="cat-skel__row">
      <span class="cat-skel__line cat-skel__line--price" style="--w: 44%; --d: 200ms"></span>
      <span class="cat-skel__circle"></span>
    </span>
  </div>
</template>

<style scoped>
/* the shelf is loading: hold the card's exact height so the page never jumps and no
   cream hole appears where a tile is about to be */
.cat-skel {
  display: block;
  width: 100%;
  animation: cat-skel-in 0.3s ease-out both;
}
.cat-skel__stage {
  display: block;
  padding: 122% 0 0;
  border-radius: 24px;
  background: color-mix(in srgb, var(--ink) 7%, transparent);
  animation: cat-skel-pulse 1.6s ease-in-out infinite;
}
.cat-skel__line {
  display: block;
  width: var(--w, 60%);
  height: 11px;
  margin-top: 10px;
  border-radius: var(--r-pill);
  background: color-mix(in srgb, var(--ink) 9%, transparent);
  animation: cat-skel-pulse 1.6s ease-in-out infinite;
  animation-delay: var(--d, 0ms);
}
.cat-skel__line--title {
  height: 17px;
}
.cat-skel__line--price {
  height: 20px;
  margin-top: 0;
}
.cat-skel__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: var(--sp-2);
  padding-top: var(--sp-1);
  border-top: var(--bw) dashed color-mix(in srgb, var(--ink) 12%, transparent);
}
.cat-skel__circle {
  width: var(--touch);
  height: var(--touch);
  flex: none;
  border-radius: var(--r-pill);
  background: color-mix(in srgb, var(--ink) 9%, transparent);
  animation: cat-skel-pulse 1.6s ease-in-out infinite;
}
@keyframes cat-skel-pulse {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}
@keyframes cat-skel-in {
  from {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cat-skel,
  .cat-skel__stage,
  .cat-skel__line,
  .cat-skel__circle {
    animation: none;
    opacity: 1;
  }
}
</style>
