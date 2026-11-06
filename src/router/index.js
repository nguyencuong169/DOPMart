import { createRouter, createWebHistory } from "vue-router";
const routes = [
  { path: "/", name: "home", component: () => import("../views/HomeView.vue") },
  {
    path: "/products",
    name: "products",
    component: () => import("../views/ProductsView.vue"),
  },
  {
    path: "/category/:slug",
    name: "category",
    component: () => import("../views/CategoryView.vue"),
  },
  {
    path: "/product/:slug",
    name: "product",
    component: () => import("../views/ProductDetailView.vue"),
  },
  {
    path: "/search",
    name: "search",
    component: () => import("../views/SearchView.vue"),
  },
  {
    path: "/cart",
    name: "cart",
    component: () => import("../views/CartView.vue"),
  },
  {
    path: "/checkout",
    name: "checkout",
    component: () => import("../views/CheckoutView.vue"),
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];
export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});
