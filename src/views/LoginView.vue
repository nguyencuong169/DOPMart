<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, CheckCircle2, LogIn, UserPlus } from 'lucide-vue-next'
import { useCartStore } from '../stores/cartStore'
import {
  getCurrentUserWithProfile,
  isSupabaseReady,
  supabase,
} from '../lib/supabase'

type AuthMode = 'login' | 'signup'

const router = useRouter()
const route = useRoute()
const cart = useCartStore()
const mode = shallowRef<AuthMode>('login')
const email = shallowRef('')
const password = shallowRef('')
const loading = shallowRef(false)
const error = shallowRef('')
const message = shallowRef('')

const isSignup = computed(() => mode.value === 'signup')
const submitLabel = computed(() => isSignup.value ? 'Tạo tài khoản' : 'Đăng nhập')
const canSubmit = computed(() => {
  return email.value.trim().length > 0 && password.value.length >= 8 && !loading.value
})

const redirectTarget = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : '/'
})

async function finishAuthentication() {
  await cart.init()
  const result = await getCurrentUserWithProfile()

  if (result?.profile?.role === 'admin') {
    await router.push(redirectTarget.value.startsWith('/admin') ? redirectTarget.value : '/admin')
    return
  }

  await router.push(redirectTarget.value.startsWith('/admin') ? '/' : redirectTarget.value)
}

async function handleSubmit() {
  error.value = ''
  message.value = ''

  if (!isSupabaseReady || !supabase) {
    error.value = 'Chưa cấu hình kết nối Supabase cho môi trường này.'
    return
  }

  if (!canSubmit.value) {
    error.value = 'Email hợp lệ và mật khẩu tối thiểu 8 ký tự.'
    return
  }

  loading.value = true

  try {
    if (isSignup.value) {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.value.trim(),
        password: password.value,
      })

      if (signupError) throw signupError

      if (!data.session) {
        message.value = 'Tài khoản đã được tạo. Hãy kiểm tra email để xác nhận trước khi đăng nhập.'
        return
      }
    } else {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.value.trim(),
        password: password.value,
      })

      if (loginError) throw loginError
    }

    await finishAuthentication()
  } catch (cause) {
    error.value = cause instanceof Error
      ? cause.message
      : 'Không thể xác thực tài khoản. Vui lòng thử lại.'
  } finally {
    loading.value = false
  }
}

function switchMode(nextMode: AuthMode) {
  mode.value = nextMode
  error.value = ''
  message.value = ''
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card" aria-labelledby="auth-title">
      <div class="auth-brand" aria-label="DOP Mart">
        <span>DOP</span><strong>mart</strong>
      </div>

      <div class="auth-heading">
        <span class="auth-kicker">DOP MART · INTERNAL ACCESS</span>
        <h1 id="auth-title">{{ isSignup ? 'Bắt đầu mua nhanh.' : 'Chào mừng trở lại.' }}</h1>
        <p>
          {{ isSignup
            ? 'Tạo tài khoản nhân viên để đặt snack và theo dõi đơn hàng.'
            : 'Đăng nhập để đặt món và xem lịch sử mua hàng.' }}
        </p>
      </div>

      <div class="auth-tabs" role="tablist" aria-label="Phương thức xác thực">
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'login'"
          :class="{ active: mode === 'login' }"
          @click="switchMode('login')"
        >
          <LogIn :size="17" aria-hidden="true" />
          Đăng nhập
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'signup'"
          :class="{ active: mode === 'signup' }"
          @click="switchMode('signup')"
        >
          <UserPlus :size="17" aria-hidden="true" />
          Tạo tài khoản
        </button>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <label class="auth-field">
          <span>Email công ty</span>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="ten@congty.vn"
            required
          />
        </label>

        <label class="auth-field">
          <span>Mật khẩu</span>
          <input
            v-model="password"
            type="password"
            :autocomplete="isSignup ? 'new-password' : 'current-password'"
            minlength="8"
            placeholder="Tối thiểu 8 ký tự"
            required
          />
        </label>

        <div v-if="error" class="auth-alert error" role="alert">{{ error }}</div>
        <div v-if="message" class="auth-alert success" role="status">
          <CheckCircle2 :size="17" aria-hidden="true" />
          {{ message }}
        </div>

        <button type="submit" class="auth-submit" :disabled="!canSubmit">
          <span v-if="loading" class="auth-spinner" aria-hidden="true" />
          <span>{{ loading ? 'Đang xử lý…' : submitLabel }}</span>
          <ArrowRight v-if="!loading" :size="18" aria-hidden="true" />
        </button>
      </form>

      <p class="auth-note">
        User mới sẽ được tạo profile với role <strong>customer</strong> mặc định.
      </p>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  display: grid;
  min-height: 100svh;
  place-items: center;
  padding: 32px 16px;
  background: #f6efe3;
}

.auth-card {
  width: min(100%, 460px);
  border: 2px solid var(--ink);
  border-radius: 24px;
  background: #fffdf7;
  padding: clamp(24px, 6vw, 48px);
  box-shadow: 7px 7px 0 var(--ink);
}

.auth-brand {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 900;
  letter-spacing: -.06em;
}

.auth-brand strong { color: #e76f51; }

.auth-heading { margin-top: 36px; }

.auth-kicker {
  color: #85786d;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .14em;
}

.auth-heading h1 {
  margin: 10px 0 12px;
  font-family: var(--font-display);
  font-size: clamp(42px, 9vw, 64px);
  line-height: .95;
  letter-spacing: -.05em;
}

.auth-heading p {
  margin: 0;
  color: #73685f;
  line-height: 1.5;
}

.auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 32px;
  border-bottom: 1px solid #ddd1c4;
}

.auth-tabs button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-bottom: 3px solid transparent;
  background: transparent;
  padding: 12px 8px;
  color: #82756a;
  font: inherit;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
}

.auth-tabs button.active {
  border-color: var(--ink);
  color: var(--ink);
}

.auth-form {
  display: grid;
  gap: 18px;
  margin-top: 24px;
}

.auth-field {
  display: grid;
  gap: 8px;
  color: var(--ink);
  font-size: 13px;
  font-weight: 900;
}

.auth-field input {
  width: 100%;
  border: 1.5px solid #cfc1b2;
  border-radius: 12px;
  background: #fff;
  padding: 13px 14px;
  color: var(--ink);
  font: inherit;
  font-weight: 500;
  outline: none;
}

.auth-field input:focus {
  border-color: var(--ink);
  box-shadow: 0 0 0 3px rgb(255 211 56 / 45%);
}

.auth-alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.45;
}

.auth-alert.error { background: #fff0ef; color: #9b211a; }
.auth-alert.success { background: #e8f7ea; color: #216b37; }

.auth-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 50px;
  border: 2px solid var(--ink);
  border-radius: 14px;
  background: #ffd338;
  color: var(--ink);
  font: inherit;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--ink);
}

.auth-submit:hover:not(:disabled) { transform: translate(-1px, -1px); }
.auth-submit:disabled { cursor: not-allowed; opacity: .5; box-shadow: none; }

.auth-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgb(25 25 25 / 30%);
  border-top-color: var(--ink);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}

.auth-note {
  margin: 24px 0 0;
  color: #85786d;
  font-size: 11px;
  line-height: 1.5;
  text-align: center;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
