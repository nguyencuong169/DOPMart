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
  return users.value.filter((user) => {
    const matchesRole = roleFilter.value === 'all' || user.role === roleFilter.value
    const matchesSearch = !query || user.userId.toLowerCase().includes(query)
    return matchesRole && matchesSearch
  })
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0,
  }).format(value || 0)
}

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
      <button type="button" class="refresh-button" :disabled="loading" @click="loadUsers">
        <RefreshCw :size="16" :class="{ spinning: loading }" aria-hidden="true" />
        Làm mới
      </button>
    </header>

    <div v-if="errorMessage" class="users-alert" role="alert">{{ errorMessage }}</div>

    <div class="users-toolbar">
      <label class="search-box">
        <Search :size="18" aria-hidden="true" />
        <span class="sr-only">Tìm người dùng</span>
        <input v-model="searchQuery" type="search" placeholder="Tìm theo ID người dùng…" />
      </label>
      <select v-model="roleFilter" class="role-filter" aria-label="Lọc theo vai trò">
        <option value="all">Tất cả vai trò</option>
        <option value="customer">Đồng nghiệp</option>
        <option value="admin">Quản trị viên</option>
      </select>
    </div>

    <div v-if="loading && !users.length" class="users-empty" role="status">Đang tải người dùng…</div>

    <div v-else class="users-table-wrap">
      <table class="users-table">
        <thead><tr><th>Người dùng</th><th>Floor</th><th>Vai trò</th><th>Đơn hàng</th><th>Đã chi</th><th><span class="sr-only">Thao tác</span></th></tr></thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.userId">
            <td><strong>#{{ user.userId.slice(0, 8) }}</strong><small>{{ user.userId }}</small></td>
            <td>{{ user.floor }}F</td>
            <td><span class="role-pill" :class="user.role"><ShieldCheck v-if="user.role === 'admin'" :size="14" /><ShieldOff v-else :size="14" />{{ roleLabel(user.role) }}</span></td>
            <td>{{ user.orderCount }}</td>
            <td class="amount">{{ formatCurrency(user.totalSpent) }}</td>
            <td class="actions"><select :value="user.role" :disabled="busyUserId === user.userId" aria-label="Đổi vai trò" @change="handleRoleChange(user, $event)"><option value="customer">Đồng nghiệp</option><option value="admin">Quản trị viên</option></select></td>
          </tr>
          <tr v-if="!filteredUsers.length"><td colspan="6" class="users-empty">Không tìm thấy người dùng phù hợp.</td></tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.admin-users { display: grid; gap: 24px; }
.users-header, .users-toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
.users-kicker { color: #756a61; font-size: 11px; font-weight: 900; letter-spacing: .1em; }
.users-title { margin: 8px 0 6px; font-family: var(--font-display, sans-serif); font-size: clamp(34px, 5vw, 56px); line-height: .95; letter-spacing: -.04em; }
.users-lead { max-width: 56ch; margin: 0; color: #756a61; font-size: 14px; line-height: 1.5; }
.refresh-button { display: inline-flex; align-items: center; gap: 8px; border: 2px solid var(--ink); border-radius: 11px; background: #ffd338; padding: 10px 13px; color: var(--ink); font-weight: 900; cursor: pointer; box-shadow: 3px 3px 0 var(--ink); }
.refresh-button:disabled { cursor: wait; opacity: .55; box-shadow: none; }
.spinning { animation: spin .8s linear infinite; }
.users-alert { border: 1.5px solid #b42318; border-radius: 12px; background: #fff1f0; padding: 12px 14px; color: #8e1c16; font-weight: 700; }
.search-box { display: flex; align-items: center; gap: 9px; width: min(420px, 100%); border: 1.5px solid #c8beb2; border-radius: 12px; background: #fffdf7; padding: 11px 13px; color: #756a61; }
.search-box input { width: 100%; border: 0; outline: 0; background: transparent; font: inherit; }
.role-filter { border: 1.5px solid #c8beb2; border-radius: 12px; background: #fffdf7; padding: 11px 13px; color: var(--ink); font: inherit; }
.users-table-wrap { overflow-x: auto; border: 1.5px solid #d9cec1; border-radius: 18px; background: #fffdf7; }
.users-table { width: 100%; min-width: 780px; border-collapse: collapse; font-size: 13px; }
.users-table th { padding: 14px 16px; border-bottom: 1.5px solid #d9cec1; color: #756a61; font-size: 11px; letter-spacing: .07em; text-align: left; text-transform: uppercase; }
.users-table td { padding: 14px 16px; border-bottom: 1px solid #ebe2d8; vertical-align: middle; }
.users-table td strong, .users-table td small { display: block; }
.users-table td small { margin-top: 4px; color: #8a7f74; font-size: 10px; }
.role-pill { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 6px 9px; font-size: 11px; font-weight: 900; }
.role-pill.admin { background: #e7e1ff; color: #5b35b7; }
.role-pill.customer { background: #e8f1f4; color: #285b68; }
.amount { font-variant-numeric: tabular-nums; font-weight: 900; white-space: nowrap; }
.actions { text-align: right; }
.actions select { border: 1px solid #c8beb2; border-radius: 8px; background: #fff; padding: 7px 9px; font: inherit; font-size: 12px; }
.users-empty { min-height: 120px; color: #8a7f74; text-align: center; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 760px) { .users-header, .users-toolbar { align-items: stretch; flex-direction: column; } .refresh-button, .search-box, .role-filter { width: 100%; } }
</style>
