<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Store,
  LogOut,
  Menu,
  ChevronLeft,
  Sun,
  Moon,
  Bell,
  ShoppingCart,
  ChevronRight,
} from "lucide-vue-next";
import { isAdmin, getCurrentUserWithProfile, supabase } from "@/lib/supabase";

const route = useRoute();
const router = useRouter();

const sidebarOpen = ref(true);
const userMenuOpen = ref(false);
const avatarError = ref(false);
const user = ref(null);
const isMobile = ref(window.innerWidth < 768);

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value;
};

const onLogout = async () => {
  await supabase?.auth.signOut();
  await router.push({ name: "login" });
};

const adminLinks = [
  { name: "admin-dashboard", label: "Tổng quan", icon: Store },
  { name: "admin-products", label: "Sản phẩm", icon: ShoppingCart },
  { name: "admin-orders", label: "Đơn hàng", icon: ShoppingCart },
  { name: "admin-users", label: "Người dùng", icon: Store },
  { name: "admin-promotions", label: "Khuyến mãi", icon: Bell },
  { name: "admin-operations", label: "Vận hành mới", icon: ShoppingCart },
];

const linkLabels = Object.fromEntries(adminLinks.map((l) => [l.name, l.label]));

const isActive = (name) => route.name === name;
const breadcrumb = computed(() => {
  const crumbs = [];
  for (let i = 0; i < adminLinks.length; i++) {
    if (adminLinks[i].name === route.name) {
      crumbs.push(adminLinks[i].label);
      break;
    }
  }
  return crumbs;
});

const goBack = () => router.back();

onMounted(async () => {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) sidebarOpen.value = false;
  const { user: u, profile } = await getCurrentUserWithProfile();
  user.value = u;
  if (!(profile?.is_admin === true || profile?.role === "admin")) {
    await router.push("/");
  }
});

window.addEventListener("resize", () => {
  isMobile.value = window.innerWidth < 768;
  if (!isMobile.value) sidebarOpen.value = true;
});
</script>

<template>
  <div class="admin-layout">
    <!-- Mobile backdrop overlay -->
    <transition name="fade">
      <div
        v-if="sidebarOpen && isMobile"
        class="admin-overlay"
        @click="toggleSidebar"
        aria-hidden="true"
      />
    </transition>

    <header class="admin-topbar">
      <button class="topbar-toggle" @click="toggleSidebar" aria-label="Mở menu">
        <Menu :size="20" />
      </button>
      <div class="topbar-brand">
        <Store :size="24" class="brand-icon" />
        <span class="brand-name">DOP<span class="brand-name-accent">Mart</span> Admin</span>
      </div>
      <div class="topbar-spacer" />
      <div class="topbar-actions">
        <button class="topbar-icon-btn" aria-label="Thông báo">
          <Bell :size="20" />
        </button>
        <button class="topbar-icon-btn topbar-icon-btn--user" @click="toggleUserMenu">
          <img
            v-if="user?.user_metadata?.avatar_url && !avatarError"
            class="avatar"
            :src="user?.user_metadata?.avatar_url"
            alt=""
            @error="avatarError = true"
          />
          <Store v-else :size="20" />
        </button>
      </div>
    </header>

    <Transition name="fade">
      <div
        v-if="userMenuOpen"
        class="user-dropdown"
        @click.outside="userMenuOpen = false"
      >
        <div class="dropdown-item" @click="userMenuOpen = false">Hồ sơ</div>
        <div class="dropdown-divider" />
        <div class="dropdown-item text-destructive" @click="onLogout">Đăng xuất</div>
      </div>
    </Transition>

    <aside
      class="admin-sidebar"
      :class="{ open: sidebarOpen }"
    >
      <div class="sidebar-header">
        <button v-if="isMobile" class="sidebar-close" @click="toggleSidebar" aria-label="Đóng menu">
          <ChevronLeft :size="20" />
        </button>
      </div>
      <nav class="sidebar-nav">
        <RouterLink
          v-for="link in adminLinks"
          :key="link.name"
          :to="{ name: link.name }"
          class="sidebar-link"
          :class="{ active: isActive(link.name) }"
          @click="sidebarOpen = false"
        >
          <div class="sidebar-link-row">
            <component :is="link.icon" :size="18" class="sidebar-link-icon" />
            <span class="sidebar-link-label">{{ link.label }}</span>
          </div>
        </RouterLink>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-version">v1.0.0</div>
      </div>
    </aside>

    <main class="admin-main">
      <!-- Breadcrumb / back navigation -->
      <nav class="admin-breadcrumb">
        <button class="breadcrumb-back" @click="goBack" :disabled="!breadcrumb.length" aria-label="Quay lại">
          <ChevronLeft size="14" /> Trở về
        </button>
        <span class="breadcrumb-separator">&rsaquo;</span>
        <span class="breadcrumb-current">{{ breadcrumb[0] || route.name }}</span>
      </nav>

      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" key="$route.name" />
        </transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
:root {
  --admin-ink: var(--ink, #1a1a1a);
  --admin-cream: var(--cream, #fff7e3);
  --admin-paper: var(--paper-bright, #fffdf7);
  --admin-border: #d9cec1;
  --admin-muted: #756a61;
  --admin-muted-bg: #f3f4f6;
  --admin-flame: var(--flame, #ff5a1f);
  --admin-yellow: var(--yellow, #ffd233);
  --admin-radius: 14px;
  --admin-shadow: 4px 4px 0 var(--ink, #1a1a1a);
  --admin-sidebar-w: 260px;
}

.admin-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: var(--admin-cream);
  color: var(--admin-ink);
}

/* Mobile overlay */
.admin-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 30;
  backdrop-filter: blur(2px);
}

/* Topbar */
.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 var(--sp-2);
  background: var(--admin-paper);
  border-bottom: var(--bw) solid var(--admin-border);
  position: sticky;
  top: 0;
  z-index: 40;
  flex-shrink: 0;
}

.topbar-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: var(--bw-bold) solid var(--admin-ink);
  border-radius: var(--admin-radius);
  background: var(--admin-paper);
  cursor: pointer;
  color: var(--admin-ink);
  flex-shrink: 0;
}

.topbar-toggle:hover {
  background: var(--admin-muted-bg);
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: var(--fs-lg);
  color: var(--admin-ink);
  text-decoration: none;
  letter-spacing: var(--tracking-display);
}

.brand-icon {
  color: var(--admin-flame);
}

.brand-name-accent {
  color: var(--admin-flame);
}

.topbar-spacer {
  flex: 1;
  display: none;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
}

.topbar-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: var(--bw-bold) solid var(--admin-ink);
  border-radius: var(--admin-radius);
  background: var(--admin-paper);
  cursor: pointer;
  color: var(--admin-ink);
  flex-shrink: 0;
}

.topbar-icon-btn:hover {
  background: var(--admin-muted-bg);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: var(--bw) solid var(--admin-border);
}

/* User dropdown */
.user-dropdown {
  position: absolute;
  top: 64px;
  right: var(--sp-2);
  width: 200px;
  background: var(--admin-paper);
  border: var(--bw-bold) solid var(--admin-ink);
  border-radius: var(--admin-radius);
  box-shadow: var(--admin-shadow);
  z-index: 50;
  overflow: hidden;
}

.dropdown-item {
  padding: var(--sp-1) var(--sp-2);
  font-size: var(--fs-sm);
  color: var(--admin-ink);
  cursor: pointer;
  transition: background 0.15s;
}

.dropdown-item:hover {
  background: var(--admin-muted-bg);
}

.dropdown-item.text-destructive {
  color: var(--red-ink, #b81f2b);
}

.dropdown-item.text-destructive:hover {
  background: #fef2f2;
}

.dropdown-divider {
  height: 1px;
  background: var(--admin-border);
  margin: var(--sp-1) 0;
}

/* Sidebar */
.admin-sidebar {
  position: fixed;
  top: 56px;
  left: 0;
  width: var(--admin-sidebar-w);
  height: calc(100vh - 56px);
  background: var(--admin-paper);
  border-right: var(--bw-bold) solid var(--admin-ink);
  z-index: 35;
  display: flex;
  flex-direction: column;
  transform: translateX(0);
  transition: transform 0.25s ease;
}

.admin-sidebar:not(.open) {
  transform: translateX(-100%);
}

.sidebar-header {
  padding: var(--sp-2);
  display: flex;
  justify-content: flex-end;
}

.sidebar-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: var(--bw-bold) solid var(--admin-ink);
  border-radius: var(--admin-radius);
  background: var(--admin-paper);
  cursor: pointer;
  color: var(--admin-ink);
}

.sidebar-nav {
  padding: var(--sp-2) 0;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.sidebar-link {
  display: block;
  width: 100%;
  padding: var(--sp-2) var(--sp-3);
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--admin-muted);
  text-decoration: none;
  border-radius: 0;
  border-left: var(--bw-bold) solid transparent;
  transition: all 0.15s;
  cursor: pointer;
}

.sidebar-link:hover {
  background: var(--admin-muted-bg);
  color: var(--admin-ink);
}

.sidebar-link.active {
  background: color-mix(in srgb, var(--admin-yellow) 20%, var(--admin-paper));
  color: var(--admin-ink);
  border-left-color: var(--admin-flame);
}

.sidebar-link-icon {
  flex-shrink: 0;
}

.sidebar-link-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.sidebar-footer {
  padding: var(--sp-2);
  font-size: var(--fs-xs);
  color: var(--admin-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-kicker);
}

/* Main content */
.admin-main {
  flex: 1;
  overflow-y: auto;
  padding: var(--sp-3);
  margin-left: var(--admin-sidebar-w);
  background: var(--admin-cream);
  transition: margin-left 0.25s ease;
}

/* Breadcrumb */
.admin-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  margin-bottom: var(--sp-3);
}

.breadcrumb-back {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  border: var(--bw-bold) solid var(--admin-ink);
  border-radius: var(--admin-radius);
  background: var(--admin-paper);
  padding: var(--sp-1) var(--sp-2);
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--admin-ink);
  cursor: pointer;
  font-family: var(--font-ui);
}

.breadcrumb-back:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.breadcrumb-back:hover:not(:disabled) {
  background: var(--admin-muted-bg);
  transform: translate(-1px, -1px);
  box-shadow: var(--admin-shadow);
}

.breadcrumb-separator {
  font-size: var(--fs-sm);
  color: var(--admin-muted);
}

.breadcrumb-current {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--admin-muted);
  font-family: var(--font-ui);
}

/* Responsive */
@media (max-width: 768px) {
  .admin-sidebar {
    z-index: 40;
  }
  .admin-main {
    margin-left: 0;
    padding: var(--sp-2);
    padding-top: 80px;
  }
  .topbar-spacer {
    display: block;
  }
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
