<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useCartStore } from "../stores/cartStore";
import { supabase } from "../lib/supabase";

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const router = useRouter();
const cart = useCartStore();

const isValid = computed(() => email.value && password.value);

async function handleLogin(e) {
  e.preventDefault();
  loading.value = true;
  error.value = "";

  const { data, error: err } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });

  if (err) {
    error.value = err.message;
    loading.value = false;
    return;
  }

  // Initialize cart for user
  if (data.user) {
    try {
      await cart.init();
    } catch (e) {
      console.warn("Cart init failed:", e);
    }
  }

  // Redirect to admin if admin, otherwise home
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.is_admin) {
    await router.push("/admin");
  } else {
    await router.push("/");
  }

  loading.value = false;
}
</script>

<template>
  <main class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="login-brand">
          <span class="brand-dop">DOP</span><span class="brand-mart">mart</span>
          <small class="brand-tagline">Mini mart · Big happy</small>
        </div>
        <h1 class="login-title">Đăng nhập</h1>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="nguoidung@email.com"
            class="form-input"
            :class="{ 'form-input--error': error }"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Mật khẩu</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="form-input"
            :class="{ 'form-input--error': error }"
            required
          />
        </div>

        <div class="form-error" v-if="error">{{ error }}</div>

        <button
          type="submit"
          class="login-btn"
          :disabled="loading || !isValid"
        >
          <span v-if="loading">Đang đăng nhập...</span>
          <span v-else>Đăng nhập</span>
        </button>
      </form>

      <div class="login-footer">
        <p>Chưa có tài khoản? <a href="#" @click.prevent="router.push('/')">Quay lại trang chủ</a></p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--midnight-dream, #0a0f2a);
  color: var(--ink-well, #1a1a1a);
  font-family: "Bricolage Grotesque", sans-serif;
  padding: 2rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--rice-paper, #f8f6f2);
  padding: 3rem 2rem;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-brand {
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.login-brand .brand-dop {
  font-family: "Anton", sans-serif;
  font-size: 2.5rem;
  font-weight: 400;
  color: var(--midnight-dream, #0a0f2a);
  letter-spacing: -0.05em;
  text-transform: uppercase;
}

.login-brand .brand-mart {
  font-family: "Anton", sans-serif;
  font-size: 2.5rem;
  font-weight: 400;
  color: var(--mango-glow, #ff6b35);
  letter-spacing: -0.05em;
  text-transform: uppercase;
}

.login-brand .brand-tagline {
  font-size: 0.75rem;
  color: rgba(26, 26, 26, 0.5);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.login-title {
  font-family: "Anton", sans-serif;
  font-size: 2.5rem;
  font-weight: 400;
  color: var(--midnight-dream, #0a0f2a);
  letter-spacing: -0.05em;
  text-transform: uppercase;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ink-well, #1a1a1a);
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-family: "Bricolage Grotesque", sans-serif;
  font-size: 1rem;
  border: 1px solid rgba(26, 26, 26, 0.2);
  border-radius: 6px;
  background: #fff;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--mango-glow, #ff6b35);
}

.form-input--error {
  border-color: var(--red, #e03e45);
}

.form-error {
  font-size: 0.875rem;
  color: var(--red, #e03e45);
  margin-top: 0.25rem;
}

.login-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-family: "Bricolage Grotesque", sans-serif;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ink-well, #1a1a1a);
  background: var(--mango-glow, #ff6b35);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.15s, background 0.2s;
  margin-top: 0.5rem;
}

.login-btn:not(:disabled):hover {
  transform: translateY(-2px);
  background: #ff8a57;
}

.login-btn:not(:disabled):active {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.875rem;
  color: rgba(26, 26, 26, 0.6);
}

.login-footer a {
  color: var(--mango-glow, #ff6b35);
  text-decoration: none;
  font-weight: 600;
}

.login-footer a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.5rem;
  }

  .login-page {
    padding: 1rem;
  }
}
</style>