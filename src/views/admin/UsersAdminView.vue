<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import { Search, User, ShieldCheck, ShieldOff, ArrowRight } from "lucide-vue-next";

const users = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const roleFilter = ref("");

const loadUsers = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        orders ( id, total, status )
      `)
      .order("created_at", { ascending: true });
    if (error) throw error;
    users.value = (data || []).map((u) => {
      const orders = u.orders || [];
      const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0);
      return {
        ...u,
        orderCount: orders.length,
        totalSpent,
        roleLabel: u.role === "admin" ? "Quản trị" : "Khách hàng",
      };
    });
  } catch (e) {
    alert("Lỗi tải người dùng: " + e.message);
  } finally { loading.value = false; }
};

const filteredUsers = ref([]);
const filterUsers = () => {
  const q = searchQuery.value.toLowerCase();
  const r = roleFilter.value;
  filteredUsers.value = users.value.filter((u) => {
    const matchQ = u.id.slice(0, 8).includes(q);
    const matchR = !r || u.role === r;
    return matchQ && matchR;
  });
};

const updateRole = async (id, newRole) => {
  try {
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", id);
    if (error) throw error;
    await loadUsers();
  } catch (e) { alert("Lỗi cập nhật role: " + e.message); }
};

const formatCurrency = (v) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v || 0);

const roleOptions = [
  { value: "customer", label: "Khách hàng" },
  { value: "admin", label: "Quản trị" },
];

onMounted(() => { loadUsers().then(filterUsers); });
</script>

<template>
  <div class="admin-users">
    <div class="page-header">
      <h1 class="page-title">Quản lý người dùng</h1>
    </div>

    <div class="filters">
      <div class="search-bar">
        <Search :size="18" class="search-icon" />
        <input v-model="searchQuery" @input="filterUsers" placeholder="Tìm người dùng..." class="search-input" />
      </div>
      <select v-model="roleFilter" @change="filterUsers" class="form-select">
        <option value="">Tất cả vai trò</option>
        <option v-for="o in roleOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </div>

    <div class="table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:110px">Mã người dùng</th>
            <th>Tầng</th>
            <th style="width:130px">Vai trò</th>
            <th style="width:130px">Đơn hàng</th>
            <th style="width:150px">Tổng chi tiêu</th>
            <th class="text-center" style="width:140px">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in filteredUsers" :key="u.id">
            <td class="mono">#{{ u.id.slice(0, 8) }}</td>
            <td>{{ u.floor }}</td>
            <td>
              <span class="badge" :class="{ 'badge--admin': u.role === 'admin', 'badge--customer': u.role === 'customer' }">
                {{ u.roleLabel }}
              </span>
            </td>
            <td class="text-center">{{ u.orderCount }}</td>
            <td class="mono">{{ formatCurrency(u.totalSpent) }}</td>
            <td class="text-center actions">
              <select v-model="u.role" @change="updateRole(u.id, u.role)" class="role-select">
                <option v-for="o in roleOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0"><td colspan="6" class="empty">Không tìm thấy người dùng nào</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.admin-users {
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

.role-select {
  width: 150px;
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

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge--admin { background: var(--purple, #6b2fb3); color: #ffffff; }
.badge--customer { background: var(--muted, #f3f4f6); color: var(--muted-foreground, #6b7280); }

.empty {
  text-align: center;
  padding: 2rem;
  color: var(--muted-foreground, #9ca3af);
}
</style>