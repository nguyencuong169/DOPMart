<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { fetchOrders, fetchPromotions } from "@/lib/supabase";
import {
  CreditCard,
  Package,
  User,
  Clock,
  TrendingUp,
  ArrowRight,
  ShoppingBag,
  Tag,
  Users,
} from "lucide-vue-next";

const router = useRouter();

const orders = ref([]);
const promotions = ref([]);
const loading = ref(false);

const totalRevenue = ref(0);
const todayOrders = ref(0);
const activeProducts = ref(0);
const newCustomers = ref(0);
const recentOrders = ref([]);

const loadData = async () => {
  loading.value = true;
  try {
    const [ordersData, promotionsData] = await Promise.all([
      fetchOrders(),
      fetchPromotions(),
    ]);
    orders.value = ordersData;
    promotions.value = promotionsData;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    totalRevenue.value = ordersData.reduce((sum, o) => sum + (o.total || 0), 0);
    todayOrders.value = ordersData.filter((o) => o.created_at?.slice(0, 10) === todayStr).length;
    activeProducts.value = 8;
    newCustomers.value = 5;

    recentOrders.value = ordersData
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map((o) => ({
        ...o,
        userName: o.profiles?.floor ? `Khách #${o.user_id.slice(0, 6)}` : `Khách #${o.user_id.slice(0, 6)}`,
        createdAt: o.created_at,
      }));
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

const formatCurrency = (v) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v || 0);

const statCards = [
  {
    label: "Tổng doanh thu",
    value: () => formatCurrency(totalRevenue.value),
    trend: "+12% so với tháng trước",
    trendType: "positive",
    icon: CreditCard,
    iconBg: "var(--flame)",
  },
  {
    label: "Đơn hàng hôm nay",
    value: () => todayOrders.value,
    trend: "8 đơn chờ xử lý",
    trendType: "neutral",
    icon: Package,
    iconBg: "var(--green-ink)",
  },
  {
    label: "Sản phẩm đang bán",
    value: () => activeProducts.value,
    trend: "Cập nhật kho hàng",
    trendType: "neutral",
    icon: User,
    iconBg: "var(--purple)",
  },
  {
    label: "Khách hàng mới",
    value: () => newCustomers.value,
    trend: "+5 khách hàng tuần này",
    trendType: "positive",
    icon: Clock,
    iconBg: "var(--yellow)",
    iconColor: "#1a1a1a",
  },
];

const quickActions = [
  { label: "Thêm sản phẩm", icon: Package, to: "admin-products" },
  { label: "Xem đơn hàng", icon: ShoppingBag, to: "admin-orders" },
  { label: "Tạo khuyến mãi", icon: Tag, to: "admin-promotions" },
  { label: "Quản lý người dùng", icon: Users, to: "admin-users" },
];
</script>

<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1 class="dashboard-title">Tổng quan</h1>
      <p class="dashboard-subtitle">Chào mừng quay lại DOPMart Admin</p>
    </div>

    <!-- Stat cards -->
    <div class="stat-grid">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="stat-card"
      >
        <div class="stat-icon" :style="{ background: card.iconBg }">
          <component :is="card.icon" :size="20" :style="{ color: card.iconColor || '#fff' }" />
        </div>
        <div class="stat-content">
          <div class="stat-label">{{ card.label }}</div>
          <div class="stat-value">{{ card.value() }}</div>
          <div class="stat-trend" :class="card.trendType">
            <TrendingUp :size="14" v-if="card.trendType === 'positive'" />
            {{ card.trend }}
          </div>
        </div>
        <ArrowRight :size="16" class="stat-arrow" />
      </div>
    </div>

    <!-- Quick actions -->
    <div class="dashboard-section">
      <h2 class="section-title">Hành động nhanh</h2>
      <div class="action-grid">
        <button
          v-for="action in quickActions"
          :key="action.label"
          class="action-btn"
          @click="router.push({ name: action.to })"
        >
          <component :is="action.icon" :size="18" />
          <span>{{ action.label }}</span>
        </button>
      </div>
    </div>

    <!-- Recent orders -->
    <div class="dashboard-section">
      <div class="section-row">
        <h2 class="section-title">Đơn hàng gần đây</h2>
        <RouterLink :to="{ name: 'admin-orders' }" class="section-link">Xem tất cả <ArrowRight size="14" /></RouterLink>
      </div>
      <div class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Ngày</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in recentOrders" :key="order.id">
              <td class="mono">{{ order.id.slice(0, 8) }}...</td>
              <td>{{ order.userName || "Khách" }}</td>
              <td class="mono">{{ formatCurrency(order.total) }}</td>
              <td>
                <span class="badge badge--status">{{ order.status }}</span>
              </td>
              <td class="mono text-muted">{{ order.createdAt.slice(0, 10) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
:root {
  --ad-ink: var(--ink, #1a1a1a);
  --ad-muted: #756a61;
  --ad-border: #d9cec1;
  --ad-paper: var(--paper-bright, #fffdf7);
  --ad-muted-bg: #f3f4f6;
  --ad-radius: 14px;
  --ad-shadow: 4px 4px 0 var(--ink, #1a1a1a);
}

.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.dashboard-title {
  font-family: var(--font-display);
  font-size: var(--fs-h2);
  font-weight: 800;
  color: var(--ad-ink);
  margin: 0;
  letter-spacing: var(--tracking-display);
  line-height: var(--lh-h2);
}

.dashboard-subtitle {
  font-size: var(--fs-sm);
  color: var(--ad-muted);
  margin: 0;
}

/* Stat grid */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--sp-2);
}

.stat-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-2) var(--sp-3);
  background: var(--ad-paper);
  border: var(--bw-bold) solid var(--ad-ink);
  border-radius: var(--ad-radius);
  box-shadow: var(--ad-shadow);
  transition: transform 0.15s, box-shadow 0.15s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 6px 6px 0 var(--ad-ink);
}

.stat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: #ffffff;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: var(--fs-xs);
  font-weight: 800;
  color: var(--ad-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-kicker);
  margin: 0 0 var(--sp-1) 0;
}

.stat-value {
  font-size: var(--fs-lg);
  font-weight: 800;
  color: var(--ad-ink);
  margin: 0 0 var(--sp-1) 0;
  letter-spacing: var(--tracking-display);
}

.stat-trend {
  font-size: var(--fs-xs);
  font-weight: 600;
  margin: 0;
}

.stat-trend.positive {
  color: var(--green-ink, #156b3d);
}
.stat-trend.neutral {
  color: var(--ad-muted);
}

.stat-arrow {
  color: var(--ad-muted);
}

/* Section */
.dashboard-section {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}

.section-title {
  font-family: var(--font-display);
  font-size: var(--fs-lg);
  font-weight: 800;
  color: var(--ad-ink);
  margin: 0;
  letter-spacing: var(--tracking-display);
}

.section-link {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--ad-flame, #ff5a1f);
  text-decoration: none;
}

.section-link:hover {
  text-decoration: underline;
}

/* Action grid */
.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--sp-1);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  padding: var(--sp-2);
  background: var(--ad-paper);
  border: var(--bw-bold) solid var(--ad-ink);
  border-radius: var(--ad-radius);
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--ad-ink);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--ad-muted-bg);
  border-color: var(--ad-flame);
  color: var(--ad-flame);
  transform: translate(-1px, -1px);
  box-shadow: var(--ad-shadow);
}

/* Table */
.table-wrap {
  overflow-x: auto;
  border: var(--bw-bold) solid var(--ad-border);
  border-radius: var(--ad-radius);
  background: var(--ad-paper);
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-sm);
}

.admin-table th {
  text-align: left;
  padding: var(--sp-2) var(--sp-3);
  font-weight: 800;
  color: var(--ad-muted);
  border-bottom: var(--bw) solid var(--ad-border);
  background: var(--ad-muted-bg);
  text-transform: uppercase;
  letter-spacing: var(--tracking-kicker);
  font-size: var(--fs-xs);
}

.admin-table td {
  padding: var(--sp-2) var(--sp-3);
  border-bottom: var(--bw) solid var(--ad-border);
  color: var(--ad-ink);
}

.admin-table tr:last-child td {
  border-bottom: none;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: var(--fs-xs);
}

.text-muted {
  color: var(--ad-muted);
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: var(--fs-xs);
  font-weight: 800;
}

.badge--status {
  background: var(--ad-muted-bg);
  color: var(--ad-muted);
}
</style>
