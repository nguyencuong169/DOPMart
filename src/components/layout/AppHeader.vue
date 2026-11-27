<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowUpRight,
  ChevronDown,
  LogOut,
  PackageCheck,
  QrCode,
  ShoppingBag,
  Store,
  User,
} from 'lucide-vue-next'
import SearchBox from '../common/SearchBox.vue'
import { useCartStore } from '../../stores/cartStore'
import { useProductStore } from '../../stores/productStore'
import { useUserStore } from '../../stores/userStore'

const route = useRoute()
const cart = useCartStore()
const catalog = useProductStore()
const userStore = useUserStore()

const user = computed(() => userStore.user)
const isLoggedIn = computed(() => !!user.value)
const accountOpen = ref(false)

const onHero = computed(() => true)

const initial = computed(() => {
  const email = user.value?.email ?? ''
  return email.charAt(0).toUpperCase()
})

async function handleLogout() {
  accountOpen.value = false
  await userStore.logout()
}

const menuOpen = ref(false)
const scrolled = ref(false)
const toggleEl = ref(null)
const panelEl = ref(null)
let compactMode = null

const primaryLinks = [
  {
    label: 'Sản phẩm',
    to: '/products',
    match: path =>
      path === '/products' || path.startsWith('/category/') || path.startsWith('/product/'),
  },
  { label: 'Shop', to: '/shop', match: path => path === '/shop' },
  { label: 'Mới', to: '/new', match: path => path === '/new' },
  { label: 'Bán chạy', to: '/best-sellers', match: path => path === '/best-sellers' },
  { label: 'Khuyến mãi', to: '/deals', match: path => path === '/deals' },
]
const moreLinks = [
  {
    label: 'Đơn của tôi',
    note: 'Theo dõi trạng thái đơn hàng',
    to: '/orders',
    icon: PackageCheck,
    match: path => path === '/orders',
  },
  {
    label: 'Về DOP Mart',
    note: 'Câu chuyện & giá trị',
    to: '/about',
    icon: Store,
    match: path => path === '/about',
  },
  {
    label: 'Cách đặt hàng',
    note: '4 nhịp: chọn → quét → nhận',
    to: '/how-it-works',
    icon: QrCode,
    match: path => path === '/how-it-works',
  },
]
const panelLinks = [...primaryLinks, ...moreLinks]

const moreOpen = ref(false)
const moreEl = ref(null)
/* the 8 categories live behind "Sản phẩm" — one source: productStore.categories */
const catOpen = ref(false)
const catEl = ref(null)
function toggleCats() {
  catOpen.value = !catOpen.value
  moreOpen.value = false
}
function openCats() {
  catOpen.value = true
}
function closeCats() {
  catOpen.value = false
}
function onCatsFocusout(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) closeCats()
}
/* cart badge: cap the number and bounce for <= 200ms on change */
const bump = ref(false)
let bumpTimer = null
watch(
  () => cart.count,
  () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    bump.value = true
    clearTimeout(bumpTimer)
    bumpTimer = setTimeout(() => (bump.value = false), 200)
  }
)
const navEl = ref(null)
const indicator = ref({ x: 0, width: 0, ready: false, animate: false })

const isCurrent = link => link.match(route.path)
const moreActive = computed(() => moreLinks.some(link => link.match(route.path)))
function toggleMenu() {
  menuOpen.value = !menuOpen.value
}
function closeMenu(restoreFocus = false) {
  if (!menuOpen.value) return
  menuOpen.value = false
  if (restoreFocus) nextTick(() => toggleEl.value?.focus())
}
function openCart() {
  closeMenu()
  moreOpen.value = false
  cart.open = true
}
function toggleMore() {
  moreOpen.value = !moreOpen.value
}
function onDocPointerDown(event) {
  if (moreOpen.value && !moreEl.value?.contains(event.target)) moreOpen.value = false
  if (catOpen.value && !catEl.value?.contains(event.target)) catOpen.value = false
}
function syncIndicator() {
  const nav = navEl.value
  if (!nav) return
  const animate = indicator.value.ready || indicator.value.animate
  const item = nav.querySelector('.is-current')
  if (!item || !item.offsetWidth) {
    indicator.value = { x: 0, width: 0, ready: false, animate }
    return
  }
  const navBox = nav.getBoundingClientRect()
  const itemBox = item.getBoundingClientRect()
  indicator.value = {
    x: itemBox.left - navBox.left,
    width: itemBox.width,
    ready: true,
    animate,
  }
}
function onResize() {
  const compact = window.innerWidth <= 1120
  if (compact !== compactMode) {
    compactMode = compact
    closeMenu()
    moreOpen.value = false
  }
  syncIndicator()
}
function onScroll() {
  scrolled.value = window.scrollY > 8
}
function focusables() {
  if (!panelEl.value) return []
  return Array.from(
    panelEl.value.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(node => node.offsetParent !== null)
}
function onKeydown(event) {
  if (event.key === 'Escape') {
    if (menuOpen.value) {
      event.preventDefault()
      closeMenu(true)
      return
    }
    if (moreOpen.value) {
      moreOpen.value = false
      return
    }
    if (catOpen.value) {
      catOpen.value = false
      return
    }
  }
  if (!menuOpen.value) return
  if (event.key !== 'Tab') return
  const list = focusables()
  if (!list.length) return
  const first = list[0]
  const last = list[list.length - 1]
  const inside = panelEl.value?.contains(document.activeElement)
  if (event.shiftKey && (document.activeElement === first || !inside)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(menuOpen, async open => {
  document.body.classList.toggle('dop-menu-locked', open && window.innerWidth <= 760)
  if (!open) return
  moreOpen.value = false
  await nextTick()
  focusables()[0]?.focus({ preventScroll: true })
})
watch(
  () => route.fullPath,
  () => {
    closeMenu()
    moreOpen.value = false
    catOpen.value = false
    nextTick(syncIndicator)
  }
)
watch(
  () => cart.open,
  open => {
    if (open) closeMenu()
  }
)

let navObserver = null
onMounted(() => {
  compactMode = window.innerWidth <= 1120
  window.addEventListener('resize', onResize)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('pointerdown', onDocPointerDown)
  scrolled.value = false
  nextTick(syncIndicator)
  if (document.fonts?.ready) document.fonts.ready.then(syncIndicator)
  if (window.ResizeObserver && navEl.value) {
    navObserver = new ResizeObserver(syncIndicator)
    navObserver.observe(navEl.value)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('pointerdown', onDocPointerDown)
  navObserver?.disconnect()
  clearTimeout(bumpTimer)
  document.body.classList.remove('dop-menu-locked')
})
</script>
<template>
  <header class="dop-header" :class="{ scrolled, 'on-hero': onHero }">
    <RouterLink to="/" class="dop-nav-logo" @click="closeMenu()">
      <span>DOP</span><b>mart</b><small>Small Money – Big Happy</small>
    </RouterLink>
    <nav ref="navEl" class="dop-nav" aria-label="Điều hướng chính">
      <span
        class="dop-nav__indicator"
        :class="{ 'is-ready': indicator.ready, 'is-animated': indicator.animate }"
        :style="{ width: `${indicator.width}px`, transform: `translateX(${indicator.x}px)` }"
        aria-hidden="true"
      />
      <div
        ref="catEl"
        class="dop-nav-cats"
        :class="{ open: catOpen }"
        @mouseenter="openCats"
        @mouseleave="closeCats"
        @focusin="openCats"
        @focusout="onCatsFocusout"
      >
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
              :class="{ 'is-current': route.path === `/category/${c.slug}` }"
              :aria-current="route.path === `/category/${c.slug}` ? 'page' : undefined"
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
          >{{ cart.count > 99 ? '99+' : cart.count }}</span
        >
      </button>

      <div v-if="isLoggedIn" class="nav-account" @click="accountOpen = !accountOpen">
        <div class="account-avatar">{{ initial }}</div>
        <button
          type="button"
          class="account-toggle"
          aria-label="Tài khoản, mở menu"
          aria-expanded="accountOpen"
        >
          <User :size="14" />
        </button>
        <Transition name="dop-account">
          <div v-if="accountOpen" class="account-panel">
            <RouterLink to="/profile" class="account-item" @click="accountOpen = false">
              <User :size="16" aria-hidden="true" />
              <span>Hồ sơ</span>
            </RouterLink>
            <RouterLink to="/orders" class="account-item" @click="accountOpen = false">
              <PackageCheck :size="16" aria-hidden="true" />
              <span>Đơn của tôi</span>
            </RouterLink>
            <button type="button" class="account-item account-item--danger" @click="handleLogout">
              <LogOut :size="16" aria-hidden="true" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </Transition>
      </div>

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
    <Transition name="dop-scrim">
      <div v-if="menuOpen" class="dop-menu-scrim" @click="closeMenu(true)" />
    </Transition>
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
            <span class="dop-menu__index">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="dop-menu__label">{{ link.label }}</span>
            <ArrowUpRight class="dop-menu__arrow" :size="16" />
          </RouterLink>
        </nav>
        <div class="dop-menu__tools">
          <div class="nav-search"><SearchBox /></div>
        </div>

        <div v-if="isLoggedIn" class="dop-menu__account">
          <div class="dop-menu__account__head">
            <div class="account-avatar" style="width: 40px; height: 40px; font-size: 18px">
              {{ initial }}
            </div>
            <div>
              <div class="dop-menu__account__email">{{ user.value?.email }}</div>
              <div class="dop-menu__account__role">
                {{ userStore.isAdminUser ? 'Quản trị viên' : 'Khách hàng' }}
              </div>
            </div>
          </div>
          <RouterLink to="/profile" class="dop-menu__account__item" @click="closeMenu()">
            <User :size="16" aria-hidden="true" />
            <span>Hồ sơ</span>
          </RouterLink>
          <RouterLink to="/orders" class="dop-menu__account__item" @click="closeMenu()">
            <PackageCheck :size="16" aria-hidden="true" />
            <span>Đơn của tôi</span>
          </RouterLink>
          <button
            type="button"
            class="dop-menu__account__item dop-menu__account__item--danger"
            @click="handleLogout"
          >
            <LogOut :size="16" aria-hidden="true" />
            <span>Đăng xuất</span>
          </button>
        </div>

        <button type="button" class="dop-menu__cart" @click="openCart">
          <ShoppingBag :size="18" /><span>Giỏ hàng</span><b>{{ cart.count }} món</b>
        </button>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.dop-header {
  pointer-events: auto;
  background: transparent;
  transition: background 0.3s ease;
}
.dop-header.scrolled {
  background: var(--paper);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
.dop-header :is(.dop-nav, .dop-nav-actions, .dop-menu) {
  pointer-events: auto;
}
@media (min-width: 1121px) {
  .dop-header .dop-nav {
    grid-column: 1 / span 2;
    justify-self: start;
  }
}
.dop-nav-actions :is(.cart-button, .nav-toggle),
.dop-nav-actions :deep(.search) {
  box-sizing: border-box;
  height: 42px;
  border: 1.5px solid #242018;
  border-radius: 14px;
  color: #242018;
  background: #ffd338;
  box-shadow: 2px 2px 0 #242018;
}
.dop-nav-actions :is(.cart-button, .nav-toggle) {
  width: 42px;
}
.dop-header .dop-nav-actions :deep(svg),
.dop-header .dop-menu :deep(svg) {
  color: #242018;
  stroke: currentColor;
}
.dop-header .nav-toggle__bars i {
  background: #242018;
}
.dop-header .dop-nav-actions :deep(.search-kbd) {
  background: transparent;
  color: #242018;
}

/* ---------- account (đăng nhập) ---------- */
.nav-account {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.account-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--ink);
  color: var(--yellow);
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-weight: var(--ds-weight-heavy);
  font-size: 15px;
  line-height: 1;
  box-shadow: 3px 3px 0 var(--yellow);
  flex-shrink: 0;
}
.account-toggle {
  width: 34px;
  height: 34px;
  border: 2px solid var(--ink);
  border-radius: 50%;
  background: var(--paper);
  color: var(--ink);
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--ink);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}
.account-toggle:hover {
  transform: translate(-1px, -1px);
  box-shadow: 5px 5px 0 var(--ink);
}
.account-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: min(210px, 100vw - 24px);
  border: 2px solid var(--ink);
  border-radius: 20px;
  background: var(--paper);
  color: var(--ink);
  box-shadow: 6px 6px 0 var(--ink);
  display: flex;
  flex-direction: column;
  z-index: 60;
  padding: 8px;
  animation: dopAccountPop 0.18s var(--ds-ease) both;
}
@keyframes dopAccountPop {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.account-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border-radius: 14px;
  color: var(--ink);
  text-decoration: none;
  font-family: var(--font-ui);
  font-weight: var(--ds-weight-medium);
  font-size: var(--fs-md);
  cursor: pointer;
  transition:
    background 0.16s ease,
    transform 0.16s ease;
}
.account-item:hover {
  background: var(--cream);
  transform: translateX(3px);
}
.account-item svg {
  flex-shrink: 0;
  color: var(--ink);
}
.account-item--danger {
  color: var(--red-ink);
  border: 1px solid transparent;
}
.account-item--danger:hover {
  background: #fdecec;
  color: var(--red-ink);
}

/* ---------- mobile panel account ---------- */
.dop-menu__account {
  border-top: 1px solid #d7c8b4;
  border-bottom: 1px solid #d7c8b4;
  padding: 14px 16px;
  background: #f1e7d7;
}
.dop-menu__account__head {
  display: flex;
  gap: 14px;
  margin-bottom: 12px;
}
.dop-menu__account__email {
  font-family: var(--font-display);
  font-weight: var(--ds-weight-heavy);
  font-size: 15px;
  line-height: 1.1;
  color: var(--ink);
}
.dop-menu__account__role {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: var(--ds-weight-semibold);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}
.dop-menu__account__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border-radius: 14px;
  color: var(--ink);
  text-decoration: none;
  font-family: var(--font-ui);
  font-weight: var(--ds-weight-medium);
  font-size: var(--fs-md);
  cursor: pointer;
  transition: background 0.16s ease;
  border: 0;
  background: transparent;
  text-align: left;
}
.dop-menu__account__item:hover {
  background: #ffe9b3;
}
.dop-menu__account__item svg {
  flex-shrink: 0;
  color: var(--ink);
}
.dop-menu__account__item--danger {
  color: var(--red-ink);
}
.dop-menu__account__item--danger:hover {
  background: #fdecec;
  color: var(--red-ink);
}

@media (prefers-reduced-motion: reduce) {
  .account-panel {
    animation: none;
  }
  .account-toggle,
  .account-item {
    transition: none;
  }
}
</style>
