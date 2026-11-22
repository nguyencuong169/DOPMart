<script setup>
import { ref, onMounted, watch } from "vue";
import { useMediaQuery } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
import { Store, Menu, ChevronLeft, Bell, ShoppingCart } from "lucide-vue-next";
import { getCurrentUserWithProfile } from "@/lib/supabase";

const route = useRoute();
const router = useRouter();

const isMobile = useMediaQuery("(max-width: 768px)");
const sidebarOpen = ref(!isMobile.value);
const userMenuOpen = ref(false);
const avatarError = ref(false);
const user = ref(null);

watch(isMobile, (mobile) => { sidebarOpen.value = !mobile; });

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const closeSidebar = () => {
  sidebarOpen.value = false;
};

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value;
};

const onLogout = async () => {
  await router.push("/");
};

const adminLinks = [
  { name: "admin-dashboard", label: "Tổng quan", icon: Store },
  { name: "admin-products", label: "Sản phẩm", icon: ShoppingCart },
  { name: "admin-orders", label: "Đơn hàng", icon: ShoppingCart },
  { name: "admin-users", label: "Người dùng", icon: Store },
  { name: "admin-promotions", label: "Khuyến mãi", icon: Bell },
];

const isActive = (name) => route.name === name;

onMounted(async () => {
  const { user: u, profile } = await getCurrentUserWithProfile();
  user.value = u;
  if (!(profile?.is_admin === true)) {
    await router.push("/");
  }
});

</script>

<template>
  <div class="admin-layout" :class="{ 'with-sidebar': sidebarOpen }" @keydown.esc="closeSidebar">
    <header class="admin-topbar">
      <button class="topbar-toggle" @click="toggleSidebar" :aria-expanded="sidebarOpen" aria-controls="admin-sidebar" :aria-label="sidebarOpen ? 'Đóng menu' : 'Mở menu'">
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
          <img v-if="user?.user_metadata?.avatar_url && !avatarError" class="avatar" :src="user?.user_metadata?.avatar_url" alt="" @error="avatarError = true" />
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

    <div v-if="isMobile && sidebarOpen" class="admin-scrim" @click="closeSidebar" />
    <aside id="admin-sidebar" class="admin-sidebar" :inert="!sidebarOpen">
      <div class="sidebar-header">
        <button class="sidebar-close" @click="closeSidebar" aria-label="Đóng sidebar">
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
          @click="isMobile && closeSidebar()"
        >
          <component :is="link.icon" :size="18" class="sidebar-link-icon" />
          <span class="sidebar-link-label">{{ link.label }}</span>
        </RouterLink>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-version">v1.0.0</div>
      </div>
    </aside>

    <main class="admin-main">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" key="$route.name" />
        </transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: var(--background, #ffffff);
  color: var(--foreground, #1a1a1a);
}

/* Topbar */
.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 56px;
  min-height: 56px;
  padding: 0 1rem;
  background: var(--background, #ffffff);
  border-bottom: 1px solid var(--border, #e5e7eb);
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  color: var(--foreground, #1a1a1a);
}

.topbar-toggle:hover {
  background: var(--muted, #f3f4f6);
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--foreground, #1a1a1a);
  text-decoration: none;
}

.brand-icon {
  color: var(--flame, #ff5a1f);
}

.brand-name-accent {
  color: var(--flame, #ff5a1f);
}

.topbar-spacer {
  flex: 1;
  display: none;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.topbar-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  color: var(--foreground, #1a1a1a);
}

.topbar-icon-btn:hover {
  background: var(--muted, #f3f4f6);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

/* User dropdown */
.user-dropdown {
  position: absolute;
  top: 64px;
  right: 1rem;
  width: 180px;
  background: var(--popover, #ffffff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 8px;
  box-shadow: var(--shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1));
  z-index: 50;
  overflow: hidden;
}

.dropdown-item {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: var(--foreground, #1a1a1a);
  cursor: pointer;
  transition: background 0.15s;
}

.dropdown-item:hover {
  background: var(--muted, #f3f4f6);
}

.dropdown-item.text-destructive {
  color: var(--destructive, #ef4444);
}

.dropdown-item.text-destructive:hover {
  background: #fef2f2;
}

.dropdown-divider {
  height: 1px;
  background: var(--border, #e5e7eb);
  margin: 0.25rem 0;
}

/* Sidebar */
.admin-sidebar {
  position: fixed;
  top: 56px;
  left: 0;
  width: 260px;
  bottom: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--background, #ffffff);
  border-right: 1px solid var(--border, #e5e7eb);
  z-index: 20;
  transition: transform 0.25s ease;
  transform: translateX(-100%);
}

.with-sidebar .admin-sidebar {
  transform: translateX(0);
}

.sidebar-header {
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
}

.sidebar-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  color: var(--muted-foreground, #6b7280);
}

.sidebar-nav {
  padding: 0.5rem 0;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--muted-foreground, #6b7280);
  text-decoration: none;
  border-radius: 0;
  transition: all 0.15s;
  border-left: 3px solid transparent;
}

.sidebar-link:hover {
  background: var(--muted, #f3f4f6);
  color: var(--foreground, #1a1a1a);
}

.sidebar-link.active {
  background: var(--accent, #eff6ff);
  color: var(--accent-foreground, #1a1a1a);
  border-left: 3px solid var(--flame, #ff5a1f);
}

.sidebar-link-icon {
  flex-shrink: 0;
}

.sidebar-footer {
  padding: 1rem;
  font-size: 0.75rem;
  color: var(--muted-foreground, #9ca3af);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Main content */
.admin-main {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  padding: clamp(12px, 2vw, 24px);
  transition: margin-left 0.25s ease;
}

.with-sidebar .admin-main {
  margin-inline-start: 260px;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-topbar {
    padding-inline: 0.5rem;
    gap: 0.5rem;
    z-index: 30;
  }

  .topbar-spacer {
    display: block;
  }

  .admin-sidebar {
    max-width: calc(100% - 44px);
    z-index: 40;
  }

  .admin-scrim {
    position: fixed;
    inset: 56px 0 0;
    z-index: 35;
    background: rgb(0 0 0 / 0.4);
  }

  .with-sidebar .admin-main {
    margin-inline-start: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-sidebar,
  .admin-main {
    transition: none;
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