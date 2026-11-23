<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { Search, Package, Clock, Edit, Phone, Mail } from "lucide-vue-next";

const orders = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const statusFilter = ref("");

const statuses = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"];
const statusLabels = {
  pending: "Chờ xử lý", confirmed: "Đã xác nhận", preparing: "Đang chuẩn bị",
  ready: "Sẵn sàng", delivered: "Đã giao", cancelled: "Đã hủy",
};
const statusColors = {
  pending: "#f59e0b", confirmed: "#3b82f6", preparing: "#8b5cf6",
  ready: "#10b981", delivered: "#059669", cancelled: "#ef4444",
};

const loadOrders = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items ( id, product_id, qty, price_snapshot, products ( name, slug ) ),
        profiles ( id, floor, role )
      `)
      .order("created_at", { ascending: false });
    if (error) throw error;
    orders.value = (data || []).map((o) => ({
      ...o,
      userName: o.profiles ? `Khách #${o.user_id.slice(0, 6)}` : `Khách #${o.user_id.slice(0, 6)}`,
      itemCount: (o.order_items || []).reduce((s, i) => s + i.qty, 0),
    }));
  } catch (e) {
    alert("Lỗi tải đơn hàng: " + e.message);
  } finally { loading.value = false; }
};

const filteredOrders = ref([]);
const filterOrders = () => {
  const q = searchQuery.value.toLowerCase();
  const s = statusFilter.value;
  filteredOrders.value = orders.value.filter((o) => {
    const matchQ = o.id.slice(0, 8).includes(q) || o.userName.toLowerCase().includes(q);
    const matchS = !s || o.status === s;
    return matchQ && matchS;
  });
};

const updateStatus = async (id, newStatus) => {
  try {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    if (error) throw error;
    await loadOrders();
  } catch (e) { alert("Lỗi cập nhật trạng thái: " + e.message); }
};

const formatCurrency = (v) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v || 0);

onMounted(() => { loadOrders().then(filterOrders); });
</script>

<template>
  <div class="admin-orders">
    <div class="page-header">
      <h1 class="page-title">Quản lý đơn hàng</h1>
    </div>

    <div class="filters">
      <div class="search-bar">
        <Search :size="18" class="search-icon" />
        <input v-model="searchQuery" @input="filterOrders" placeholder="Tìm đơn hàng..." class="search-input" />
      </div>
      <select v-model="statusFilter" @change="filterOrders" class="form-select">
        <option value="">Tất cả trạng thái</option>
        <option v-for="s in statuses" :key="s" :value="s">{{ statusLabels[s] }}</option>
      </select>
    </div>

    <div class="table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:110px">Mã đơn</th>
            <th>Khách hàng</th>
            <th style="width:130px">Tổng tiền</th>
            <th style="width:110px">Số lượng</th>
            <th style="width:140px">Trạng thái</th>
            <th style="width:150px">Ngày</th>
            <th class="text-center" style="width:120px">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in filteredOrders" :key="o.id">
            <td class="mono">#{{ o.id.slice(0, 8) }}</td>
            <td>{{ o.userName }}</td>
            <td class="mono">{{ formatCurrency(o.total) }}</td>
            <td class="text-center">{{ o.itemCount }}</td>
            <td>
              <span class="badge" :style="{ backgroundColor: statusColors[o.status] + '20', color: statusColors[o.status] }">
                {{ statusLabels[o.status] }}
              </span>
            </td>
            <td class="mono text-muted">{{ o.created_at?.slice(0, 16) }}</td>
            <td class="text-center actions">
              <select v-model="o.status" @change="updateStatus(o.id, o.status)" class="status-select">
                <option v-for="s in statuses" :key="s" :value="s">{{ statusLabels[s] }}</option>
              </select>
            </td>
          </tr>
          <tr v-if="filteredOrders.length === 0"><td colspan="7" class="empty">Không tìm thấy đơn hàng nào</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.admin-orders {
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

.filters {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

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

.search-icon {
  color: var(--muted-foreground, #9ca3af);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.875rem;
  color: var(--foreground, #1a1a1a);
}

.form-select {
  width: 200px;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 10px;
  background: var(--background, #ffffff);
  color: var(--foreground, #1a1a1a);
  font-size: 0.875rem;
  outline: none;
}

.status-select {
  width: 140px;
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 6px;
  background: var(--background, #ffffff);
  font-size: 0.75rem;
  cursor: pointer;
}

.table-wrap {
  overflow-x: auto;
  margin-top: 0.5rem;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.admin-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: var(--muted-foreground, #6b7280);
  border-bottom: 1px solid var(--border, #e5e7eb);
  background: var(--muted, #f9fafb);
}

.admin-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border, #e5e7eb);
  color: var(--foreground, #1a1a1a);
}

.admin-table tr:last-child td { border-bottom: none; }

.text-center { text-align: center; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.8125rem; }
.text-muted { color: var(--muted-foreground, #6b7280); }

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.empty {
  text-align: center;
  padding: 2rem;
  color: var(--muted-foreground, #9ca3af);
}
</style>