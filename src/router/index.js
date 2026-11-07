import { createRouter, createWebHistory } from "vue-router";

const Catalogue = () => import("../views/ProductsView.vue");

const routes = [
  { path: "/", name: "home", component: () => import("../views/HomeView.vue") },
  {
    path: "/products",
    name: "products",
    component: Catalogue,
    beforeEnter: (to) => {
      if (to.query.filter === "new") return { name: "new", replace: true };
      if (to.query.sort === "best") return { name: "best", replace: true };
    },
  },
  { path: "/new", name: "new", component: Catalogue, props: { mode: "new" } },
  {
    path: "/best-sellers",
    name: "best",
    component: Catalogue,
    props: { mode: "best" },
  },
  { path: "/deals", name: "deals", component: () => import("../views/DealsView.vue") },
  { path: "/about", name: "about", component: () => import("../views/AboutView.vue") },
  {
    path: "/how-it-works",
    name: "how-it-works",
    component: () => import("../views/HowItWorksView.vue"),
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
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) {
      return new Promise((resolve) => {
        let tries = 0;
        const waitForTarget = () => {
          const target = document.querySelector(to.hash);
          if (target || tries++ > 20) {
            resolve(target ? { el: to.hash, top: 96, behavior: "smooth" } : { top: 0 });
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

