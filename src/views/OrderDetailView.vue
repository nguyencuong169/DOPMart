<template>
  <div class="page order-detail-page">
    <div v-if="loading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="error" class="py-12 text-center">
      <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-gray-900">Không tìm thấy đơn hàng</h2>
      <p class="mt-2 text-gray-600">{{ error }}</p>
      <div class="mt-6">
        <a
          href="/orders"
          class="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700"
        >
          Quay lại danh sách đơn hàng
        </a>
      </div>
    </div>

    <div v-else-if="order" class="mx-auto max-w-4xl px-4 py-8">
      <div class="mb-8">
        <div class="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span class="badge">Đơn hàng #{{ order.orderNumber }}</span>
            <h1 class="mt-2 text-2xl font-bold tracking-tight text-gray-900">Chi tiết đơn hàng</h1>
            <p class="mt-1 text-gray-600">Đã tạo vào {{ formatDate(order.createdAt) }}</p>
          </div>
          <div class="flex gap-3">
            <button
              v-if="canCancel"
              @click="handleCancel"
              :disabled="cancelling"
              class="rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-600 transition hover:bg-red-100"
            >
              {{ cancelling ? 'Đang hủy...' : 'Hủy đơn hàng' }}
            </button>
            <button
              v-if="order.status === 'pending_payment' && order.payment"
              @click="handleSimulatePayment"
              :disabled="paying"
              class="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {{ paying ? 'Đang xử lý...' : 'Thanh toán mô phỏng' }}
            </button>
            <a
              href="/orders"
              class="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-200"
            >
              Quay lại danh sách
            </a>
          </div>
        </div>
      </div>

      <div class="mb-6 flex items-center gap-2">
        <span class="status-badge" :class="'status-' + order.status">
          {{ statusLabel(order.status) }}
        </span>
        <span v-if="order.payment?.status" class="text-xs text-gray-500">
          Thanh toán: {{ paymentLabel(order.payment.status) }}
        </span>
      </div>

      <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Tổng cộng</p>
          <p class="text-2xl font-bold tabular-nums text-gray-900">
            {{ formatCurrency(order.grandTotal) }}
          </p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Phương thức giao
          </p>
          <p class="text-base font-medium capitalize text-gray-800">
            {{ order.fulfillmentMethod }}
          </p>
          <p v-if="order.deliveryLocation" class="mt-1 text-xs text-gray-500">
            {{ order.deliveryLocation }}
          </p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Số lượng món
          </p>
          <p class="text-2xl font-bold tabular-nums text-gray-900">{{ order.itemCount }}</p>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-gray-700">
                Sản phẩm
              </th>
              <th class="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-gray-700">
                SKU
              </th>
              <th
                class="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider text-gray-700"
              >
                Đơn giá
              </th>
              <th
                class="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider text-gray-700"
              >
                SL
              </th>
              <th
                class="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider text-gray-700"
              >
                Thành tiền
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="item in order.items"
              :key="item.productId"
              class="transition hover:bg-gray-50"
            >
              <td class="px-6 py-4 font-medium text-gray-800">{{ item.name }}</td>
              <td class="px-6 py-4 text-sm tabular-nums text-gray-500">{{ item.sku }}</td>
              <td class="px-6 py-4 text-right text-sm tabular-nums text-gray-700">
                {{ formatCurrency(item.unitPrice) }}
              </td>
              <td class="px-6 py-4 text-right text-sm tabular-nums text-gray-700">
                {{ item.quantity }}
              </td>
              <td class="px-6 py-4 text-right text-sm font-semibold tabular-nums text-gray-900">
                {{ formatCurrency(item.lineTotal) }}
              </td>
            </tr>
          </tbody>
          <tfoot class="border-t border-gray-100">
            <tr class="bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-500">Tạm tính</td>
              <td class="px-6 py-4 text-right text-sm text-gray-500"></td>
              <td class="px-6 py-4 text-right text-sm text-gray-500"></td>
              <td class="px-6 py-4 text-right text-sm text-gray-500"></td>
              <td class="px-6 py-4 text-right text-sm font-medium tabular-nums text-gray-900">
                {{ formatCurrency(order.subtotal) }}
              </td>
            </tr>
            <tr v-if="order.discountTotal > 0" class="bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-500">Giảm giá</td>
              <td class="px-6 py-4 text-right text-sm text-gray-500"></td>
              <td class="px-6 py-4 text-right text-sm text-gray-500"></td>
              <td class="px-6 py-4 text-right text-sm text-gray-500"></td>
              <td class="px-6 py-4 text-right text-sm tabular-nums text-red-600">
                - {{ formatCurrency(order.discountTotal) }}
              </td>
            </tr>
            <tr v-if="order.deliveryFee > 0" class="bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-500">Phí giao hàng</td>
              <td class="px-6 py-4 text-right text-sm text-gray-500"></td>
              <td class="px-6 py-4 text-right text-sm text-gray-500"></td>
              <td class="px-6 py-4 text-right text-sm text-gray-500"></td>
              <td class="px-6 py-4 text-right text-sm font-medium tabular-nums text-gray-900">
                {{ formatCurrency(order.deliveryFee) }}
              </td>
            </tr>
            <tr class="bg-white">
              <td class="px-6 py-4 text-sm text-gray-500"></td>
              <td class="px-6 py-4 text-right text-sm text-gray-500"></td>
              <td class="px-6 py-4 text-right text-sm text-gray-500"></td>
              <td class="px-6 py-4 text-right text-sm text-gray-500"></td>
              <td class="px-6 py-4 text-right text-xl font-bold tabular-nums text-gray-900">
                {{ formatCurrency(order.grandTotal) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div
        v-if="order.payment"
        class="mt-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <svg class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Thông tin thanh toán
        </h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="rounded-lg bg-gray-50 p-4">
            <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Phương thức
            </p>
            <p class="text-base font-medium capitalize text-gray-800">{{ order.payment.method }}</p>
          </div>
          <div class="rounded-lg bg-gray-50 p-4">
            <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Trạng thái
            </p>
            <p class="text-base font-medium" :class="paymentStatusClass(order.payment.status)">
              {{ paymentLabel(order.payment.status) }}
            </p>
          </div>
          <div class="rounded-lg bg-gray-50 p-4">
            <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Số tiền</p>
            <p class="text-base font-bold tabular-nums text-gray-900">
              {{ formatCurrency(order.payment.amount) }}
            </p>
          </div>
          <div v-if="order.payment.paidAt" class="rounded-lg bg-gray-50 p-4">
            <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Thời gian thanh toán
            </p>
            <p class="text-base text-gray-800">{{ formatDate(order.payment.paidAt) }}</p>
          </div>
          <div
            v-if="order.payment.qrPayload"
            class="rounded-lg border border-blue-100 bg-blue-50 p-4"
          >
            <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
              Mã QR thanh toán
            </p>
            <p class="break-all font-mono text-sm text-blue-800">{{ order.payment.qrPayload }}</p>
          </div>
          <div
            v-if="order.payment.checkoutUrl"
            class="rounded-lg border border-blue-100 bg-blue-50 p-4"
          >
            <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
              Link thanh toán
            </p>
            <a
              :href="order.payment.checkoutUrl"
              target="_blank"
              class="text-sm font-medium text-blue-600 hover:underline"
            >
              Mở trang thanh toán →
            </a>
          </div>
        </div>
      </div>

      <div
        v-if="order.expiresAt && order.status === 'pending_payment'"
        class="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4"
      >
        <div class="flex items-start gap-3">
          <svg
            class="mt-0.5 h-5 w-5 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p class="text-sm font-medium text-amber-800">
              Đơn hàng sẽ hết hạn vào {{ formatDate(order.expiresAt) }}
            </p>
            <p class="mt-1 text-xs text-amber-600">
              Vui lòng thanh toán trước thời gian này để đơn hàng không bị hủy tự động.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import type { MartOrder } from '../types/mart-order'

const route = useRoute()
const router = useRouter()

const orderId = computed(() => String(route.params.id))
const order = ref<MartOrder | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const cancelling = ref(false)
const paying = ref(false)

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_payment: 'Chờ thanh toán',
    confirmed: 'Đã xác nhận',
    preparing: 'Đang chuẩn bị',
    ready_for_pickup: 'Sẵn sàng lấy hàng',
    out_for_delivery: 'Đang giao hàng',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    expired: 'Hết hạn',
    manual_review: 'Kiểm tra thủ công',
  }
  return labels[status] || status
}

function paymentLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Chờ xử lý',
    succeeded: 'Thành công',
    failed: 'Thất bại',
    expired: 'Hết hạn',
    refunded: 'Đã hoàn tiền',
    manual_review: 'Kiểm tra thủ công',
    unknown: 'Không rõ',
  }
  return labels[status] || status
}

function paymentStatusClass(status: string): string {
  const classes: Record<string, string> = {
    pending: 'text-amber-600',
    succeeded: 'text-green-600',
    failed: 'text-red-600',
    expired: 'text-amber-600',
    refunded: 'text-blue-600',
    manual_review: 'text-purple-600',
    unknown: 'text-gray-600',
  }
  return classes[status] || 'text-gray-600'
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

async function fetchOrder() {
  if (!orderId.value) return
  loading.value = true
  error.value = null

  try {
    if (supabase) {
      const { data, error: err } = await supabase
        .from('orders')
        .select('*, order_items (*), payment:payments (*)')
        .eq('id', orderId.value)
        .single()

      if (err) throw err
      order.value = data as MartOrder
    } else {
      const { getMyMartOrders } = await import('../services/martOrderService')
      const orders = await getMyMartOrders()
      const found = orders.find(o => o.id === orderId.value)
      if (!found) throw new Error('Không tìm thấy đơn hàng')
      order.value = found
    }
  } catch (err: any) {
    error.value = err?.message || 'Có lỗi xảy ra khi tải đơn hàng'
  } finally {
    loading.value = false
  }
}

async function handleCancel() {
  if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return
  cancelling.value = true
  try {
    if (supabase) {
      const { error: err } = await supabase.rpc('cancel_mart_order', {
        p_order_id: orderId.value,
      })
      if (err) throw err
    } else {
      const { cancelMartOrder } = await import('../services/martOrderService')
      await cancelMartOrder(orderId.value)
    }
    alert('Đã hủy đơn hàng thành công!')
    await fetchOrder()
  } catch (err: any) {
    alert(err?.message || 'Không thể hủy đơn hàng')
  } finally {
    cancelling.value = false
  }
}

async function handleSimulatePayment() {
  if (!confirm('Mô phỏng thanh toán thành công cho đơn hàng này?')) return
  paying.value = true
  try {
    const { simulateMockPayment } = await import('../services/martOrderService')
    await simulateMockPayment(orderId.value)
    alert('Thanh toán mô phỏng thành công!')
    await fetchOrder()
  } catch (err: any) {
    alert(err?.message || 'Thanh toán mô phỏng thất bại')
  } finally {
    paying.value = false
  }
}

const canCancel = computed(() => order.value?.status === 'pending_payment')

watch(orderId, () => {
  fetchOrder()
})

onMounted(() => {
  fetchOrder()
})
</script>

<style scoped>
.page {
  min-height: calc(100vh - 4rem);
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.status-badge {
  padding: 8px 14px;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.status-pending_payment,
.status-expired {
  background: #fff0c2;
  color: #935b00;
}
.status-confirmed,
.status-preparing {
  background: #e7e1ff;
  color: #5b35b7;
}
.status-ready_for_pickup,
.status-out_for_delivery,
.status-completed {
  background: #d8f5df;
  color: #176b39;
}
.status-cancelled,
.status-manual_review {
  background: #ffe1df;
  color: #a22b24;
}
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
</style>
