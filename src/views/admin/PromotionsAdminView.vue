<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef } from 'vue'
import { Edit, Plus, RefreshCw, Search, Trash2, X } from 'lucide-vue-next'
import {
  deleteMartPromotion,
  getMartAdminPromotions,
  upsertMartPromotion,
  type MartAdminPromotion,
} from '../../services/martAdminService'

interface PromotionForm {
  code: string
  description: string
  discountType: 'percent' | 'fixed'
  discountValue: number
  minOrder: number
  maxUses: number
  startsAt: string
  endsAt: string
  isActive: boolean
}

const promotions = shallowRef<MartAdminPromotion[]>([])
const loading = shallowRef(true)
const saving = shallowRef(false)
const errorMessage = shallowRef('')
const searchQuery = shallowRef('')
const showForm = shallowRef(false)
const editingId = shallowRef<string | null>(null)

const form = reactive<PromotionForm>({
  code: '', description: '', discountType: 'percent', discountValue: 0,
  minOrder: 0, maxUses: 0, startsAt: '', endsAt: '', isActive: true,
})

const filteredPromotions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return promotions.value
  return promotions.value.filter((promotion) => (
    `${promotion.code} ${promotion.description}`.toLowerCase().includes(query)
  ))
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0,
  }).format(value || 0)
}

function formatDate(value?: string) {
  if (!value) return 'Không giới hạn'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(value))
}

function toDateTimeInput(value?: string) {
  return value ? value.slice(0, 16) : ''
}

function resetForm() {
  Object.assign(form, {
    code: '', description: '', discountType: 'percent', discountValue: 0,
    minOrder: 0, maxUses: 0, startsAt: new Date().toISOString().slice(0, 16),
    endsAt: '', isActive: true,
  })
}

function openCreate() {
  editingId.value = null
  resetForm()
  showForm.value = true
}

function openEdit(promotion: MartAdminPromotion) {
  editingId.value = promotion.id
  Object.assign(form, {
    code: promotion.code,
    description: promotion.description,
    discountType: promotion.discount_type,
    discountValue: promotion.discount_value,
    minOrder: promotion.min_order,
    maxUses: promotion.max_uses,
    startsAt: toDateTimeInput(promotion.starts_at),
    endsAt: toDateTimeInput(promotion.ends_at),
    isActive: promotion.is_active,
  })
  showForm.value = true
}

function getErrorMessage(cause: unknown, fallback: string) {
  const raw = cause instanceof Error ? cause.message : ''
  const code = raw.split(':')[0]
  const messages: Record<string, string> = {
    '23505': 'Mã khuyến mãi đã tồn tại.',
    INVALID_PROMOTION_PAYLOAD: 'Vui lòng kiểm tra loại và giá trị giảm.',
    PROMOTION_NOT_FOUND: 'Không tìm thấy khuyến mãi.',
  }
  return messages[code] ?? raw ?? fallback
}

async function loadPromotions() {
  loading.value = true
  errorMessage.value = ''
  try {
    promotions.value = await getMartAdminPromotions()
  } catch (cause) {
    errorMessage.value = getErrorMessage(cause, 'Không thể tải khuyến mãi.')
  } finally {
    loading.value = false
  }
}

async function savePromotion() {
  if (!form.code.trim() || form.discountValue <= 0) {
    errorMessage.value = 'Mã và giá trị khuyến mãi là bắt buộc.'
    return
  }

  saving.value = true
  errorMessage.value = ''
  try {
    await upsertMartPromotion({
      id: editingId.value ?? undefined,
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrder: Number(form.minOrder),
      maxUses: Number(form.maxUses),
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      isActive: form.isActive,
    })
    showForm.value = false
    await loadPromotions()
  } catch (cause) {
    errorMessage.value = getErrorMessage(cause, 'Không thể lưu khuyến mãi.')
  } finally {
    saving.value = false
  }
}

async function removePromotion(promotion: MartAdminPromotion) {
  if (!window.confirm(`Xóa mã “${promotion.code}”?`)) return
  errorMessage.value = ''
  try {
    await deleteMartPromotion(promotion.id)
    await loadPromotions()
  } catch (cause) {
    errorMessage.value = getErrorMessage(cause, 'Không thể xóa khuyến mãi.')
  }
}

onMounted(loadPromotions)
</script>

<template>
  <section class="admin-promotions" aria-labelledby="promotions-heading">
    <header class="promotions-header">
      <div>
        <span class="promotions-kicker">DOP MART · PROMOTIONS</span>
        <h1 id="promotions-heading" class="promotions-title">Khuyến mãi</h1>
        <p class="promotions-lead">Quản lý mã giảm giá dùng trong các chiến dịch bán hàng nội bộ.</p>
      </div>
      <div class="header-actions">
        <button type="button" class="secondary-button" :disabled="loading" @click="loadPromotions">
          <RefreshCw :size="16" :class="{ spinning: loading }" aria-hidden="true" />
          Làm mới
        </button>
        <button type="button" class="primary-button" @click="openCreate">
          <Plus :size="17" aria-hidden="true" />
          Tạo mã mới
        </button>
      </div>
    </header>

    <div v-if="errorMessage" class="admin-alert" role="alert">{{ errorMessage }}</div>

    <label class="search-box">
      <Search :size="18" aria-hidden="true" />
      <span class="sr-only">Tìm mã khuyến mãi</span>
      <input v-model="searchQuery" type="search" placeholder="Tìm theo mã hoặc mô tả…" />
    </label>

    <div v-if="loading && !promotions.length" class="empty-state" role="status">Đang tải khuyến mãi…</div>

    <div v-else class="table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Mã</th><th>Mô tả</th><th>Giảm</th><th>Đơn tối thiểu</th><th>Đã dùng</th><th>Thời hạn</th><th>Trạng thái</th><th><span class="sr-only">Thao tác</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="promotion in filteredPromotions" :key="promotion.id">
            <td><strong class="code">{{ promotion.code }}</strong></td>
            <td>{{ promotion.description || 'Không có mô tả' }}</td>
            <td class="amount">{{ promotion.discount_type === 'percent' ? `${promotion.discount_value}%` : formatCurrency(promotion.discount_value) }}</td>
            <td class="amount">{{ formatCurrency(promotion.min_order) }}</td>
            <td>{{ promotion.used_count }} / {{ promotion.max_uses || '∞' }}</td>
            <td class="date-cell">{{ formatDate(promotion.ends_at) }}</td>
            <td><span class="status-pill" :class="{ active: promotion.is_active, inactive: !promotion.is_active }">{{ promotion.is_active ? 'Đang bật' : 'Đã tắt' }}</span></td>
            <td class="actions">
              <button type="button" class="icon-button" title="Sửa khuyến mãi" @click="openEdit(promotion)"><Edit :size="16" /></button>
              <button type="button" class="icon-button danger" title="Xóa khuyến mãi" @click="removePromotion(promotion)"><Trash2 :size="16" /></button>
            </td>
          </tr>
          <tr v-if="!filteredPromotions.length"><td colspan="8" class="empty-state">Chưa có khuyến mãi phù hợp.</td></tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="modal-layer" @click.self="showForm = false">
      <form class="modal" @submit.prevent="savePromotion">
        <header class="modal-header">
          <div><span class="promotions-kicker">PROMOTION EDITOR</span><h2>{{ editingId ? 'Sửa khuyến mãi' : 'Tạo khuyến mãi' }}</h2></div>
          <button type="button" class="icon-button" aria-label="Đóng" @click="showForm = false"><X :size="19" /></button>
        </header>
        <div class="form-grid">
          <label>Mã khuyến mãi<input v-model="form.code" required placeholder="DOP20" /></label>
          <label>Mô tả<input v-model="form.description" placeholder="Giảm cho đơn đầu tiên" /></label>
          <label>Loại giảm<select v-model="form.discountType"><option value="percent">Phần trăm (%)</option><option value="fixed">Số tiền (VND)</option></select></label>
          <label>Giá trị<input v-model.number="form.discountValue" type="number" min="0.01" required /></label>
          <label>Đơn tối thiểu<input v-model.number="form.minOrder" type="number" min="0" /></label>
          <label>Giới hạn lượt dùng<input v-model.number="form.maxUses" type="number" min="0" /></label>
          <label>Bắt đầu<input v-model="form.startsAt" type="datetime-local" /></label>
          <label>Kết thúc<input v-model="form.endsAt" type="datetime-local" /></label>
          <label class="checkbox-field"><input v-model="form.isActive" type="checkbox" /> Kích hoạt mã</label>
        </div>
        <footer class="modal-footer"><button type="button" class="secondary-button" @click="showForm = false">Hủy</button><button type="submit" class="primary-button" :disabled="saving">{{ saving ? 'Đang lưu…' : 'Lưu khuyến mãi' }}</button></footer>
      </form>
    </div>
  </section>
</template>

<style scoped>
.admin-promotions { display: grid; gap: 24px; }
.promotions-header, .header-actions { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
.header-actions { align-items: center; }
.promotions-kicker { color: #756a61; font-size: 11px; font-weight: 900; letter-spacing: .1em; }
.promotions-title { margin: 8px 0 6px; font-family: var(--font-display, sans-serif); font-size: clamp(34px, 5vw, 56px); line-height: .95; letter-spacing: -.04em; }
.promotions-lead { max-width: 56ch; margin: 0; color: #756a61; font-size: 14px; line-height: 1.5; }
.primary-button, .secondary-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 2px solid var(--ink, #191919); border-radius: 11px; padding: 10px 13px; color: var(--ink, #191919); font-weight: 900; cursor: pointer; }
.primary-button { background: #ffd338; box-shadow: 3px 3px 0 var(--ink, #191919); }
.secondary-button { background: #fffdf7; }
.primary-button:disabled, .secondary-button:disabled { cursor: wait; opacity: .55; }
.spinning { animation: spin .8s linear infinite; }
.admin-alert { border: 1.5px solid #b42318; border-radius: 12px; background: #fff1f0; padding: 12px 14px; color: #8e1c16; font-weight: 700; }
.search-box { display: flex; align-items: center; gap: 9px; width: min(440px, 100%); border: 1.5px solid #c8beb2; border-radius: 12px; background: #fffdf7; padding: 11px 13px; color: #756a61; }
.search-box input { width: 100%; border: 0; outline: 0; background: transparent; font: inherit; }
.table-wrap { overflow-x: auto; border: 1.5px solid #d9cec1; border-radius: 18px; background: #fffdf7; }
.admin-table { width: 100%; min-width: 900px; border-collapse: collapse; font-size: 13px; }
.admin-table th { padding: 14px 16px; border-bottom: 1.5px solid #d9cec1; color: #756a61; font-size: 11px; letter-spacing: .07em; text-align: left; text-transform: uppercase; }
.admin-table td { padding: 14px 16px; border-bottom: 1px solid #ebe2d8; vertical-align: middle; }
.code, .amount { font-variant-numeric: tabular-nums; font-weight: 900; white-space: nowrap; }
.date-cell { color: #756a61; white-space: nowrap; }
.status-pill { display: inline-flex; border-radius: 999px; padding: 6px 9px; font-size: 11px; font-weight: 900; }
.status-pill.active { background: #d8f5df; color: #176b39; }
.status-pill.inactive { background: #f1e9dc; color: #756a61; }
.actions { display: flex; justify-content: flex-end; gap: 6px; }
.icon-button { display: inline-grid; place-items: center; width: 34px; height: 34px; border: 1px solid #d9cec1; border-radius: 9px; background: transparent; color: #645b53; cursor: pointer; }
.icon-button:hover { background: #f1e9dc; color: #191919; }
.icon-button.danger:hover { background: #fff1f0; color: #b42318; }
.empty-state { min-height: 120px; color: #8a7f74; text-align: center; }
.modal-layer { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; background: rgb(25 25 25 / .38); padding: 20px; }
.modal { width: min(720px, 100%); max-height: 90svh; overflow: auto; border: 2px solid var(--ink); border-radius: 20px; background: #fffdf7; box-shadow: 7px 7px 0 var(--ink); padding: 24px; }
.modal-header, .modal-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.modal-header h2 { margin: 7px 0 0; font-family: var(--font-display); font-size: 32px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 24px; }
.form-grid label { display: grid; gap: 7px; color: #645b53; font-size: 12px; font-weight: 800; }
.form-grid input:not([type='checkbox']), .form-grid select { width: 100%; border: 1.5px solid #c8beb2; border-radius: 10px; background: #fff; padding: 10px 11px; color: #191919; font: inherit; font-weight: 500; }
.checkbox-field { display: flex !important; align-items: center; gap: 8px !important; }
.modal-footer { justify-content: flex-end; margin-top: 24px; border-top: 1px solid #ded5ca; padding-top: 18px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 760px) { .promotions-header, .header-actions { align-items: stretch; flex-direction: column; } .header-actions, .primary-button, .secondary-button { width: 100%; } .form-grid { grid-template-columns: 1fr; } }
</style>
