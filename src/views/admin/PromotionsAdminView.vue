<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef } from "vue";
import { Edit, Plus, RefreshCw, Search, Trash2, X } from "lucide-vue-next";
import {
  deleteMartPromotion,
  getMartAdminPromotions,
  upsertMartPromotion,
  type MartAdminPromotion,
} from "../../services/martAdminService";

interface PromotionForm {
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrder: number;
  maxUses: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

const promotions = shallowRef<MartAdminPromotion[]>([]);
const loading = shallowRef(true);
const saving = shallowRef(false);
const errorMessage = shallowRef("");
const searchQuery = shallowRef("");
const showForm = shallowRef(false);
const editingId = shallowRef<string | null>(null);

const form = reactive<PromotionForm>({
  code: "",
  description: "",
  discountType: "percent",
  discountValue: 0,
  minOrder: 0,
  maxUses: 0,
  startsAt: "",
  endsAt: "",
  isActive: true,
});

const filteredPromotions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return promotions.value;
  return promotions.value.filter(
    (promotion) => `${promotion.code} ${promotion.description}`.toLowerCase().includes(query),
  );
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(
    value || 0,
  );
}

function formatDate(value?: string) {
  if (!value) return "Không giới hạn";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(value));
}

function toDateTimeInput(value?: string) {
  return value ? value.slice(0, 16) : "";
}

function resetForm() {
  Object.assign(form, {
    code: "",
    description: "",
    discountType: "percent",
    discountValue: 0,
    minOrder: 0,
    maxUses: 0,
    startsAt: new Date().toISOString().slice(0, 16),
    endsAt: "",
    isActive: true,
  });
}

function openCreate() {
  editingId.value = null;
  resetForm();
  showForm.value = true;
}

function openEdit(promotion: MartAdminPromotion) {
  editingId.value = promotion.id;
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
  });
  showForm.value = true;
}

function getErrorMessage(cause: unknown, fallback: string) {
  const raw = cause instanceof Error ? cause.message : "";
  const code = raw.split(":")[0];
  const messages: Record<string, string> = {
    "23505": "Mã khuyến mãi đã tồn tại.",
    INVALID_PROMOTION_PAYLOAD: "Vui lòng kiểm tra loại và giá trị giảm.",
    PROMOTION_NOT_FOUND: "Không tìm thấy khuyến mãi.",
  };
  return messages[code] ?? raw ?? fallback;
}

async function loadPromotions() {
  loading.value = true;
  errorMessage.value = "";
  try {
    promotions.value = await getMartAdminPromotions();
  } catch (cause) {
    errorMessage.value = getErrorMessage(cause, "Không thể tải khuyến mãi.");
  } finally {
    loading.value = false;
  }
}

async function savePromotion() {
  if (!form.code.trim() || form.discountValue <= 0) {
    errorMessage.value = "Mã và giá trị khuyến mãi là bắt buộc.";
    return;
  }

  saving.value = true;
  errorMessage.value = "";
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
    });
    showForm.value = false;
    await loadPromotions();
  } catch (cause) {
    errorMessage.value = getErrorMessage(cause, "Không thể lưu khuyến mãi.");
  } finally {
    saving.value = false;
  }
}

async function removePromotion(promotion: MartAdminPromotion) {
  if (!window.confirm(`Xóa mã “${promotion.code}”?`)) return;
  errorMessage.value = "";
  try {
    await deleteMartPromotion(promotion.id);
    await loadPromotions();
  } catch (cause) {
    errorMessage.value = getErrorMessage(cause, "Không thể xóa khuyến mãi.");
  }
}

onMounted(loadPromotions);
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
        <button type="button" class="ad-btn-refresh" :disabled="loading" @click="loadPromotions">
          <RefreshCw :size="16" :class="{ spinning: loading }" aria-hidden="true" />
          Làm mới
        </button>
        <button type="button" class="btn-primary" @click="openCreate">
          <Plus :size="17" aria-hidden="true" />
          Tạo mã mới
        </button>
      </div>
    </header>

    <div v-if="errorMessage" class="ad-alert ad-alert--error" role="alert">{{ errorMessage }}</div>

    <label class="ad-search">
      <Search :size="16" aria-hidden="true" />
      <input v-model="searchQuery" type="search" placeholder="Tìm theo mã hoặc mô tả…" />
    </label>

    <div v-if="loading && !promotions.length" class="ad-empty" role="status">Đang tải khuyến mãi…</div>

    <div v-else class="table-wrap">
      <table class="ad-table">
        <thead>
          <tr>
            <th>Mã</th>
            <th>Mô tả</th>
            <th>Giảm</th>
            <th>Đơn tối thiểu</th>
            <th>Đã dùng</th>
            <th>Thời hạn</th>
            <th>Trạng thái</th>
            <th><span class="sr-only">Thao tác</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="promotion in filteredPromotions" :key="promotion.id">
            <td><strong class="code">{{ promotion.code }}</strong></td>
            <td>{{ promotion.description || "Không có mô tả" }}</td>
            <td class="amount">
              {{ promotion.discount_type === "percent" ? `${promotion.discount_value}%` : formatCurrency(promotion.discount_value) }}
            </td>
            <td class="amount">{{ formatCurrency(promotion.min_order) }}</td>
            <td>{{ promotion.used_count }} / {{ promotion.max_uses || "∞" }}</td>
            <td class="date-cell">{{ formatDate(promotion.ends_at) }}</td>
            <td>
              <span class="ad-status-pill" :class="{ active: promotion.is_active, inactive: !promotion.is_active }">
                {{ promotion.is_active ? "Đang bật" : "Đã tắt" }}
              </span>
            </td>
            <td class="actions">
              <button type="button" class="ad-icon-btn" title="Sửa khuyến mãi" @click="openEdit(promotion)">
                <Edit :size="16" />
              </button>
              <button type="button" class="ad-icon-btn ad-icon-btn--danger" title="Xóa khuyến mãi" @click="removePromotion(promotion)">
                <Trash2 :size="16" />
              </button>
            </td>
          </tr>
          <tr v-if="!filteredPromotions.length">
            <td colspan="8" class="ad-empty">Chưa có khuyến mãi phù hợp.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="ad-modal-layer" @click.self="showForm = false">
      <form class="ad-modal" @submit.prevent="savePromotion">
        <div class="ad-modal-header">
          <div>
            <span class="promotions-kicker">PROMOTION EDITOR</span>
            <h2>{{ editingId ? "Sửa khuyến mãi" : "Tạo khuyến mãi" }}</h2>
          </div>
          <button type="button" class="ad-icon-btn" aria-label="Đóng" @click="showForm = false">
            <X :size="19" />
          </button>
        </div>
        <div class="ad-form-grid">
          <label class="ad-field">
            <span>Mã khuyến mãi</span>
            <input v-model="form.code" required placeholder="DOP20" />
          </label>
          <label class="ad-field">
            <span>Mô tả</span>
            <input v-model="form.description" placeholder="Giảm cho đơn đầu tiên" />
          </label>
          <label class="ad-field">
            <span>Loại giảm</span>
            <select v-model="form.discountType" class="ad-select">
              <option value="percent">Phần trăm (%)</option>
              <option value="fixed">Số tiền (VND)</option>
            </select>
          </label>
          <label class="ad-field">
            <span>Giá trị</span>
            <input v-model.number="form.discountValue" type="number" min="0.01" required />
          </label>
          <label class="ad-field">
            <span>Đơn tối thiểu</span>
            <input v-model.number="form.minOrder" type="number" min="0" />
          </label>
          <label class="ad-field">
            <span>Giới hạn lượt dùng</span>
            <input v-model.number="form.maxUses" type="number" min="0" />
          </label>
          <label class="ad-field">
            <span>Bắt đầu</span>
            <input v-model="form.startsAt" type="datetime-local" />
          </label>
          <label class="ad-field">
            <span>Kết thúc</span>
            <input v-model="form.endsAt" type="datetime-local" />
          </label>
          <label class="ad-field ad-checkbox">
            <input v-model="form.isActive" type="checkbox" />
            <span>Kích hoạt mã</span>
          </label>
        </div>
        <footer class="ad-modal-footer">
          <button type="button" class="btn-secondary" @click="showForm = false">Hủy</button>
          <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? "Đang lưu…" : "Lưu khuyến mãi" }}</button>
        </footer>
      </form>
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

.admin-promotions {
  display: grid;
  gap: var(--sp-3);
}

.promotions-header,
.header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}

.header-actions {
  align-items: center;
}

.promotions-kicker {
  color: #756a61;
  font-size: var(--fs-xs);
  font-weight: 900;
  letter-spacing: var(--tracking-kicker);
}

.promotions-title {
  margin: var(--sp-1) 0 0;
  font-family: var(--font-display);
  font-size: clamp(34px, 5vw, 56px);
  line-height: 0.95;
  letter-spacing: var(--tracking-display);
  color: var(--ad-ink);
}

.promotions-lead {
  max-width: 56ch;
  margin: 0;
  color: #756a61;
  font-size: var(--fs-sm);
  line-height: 1.5;
}

.ad-btn-refresh,
.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
  border: var(--bw-bold) solid var(--ad-ink);
  border-radius: var(--ad-radius);
  padding: var(--sp-1) var(--sp-3);
  color: var(--ad-ink);
  font-weight: 800;
  font-family: var(--font-ui);
  cursor: pointer;
  font-size: var(--fs-sm);
}

.ad-btn-refresh {
  background: var(--ad-yellow);
  box-shadow: var(--ad-shadow);
}

.ad-btn-refresh:disabled {
  cursor: wait;
  opacity: 0.55;
  box-shadow: none;
}

.btn-primary {
  background: var(--ad-ink);
  color: #fff;
  box-shadow: var(--ad-shadow);
}

.btn-primary:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 6px 6px 0 var(--ad-ink);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--ad-paper);
}

.btn-secondary:hover {
  background: var(--ad-muted-bg);
}

.spinning {
  animation: spin 0.8s linear infinite;
}

.ad-alert--error {
  border: var(--bw) solid #b42318;
  border-radius: var(--ad-radius);
  background: #fff1f0;
  padding: var(--sp-2) var(--sp-3);
  color: #8e1c16;
  font-weight: 800;
}

.ad-search {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  width: min(440px, 100%);
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
  font: inherit;
}

.table-wrap {
  overflow-x: auto;
  border: var(--bw-bold) solid #d9cec1;
  border-radius: var(--ad-radius);
  background: var(--ad-paper);
}

.ad-table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
  font-size: var(--fs-sm);
}

.ad-table th {
  padding: var(--sp-2) var(--sp-3);
  border-bottom: var(--bw) solid #d9cec1;
  color: #756a61;
  font-size: var(--fs-xs);
  letter-spacing: var(--tracking-kicker);
  text-align: left;
  text-transform: uppercase;
  font-weight: 800;
  background: var(--ad-muted-bg);
}

.ad-table td {
  padding: var(--sp-2) var(--sp-3);
  border-bottom: var(--bw) solid #ebe2d8;
  vertical-align: middle;
  color: var(--ad-ink);
}

.code,
.amount {
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  white-space: nowrap;
}

.date-cell {
  color: #756a61;
  white-space: nowrap;
}

.ad-status-pill {
  display: inline-flex;
  border-radius: 999px;
  padding: 5px 9px;
  font-size: var(--fs-xs);
  font-weight: 800;
}

.ad-status-pill.active {
  background: #d8f5df;
  color: #176b39;
}

.ad-status-pill.inactive {
  background: #f1e9dc;
  color: #756a61;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sp-1);
}

.ad-icon-btn {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: var(--bw) solid #d9cec1;
  border-radius: 9px;
  background: transparent;
  color: #645b53;
  cursor: pointer;
}

.ad-icon-btn:hover {
  background: #f1e9dc;
  color: #191919;
}

.ad-icon-btn--danger:hover {
  background: #fff1f0;
  color: #b42318;
}

.ad-empty {
  min-height: 120px;
  color: #8a7f74;
  text-align: center;
}

.ad-modal-layer {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  background: rgb(25, 25, 25, 0.38);
  padding: var(--sp-3);
}

.ad-modal {
  width: min(720px, 100%);
  max-height: 90svh;
  overflow: auto;
  border: var(--bw-bold) solid var(--ad-ink);
  border-radius: 20px;
  background: var(--ad-paper);
  box-shadow: var(--ad-shadow);
  padding: var(--sp-3);
}

.ad-modal-header,
.ad-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}

.ad-modal-header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 32px;
}

.ad-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
}

.ad-field {
  display: grid;
  gap: var(--sp-1);
  color: #645b53;
  font-size: var(--fs-xs);
  font-weight: 800;
}

.ad-field input:not([type="checkbox"]),
.ad-field select {
  width: 100%;
  border: var(--bw-bold) solid #c8beb2;
  border-radius: var(--ad-radius);
  background: var(--ad-paper);
  padding: var(--sp-1) var(--sp-2);
  color: #191919;
  font: inherit;
  font-weight: 500;
  outline: 0;
}

.ad-checkbox {
  display: flex !important;
  align-items: center;
  gap: var(--sp-1) !important;
}

.ad-modal-footer {
  justify-content: flex-end;
  margin-top: var(--sp-3);
  border-top: var(--bw) solid #ded5ca;
  padding-top: var(--sp-2);
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
  .promotions-header,
  .header-actions {
    align-items: stretch;
    flex-direction: column;
  }
  .header-actions,
  .btn-primary,
  .btn-secondary,
  .ad-btn-refresh {
    width: 100%;
  }
  .ad-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
