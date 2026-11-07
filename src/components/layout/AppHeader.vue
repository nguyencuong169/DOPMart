<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ArrowUpRight, ChevronDown, MapPin, QrCode, ShoppingBag, Store } from "lucide-vue-next";
import SearchBox from "../common/SearchBox.vue";
import FloorSelector from "../common/FloorSelector.vue";
import { useCartStore } from "../../stores/cartStore";
import { useFloorStore } from "../../stores/floorStore";
import { useProductStore } from "../../stores/productStore";

const route = useRoute();
const cart = useCartStore();
const floor = useFloorStore();
const catalog = useProductStore();

const scrolled = ref(false);
const atTop = ref(true);
const hidden = ref(false);
const menuOpen = ref(false);
const toggleEl = ref(null);
const panelEl = ref(null);
let compactMode = null;
let lastY = 0;

const onHero = computed(() => route.path === "/");

const primaryLinks = [
  {
    label: "Sản phẩm",
    to: "/products",
    match: (path) =>
      path === "/products" || path.startsWith("/category/") || path.startsWith("/product/"),
  },
  { label: "Mới", to: "/new", match: (path) => path === "/new" },
  { label: "Bán chạy", to: "/best-sellers", match: (path) => path === "/best-sellers" },
  { label: "Khuyến mãi", to: "/deals", match: (path) => path === "/deals" },
];
const moreLinks = [
  {
    label: "Về DOP Mart",
    note: "Câu chuyện & giá trị",
    to: "/about",
    icon: Store,
    match: (path) => path === "/about",
  },
  {
    label: "Cách đặt hàng",
    note: "4 nhịp: chọn → quét → nhận",
    to: "/how-it-works",
    icon: QrCode,
    match: (path) => path === "/how-it-works",
  },
];
const panelLinks = [...primaryLinks, ...moreLinks];

const moreOpen = ref(false);
const moreEl = ref(null);
/* the 8 categories live behind "Sản phẩm" — one source: productStore.categories */
const catOpen = ref(false);
const catEl = ref(null);
function toggleCats() {
  catOpen.value = !catOpen.value;
  moreOpen.value = false;
}
/* cart badge: cap the number and bounce for <= 200ms on change */
const bump = ref(false);
let bumpTimer = null;
watch(
  () => cart.count,
  () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    bump.value = true;
    clearTimeout(bumpTimer);
    bumpTimer = setTimeout(() => (bump.value = false), 200);
  }
);
const navEl = ref(null);
const indicator = ref({ x: 0, width: 0, ready: false, animate: false });

const isCurrent = (link) => link.match(route.path);
const moreActive = computed(() => moreLinks.some((link) => link.match(route.path)));
function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}
function closeMenu(restoreFocus = false) {
  if (!menuOpen.value) return;
  menuOpen.value = false;
  if (restoreFocus) nextTick(() => toggleEl.value?.focus());
}
function openCart() {
  closeMenu();
  moreOpen.value = false;
  cart.open = true;
}
function toggleMore() {
  moreOpen.value = !moreOpen.value;
}
function onDocPointerDown(event) {
  if (moreOpen.value && !moreEl.value?.contains(event.target)) moreOpen.value = false;
  if (catOpen.value && !catEl.value?.contains(event.target)) catOpen.value = false;
}
function syncIndicator() {
  const nav = navEl.value;
  if (!nav) return;
  const animate = indicator.value.ready || indicator.value.animate;
  const item = nav.querySelector(".is-current");
  if (!item || !item.offsetWidth) {
    indicator.value = { x: 0, width: 0, ready: false, animate };
    return;
  }
  const navBox = nav.getBoundingClientRect();
  const itemBox = item.getBoundingClientRect();
  indicator.value = {
    x: itemBox.left - navBox.left,
    width: itemBox.width,
    ready: true,
    animate,
  };
}
function onScroll() {
  const y = window.scrollY;
  const delta = y - lastY;
  scrolled.value = y > 54;
  atTop.value = y < 24;
  if (menuOpen.value || moreOpen.value) {
    hidden.value = false;
    lastY = y;
    return;
  }
  if (y < 140) hidden.value = false;
  else if (Math.abs(delta) > 6) hidden.value = delta > 0;
  lastY = y;
}
function reveal() {
  hidden.value = false;
}
function onResize() {
  onScroll();
  const compact = window.innerWidth <= 1023;
  if (compact !== compactMode) {
    compactMode = compact;
    closeMenu();
    moreOpen.value = false;
  }
  syncIndicator();
}
function focusables() {
  if (!panelEl.value) return [];
  return Array.from(
    panelEl.value.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((node) => node.offsetParent !== null);
}
function onKeydown(event) {
  if (event.key === "Escape") {
    if (menuOpen.value) {
      event.preventDefault();
      closeMenu(true);
      return;
    }
    if (moreOpen.value) {
      moreOpen.value = false;
      return;
    }
    if (catOpen.value) {
      catOpen.value = false;
      return;
    }
  }
  if (!menuOpen.value) return;
  if (event.key !== "Tab") return;
  const list = focusables();
  if (!list.length) return;
  const first = list[0];
  const last = list[list.length - 1];
  const inside = panelEl.value?.contains(document.activeElement);
  if (event.shiftKey && (document.activeElement === first || !inside)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(menuOpen, async (open) => {
  document.body.classList.toggle("dop-menu-locked", open && window.innerWidth <= 760);
  if (!open) return;
  moreOpen.value = false;
  await nextTick();
  focusables()[0]?.focus({ preventScroll: true });
});
watch(
  () => route.fullPath,
  () => {
    closeMenu();
    moreOpen.value = false;
    catOpen.value = false;
    nextTick(syncIndicator);
  }
);
watch(
  () => cart.open,
  (open) => {
    if (open) closeMenu();
  }
);

let navObserver = null;
onMounted(() => {
  lastY = window.scrollY;
  onScroll();
  compactMode = window.innerWidth <= 1023;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("keydown", onKeydown);
  document.addEventListener("pointerdown", onDocPointerDown);
  nextTick(syncIndicator);
  if (document.fonts?.ready) document.fonts.ready.then(syncIndicator);
  if (window.ResizeObserver && navEl.value) {
    navObserver = new ResizeObserver(syncIndicator);
    navObserver.observe(navEl.value);
  }
});
onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onResize);
  window.removeEventListener("keydown", onKeydown);
  document.removeEventListener("pointerdown", onDocPointerDown);
  navObserver?.disconnect();
  clearTimeout(bumpTimer);
  document.body.classList.remove("dop-menu-locked");
});
</script>
<template>
  <header
    class="dop-header"
    :class="{
      scrolled,
      'at-top': atTop && !menuOpen,
      'on-hero': onHero,
      'is-hidden': hidden,
      'is-menu-open': menuOpen,
    }"
    @focusin="reveal"
  >
    <RouterLink to="/" class="dop-nav-logo" @click="closeMenu()">
      <span>DOP</span><b>mart</b><small>Mini mart · Big happy</small>
    </RouterLink>
    <nav ref="navEl" class="dop-nav" aria-label="Điều hướng chính">
      <span
        class="dop-nav__indicator"
        :class="{ 'is-ready': indicator.ready, 'is-animated': indicator.animate }"
        :style="{ width: `${indicator.width}px`, transform: `translateX(${indicator.x}px)` }"
        aria-hidden="true"
      />
      <div ref="catEl" class="dop-nav-cats" :class="{ open: catOpen }">
        <RouterLink
          to="/products"
          class="dop-nav__link"
          :class="{ 'is-current': isCurrent(primaryLinks[0]) }"
          :aria-current="isCurrent(primaryLinks[0]) ? 'page' : undefined"
          >Sản phẩm</RouterLink
        ><button
          type="button"
          class="dop-nav-cats__toggle"
          :aria-expanded="catOpen"
          aria-haspopup="true"
          aria-controls="dop-cats-panel"
          :aria-label="catOpen ? 'Đóng 8 danh mục' : 'Mở 8 danh mục'"
          @click="toggleCats"
        >
          <ChevronDown :size="13" /></button
        ><Transition name="dop-more">
          <div v-if="catOpen" id="dop-cats-panel" class="dop-nav-cats__panel">
            <RouterLink
              v-for="c in catalog.categories"
              :key="c.slug"
              :to="`/category/${c.slug}`"
              class="dop-nav-cats__item"
              @click="catOpen = false"
            >
              <span aria-hidden="true">{{ c.icon }}</span>
              {{ c.name }}
            </RouterLink>
          </div>
        </Transition>
      </div>
      <RouterLink
        v-for="link in primaryLinks.slice(1)"
        :key="link.to"
        :to="link.to"
        class="dop-nav__link"
        :class="{ 'is-current': isCurrent(link) }"
        :aria-current="isCurrent(link) ? 'page' : undefined"
        >{{ link.label }}</RouterLink
      >
      <RouterLink
        to="/how-it-works"
        class="dop-nav__link"
        :class="{ 'is-current': route.path === '/how-it-works' }"
        :aria-current="route.path === '/how-it-works' ? 'page' : undefined"
        >Cách đặt hàng</RouterLink
      >
    </nav>
    <div class="dop-nav-actions">
      <div class="nav-search"><SearchBox /></div>
      <FloorSelector />
      <button
        type="button"
        class="cart-button"
        :aria-label="`Mở giỏ hàng, ${cart.count} món`"
        @click="openCart"
      >
        <ShoppingBag />
        <span
          v-if="cart.count"
          class="cart-count"
          :class="{ 'is-bump': bump }"
          aria-hidden="true"
          >{{ cart.count > 99 ? "99+" : cart.count }}</span
        >
      </button>
      <button
        ref="toggleEl"
        type="button"
        class="nav-toggle"
        :class="{ 'is-open': menuOpen }"
        :aria-expanded="menuOpen"
        aria-controls="dop-menu-panel"
        :aria-label="menuOpen ? 'Đóng menu' : 'Mở menu'"
        @click="toggleMenu"
      >
        <span class="nav-toggle__bars" aria-hidden="true"><i></i><i></i><i></i></span>
      </button>
    </div>
    <Teleport to="body">
      <Transition name="dop-scrim">
        <div v-if="menuOpen" class="dop-menu-scrim" @click="closeMenu(true)" />
      </Transition>
    </Teleport>
    <Transition name="dop-panel">
      <div
        v-if="menuOpen"
        id="dop-menu-panel"
        ref="panelEl"
        class="dop-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu chính"
      >
        <div class="dop-menu__head">
          <span class="dop-menu__kicker">DOP MART · MENU</span>
          <span class="dop-menu__pickup"><MapPin :size="13" /> Tầng {{ floor.floor }}</span>
        </div>
        <nav class="dop-menu__links" aria-label="Điều hướng chính">
          <RouterLink
            v-for="(link, index) in panelLinks"
            :key="link.to"
            :to="link.to"
            :style="{ '--i': index }"
            :class="{ 'is-current': isCurrent(link) }"
            :aria-current="isCurrent(link) ? 'page' : undefined"
            @click="closeMenu()"
          >
            <span class="dop-menu__index">{{ String(index + 1).padStart(2, "0") }}</span>
            <span class="dop-menu__label">{{ link.label }}</span>
            <ArrowUpRight class="dop-menu__arrow" :size="16" />
          </RouterLink>
        </nav>
        <div class="dop-menu__tools">
          <div class="nav-search"><SearchBox /></div>
          <FloorSelector />
        </div>
        <button type="button" class="dop-menu__cart" @click="openCart">
          <ShoppingBag :size="18" /><span>Giỏ hàng</span><b>{{ cart.count }} món</b>
        </button>
      </div>
    </Transition>
  </header>
</template>

