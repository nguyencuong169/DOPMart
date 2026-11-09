<script setup>
import { computed, ref, watch } from "vue";
import { Minus, Plus, ShoppingBag } from "lucide-vue-next";
import { useCartStore } from "../../stores/cartStore";

/* The one add-to-cart control in the app: the card buy row, the card's quick button,
   the quick view and the detail page all mount this, so the quantity stepper, the
   stock guard and "what happens after adding" can never drift between screens. */
const props = defineProps({
  product: { type: Object, required: true },
  /* stock on the floor being shopped; null means unknown, so the control stays live */
  stock: { type: Number, default: null },
  /* "row" = stepper + button, "icon" = the single 44px button a small tile has room for */
  variant: { type: String, default: "row" },
  /* "sm" inside a card, "md" on a page */
  size: { type: String, default: "sm" },
  label: { type: String, default: "Thêm vào giỏ" },
});
const emit = defineEmits(["added"]);

const cart = useCartStore();
const qty = ref(1);
const soldOut = computed(() => props.stock !== null && props.stock <= 0);
const ceiling = computed(() => (props.stock === null ? 99 : Math.max(1, props.stock)));

/* a new product means a new quantity */
watch(
  () => props.product?.id,
  () => (qty.value = 1),
);

const step = (delta) => {
  qty.value = Math.min(ceiling.value, Math.max(1, qty.value + delta));
};
const add = () => {
  if (soldOut.value) return;
  cart.add(props.product, qty.value);
  emit("added", qty.value);
  qty.value = 1;
};
</script>
<template>
  <div class="qa" :class="[`qa--${variant}`, `qa--${size}`]">
    <div v-if="variant === 'row'" class="qa__qty">
      <button
        type="button"
        class="qa__step"
        :disabled="qty <= 1"
        :aria-label="`Bớt một ${product.name}`"
        @click="step(-1)"
      >
        <Minus :size="14" />
      </button>
      <span class="qa__n" aria-live="polite">{{ qty }}</span>
      <button
        type="button"
        class="qa__step"
        :disabled="qty >= ceiling"
        :aria-label="`Thêm một ${product.name}`"
        @click="step(1)"
      >
        <Plus :size="14" />
      </button>
    </div>
    <button
      type="button"
      class="qa__go"
      :disabled="soldOut"
      :aria-label="
        soldOut ? `${product.name} đã hết hàng` : `Thêm ${product.name} vào giỏ`
      "
      @click="add"
    >
      <Plus v-if="variant === 'icon'" :size="20" />
      <template v-else
        >{{ soldOut ? "Hết hàng" : label }}<ShoppingBag :size="16"
      /></template>
    </button>
  </div>
</template>

<style scoped>
.qa {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-ui);
}
.qa__qty {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border: var(--bw-bold) solid var(--ink);
  border-radius: var(--r-pill);
  background: #fff;
  box-shadow: 2px 2px 0 var(--ink);
}
.qa__step {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1.5px solid var(--ink);
  border-radius: 50%;
  background: #fff;
  color: var(--ink);
  cursor: pointer;
}
.qa__step:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.qa__step:hover:not(:disabled) {
  background: #f3f3f3;
}
.qa__n {
  min-width: 18px;
  text-align: center;
  font-size: var(--fs-sm);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.qa__go {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border: var(--bw-bold) solid var(--ink);
  border-radius: var(--r-pill);
  background: var(--yellow);
  color: var(--ink);
  font-weight: 800;
  font-size: var(--fs-sm);
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--ink);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}
.qa__go:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--ink);
}
.qa__go:active:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 var(--ink);
}
.qa__go:disabled {
  background: color-mix(in srgb, var(--ink) 8%, transparent);
  border-color: color-mix(in srgb, var(--ink) 24%, transparent);
  color: color-mix(in srgb, var(--ink) 45%, transparent);
  box-shadow: none;
  cursor: not-allowed;
}
.qa__go:focus-visible,
.qa__step:focus-visible {
  outline: 3px solid var(--ink);
  outline-offset: 2px;
}
/* the icon form is the 44px target a small tile can carry */
.qa--icon .qa__go {
  width: var(--touch);
  height: var(--touch);
  padding: 0;
}
/* md is for the quick view and the detail page */
.qa--md .qa__qty {
  padding: 4px 8px;
}
.qa--md .qa__step {
  width: 30px;
  height: 30px;
}
.qa--md .qa__n {
  min-width: 22px;
  font-size: var(--fs-md);
}
.qa--md .qa__go {
  height: 48px;
  padding: 0 20px;
  font-size: var(--fs-md);
}
@media (prefers-reduced-motion: reduce) {
  .qa__go {
    transition: none;
  }
}
</style>
