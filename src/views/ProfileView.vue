<template>
  <main class="profile-page">
    <header class="profile-hero">
      <div class="profile-hero__copy">
        <span class="kicker">HỒ SƠ · TÀI KHOẢN</span>
        <h1>Hồ sơ của bạn.</h1>
        <p class="profile-lead">
          Quản lý thông tin cá nhân, lớp và vai trò. Tùy chọn hiển thị của bạn sẽ áp dụng trên mọi
          đơn hàng.
        </p>
      </div>
      <RouterLink to="/orders" class="profile-cta">
        Xem đơn hàng <ArrowUpRight :size="14" aria-hidden="true" />
      </RouterLink>
    </header>

    <div v-if="loading" class="profile-loading" role="status">
      <div class="profile-spin"></div>
      <span class="profile-loading-text">Đang tải hồ sơ…</span>
    </div>

    <div v-else-if="!user" class="profile-empty">
      <div class="profile-empty__mark">🔒</div>
      <h2>Bạn chưa đăng nhập.</h2>
      <p class="profile-empty-lead">Vui lòng đăng nhập để xem và cập nhật hồ sơ của mình.</p>
      <RouterLink to="/login" class="profile-btn">Đăng nhập</RouterLink>
    </div>

    <div v-else class="profile-grid">
      <article class="profile-card profile-card--account">
        <div class="profile-card__head">
          <div class="profile-avatar">{{ initial }}</div>
          <div class="profile-card__meta">
            <h2>{{ displayName }}</h2>
            <p class="profile-email">{{ user.email }}</p>
          </div>
          <span class="profile-role" :class="{ 'profile-role--admin': isAdmin }">
            {{ isAdmin ? 'Quản trị viên' : 'Khách hàng' }}
          </span>
        </div>

        <div class="profile-facts">
          <div class="profile-fact">
            <span class="profile-fact__label">Lớp</span>
            <strong class="profile-fact__value">{{ profile?.floor ?? 1 }}</strong>
          </div>
          <div class="profile-fact">
            <span class="profile-fact__label">Email</span>
            <strong class="profile-fact__value">{{ user.email }}</strong>
          </div>
          <div class="profile-fact">
            <span class="profile-fact__label">Thành lập</span>
            <strong class="profile-fact__value">{{ memberSince }}</strong>
          </div>
        </div>

        <div v-if="isAdmin" class="profile-admin">
          <RouterLink to="/admin" class="profile-btn profile-btn--outline">
            Vào trang quản trị
          </RouterLink>
        </div>
      </article>

      <article class="profile-card profile-card--settings">
        <div class="profile-card__head">
          <span class="kicker profile-card__kicker">CẤU HÌNH</span>
          <h3 class="profile-card__title">Thông tin lớp</h3>
        </div>

        <form @submit.prevent="handleUpdateProfile" class="profile-form">
          <label class="profile-field">
            <span class="profile-field__label">Lớp (floor)</span>
            <input
              v-model.number="profileForm.floor"
              type="number"
              min="1"
              max="99"
              class="profile-field__input"
              :placeholder="`Lớp ${profile?.floor ?? 1}`"
            />
          </label>

          <div v-if="profileError" class="profile-alert profile-alert--error" role="alert">
            {{ profileError }}
          </div>

          <button type="submit" :disabled="profileLoading" class="profile-btn profile-btn--primary">
            <span v-if="profileLoading" class="profile-spin-small"></span>
            {{ profileLoading ? 'Đang lưu…' : 'Lưu thay đổi' }}
          </button>
        </form>

        <p class="profile-card__note">
          Lớp của bạn ảnh hưởng đến hiển thị sản phẩm và ưu tiên nhận hàng tại văn phòng.
        </p>
      </article>

      <article class="profile-card profile-card--actions">
        <div class="profile-card__head">
          <span class="kicker profile-card__kicker">TÀI KHOẢN</span>
          <h3 class="profile-card__title">Đăng xuất</h3>
        </div>

        <p class="profile-card__desc">
          Đăng xuất sẽ thoát phiên hiện tại trên thiết bị này. Bạn có thể đăng nhập lại bất cứ lúc
          nào.
        </p>

        <button @click="handleLogout" class="profile-btn profile-btn--danger">
          Đăng xuất ngay
        </button>
      </article>
    </div>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowUpRight } from 'lucide-vue-next'
import { useUserStore } from '../stores/userStore'

const store = useUserStore()
const router = useRouter()

const user = computed(() => store.user)
const profile = computed(() => store.profile)
const isAdmin = computed(() => store.isAdmin)
const loading = computed(() => store.loading)
const profileLoading = computed(() => store.loading)
const profileError = computed(() => store.error)

const profileForm = { floor: profile.value?.floor ?? 1 }

const initial = computed(() => {
  const email = user.value?.email ?? ''
  return email.charAt(0).toUpperCase()
})

const displayName = computed(() => {
  const floor = profile.value?.floor
  return floor ? `Lớp ${floor}` : 'Khách hàng'
})

const memberSince = computed(() => {
  const createdAt = profile.value?.created_at || user.value?.created_at
  if (!createdAt) return '—'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(createdAt))
})

async function handleUpdateProfile() {
  const res = await store.updateProfile({ floor: profileForm.floor })
  if (res.error) return
}

async function handleLogout() {
  await store.logout()
  await router.push('/login')
}

store.init()
</script>

<style scoped>
.profile-page {
  min-height: calc(100svh - 88px);
  padding: 112px 6vw 100px;
  background: var(--paper);
  color: var(--ink);
}
.profile-page a {
  color: inherit;
  text-decoration: none;
}

/* ---------- hero header ---------- */
.profile-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 46px;
}
.profile-hero__copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.kicker {
  font-family: var(--font-ui);
  font-size: var(--fs-kicker);
  font-weight: var(--ds-weight-semibold);
  letter-spacing: var(--tracking-kicker);
  text-transform: uppercase;
  color: var(--on-yellow);
  background: var(--yellow);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 11px;
  border-radius: var(--ds-radius-pill);
  border: 2px solid var(--ink);
  box-shadow: 3px 3px 0 var(--ink);
}
.profile-hero h1 {
  font-family: var(--font-display);
  font-size: clamp(42px, 6vw, 76px);
  line-height: 1;
  margin: 6px 0 0;
  letter-spacing: var(--tracking-display);
  text-wrap: balance;
}
.profile-lead {
  max-width: 52ch;
  margin: 10px 0 0;
  color: var(--muted-foreground);
  font-size: var(--fs-lead);
  line-height: var(--lh-body);
}
.profile-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px solid var(--ink);
  border-radius: var(--ds-radius-pill);
  background: var(--yellow);
  color: var(--ink);
  font-weight: var(--ds-weight-heavy);
  padding: 11px 18px;
  box-shadow: 4px 4px 0 var(--ink);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}
.profile-cta:hover {
  transform: translate(-1px, -1px);
  box-shadow: 6px 6px 0 var(--ink);
}

/* ---------- states ---------- */
.profile-loading {
  display: grid;
  place-items: center;
  gap: 12px;
  padding: 26px 0;
  color: var(--muted-foreground);
}
.profile-spin {
  width: 34px;
  height: 34px;
  border: 3px solid #e2d8c2;
  border-top-color: var(--ink);
  border-radius: 50%;
  animation: profileSpin 0.8s linear infinite;
}
.profile-loading-text {
  font-family: var(--font-ui);
  font-weight: var(--ds-weight-semibold);
}
@keyframes profileSpin {
  to {
    transform: rotate(360deg);
  }
}
.profile-empty {
  display: grid;
  place-items: center;
  gap: 16px;
  padding: 40px 20px;
  text-align: center;
  border: 2px dashed #b9aea3;
  border-radius: 24px;
  max-width: 560px;
  margin: 0 auto 0;
}
.profile-empty__mark {
  font-size: 56px;
}
.profile-empty h2 {
  font-family: var(--font-display);
  font-size: clamp(30px, 5vw, 48px);
  line-height: 1.15;
  margin: 0;
}
.profile-empty-lead {
  color: var(--muted-foreground);
  font-size: var(--fs-md);
  line-height: var(--lh-body);
  margin: 6px 0 18px;
}
.profile-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px solid var(--ink);
  border-radius: var(--ds-radius-pill);
  background: var(--yellow);
  color: var(--ink);
  font-family: var(--font-ui);
  font-weight: var(--ds-weight-heavy);
  padding: 12px 22px;
  font-size: var(--fs-md);
  box-shadow: 4px 4px 0 var(--ink);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}
.profile-btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 6px 6px 0 var(--ink);
}

/* ---------- grid ---------- */
.profile-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 22px;
  max-width: 980px;
  margin: 0 auto;
}
@media (min-width: 760px) {
  .profile-grid {
    grid-template-columns: 1.15fr 0.85fr;
  }
}

/* ---------- cards ---------- */
.profile-card {
  position: relative;
  background: var(--paper);
  border: 2px solid var(--ink);
  border-radius: 24px;
  padding: 30px;
  box-shadow: 6px 6px 0 var(--ink);
  overflow: hidden;
}
.profile-card::before {
  content: '';
  position: absolute;
  inset: 0 -40px -40px 0;
  background: var(--yellow);
  opacity: 0.16;
  z-index: 0;
  transform: rotate(-2deg);
  transform-origin: top left;
  pointer-events: none;
}
.profile-card > * {
  position: relative;
  z-index: 1;
}
.profile-card--account {
  grid-row: 1 / -1;
}
.profile-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.profile-card__kicker {
  margin: 0;
}
.profile-card__title {
  font-family: var(--font-display);
  font-size: clamp(24px, 3.5vw, 36px);
  line-height: 1.1;
  margin: 0;
  letter-spacing: var(--tracking-display);
}
.profile-card__desc {
  color: var(--muted-foreground);
  font-size: var(--fs-md);
  line-height: var(--lh-body);
  margin: 0 0 24px;
  max-width: 42ch;
}
.profile-card__note {
  margin: 24px 0 0;
  color: var(--muted-foreground);
  font-size: var(--fs-sm);
  line-height: var(--lh-body);
}

/* account card */
.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--ink);
  color: var(--yellow);
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: var(--ds-weight-heavy);
  box-shadow: 4px 4px 0 var(--yellow);
  flex-shrink: 0;
}
.profile-card__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.profile-card__meta h2 {
  font-family: var(--font-display);
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.05;
  margin: 0;
  letter-spacing: var(--tracking-display);
}
.profile-email {
  margin: 0;
  color: var(--muted-foreground);
  font-size: var(--fs-md);
}
.profile-role {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: var(--ds-weight-semibold);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 5px 12px;
  border-radius: var(--ds-radius-pill);
  border: 2px solid var(--ink);
  background: var(--cream);
  color: var(--ink);
  white-space: nowrap;
  box-shadow: 3px 3px 0 var(--ink);
}
.profile-role--admin {
  background: var(--red);
  color: var(--on-red);
  border-color: var(--red-ink);
  box-shadow: 3px 3px 0 var(--red-ink);
}
.profile-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}
.profile-fact {
  display: grid;
  gap: 4px;
}
.profile-fact__label {
  font-size: var(--fs-xs);
  font-weight: var(--ds-weight-semibold);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}
.profile-fact__value {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: var(--ds-weight-heavy);
  color: var(--ink);
  line-height: 1.1;
}
.profile-admin {
  margin-top: 22px;
}

/* settings / actions cards */
.profile-form {
  display: grid;
  gap: 16px;
  margin-bottom: 8px;
}
.profile-field {
  display: grid;
  gap: 8px;
}
.profile-field__label {
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
  font-weight: var(--ds-weight-semibold);
  color: var(--ink);
}
.profile-field__input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--ink);
  border-radius: 14px;
  background: var(--paper);
  color: var(--ink);
  font: inherit;
  font-weight: var(--ds-weight-medium);
  outline: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}
.profile-field__input:focus {
  border-color: var(--yellow);
  box-shadow: 0 0 0 4px rgb(255 211 56 / 35%);
}
.profile-alert--error {
  padding: 12px 16px;
  border-radius: 14px;
  border: 2px solid var(--red-ink);
  background: #fdecec;
  color: var(--red-ink);
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
  font-weight: var(--ds-weight-semibold);
}
.profile-btn--primary {
  width: 100%;
  margin-top: 4px;
}
.profile-btn--outline {
  width: 100%;
  background: var(--paper);
  box-shadow: 4px 4px 0 var(--ink);
}
.profile-btn--outline:hover {
  background: var(--cream);
}
.profile-btn--danger {
  width: 100%;
  background: var(--red);
  color: var(--on-red);
  border-color: var(--red-ink);
  box-shadow: 4px 4px 0 var(--red-ink);
}
.profile-btn--danger:hover {
  background: var(--red-ink);
  box-shadow: 6px 6px 0 var(--red-ink);
}
.profile-spin-small {
  width: 16px;
  height: 16px;
  border: 2.5px solid rgba(255 255 255 / 0.45);
  border-top-color: var(--ink);
  border-radius: 50%;
  animation: profileSpin 0.8s linear infinite;
}

/* reduced motion */
@media (prefers-reduced-motion: reduce) {
  .profile-cta,
  .profile-btn {
    transition: none;
  }
  .profile-spin,
  .profile-spin-small {
    animation: none;
  }
  .profile-card::before {
    transition: none;
  }
}
@media (max-width: 640px) {
  .profile-page {
    padding: 92px 16px 96px;
  }
  .profile-hero {
    flex-direction: column;
    align-items: flex-start;
  }
  .profile-facts {
    grid-template-columns: 1fr;
  }
  .profile-card {
    padding: 22px;
  }
}
</style>
