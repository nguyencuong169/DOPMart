<script setup lang="ts">
import { onMounted, reactive, shallowRef } from "vue";
import { AlertTriangle, Check, PackagePlus, RefreshCw, Truck } from "lucide-vue-next";
import {
  getMartAdminSummary,
  receiveMartStock,
  updateMartOrderStatus,
  type MartAdminSummary,
} from "../../services/martAdminService";

const summary = shallowRef<MartAdminSummary | null>(null);
const loading = shallowRef(true);
const actionError = shallowRef("");
const actionMessage = shallowRef("");
const receiveQuantities = reactive<Record<number, number>>({});
const receiveNotes = reactive<Record<number, string>>({});
const busyProductId = shallowRef<number | null>(null);
const busyOrderId = shallowRef<string | null>(null);

const statusLabels: Record<string, string> = {
  confirmed: "Đã thanh toán",
  preparing: "Đang soạn",
  ready_for_pickup: "Sẵn sàng lấy",
  out_for_delivery: "Đang giao",
  completed: "Hoàn tất",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

async function load() {
  loading.value = true;
  actionError.value = "";
  try {
    summary.value = await getMartAdminSummary();
  } catch (cause) {
    actionError.value = cause instanceof Error ? cause.message : "Không thể tải dashboard vận hành.";
  } finally {
    loading.value = false;
  }
}

async function receive(productId: number) {
  const quantity = Number(receiveQuantities[productId] ?? 0);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    actionError.value = "Số lượng nhập phải là số nguyên dương.";
    return;
  }

  busyProductId.value = productId;
  actionError.value = "";
  actionMessage.value = "";

  try {
    await receiveMartStock(productId, quantity, receiveNotes[productId] || "Nhập hàng vận hành");
    receiveQuantities[productId] = 0;
    receiveNotes[productId] = "";
    actionMessage.value = "Đã cập nhật tồn kho.";
    await load();
  } catch (cause) {
    actionError.value = cause instanceof Error ? cause.message : "Không thể nhập kho.";
  } finally {
    busyProductId.value = null;
  }
}

function nextStatus(status: string, fulfillmentMethod: string) {
  if (status === "confirmed") return "preparing";
  if (status === "preparing") {
    return fulfillmentMethod === "pickup" ? "ready_for_pickup" : "out_for_delivery";
  }
  if (status === "ready_for_pickup" || status === "out_for_delivery") return "completed";
  return null;
}

async function advanceOrder(orderId: string, status: string, fulfillmentMethod: string) {
  const target = nextStatus(status, fulfillmentMethod);
  if (!target) return;

  busyOrderId.value = orderId;
  actionError.value = "";
  actionMessage.value = "";

  try {
    await updateMartOrderStatus(orderId, target, `Operator chuyển sang ${target}`);
    actionMessage.value = "Đã cập nhật trạng thái đơn.";
    await load();
  } catch (cause) {
    actionError.value = cause instanceof Error ? cause.message : "Không thể cập nhật đơn.";
  } finally {
    busyOrderId.value = null;
  }
}

onMounted(load);
</script>

<template>
  <div class="operations-page">
    <header class="operations-header">
      <div>
        <span class="operations-kicker">DOP MART · OPERATIONS</span>
        <h1>Vận hành kho & đơn hàng</h1>
        <p>Theo dõi tồn có thể bán, nhập hàng và xử lý đơn đã thanh toán.</p>
      </div>
      <button type="button" class="ad-btn-refresh" :disabled="loading" @click="load">
        <RefreshCw :size="16" :class="{ spinning: loading }" />
        Làm mới
      </button>
    </header>

    <div v-if="actionError" class="ad-alert ad-alert--error" role="alert">
      <AlertTriangle :size="18" />
      {{ actionError }}
    </div>
    <div v-if="actionMessage" class="ad-alert ad-alert--success" role="status">
      <Check :size="18" />
      {{ actionMessage }}
    </div>

    <div v-if="loading && !summary" class="ad-empty">Đang tải dữ liệu vận hành…</div>

    <template v-else-if="summary">
      <section class="kpi-section" aria-label="Chỉ số vận hành">
        <div class="kpi-grid">
          <article class="kpi-card">
            <span>Doanh thu đã thu</span>
            <strong>{{ formatCurrency(summary.kpis.paidRevenue) }}</strong>
          </article>
          <article class="kpi-card">
            <span>Đơn đã thanh toán</span>
            <strong>{{ summary.kpis.paidOrders }}</strong>
          </article>
          <article class="kpi-card">
            <span>Đơn đang xử lý</span>
            <strong>{{ summary.kpis.activeOrders }}</strong>
          </article>
          <article class="kpi-card kpi-card--warning">
            <span>Cảnh báo tồn thấp</span>
            <strong>{{ summary.kpis.lowStockCount }}</strong>
          </article>
        </div>
      </section>

      <section class="operations-section">
        <div class="operations-grid">
          <article class="operations-card">
            <div class="card-heading">
              <div>
                <span class="operations-kicker">INVENTORY</span>
                <h2>Cần nhập thêm</h2>
              </div>
              <PackagePlus :size="22" aria-hidden="true" />
            </div>

            <div v-if="summary.lowStock.length" class="stock-list">
              <div v-for="item in summary.lowStock" :key="item.productId" class="stock-row">
                <div class="stock-copy">
                  <strong>{{ item.name }}</strong>
                  <small>{{ item.sku }} · Có thể bán {{ item.availableQty }}</small>
                </div>
                <div class="stock-action">
                  <input
                    v-model.number="receiveQuantities[item.productId]"
                    type="number"
                    min="1"
                    placeholder="SL"
                    class="ad-input"
                  />
                  <button
                    type="button"
                    :disabled="busyProductId === item.productId"
                    @click="receive(item.productId)"
                    class="ad-btn-stock"
                  >
                    {{ busyProductId === item.productId ? "…" : "Nhập" }}
                  </button>
                </div>
                <input
                  v-model="receiveNotes[item.productId]"
                  class="ad-input stock-note"
                  type="text"
                  placeholder="Ghi chú nhập kho"
                />
              </div>
            </div>
            <div v-else class="ad-empty">Kho đang ở mức an toàn.</div>
          </article>

          <article class="operations-card">
            <div class="card-heading">
              <div>
                <span class="operations-kicker">ORDER QUEUE</span>
                <h2>Đơn gần đây</h2>
              </div>
              <Truck :size="22" aria-hidden="true" />
            </div>

            <div v-if="summary.recentOrders.length" class="order-list">
              <div v-for="order in summary.recentOrders" :key="order.id" class="order-row">
                <div>
                  <strong>{{ order.orderNumber }}</strong>
                  <small>{{ formatCurrency(order.grandTotal) }} · {{ order.fulfillmentMethod }}</small>
                </div>
                <div class="order-action">
                  <span class="ad-status-pill">{{ statusLabels[order.status] ?? order.status }}</span>
                  <button
                    v-if="nextStatus(order.status, order.fulfillmentMethod)"
                    type="button"
                    :disabled="busyOrderId === order.id"
                    @click="advanceOrder(order.id, order.status, order.fulfillmentMethod)"
                    class="ad-btn-advance"
                  >
                    {{ busyOrderId === order.id ? "…" : "Tiếp theo" }}
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="ad-empty">Chưa có đơn hàng mới.</div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
:root {
  --ad-ink: var(--ink, #1a1a1a);
  --ad-muted: #756a61;
  --ad-border: #d9cec1;
  --ad-paper: var(--paper-bright, #fffdf7);
  --ad-muted-bg: #f3f4f6;
  --ad-radius: 14px;
  --ad-shadow: 4px 4px 0 var(--ink, #1a1a1a);
}

.operations-page {
  display: grid;
  gap: var(--sp-3);
}

.operations-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}

.operations-header h1 {
  margin: var(--sp-1) 0 0;
  font-family: var(--font-display);
  font-size: clamp(34px, 5vw, 54px);
  line-height: 0.98;
  letter-spacing: var(--tracking-display);
  color: var(--ad-ink);
}

.operations-header p {
  margin: 0;
  color: var(--ad-muted);
}

.operations-kicker {
  color: #7b6f64;
  font-size: var(--fs-xs);
  font-weight: 900;
  letter-spacing: var(--tracking-kicker);
}

.ad-btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  border: var(--bw-bold) solid var(--ad-ink);
  border-radius: var(--ad-radius);
  background: var(--ad-paper);
  padding: var(--sp-1) var(--sp-3);
  color: var(--ad-ink);
  cursor: pointer;
  font-size: var(--fs-sm);
  font-family: var(--font-ui);
}

.ad-btn-refresh:disabled {
  opacity: 0.55;
  cursor: wait;
}

.spinning {
  animation: spin 0.8s linear infinite;
}

.ad-alert {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  border-radius: var(--ad-radius);
  padding: var(--sp-2) var(--sp-3);
  font-size: var(--fs-sm);
  font-weight: 800;
}

.ad-alert--error {
  background: #fff0ef;
  color: #9b211a;
  border: var(--bw) solid #f5c6bf;
}

.ad-alert--success {
  background: #e8f7ea;
  color: #216b37;
  border: var(--bw) solid #b9e3cc;
}

.ad-empty {
  color: var(--ad-muted);
  padding: var(--sp-3) 0;
}

.kpi-section {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--sp-2);
}

.kpi-card,
.operations-card {
  border: var(--bw-bold) solid var(--ad-border);
  border-radius: var(--ad-radius);
  background: var(--ad-paper);
  padding: var(--sp-3);
  box-shadow: var(--ad-shadow);
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.kpi-card span {
  color: var(--ad-muted);
  font-size: var(--fs-xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: var(--tracking-kicker);
}

.kpi-card strong {
  font-size: var(--fs-lg);
  font-weight: 800;
  color: var(--ad-ink);
}

.kpi-card--warning {
  border-color: #f2c94c;
  background: #fffaf0;
}

.operations-section {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.operations-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
}

.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}

.card-heading h2 {
  margin: 0;
  font-size: var(--fs-lg);
  font-weight: 800;
  color: var(--ad-ink);
}

.stock-list,
.order-list {
  display: grid;
  gap: var(--sp-1);
}

.stock-row,
.order-row {
  display: grid;
  gap: var(--sp-1);
  border-bottom: var(--bw) solid #eee;
  padding-bottom: var(--sp-1);
}

.stock-row:last-child,
.order-row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.stock-copy,
.order-row > div:first-child {
  display: grid;
  gap: 4px;
}

.stock-copy small,
.order-row small {
  color: var(--ad-muted);
  font-size: var(--fs-xs);
}

.stock-action,
.order-action {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
}

.stock-action input.ad-input,
.stock-note.ad-input {
  width: 72px;
  border: var(--bw-bold) solid var(--ad-border);
  border-radius: 10px;
  padding: var(--sp-1);
  font-size: var(--fs-sm);
  color: var(--ad-ink);
  background: var(--ad-paper);
  outline: 0;
}

.stock-note {
  width: 100%;
}

.ad-btn-stock,
.ad-btn-advance {
  border: 0;
  border-radius: 10px;
  background: var(--ad-ink);
  padding: var(--sp-1) var(--sp-2);
  color: #fff;
  font-weight: 800;
  cursor: pointer;
  font-size: var(--fs-xs);
}

.ad-btn-stock:disabled,
.ad-btn-advance:disabled {
  opacity: 0.5;
  cursor: wait;
}

.order-row {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
}

.order-action {
  justify-content: flex-end;
  flex-wrap: wrap;
}

.ad-status-pill {
  border-radius: 999px;
  background: #f1f5f9;
  padding: 5px 8px;
  color: #475569;
  font-size: var(--fs-xs);
  font-weight: 800;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .operations-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .operations-header {
    display: grid;
  }
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  .order-row {
    grid-template-columns: 1fr;
  }
  .order-action {
    justify-content: flex-start;
  }
}
</style>
