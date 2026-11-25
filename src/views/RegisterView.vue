<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 tracking-tight text-balance">
          Tạo tài khoản mới
        </h1>
        <p class="text-gray-600 mt-2 text-sm">
          Đăng ký để mua sắm tại DOPMart
        </p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
          <input
            v-model="form.password"
            type="password"
            required
            minlength="6"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            placeholder="••••••••"
          />
        </div>

        <div v-if="errorMsg" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {{ errorMsg }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
        >
          {{ loading ? "Đang tạo tài khoản..." : "Đăng ký" }}
        </button>
      </form>

      <div class="mt-8 text-center">
        <p class="text-gray-600 text-sm">
          Đã có tài khoản?
          <a href="/login" class="text-blue-600 hover:underline font-medium">Đăng nhập</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from "../stores/userStore";
import { computed } from "vue";
import { useRouter } from "vue-router";

const store = useUserStore();
const router = useRouter();
const form = { email: "", password: "" };

const errorMsg = computed(() => store.error);
const loading = computed(() => store.loading);

async function handleRegister() {
  const res = await store.register(form.email, form.password);
  if (res.error) return;
  await router.push({
    name: "login",
    query: { message: "Đăng ký thành công. Vui lòng kiểm tra email để xác nhận." },
  });
}
</script>

<style scoped>
h1 {
  letter-spacing: -0.02em;
}
</style>