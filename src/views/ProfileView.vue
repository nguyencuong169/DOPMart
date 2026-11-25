<template>
  <div class="max-w-2xl mx-auto py-8 px-4">
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="!user" class="text-center py-12">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
        <svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-gray-900">Chưa đăng nhập</h2>
      <p class="text-gray-600 mt-2">Vui lòng đăng nhập để xem hồ sơ.</p>
      <div class="mt-6">
        <a href="/login" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition">Đăng nhập</a>
      </div>
    </div>

    <div v-else class="bg-white rounded-2xl shadow-lg p-6">
      <div class="flex flex-col md:flex-row gap-6 items-start">
        <div class="flex-shrink-0">
          <div class="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
            <span class="text-xl font-bold text-blue-600">{{ user.email.charAt(0).toUpperCase() }}</span>
          </div>
        </div>

        <div class="flex-1">
          <h2 class="text-2xl font-bold text-gray-900 tracking-tight">
            {{ profile?.floor ? "Tầng " + profile.floor : "Khách hàng" }}
          </h2>
          <p class="text-gray-600 mt-1">{{ user.email }}</p>

          <div class="mt-4 flex items-center gap-2">
            <span class="px-2 py-1 rounded-full text-xs font-medium"
              :class="profile?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
              {{ profile?.role === 'admin' ? 'Quản trị viên' : 'Khách hàng' }}
            </span>
          </div>

          <div v-if="isAdmin" class="mt-4 flex gap-3">
            <button @click="goToAdmin" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              Vào trang quản trị
            </button>
          </div>
        </div>
      </div>

      <div class="mt-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Cập nhật hồ sơ</h3>
        <form @submit.prevent="handleUpdateProfile" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tầng (floor)</label>
            <input
              v-model="profileForm.floor"
              type="number"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <div v-if="profileError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {{ profileError }}
          </div>

          <button
            type="submit"
            :disabled="profileLoading"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition"
          >
            {{ profileLoading ? "Đang lưu..." : "Lưu thay đổi" }}
          </button>
        </form>
      </div>

      <div class="mt-8 pt-6 border-t border-gray-100">
        <button
          @click="handleLogout"
          class="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-lg transition"
        >
          Đăng xuất
        </button>
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

const user = computed(() => store.user);
const profile = computed(() => store.profile);
const isAdmin = computed(() => store.isAdmin);
const loading = computed(() => store.loading);
const profileLoading = computed(() => store.loading);
const profileError = computed(() => store.error);

const profileForm = { floor: profile.value?.floor ?? 1 };

async function handleUpdateProfile() {
  const res = await store.updateProfile({ floor: profileForm.floor });
  if (res.error) return;
  alert("Đã cập nhật hồ sơ thành công!");
}

async function handleLogout() {
  await store.logout();
  await router.push("/login");
}

function goToAdmin() {
  router.push("/admin");
}

// Tải user khi vào trang
store.fetchCurrentUser();
</script>

<style scoped>
h2 {
  letter-spacing: -0.02em;
}
</style>