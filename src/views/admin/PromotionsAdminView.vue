<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { Search, Plus, Edit, Trash2, Save, X, Tag, Clock } from "lucide-vue-next";

const promotions = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const showForm = ref(false);
const editing = ref(null);
const form = ref({
  code: "",
  description: "",
  discountType: "percent",
  discountValue: null,
  minOrder: 0,
  maxUses: 0,
  startsAt: "",
  endsAt: "",
  isActive: true,
});

const loadPromotions = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    promotions.value = data || [];
  } catch (e) {
    alert("Lỗi tải khuyến mãi: " + e.message);
  } finally { loading.value = false; }
};

const filteredPromotions = ref([]);
const filterPromotions = () => {
  const q = searchQuery.value.toLowerCase();
  filteredPromotions.value = promotions.value.filter((p) =>
    p.code.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q)
  );
};

const openCreate = () => {
  editing.value = null;
  form.value = { code: "", description: "", discountType: "percent", discountValue: null, minOrder: 0, maxUses: 0, startsAt: "", endsAt: "", isActive: true };
  showForm.value = true;
};

const openEdit = (p) => {
  editing.value = p.id;
  form.value = { ...p, startsAt: p.starts_at, endsAt: p.ends_at, discountType: p.discount_type, discountValue: p.discount_value, minOrder: p.min_order, maxUses: p.max_uses, isActive: Boolean(p.is_active) };
  showForm.value = true;
};

const savePromotion = async () => {
  const payload = {
    code: form.value.code.toUpperCase().trim(),
    description: form.value.description,
    discount_type: form.value.discountType,
    discount_value: Number(form.value.discountValue) || 0,
    min_order: Number(form.value.minOrder) || 0,
    max_uses: Number(form.value.maxUses) || 0,
    starts_at: form.value.startsAt,
    ends_at: form.value.endsAt,
    is_active: Boolean(form.value.isActive),
  };
  try {
    if (editing.value) {
      const { error } = await supabase.from("promotions").update(payload).eq("id", editing.value);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("promotions").insert(payload);
      if (error) throw error;
    }
    showForm.value = false;
    await loadPromotions();
  } catch (e) { alert("Lỗi lưu khuyến mãi: " + e.message); }
};

const deletePromotion = async (id) => {
  if (!confirm("Xóa mã giảm giá này?")) return;
  try {
    const { error } = await supabase.from("promotions").delete().eq("id", id);
    if (error) throw error;
    await loadPromotions();
  } catch (e) { alert("Lỗi xóa khuyến mãi: " + e.message); }
};

const toggleActive = async (id, current) => {
  try {
    const { error } = await supabase.from("promotions").update({ is_active: !current }).eq("id", id);
    if (error) throw error;
    await loadPromotions();
  } catch (e) { alert("Lỗi cập nhật trạng thái: " + e.message); }
};

const formatCurrency = (v) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v || 0);

onMounted(() => { loadPromotions(); });
</script>

<template>
  <div class="admin-promotions">
    <div class="page-header">
      <h1 class="page-title">Quản lý khuyến mãi</h1>
      <button class="btn btn--primary" @click="openCreate">
        <Plus size={18} /> Tạo mã giảm giá
      </button>
    </div>

    <div class="search-bar">
      <Search size={18} class="search-icon" />
      <input v-model="searchQuery" @input="filterPromotions" placeholder="Tìm mã giảm giá..." class="search-input" />
    </div>

    <div class="table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:130px">Mã giảm giá</th>
            <th>Mô tả</th>
            <th style="width:130px">Loại giảm</th>
            <th style="width:120px">Giá trị</th>
            <th style="width:110px">Đơn tối thiểu</th>
            <th style="width:110px">Số lần dùng</th>
            <th style="width:140px">Hạn sử dụng</th>
            <th class="text-center" style="width:100px">Kích hoạt</th>
            <th class="text-center" style="width:120px">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filteredPromotions" :key="p.id">
            <td class="mono font-bold">{{ p.code }}</td>
            <td>{{ p.description || "—" }}</td>
            <td>{{ p.discount_type === "percent" ? "Phần trăm" : "Tiền mặt" }}</td>
            <td class="mono">
              {{ p.discount_type === "percent" ? p.discount_value + "%" : formatCurrency(p.discount_value) }}
            </td>
            <td class="mono">{{ formatCurrency(p.min_order) }}</td>
            <td class="text-center">{{ p.used_count }} / {{ p.max_uses || "∞" }}</td>
            <td class="mono text-muted">{{ p.ends_at?.slice(0, 10) }}</td>
            <td class="text-center">
              <label class="toggle-switch">
                <input type="checkbox" v-model="p.is_active" @change="toggleActive(p.id, p.is_active)" />
                <span class="toggle-slider"></span>
              </label>
            </td>
            <td class="text-center actions">
              <button class="icon-btn" @click="openEdit(p)" title="Sửa"><Edit size={16} /></button>
              <button class="icon-btn icon-btn--danger" @click="deletePromotion(p.id)" title="Xóa"><Trash2 size={16} /></button>
            </td>
          </tr>
          <tr v-if="filteredPromotions.length === 0"><td colspan="9" class="empty">Không tìm thấy khuyến mãi nào</td></tr>
        </tbody>
      </table>
    </div>

    <Transition name="fade">
      <div v-if="showForm" class="modal-overlay" @click="showForm = false"></div>
    </Transition>
    <Transition name="slide-fade">
      <div v-if="showForm" class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editing ? "Sửa mã giảm giá" : "Tạo mã giảm giá mới" }}</h3>
          <button class="modal-close" @click="showForm = false"><X size={20} /></button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-field span-2">
              <label class="form-label">Mã giảm giá</label>
              <input v-model="form.code" class="form-input" placeholder="GIAM20" />
            </div>
            <div class="form-field span-2">
              <label class="form-label">Mô tả</label>
              <input v-model="form.description" class="form-input" placeholder="Giảm 20% cho đơn trên 100k" />
            </div>
            <div class="form-field">
              <label class="form-label">Loại giảm giá</label>
              <select v-model="form.discountType" class="form-select">
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Tiền mặt (VNĐ)</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Giá trị giảm</label>
              <input type="number" v-model.number="form.discountValue" class="form-input" />
            </div>
            <div class="form-field">
              <label class="form-label">Đơn hàng tối thiểu</label>
              <input type="number" v-model.number="form.minOrder" class="form-input" />
            </div>
            <div class="form-field">
              <label class="form-label">Số lần sử dụng tối đa</label>
              <input type="number" v-model.number="form.maxUses" class="form-input" placeholder="0 = không giới hạn" />
            </div>
            <div class="form-field">
              <label class="form-label">Bắt đầu từ</label>
              <input type="datetime-local" v-model="form.startsAt" class="form-input" />
            </div>
            <div class="form-field">
              <label class="form-label">Kết thúc vào</label>
              <input type="datetime-local" v-model="form.endsAt" class="form-input" />
            </div>
            <div class="form-field span-2 form-toggle">
              <label class="form-label">Trạng thái</label>
              <div class="toggle-row">
                <label class="toggle-item">
                  <input type="checkbox" v-model="form.isActive" /> Kích hoạt
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showForm = false">Hủy</button>
          <button class="btn btn--primary" @click="savePromotion"><Save size={16} /> {{ editing ? "Cập nhật" : "Tạo mới" }}</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.admin-promotions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--foreground, #1a1a1a);
  margin: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
}

.btn--primary {
  background: var(--flame, #ff5a1f);
  color: #ffffff;
  border-color: var(--flame, #ff5a1f);
}

.btn--primary:hover { opacity: 0.9; }

.btn {
  background: var(--background, #ffffff);
  color: var(--foreground, #1a1a1a);
  border-color: var(--border, #e5e7eb);
}

.btn:hover { background: var(--muted, #f3f4f6); }

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--muted, #f9fafb);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 10px;
  width: 320px;
}

.search-icon { color: var(--muted-foreground, #9ca3af); flex-shrink: 0; }

.search-input {
  flex: 1; border: none; background: transparent; outline: none;
  font-size: 0.875rem; color: var(--foreground, #1a1a1a);
}

.table-wrap { overflow-x: auto; margin-top: 0.5rem; }

.admin-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }

.admin-table th {
  text-align: left; padding: 0.75rem 1rem; font-weight: 600;
  color: var(--muted-foreground, #6b7280);
  border-bottom: 1px solid var(--border, #e5e7eb);
  background: var(--muted, #f9fafb);
}

.admin-table td {
  padding: 0.75rem 1rem; border-bottom: 1px solid var(--border, #e5e7eb);
  color: var(--foreground, #1a1a1a);
}

.admin-table tr:last-child td { border-bottom: none; }

.text-center { text-align: center; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.8125rem; }
.font-bold { font-weight: 700; }
.text-muted { color: var(--muted-foreground, #6b7280); }

.empty {
  text-align: center; padding: 2rem; color: var(--muted-foreground, #9ca3af);
}

/* Toggle switch */
.toggle-switch {
  position: relative; display: inline-block; width: 44px; height: 24px;
}
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
  background: var(--muted, #f3f4f6); transition: 0.15s; border-radius: 34px;
}
.toggle-slider:before {
  position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
  background: #ffffff; transition: 0.15s; border-radius: 50%;
}
.toggle-switch input:checked + .toggle-slider { background: var(--flame, #ff5a1f); }
.toggle-switch input:checked + .toggle-slider:before { transform: translateX(20px); }

.actions { gap: 0.5rem; }
.icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border: none; background: transparent;
  cursor: pointer; border-radius: 6px; color: var(--muted-foreground, #6b7280);
}
.icon-btn:hover { background: var(--muted, #f3f4f6); }
.icon-btn--danger:hover { background: #fef2f2; color: #b91c1c; }

/* Form (modal) */
.form-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;
}
.form-field.span-2 { grid-column: span 2; }
.form-label {
  display: block; font-size: 0.8125rem; font-weight: 500;
  color: var(--muted-foreground, #6b7280); margin-bottom: 0.375rem;
}
.form-input, .form-select {
  width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--border, #e5e7eb);
  border-radius: 8px; background: var(--background, #ffffff);
  color: var(--foreground, #1a1a1a); font-size: 0.875rem; outline: none;
}
.form-input:focus, .form-select:focus { border-color: var(--flame, #ff5a1f); }
.toggle-row { display: flex; gap: 1rem; margin-top: 0.25rem; }
.toggle-item {
  display: flex; align-items: center; gap: 0.375rem;
  font-size: 0.875rem; color: var(--foreground, #1a1a1a); cursor: pointer;
}

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgb(0 0 0 / 0.4);
  backdrop-filter: blur(2px); z-index: 50;
}
.modal {
  position: fixed; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: min(720px, 92vw); max-height: 85vh;
  background: var(--popover, #ffffff); border: 1px solid var(--border, #e5e7eb);
  border-radius: 12px; box-shadow: var(--shadow-2, 0 10px 15px -3px rgb(0 0 0 / 0.1));
  z-index: 51; display: flex; flex-direction: column; overflow: hidden;
  animation: slideUp 0.2s ease;
}
@keyframes slideUp {
  from { opacity: 0; transform: translate(-50%, -40%); }
  to { opacity: 1; transform: translate(-50%, -50%); }
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem; border-bottom: 1px solid var(--border, #e5e7eb);
}
.modal-header h3 { font-size: 1rem; font-weight: 600; color: var(--foreground, #1a1a1a); margin: 0; }
.modal-close {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border: none; background: transparent;
  cursor: pointer; border-radius: 6px; color: var(--muted-foreground, #6b7280);
}
.modal-close:hover { background: var(--muted, #f3f4f6); }
.modal-body { padding: 1.25rem; overflow-y: auto; }
.modal-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem;
  padding: 0.75rem 1.25rem; border-top: 1px solid var(--border, #e5e7eb);
  background: var(--muted, #f9fafb);
}
</style>