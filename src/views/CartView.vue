<script setup>
import { onMounted } from "vue";
import { ArrowRight } from "lucide-vue-next";
import { useCartStore } from "../stores/cartStore";
const cart = useCartStore();
onMounted(() => cart.init());
</script>
<template>
  <main class="cart-page">
    <header class="cart-hero">
      <div class="cart-hero__copy">
        <span class="kicker">GIỎ HÀNG · CỦA BẠN</span>
        <h1>Giỏ hàng của bạn.</h1>
        <p class="cart-lead">
          Mỗi món sẽ được giữ riêng cho bạn khi bấm đặt hàng. Tùy chỉnh số lượng hoặc xóa món bất cứ lúc nào.
        </p>
      </div>
    </header>

    <div v-if="cart.items.length" class="cart-grid">
      <section class="cart-list" aria-label="Danh sách món trong giỏ">
        <CartItem
          v-for="item in cart.items"
          :key="item.id"
          :item="item"
        />
      </section>

      <aside class="cart-summary" aria-label="Tóm tắt thanh toán">
        <div class="cart-summary__head">
          <span class="kicker cart-summary__kicker">TÓM TẮT ĐƠN</span>
          <h2 class="cart-summary__title">Tổng cộng</h2>
        </div>

        <div class="cart-summary__breakdown">
          <div class="cart-summary__row">
            <span>Tạm tính</span>
            <b class="tabular-nums">{{ cart.total.toLocaleString("vi-VN") }} ₫</b>
          </div>
          <div class="cart-summary__row cart-summary__row--muted">
            <span>Phí giao hàng</span>
            <span>Miễn phí</span>
          </div>
          <div class="cart-summary__row cart-summary__row--grand">
            <span>Tổng thanh toán</span>
            <b class="tabular-nums">{{ cart.total.toLocaleString("vi-VN") }} ₫</b>
          </div>
        </div>

        <RouterLink
          v-if="cart.items.length"
          class="cart-cta"
          to="/checkout"
        >
          Tiếp tục thanh toán <ArrowRight :size="15" aria-hidden="true" />
        </RouterLink>

        <p class="cart-note">
          Giá và tồn kho sẽ được xác nhận lại ở bước đặt hàng.
        </p>
      </aside>
    </div>

    <div v-else class="cart-empty">
      <div class="cart-empty__mark">🛒</div>
      <h2 class="cart-empty__title">Giỏ hàng đang trống.</h2>
      <p class="cart-empty__lead">
        Chưa có món nào trong giỏ. Khám phá thực đơn và thêm món đầu tiên.
      </p>
      <RouterLink class="cart-btn" to="/products">Xem thực đơn</RouterLink>
    </div>
  </main>
</template>

<style scoped>
.cart-page {
  min-height: calc(100svh - 88px);
  padding: 104px 6vw 96px;
  background: var(--paper);
  color: var(--ink);
}
.cart-page a {
  color: inherit;
  text-decoration: none;
}

/* ---------- hero header ---------- */
.cart-hero {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 46px;
}
.kicker {
  font-family: var(--font-ui);
  font-size: var(--fs-kicker);
  font-weight: var(--ds-weight-semibold);
  letter-spacing: var(--tracking-kicker);
  text-transform: uppercase;
  color: var(--on-yellow);
  background: var(--yellow);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 11px;
  border-radius: var(--ds-radius-pill);
  border: 2px solid var(--ink);
  box-shadow: 3px 3px 0 var(--ink);
}
.cart-hero h1 {
  font-family: var(--font-display);
  font-size: clamp(42px, 6vw, 76px);
  line-height: 1;
  margin: 6px 0 0;
  letter-spacing: var(--tracking-display);
  text-wrap: balance;
}
.cart-lead {
  max-width: 52ch;
  margin: 10px 0 0;
  color: var(--muted-foreground);
  font-size: var(--fs-lead);
  line-height: var(--lh-body);
}

/* ---------- grid ---------- */
.cart-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 22px;
  max-width: 980px;
  margin: 0 auto;
}
@media (min-width: 760px) {
  .cart-grid {
    grid-template-columns: 1.35fr 0.65fr;
  }
}

/* ---------- list ---------- */
.cart-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ---------- summary aside ---------- */
.cart-summary {
  position: sticky;
  top: 112px;
  align-self: start;
}
.cart-summary__head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}
.cart-summary__kicker {
  margin: 0;
}
.cart-summary__title {
  font-family: var(--font-display);
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.05;
  margin: 0;
  letter-spacing: var(--tracking-display);
}
.cart-summary__breakdown {
  display: grid;
  gap: 12px;
  margin-bottom: 26px;
  border: 2px solid var(--ink);
  border-radius: 20px;
  background: #fffdf7;
  padding: 18px;
  box-shadow: 5px 5px 0 var(--ink);
}
.cart-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--ink);
}
.cart-summary__row--muted {
  color: var(--muted-foreground);
  font-size: 13px;
  font-weight: var(--ds-weight-medium);
}
.cart-summary__row--grand {
  border-top: 1px solid #ded5ca;
  padding-top: 14px;
  margin-top: 10px;
  font-size: 16px;
  font-weight: var(--ds-weight-heavy);
}
.cart-summary__row--grand b {
  font-family: var(--font-display);
  font-size: 26px;
}
.cart-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  border: 2px solid var(--ink);
  border-radius: var(--ds-radius-pill);
  background: var(--yellow);
  color: var(--ink);
  font-family: var(--font-ui);
  font-weight: var(--ds-weight-heavy);
  padding: 13px 22px;
  font-size: var(--fs-md);
  box-shadow: 4px 4px 0 var(--ink);
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.cart-cta:hover {
  transform: translate(-1px, -1px);
  box-shadow: 6px 6px 0 var(--ink);
}
.cart-note {
  margin: 10px 0 0;
  color: var(--muted-foreground);
  font-size: var(--fs-sm);
  line-height: var(--lh-body);
  text-align: center;
}

/* ---------- empty state ---------- */
.cart-empty {
  display: grid;
  place-items: center;
  gap: 16px;
  padding: 40px 20px;
  text-align: center;
  border: 2px dashed #b9aea3;
  border-radius: 24px;
  max-width: 560px;
  margin: 0 auto;
}
.cart-empty__mark {
  font-size: 56px;
}
.cart-empty__title {
  font-family: var(--font-display);
  font-size: clamp(30px, 5vw, 48px);
  line-height: 1.15;
  margin: 0;
}
.cart-empty__lead {
  margin: 6px 0 18px;
  color: var(--muted-foreground);
  font-size: var(--fs-md);
  line-height: var(--lh-body);
}
.cart-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px solid var(--ink);
  border-radius: var(--ds-radius-pill);
  background: var(--yellow);
  color: var(--ink);
  font-family: var(--font-ui);
  font-weight: var(--ds-weight-heavy);
  padding: 12px 26px;
  font-size: var(--fs-md);
  box-shadow: 4px 4px 0 var(--ink);
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.cart-btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 6px 6px 0 var(--ink);
}

@media (max-width: 640px) {
  .cart-page {
    padding: 92px 16px 96px;
  }
  .cart-summary {
    position: static;
  }
}
</style>
