import { createRouter, createWebHistory } from "vue-router";
import { getCurrentUser, isAdmin } from "../lib/supabase";

const CatalogView = () => import("../views/ProductsView.vue");

// Admin views (lazy-loaded)
const AdminLayout = () => import("../views/admin/AdminLayout.vue");
const AdminDashboard = () => import("../views/admin/MartOperationsView.vue");
const AdminProducts = () => import("../views/admin/ProductsAdminView.vue");
const AdminOrders = () => import("../views/admin/OrdersAdminView.vue");
const AdminUsers = () => import("../views/admin/UsersAdminView.vue");
const AdminPromotions = () => import("../views/admin/PromotionsAdminView.vue");
const MartOperations = () => import("../views/admin/MartOperationsView.vue");

/**
 * Guard: chỉ cho vào nếu user đã đăng nhập
 */
async function authGuard(to) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      name: "login",
      query: { redirect: to.fullPath },
      replace: true,
    };
  }
}

/**
 * Guard: chỉ cho vào nếu user có role admin, không thì trả về trang login
 */
async function adminGuard(to) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      name: "login",
      query: { redirect: to.fullPath },
      replace: true,
    };
  }

  const ok = await isAdmin();
  if (!ok) {
    return { name: "home", replace: true };
  }
}

const routes = [
  { path: "/", name: "home", component: () => import("../views/HomeView.vue") },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
  },
  {
    path: "/register",
    name: "register",
    component: () => import("../views/RegisterView.vue"),
  },
  {
    path: "/profile",
    name: "profile",
    component: () => import("../views/ProfileView.vue"),
    beforeEnter: authGuard,
  },
  {
    path: "/orders",
    name: "orders",
    component: () => import("../views/OrdersView.vue"),
    beforeEnter: authGuard,
  },
  {
    path: "/orders/:id",
    name: "order-detail",
    component: () => import("../views/OrderDetailView.vue"),
    beforeEnter: authGuard,
  },
  {
    path: "/products",
    name: "products",
    component: CatalogView,
    beforeEnter: (to) => {
      if (to.query.filter === "new") return { name: "new", replace: true };
      if (to.query.sort === "best") return { name: "best", replace: true };
    },
  },
  { path: "/new", name: "new", component: CatalogView, props: { mode: "new" } },
  { path: "/best-sellers", name: "best", component: CatalogView, props: { mode: "best" } },
  { path: "/shop", name: "shop", component: () => import("../views/CatalogView.vue") },
  { path: "/deals", name: "deals", component: () => import("../views/DealsView.vue") },
  { path: "/about", name: "about", component: () => import("../views/AboutView.vue") },
  { path: "/how-it-works", name: "how-it-works", component: () => import("../views/HowItWorksView.vue") },
  { path: "/category/:slug", name: "category", component: () => import("../views/CategoryView.vue") },
  { path: "/product/:slug", name: "product", component: () => import("../views/ProductDetailView.vue") },
  { path: "/search", name: "search", component: () => import("../views/SearchView.vue") },
  { path: "/cart", name: "cart", component: () => import("../views/CartView.vue") },
  {
    path: "/checkout",
    name: "checkout",
    component: () => import("../views/CheckoutView.vue"),
    beforeEnter: authGuard,
  },
  // ============================================
  // Admin routes (chỉ role admin)
  // ============================================
  {
    path: "/admin",
    component: AdminLayout,
    beforeEnter: adminGuard,
    children: [
      { path: "", redirect: { name: "admin-dashboard" } },
      { path: "dashboard", name: "admin-dashboard", component: AdminDashboard, beforeEnter: adminGuard },
      { path: "products", name: "admin-products", component: AdminProducts, beforeEnter: adminGuard },
      { path: "orders", name: "admin-orders", component: AdminOrders, beforeEnter: adminGuard },
      { path: "users", name: "admin-users", component: AdminUsers, beforeEnter: adminGuard },
      { path: "promotions", name: "admin-promotions", component: AdminPromotions, beforeEnter: adminGuard },
      { path: "operations", name: "admin-operations", component: MartOperations, beforeEnter: adminGuard },
    ],
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) {
      return new Promise((resolve) => {
        let tries = 0;
        const waitForTarget = () => {
          const target = document.querySelector(to.hash);
          if (target || tries++ > 20) {
            resolve({ el: target ? to.hash : { top: 0, behavior: "smooth" } });
            return;
          }
          requestAnimationFrame(waitForTarget);
        };
        requestAnimationFrame(waitForTarget);
      });
    }
    return { top: 0 };
  },
});