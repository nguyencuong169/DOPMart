<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { RefreshCw, Search, ShieldCheck, ShieldOff } from 'lucide-vue-next'
import {
  getMartAdminUsers,
  updateMartUserRole,
  type MartAdminUser,
} from '../../services/martAdminService'

const users = shallowRef<MartAdminUser[]>([])
const loading = shallowRef(true)
const errorMessage = shallowRef('')
const searchQuery = shallowRef('')
const roleFilter = shallowRef<'all' | 'admin' | 'customer'>('all')
const busyUserId = shallowRef<string | null>(null)

const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return users.value.filter(user => {
    const matchesRole = roleFilter.value === 'all' || user.role === roleFilter.value
    const matchesSearch = !query || user.userId.toLowerCase().includes(query)
    return matchesRole && matchesSearch
  })
})

function roleLabel(role: MartAdminUser['role']) {
  return role === 'admin' ? 'Quản trị viên' : 'Đồng nghiệp'
}

function errorText(cause: unknown) {
  const raw = cause instanceof Error ? cause.message : ''
  const code = raw.split(':')[0]
  const messages: Record<string, string> = {
    CANNOT_CHANGE_OWN_ROLE: 'Không thể tự hạ quyền tài khoản đang đăng nhập.',
    INVALID_USER_ROLE: 'Vai trò không hợp lệ.',
    USER_PROFILE_NOT_FOUND: 'Không tìm thấy profile người dùng.',
  }
  return messages[code] ?? raw ?? 'Không thể cập nhật người dùng.'
}

async function loadUsers() {
  loading.value = true
  errorMessage.value = ''
  try {
    users.value = await getMartAdminUsers()
  } catch (cause) {
    errorMessage.value = errorText(cause)
  } finally {
    loading.value = false
  }
}

async function changeRole(user: MartAdminUser, role: 'admin' | 'customer') {
  if (user.role === role) return
  if (!window.confirm(`Đổi ${user.userId.slice(0, 8)} thành ${roleLabel(role)}?`)) return

  busyUserId.value = user.userId
  errorMessage.value = ''
  try {
    await updateMartUserRole(user.userId, role)
    await loadUsers()
  } catch (cause) {
    errorMessage.value = errorText(cause)
  } finally {
    busyUserId.value = null
  }
}

function handleRoleChange(user: MartAdminUser, event: Event) {
  const role = (event.target as HTMLSelectElement).value as 'admin' | 'customer'
  void changeRole(user, role)
}

onMounted(loadUsers)
</script>

<template>
  <section class="admin-users" aria-labelledby="users-heading">
    <header class="users-header">
      <div>
        <span class="users-kicker">DOP MART · ACCESS</span>
        <h1 id="users-heading" class="users-title">Người dùng</h1>
        <p class="users-lead">Quản lý floor và vai trò vận hành của đồng nghiệp trong DOP Mart.</p>
      </div>
      <button type="button" class="ad-btn-refresh" :disabled="loading" @click="loadUsers">
        <RefreshCw :size="16" :class="{ spinning: loading }" aria-hidden="true" />
        Làm mới
      </button>
    </header>

    <div v-if="errorMessage" class="ad-alert ad-alert--error" role="alert">{{ errorMessage }}</div>

    <div class="users-toolbar">
      <label class="ad-search">
        <Search :size="16" aria-hidden="true" />
        <input v-model="searchQuery" type="search" placeholder="Tìm theo ID người dùng…" />
      </label>
      <div class="ad-field">
        <span class="ad-field-label">Vai trò</span>
        <select v-model="roleFilter" class="ad-select" aria-label="Lọc theo vai trò">
          <option value="all">Tất cả vai trò</option>
          <option value="customer">Đồng nghiệp</option>
          <option value="admin">Quản trị viên</option>
        </select>
      </div>
    </div>

    <div v-if="loading && !users.length" class="ad-empty" role="status">Đang tải người dùng…</div>

    <div v-else class="table-wrap">
      <table class="ad-table">
        <thead>
          <tr>
            <th>Người dùng</th>
            <th>Floor</th>
            <th>Vai trò</th>
            <th>Đơn hàng</th>
            <th>Đã chi</th>
            <th><span class="sr-only">Thao tác</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.userId">
            <td>
              <strong>#{{ user.userId.slice(0, 8) }}</strong>
              <small class="mono">{{ user.userId }}</small>
            </td>
            <td>{{ user.floor }}F</td>
            <td>
              <span class="ad-role-pill" :class="user.role">
                <ShieldCheck v-if="user.role === 'admin'" :size="14" />
                <ShieldOff v-else :size="14" />
                {{ roleLabel(user.role) }}
              </span>
            </td>
            <td class="amount">{{ user.orderCount }}</td>
            <td class="amount">{{ formatCurrency(user.totalSpent) }}</td>
            <td class="actions">
              <select
                :value="user.role"
                :disabled="busyUserId === user.userId"
                aria-label="Đổi vai trò"
                @change="handleRoleChange(user, $event)"
                class="ad-role-select"
              >
                <option value="customer">Đồng nghiệp</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </td>
          </tr>
          <tr v-if="!filteredUsers.length">
            <td colspan="6" class="ad-empty">Không tìm thấy người dùng phù hợp.</td>
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

.admin-users {
  display: grid;
  gap: var(--sp-3);
}

.users-header,
.users-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}

.users-kicker {
  color: #756a61;
  font-size: var(--fs-xs);
  font-weight: 900;
  letter-spacing: var(--tracking-kicker);
}

.users-title {
  margin: var(--sp-1) 0 0;
  font-family: var(--font-display);
  font-size: clamp(34px, 5vw, 56px);
  line-height: 0.95;
  letter-spacing: var(--tracking-display);
  color: var(--ad-ink);
}

.users-lead {
  max-width: 56ch;
  margin: 0;
  color: #756a61;
  font-size: var(--fs-sm);
  line-height: 1.5;
}

.ad-btn-refresh {
  display: inline-flex;
  align-items: center;
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

.ad-btn-refresh:disabled {
  cursor: wait;
  opacity: 0.55;
  box-shadow: none;
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

.users-toolbar {
  display: flex;
  gap: var(--sp-2);
  align-items: center;
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
  min-width: 780px;
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

.ad-table td > strong,
.ad-table td > small {
  display: block;
}

.ad-table td small {
  margin-top: 4px;
  color: #8a7f74;
  font-size: var(--fs-xs);
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: var(--fs-xs);
}

.amount {
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  white-space: nowrap;
}

.ad-role-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  border-radius: 999px;
  padding: 5px 9px;
  font-size: var(--fs-xs);
  font-weight: 800;
}

.ad-role-pill.admin {
  background: #e7e1ff;
  color: #5b35b7;
}

.ad-role-pill.customer {
  background: #e8f1f4;
  color: #285b68;
}

.actions {
  text-align: right;
}

.ad-role-select {
  border: var(--bw) solid #c8beb2;
  border-radius: 8px;
  background: var(--ad-paper);
  padding: 7px 9px;
  font: inherit;
  font-size: var(--fs-xs);
  outline: 0;
}

.ad-empty {
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
  .users-header,
  .users-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .ad-btn-refresh,
  .ad-search,
  .ad-select {
    width: 100%;
  }
}
</style>
