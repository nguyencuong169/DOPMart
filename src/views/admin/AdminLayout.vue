<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Store, LogOut, Menu, ChevronLeft, Sun, Moon, Bell, ShoppingCart } from "lucide-vue-next";
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

const closeSidebar = () => {
  if (isMobile.value) sidebarOpen.value = false;
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

const isActive = (name) => route.name === name;

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
  <div class="admin-layout" :class="{ 'is-mobile': isMobile }">
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

    <aside
      class="admin-sidebar"
      :class="{ open: sidebarOpen, hidden: isMobile && !sidebarOpen }"
      @click.outside="closeSidebar"
    >
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
          @click="closeSidebar"
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
  background: var(--background, #ffffff);
  color: var(--foreground, #1a1a1a);
}

/* Topbar */
.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
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
  height: calc(100vh - 56px);
  background: var(--background, #ffffff);
  border-right: 1px solid var(--border, #e5e7eb);
  z-index: 20;
  transition: transform 0.25s ease;
  transform: translateX(0);
}

.admin-sidebar.hidden {
  transform: translateX(-100%);
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
  overflow: auto;
  padding: 1.5rem;
  margin-left: 260px;
  transition: margin-left 0.25s ease;
}

.is-mobile .admin-main {
  margin-left: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-topbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 30;
  }
  .topbar-spacer {
    display: block;
  }
  .admin-sidebar {
    z-index: 40;
  }
  .admin-main {
    padding-top: 72px;
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
