<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { ArrowRight, PackageOpen, RefreshCw, Search } from 'lucide-vue-next'
import {
  getMartAdminOrders,
  updateMartOrderStatus,
  type MartAdminOrder,
} from '../../services/martAdminService'
import type { MartOrderStatus } from '../../types/mart-order'

type StatusFilter = '' | MartOrderStatus

const orders = shallowRef<MartAdminOrder[]>([])
const loading = shallowRef(true)
const errorMessage = shallowRef('')
const searchQuery = shallowRef('')
const statusFilter = shallowRef<StatusFilter>('')
const busyOrderId = shallowRef<string | null>(null)

const statuses: Array<{ value: MartOrderStatus; label: string }> = [
  { value: 'pending_payment', label: 'Chờ thanh toán' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'preparing', label: 'Đang soạn' },
  { value: 'ready_for_pickup', label: 'Sẵn sàng lấy' },
  { value: 'out_for_delivery', label: 'Đang giao' },
  { value: 'completed', label: 'Hoàn tất' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'manual_review', label: 'Cần kiểm tra' },
]

const statusLabel = Object.fromEntries(
  statuses.map(status => [status.value, status.label])
) as Record<MartOrderStatus, string>

const statusColor: Record<MartOrderStatus, string> = {
  pending_payment: '#b45309',
  confirmed: '#2563eb',
  preparing: '#7c3aed',
  ready_for_pickup: '#047857',
  out_for_delivery: '#0f766e',
  completed: '#166534',
  cancelled: '#b91c1c',
  expired: '#6b7280',
  manual_review: '#be123c',
}

const filteredOrders = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const selectedStatus = statusFilter.value

  return orders.value.filter(order => {
    const matchesStatus = !selectedStatus || order.status === selectedStatus
    const haystack = [order.orderNumber, order.customerId, order.deliveryLocation ?? '']
      .join(' ')
      .toLowerCase()
    return matchesStatus && (!query || haystack.includes(query))
  })
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value)
  )
}

function paymentLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Chờ thanh toán',
    succeeded: 'Đã thanh toán',
    failed: 'Thanh toán lỗi',
    manual_review: 'Cần đối soát',
    expired: 'Hết hạn',
    unknown: 'Chưa có payment',
  }
  return labels[status] ?? status
}

function nextStatus(order: MartAdminOrder): MartOrderStatus | null {
  if (order.status === 'confirmed') return 'preparing'
  if (order.status === 'preparing') {
    return order.fulfillmentMethod === 'pickup' ? 'ready_for_pickup' : 'out_for_delivery'
  }
  if (order.status === 'ready_for_pickup' || order.status === 'out_for_delivery') {
    return 'completed'
  }
  return null
}

function nextStatusLabel(order: MartAdminOrder) {
  const target = nextStatus(order)
  return target ? statusLabel[target] : ''
}

async function loadOrders() {
  loading.value = true
  errorMessage.value = ''
  try {
    orders.value = await getMartAdminOrders()
  } catch (cause) {
    errorMessage.value =
      cause instanceof Error ? cause.message : 'Không thể tải danh sách đơn hàng.'
  } finally {
    loading.value = false
  }
}

async function advanceOrder(order: MartAdminOrder) {
  const target = nextStatus(order)
  if (!target) return

  busyOrderId.value = order.id
  errorMessage.value = ''

  try {
    await updateMartOrderStatus(order.id, target, `Operator chuyển sang ${statusLabel[target]}`)
    await loadOrders()
  } catch (cause) {
    errorMessage.value =
      cause instanceof Error ? cause.message : 'Không thể cập nhật trạng thái đơn hàng.'
  } finally {
    busyOrderId.value = null
  }
}

onMounted(loadOrders)
</script>

<template>
  <section class="admin-orders" aria-labelledby="orders-heading">
    <header class="orders-header">
      <div>
        <span class="orders-kicker">DOP MART · ORDERS</span>
        <h1 id="orders-heading" class="orders-title">Quản lý đơn hàng</h1>
        <p class="orders-lead">Theo dõi thanh toán và chuyển đơn qua từng bước vận hành.</p>
      </div>
      <button type="button" class="ad-btn-refresh" :disabled="loading" @click="loadOrders">
        <RefreshCw :size="16" :class="{ spinning: loading }" aria-hidden="true" />
        Làm mới
      </button>
    </header>

    <div v-if="errorMessage" class="ad-alert ad-alert--error" role="alert">{{ errorMessage }}</div>

    <div class="orders-toolbar">
      <label class="ad-search">
        <Search :size="16" aria-hidden="true" />
        <input v-model="searchQuery" type="search" placeholder="Mã đơn, user, vị trí giao…" />
      </label>
      <div class="ad-field">
        <span class="ad-field-label">Trạng thái</span>
        <select v-model="statusFilter" class="ad-select">
          <option value="">Tất cả</option>
          <option v-for="status in statuses" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading && !orders.length" class="ad-empty" role="status">
      Đang tải danh sách đơn hàng…
    </div>

    <div v-else class="table-wrap">
      <table class="ad-table">
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Người đặt</th>
            <th>Nhận hàng</th>
            <th>Thanh toán</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
            <th>Thời gian</th>
            <th><span class="sr-only">Thao tác</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.id">
            <td>
              <strong class="order-number">{{ order.orderNumber }}</strong>
              <small>{{ order.itemCount }} món</small>
            </td>
            <td>
              <strong>#{{ order.customerId.slice(0, 8) }}</strong>
              <small>{{ order.floor ? `Tầng ${order.floor}` : 'Chưa có tầng' }}</small>
            </td>
            <td>
              <strong>{{
                order.fulfillmentMethod === 'pickup' ? 'Tự lấy' : 'Giao tại chỗ'
              }}</strong>
              <small>{{ order.deliveryLocation || 'Quầy / kho DOP Mart' }}</small>
            </td>
            <td>
              <span class="ad-badge">{{ paymentLabel(order.paymentStatus) }}</span>
            </td>
            <td class="amount">{{ formatCurrency(order.grandTotal) }}</td>
            <td>
              <span
                class="ad-status-badge"
                :style="{
                  color: statusColor[order.status],
                  backgroundColor: `${statusColor[order.status]}18`,
                }"
              >
                {{ statusLabel[order.status] }}
              </span>
            </td>
            <td class="date-cell">{{ formatDate(order.createdAt) }}</td>
            <td class="action-cell">
              <button
                v-if="nextStatus(order)"
                type="button"
                class="ad-advance-btn"
                :disabled="busyOrderId === order.id"
                @click="advanceOrder(order)"
              >
                {{ busyOrderId === order.id ? 'Đang lưu…' : nextStatusLabel(order) }}
                <ArrowRight :size="13" aria-hidden="true" />
              </button>
              <span v-else class="no-action">—</span>
            </td>
          </tr>
          <tr v-if="!filteredOrders.length">
            <td colspan="8" class="ad-empty">
              <PackageOpen :size="24" aria-hidden="true" />
              Không tìm thấy đơn hàng phù hợp.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
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

.admin-orders {
  display: grid;
  gap: var(--sp-3);
}

.orders-header,
.orders-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}

.orders-kicker {
  color: #756a61;
  font-size: var(--fs-xs);
  font-weight: 900;
  letter-spacing: var(--tracking-kicker);
}

.orders-title {
  margin: var(--sp-1) 0 0;
  font-family: var(--font-display);
  font-size: clamp(34px, 5vw, 56px);
  line-height: 0.95;
  letter-spacing: var(--tracking-display);
  color: var(--ad-ink);
}

.orders-lead {
  max-width: 56ch;
  margin: 0;
  color: #756a61;
  font-size: var(--fs-sm);
  line-height: 1.5;
}

.ad-btn-refresh,
.ad-advance-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
  border: var(--bw-bold) solid var(--ad-ink);
  border-radius: var(--ad-radius);
  background: var(--ad-yellow);
  padding: var(--sp-1) var(--sp-3);
  color: var(--ad-ink);
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--ad-shadow);
  font-size: var(--fs-sm);
  font-family: var(--font-ui);
}

.ad-btn-refresh:disabled,
.ad-advance-btn:disabled {
  cursor: wait;
  opacity: 0.55;
  box-shadow: none;
}

.ad-btn-refresh .spinning {
  animation: spin 0.8s linear infinite;
}

.ad-alert--error {
  border: var(--bw) solid #b42318;
  border-radius: var(--ad-radius);
  background: #fff1f0;
  padding: var(--sp-2) var(--sp-3);
  color: #8e1c16;
  font-size: var(--fs-sm);
  font-weight: 800;
}

.ad-search {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  width: min(420px, 100%);
  border: var(--bw-bold) solid #c8beb2;
  border-radius: var(--ad-radius);
  background: var(--ad-paper);
  padding: var(--sp-1) var(--sp-2);
  color: #756a61;
}

.ad-search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ad-ink);
  font: inherit;
}

.ad-field {
  display: grid;
  gap: var(--sp-1);
}

.ad-field-label {
  font-size: var(--fs-xs);
  font-weight: 800;
  color: #756a61;
}

.ad-select {
  border: var(--bw-bold) solid #c8beb2;
  border-radius: var(--ad-radius);
  background: var(--ad-paper);
  padding: var(--sp-1) var(--sp-2);
  font-size: var(--fs-sm);
  outline: 0;
  color: var(--ad-ink);
}

.table-wrap {
  overflow-x: auto;
  border: var(--bw-bold) solid #d9cec1;
  border-radius: var(--ad-radius);
  background: var(--ad-paper);
}

.ad-table {
  width: 100%;
  min-width: 960px;
  border-collapse: collapse;
  font-size: var(--fs-sm);
}

.ad-table th {
  padding: var(--sp-2) var(--sp-3);
  border-bottom: var(--bw) solid #d9cec1;
  color: #756a61;
  font-size: var(--fs-xs);
  font-weight: 800;
  letter-spacing: var(--tracking-kicker);
  text-align: left;
  text-transform: uppercase;
  background: var(--ad-muted-bg);
}

.ad-table td {
  padding: var(--sp-2) var(--sp-3);
  border-bottom: var(--bw) solid #ebe2d8;
  color: var(--ad-ink);
  vertical-align: middle;
}

.ad-table tr:last-child td {
  border-bottom: 0;
}

.ad-table td > strong,
.ad-table td > small {
  display: block;
}

.ad-table td small {
  margin-top: 4px;
  color: #8a7f74;
  font-size: var(--fs-xs);
}

.order-number {
  font-variant-numeric: tabular-nums;
}

.ad-badge {
  color: #645b53;
  font-size: var(--fs-xs);
  font-weight: 800;
}

.amount {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}

.ad-status-badge {
  display: inline-flex;
  border-radius: 999px;
  padding: 5px 9px;
  font-size: var(--fs-xs);
  font-weight: 800;
  white-space: nowrap;
}

.date-cell {
  color: #756a61 !important;
  font-size: var(--fs-xs);
  white-space: nowrap;
}

.action-cell {
  text-align: right;
}

.ad-advance-btn {
  border-width: var(--bw);
  border-radius: 9px;
  padding: var(--sp-1);
  font-size: var(--fs-xs);
  box-shadow: 2px 2px 0 var(--ad-ink);
  white-space: nowrap;
}

.no-action {
  color: #a3988d;
}

.ad-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
  min-height: 120px;
  color: #8a7f74;
  text-align: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 760px) {
  .orders-header,
  .orders-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .ad-btn-refresh,
  .ad-search,
  .ad-field {
    width: 100%;
  }
}
</style>
