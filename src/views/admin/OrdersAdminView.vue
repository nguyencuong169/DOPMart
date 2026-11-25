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
  statuses.map((status) => [status.value, status.label]),
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

  return orders.value.filter((order) => {
    const matchesStatus = !selectedStatus || order.status === selectedStatus
    const haystack = [
      order.orderNumber,
      order.customerId,
      order.deliveryLocation ?? '',
    ].join(' ').toLowerCase()

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
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
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
    errorMessage.value = cause instanceof Error
      ? cause.message
      : 'Không thể tải danh sách đơn hàng.'
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
    await updateMartOrderStatus(
      order.id,
      target,
      `Operator chuyển sang ${statusLabel[target]}`,
    )
    await loadOrders()
  } catch (cause) {
    errorMessage.value = cause instanceof Error
      ? cause.message
      : 'Không thể cập nhật trạng thái đơn hàng.'
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
      <button type="button" class="refresh-button" :disabled="loading" @click="loadOrders">
        <RefreshCw :size="16" :class="{ spinning: loading }" aria-hidden="true" />
        Làm mới
      </button>
    </header>

    <div v-if="errorMessage" class="orders-alert" role="alert">{{ errorMessage }}</div>

    <div class="orders-toolbar">
      <label class="search-box">
        <Search :size="18" aria-hidden="true" />
        <span class="sr-only">Tìm đơn hàng</span>
        <input v-model="searchQuery" type="search" placeholder="Mã đơn, user, vị trí giao…" />
      </label>

      <label class="filter-field">
        <span>Trạng thái</span>
        <select v-model="statusFilter">
          <option value="">Tất cả</option>
          <option v-for="status in statuses" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>
      </label>
    </div>

    <div v-if="loading && !orders.length" class="orders-empty" role="status">
      Đang tải danh sách đơn hàng…
    </div>

    <div v-else class="orders-table-wrap">
      <table class="orders-table">
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
              <strong>{{ order.fulfillmentMethod === 'pickup' ? 'Tự lấy' : 'Giao tại chỗ' }}</strong>
              <small>{{ order.deliveryLocation || 'Quầy / kho DOP Mart' }}</small>
            </td>
            <td><span class="payment-state">{{ paymentLabel(order.paymentStatus) }}</span></td>
            <td class="amount">{{ formatCurrency(order.grandTotal) }}</td>
            <td>
              <span
                class="status-badge"
                :style="{ color: statusColor[order.status], backgroundColor: `${statusColor[order.status]}18` }"
              >
                {{ statusLabel[order.status] }}
              </span>
            </td>
            <td class="date-cell">{{ formatDate(order.createdAt) }}</td>
            <td class="action-cell">
              <button
                v-if="nextStatus(order)"
                type="button"
                class="advance-button"
                :disabled="busyOrderId === order.id"
                @click="advanceOrder(order)"
              >
                {{ busyOrderId === order.id ? 'Đang lưu…' : nextStatusLabel(order) }}
                <ArrowRight :size="15" aria-hidden="true" />
              </button>
              <span v-else class="no-action">—</span>
            </td>
          </tr>
          <tr v-if="!filteredOrders.length">
            <td colspan="8" class="orders-empty">
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
.admin-orders { display: grid; gap: 24px; }
.orders-header, .orders-toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
.orders-kicker { color: #756a61; font-size: 11px; font-weight: 900; letter-spacing: .1em; }
.orders-title { margin: 8px 0 6px; color: var(--ink, #191919); font-family: var(--font-display, sans-serif); font-size: clamp(34px, 5vw, 56px); line-height: .95; letter-spacing: -.04em; }
.orders-lead { max-width: 56ch; margin: 0; color: #756a61; font-size: 14px; line-height: 1.5; }
.refresh-button, .advance-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 2px solid var(--ink, #191919); border-radius: 12px; background: #ffd338; padding: 10px 14px; color: var(--ink, #191919); font-weight: 900; cursor: pointer; box-shadow: 3px 3px 0 var(--ink, #191919); }
.refresh-button:disabled, .advance-button:disabled { cursor: wait; opacity: .55; box-shadow: none; }
.refresh-button .spinning { animation: spin .8s linear infinite; }
.orders-alert { border: 1.5px solid #b42318; border-radius: 12px; background: #fff1f0; padding: 12px 14px; color: #8e1c16; font-size: 14px; font-weight: 700; }
.search-box, .filter-field { display: grid; gap: 7px; }
.search-box { display: flex; align-items: center; width: min(420px, 100%); border: 1.5px solid #c8beb2; border-radius: 12px; background: #fffdf7; padding: 11px 13px; color: #756a61; }
.search-box input, .filter-field select { border: 0; outline: 0; background: transparent; color: var(--ink, #191919); font: inherit; }
.search-box input { width: 100%; }
.filter-field { min-width: 180px; color: #756a61; font-size: 12px; font-weight: 800; }
.filter-field select { border: 1.5px solid #c8beb2; border-radius: 12px; background: #fffdf7; padding: 11px 13px; font-size: 14px; }
.orders-table-wrap { overflow-x: auto; border: 1.5px solid #d9cec1; border-radius: 18px; background: #fffdf7; }
.orders-table { width: 100%; min-width: 960px; border-collapse: collapse; font-size: 13px; }
.orders-table th { padding: 14px 16px; border-bottom: 1.5px solid #d9cec1; color: #756a61; font-size: 11px; font-weight: 900; letter-spacing: .07em; text-align: left; text-transform: uppercase; }
.orders-table td { padding: 15px 16px; border-bottom: 1px solid #ebe2d8; color: var(--ink, #191919); vertical-align: middle; }
.orders-table tbody tr:last-child td { border-bottom: 0; }
.orders-table td > strong, .orders-table td > small { display: block; }
.orders-table td small { margin-top: 4px; color: #8a7f74; font-size: 11px; }
.order-number { font-variant-numeric: tabular-nums; }
.payment-state { color: #645b53; font-size: 12px; font-weight: 700; }
.amount { white-space: nowrap; font-variant-numeric: tabular-nums; font-weight: 900; }
.status-badge { display: inline-flex; border-radius: 999px; padding: 6px 9px; font-size: 11px; font-weight: 900; white-space: nowrap; }
.date-cell { color: #756a61 !important; font-size: 12px; white-space: nowrap; }
.action-cell { text-align: right; }
.advance-button { border-width: 1.5px; border-radius: 9px; padding: 7px 9px; font-size: 11px; box-shadow: 2px 2px 0 var(--ink, #191919); white-space: nowrap; }
.no-action { color: #a3988d; }
.orders-empty { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 150px; color: #8a7f74; text-align: center; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 760px) {
  .orders-header, .orders-toolbar { align-items: stretch; flex-direction: column; }
  .refresh-button, .search-box, .filter-field { width: 100%; }
}
</style>
