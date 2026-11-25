<script setup lang="ts">
import { onMounted, reactive, shallowRef } from 'vue'
import { AlertTriangle, Check, PackagePlus, RefreshCw, Truck } from 'lucide-vue-next'
import {
  getMartAdminSummary,
  receiveMartStock,
  updateMartOrderStatus,
  type MartAdminSummary,
} from '../../services/martAdminService'

const summary = shallowRef<MartAdminSummary | null>(null)
const loading = shallowRef(true)
const actionError = shallowRef('')
const actionMessage = shallowRef('')
const receiveQuantities = reactive<Record<number, number>>({})
const receiveNotes = reactive<Record<number, string>>({})
const busyProductId = shallowRef<number | null>(null)
const busyOrderId = shallowRef<string | null>(null)

const statusLabels: Record<string, string> = {
  confirmed: 'Đã thanh toán',
  preparing: 'Đang soạn',
  ready_for_pickup: 'Sẵn sàng lấy',
  out_for_delivery: 'Đang giao',
  completed: 'Hoàn tất',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

async function load() {
  loading.value = true
  actionError.value = ''

  try {
    summary.value = await getMartAdminSummary()
  } catch (cause) {
    actionError.value = cause instanceof Error ? cause.message : 'Không thể tải dashboard vận hành.'
  } finally {
    loading.value = false
  }
}

async function receive(productId: number) {
  const quantity = Number(receiveQuantities[productId] ?? 0)
  if (!Number.isInteger(quantity) || quantity <= 0) {
    actionError.value = 'Số lượng nhập phải là số nguyên dương.'
    return
  }

  busyProductId.value = productId
  actionError.value = ''
  actionMessage.value = ''

  try {
    await receiveMartStock(productId, quantity, receiveNotes[productId] || 'Nhập hàng vận hành')
    receiveQuantities[productId] = 0
    receiveNotes[productId] = ''
    actionMessage.value = 'Đã cập nhật tồn kho.'
    await load()
  } catch (cause) {
    actionError.value = cause instanceof Error ? cause.message : 'Không thể nhập kho.'
  } finally {
    busyProductId.value = null
  }
}

function nextStatus(status: string, fulfillmentMethod: string) {
  if (status === 'confirmed') return 'preparing'
  if (status === 'preparing') {
    return fulfillmentMethod === 'pickup' ? 'ready_for_pickup' : 'out_for_delivery'
  }
  if (status === 'ready_for_pickup' || status === 'out_for_delivery') return 'completed'
  return null
}

async function advanceOrder(orderId: string, status: string, fulfillmentMethod: string) {
  const target = nextStatus(status, fulfillmentMethod)
  if (!target) return

  busyOrderId.value = orderId
  actionError.value = ''
  actionMessage.value = ''

  try {
    await updateMartOrderStatus(orderId, target, `Operator chuyển sang ${target}`)
    actionMessage.value = 'Đã cập nhật trạng thái đơn.'
    await load()
  } catch (cause) {
    actionError.value = cause instanceof Error ? cause.message : 'Không thể cập nhật đơn.'
  } finally {
    busyOrderId.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="operations-page">
    <header class="operations-header">
      <div>
        <span class="operations-kicker">DOP MART · OPERATIONS</span>
        <h1>Vận hành kho & đơn hàng.</h1>
        <p>Theo dõi tồn có thể bán, nhập hàng và xử lý đơn đã thanh toán.</p>
      </div>
      <button type="button" class="refresh-button" :disabled="loading" @click="load">
        <RefreshCw :size="16" :class="{ spinning: loading }" />
        Làm mới
      </button>
    </header>

    <div v-if="actionError" class="operation-alert error" role="alert">
      <AlertTriangle :size="18" />
      {{ actionError }}
    </div>
    <div v-if="actionMessage" class="operation-alert success" role="status">
      <Check :size="18" />
      {{ actionMessage }}
    </div>

    <div v-if="loading && !summary" class="loading-state">Đang tải dữ liệu vận hành…</div>

    <template v-else-if="summary">
      <section class="kpi-grid" aria-label="Chỉ số vận hành">
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
        <article class="kpi-card warning">
          <span>Cảnh báo tồn thấp</span>
          <strong>{{ summary.kpis.lowStockCount }}</strong>
        </article>
      </section>

      <section class="operations-grid">
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
                <input v-model.number="receiveQuantities[item.productId]" type="number" min="1" placeholder="SL" />
                <button
                  type="button"
                  :disabled="busyProductId === item.productId"
                  @click="receive(item.productId)"
                >
                  {{ busyProductId === item.productId ? '…' : 'Nhập' }}
                </button>
              </div>
              <input v-model="receiveNotes[item.productId]" class="stock-note" type="text" placeholder="Ghi chú nhập kho" />
            </div>
          </div>
          <div v-else class="empty-state">Kho đang ở mức an toàn.</div>
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
                <span class="status-pill">{{ statusLabels[order.status] ?? order.status }}</span>
                <button
                  v-if="nextStatus(order.status, order.fulfillmentMethod)"
                  type="button"
                  :disabled="busyOrderId === order.id"
                  @click="advanceOrder(order.id, order.status, order.fulfillmentMethod)"
                >
                  {{ busyOrderId === order.id ? '…' : 'Tiếp theo' }}
                </button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">Chưa có đơn hàng mới.</div>
        </article>
      </section>
    </template>
  </div>
</template>

<style scoped>
.operations-page { display: grid; gap: 24px; }
.operations-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.operations-header h1 { margin: 8px 0; font-family: var(--font-display); font-size: clamp(34px, 5vw, 54px); line-height: .98; letter-spacing: -.045em; }
.operations-header p { margin: 0; color: var(--muted-foreground, #6b7280); }
.operations-kicker { color: #7b6f64; font-size: 10px; font-weight: 900; letter-spacing: .14em; }
.refresh-button { display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--border, #ddd); border-radius: 10px; background: #fff; padding: 10px 14px; color: var(--foreground, #111); cursor: pointer; }
.refresh-button:disabled { opacity: .55; cursor: wait; }
.spinning { animation: spin .8s linear infinite; }
.operation-alert { display: flex; align-items: center; gap: 8px; border-radius: 10px; padding: 12px 14px; font-size: 13px; font-weight: 700; }
.operation-alert.error { background: #fff0ef; color: #9b211a; }
.operation-alert.success { background: #e8f7ea; color: #216b37; }
.loading-state, .empty-state { color: var(--muted-foreground, #6b7280); padding: 24px 0; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.kpi-card, .operations-card { border: 1px solid var(--border, #e5e7eb); border-radius: 14px; background: var(--card, #fff); padding: 20px; }
.kpi-card { display: grid; gap: 8px; }
.kpi-card span { color: var(--muted-foreground, #6b7280); font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
.kpi-card strong { font-size: 24px; }
.kpi-card.warning { border-color: #f2c94c; background: #fffaf0; }
.operations-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
.card-heading h2 { margin: 6px 0 0; font-size: 20px; }
.stock-list, .order-list { display: grid; gap: 12px; }
.stock-row, .order-row { display: grid; gap: 8px; border-bottom: 1px solid var(--border, #eee); padding-bottom: 12px; }
.stock-row:last-child, .order-row:last-child { border-bottom: 0; padding-bottom: 0; }
.stock-copy, .order-row > div:first-child { display: grid; gap: 4px; }
.stock-copy small, .order-row small { color: var(--muted-foreground, #6b7280); font-size: 12px; }
.stock-action, .order-action { display: flex; align-items: center; gap: 8px; }
.stock-action input { width: 72px; border: 1px solid var(--border, #ddd); border-radius: 8px; padding: 8px; }
.stock-action button, .order-action button { border: 0; border-radius: 8px; background: var(--foreground, #111); padding: 8px 12px; color: #fff; font-weight: 800; cursor: pointer; }
.stock-action button:disabled, .order-action button:disabled { opacity: .5; cursor: wait; }
.stock-note { width: 100%; border: 1px solid var(--border, #ddd); border-radius: 8px; padding: 8px; font-size: 12px; }
.order-row { grid-template-columns: minmax(0, 1fr) auto; align-items: center; }
.order-action { justify-content: flex-end; flex-wrap: wrap; }
.status-pill { border-radius: 999px; background: #f1f5f9; padding: 5px 8px; color: #475569; font-size: 11px; font-weight: 800; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } .operations-grid { grid-template-columns: 1fr; } }
@media (max-width: 560px) { .operations-header { display: grid; } .kpi-grid { grid-template-columns: 1fr; } .order-row { grid-template-columns: 1fr; } .order-action { justify-content: flex-start; } }
</style>
