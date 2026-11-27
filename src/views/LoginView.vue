<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
      <div class="mb-8 text-center">
        <h1 class="text-balance text-3xl font-bold tracking-tight text-gray-900">
          Chào mừng trở lại
        </h1>
        <p class="mt-2 text-sm text-gray-600">Đăng nhập vào tài khoản DOPMart của bạn</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
          <input
            v-model="form.password"
            type="password"
            required
            class="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        <div
          v-if="errorMsg"
          class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ errorMsg }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
        </button>
      </form>

      <div class="mt-8 text-center">
        <p class="text-sm text-gray-600">
          Chưa có tài khoản?
          <a href="/register" class="font-medium text-blue-600 hover:underline">Đăng ký ngay</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '../stores/userStore'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const store = useUserStore()
const router = useRouter()
const form = { email: '', password: '' }

const errorMsg = computed(() => store.error)
const loading = computed(() => store.loading)

async function handleLogin() {
  const res = await store.login(form.email, form.password)
  if (res.error) return
  const redirect = router.currentRoute.value.query.redirect || '/'
  await router.push(redirect)
}
</script>

<style scoped>
h1 {
  letter-spacing: -0.02em;
}
</style>
