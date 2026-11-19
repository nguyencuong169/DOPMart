<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { fetchOrders, fetchPromotions } from "@/lib/supabase";
import { CreditCard, Package, User, Clock, TrendingUp, ArrowRight, ShoppingBag, Tag, Users } from "lucide-vue-next";

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
    activeProducts.value = 8; // TODO: lấy từ products store khi có
    newCustomers.value = 5;   // TODO: tính từ profiles khi có

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
</script>

<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1 class="dashboard-title">Tổng quan</h1>
      <p class="dashboard-subtitle">Chào mừng quay lại DOPMart Admin</p>
    </div>

    <!-- Stat cards -->
    <div class="stat-grid">
      <div class="stat-card stat-card--revenue">
        <div class="stat-icon stat-icon--revenue">
          <CreditCard size={20} />
        </div>
        <div class="stat-content">
          <div class="stat-label">Tổng doanh thu</div>
          <div class="stat-value">{{ formatCurrency(totalRevenue) }}</div>
          <div class="stat-trend positive">
            <TrendingUp size={14} /> +12% so với tháng trước
          </div>
        </div>
        <ArrowRight size={16} class="stat-arrow" />
      </div>

      <div class="stat-card stat-card--orders">
        <div class="stat-icon stat-icon--orders">
          <Package size={20} />
        </div>
        <div class="stat-content">
          <div class="stat-label">Đơn hàng hôm nay</div>
          <div class="stat-value">{{ todayOrders }}</div>
          <div class="stat-trend neutral">8 đơn chờ xử lý</div>
        </div>
        <ArrowRight size={16} class="stat-arrow" />
      </div>

      <div class="stat-card stat-card--products">
        <div class="stat-icon stat-icon--products">
          <User size={20} />
        </div>
        <div class="stat-content">
          <div class="stat-label">Sản phẩm đang bán</div>
          <div class="stat-value">{{ activeProducts }}</div>
          <div class="stat-trend neutral">Cập nhật kho hàng</div>
        </div>
        <ArrowRight size={16} class="stat-arrow" />
      </div>

      <div class="stat-card stat-card--customers">
        <div class="stat-icon stat-icon--customers">
          <Clock size={20} />
        </div>
        <div class="stat-content">
          <div class="stat-label">Khách hàng mới</div>
          <div class="stat-value">{{ newCustomers }}</div>
          <div class="stat-trend positive">+5 khách hàng tuần này</div>
        </div>
        <ArrowRight size={16} class="stat-arrow" />
      </div>
    </div>

    <!-- Quick actions -->
    <div class="dashboard-section">
      <h2 class="section-title">Hành động nhanh</h2>
      <div class="action-grid">
        <button class="action-btn action-btn--add" @click="router.push({ name: 'admin-products' })">
          <Package size={18} />
          <span>Thêm sản phẩm</span>
        </button>
        <button class="action-btn action-btn--orders" @click="router.push({ name: 'admin-orders' })">
          <ShoppingBag size={18} />
          <span>Xem đơn hàng</span>
        </button>
        <button class="action-btn action-btn--promo" @click="router.push({ name: 'admin-promotions' })">
          <Tag size={18} />
          <span>Tạo khuyến mãi</span>
        </button>
        <button class="action-btn action-btn--users" @click="router.push({ name: 'admin-users' })">
          <Users size={18} />
          <span>Quản lý người dùng</span>
        </button>
      </div>
    </div>

    <!-- Recent orders -->
    <div class="dashboard-section">
      <h2 class="section-title">Đơn hàng gần đây</h2>
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
              <td>{{ order.userName || 'Khách' }}</td>
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
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dashboard-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--foreground, #1a1a1a);
  margin: 0;
  letter-spacing: -0.01em;
}

.dashboard-subtitle {
  font-size: 0.9375rem;
  color: var(--muted-foreground, #6b7280);
  margin: 0;
}

/* Stat grid */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: var(--card, #ffffff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 12px;
  box-shadow: var(--shadow, 0 1px 2px 0 rgb(0 0 0 / 0.05));
  transition: transform 0.15s, box-shadow 0.15s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-2, 0 4px 6px -1px rgb(0 0 0 / 0.1));
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

.stat-icon--revenue { background: var(--flame, #ff5a1f); }
.stat-icon--orders  { background: var(--green-ink, #156b3d); }
.stat-icon--products{ background: var(--purple, #6b2fb3); }
.stat-icon--customers{ background: var(--yellow, #ffd233); color: #1a1a1a; }

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--muted-foreground, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.25rem 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--foreground, #1a1a1a);
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.stat-trend {
  font-size: 0.75rem;
  font-weight: 500;
  margin: 0;
}

.stat-trend.positive { color: var(--green-ink, #156b3d); }
.stat-trend.neutral  { color: var(--muted-foreground, #6b7280); }

.stat-arrow {
  color: var(--muted-foreground, #9ca3af);
}

/* Section */
.dashboard-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--foreground, #1a1a1a);
  margin: 0;
}

/* Action grid */
.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--background, #ffffff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--foreground, #1a1a1a);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--muted, #f3f4f6);
  border-color: var(--flame, #ff5a1f);
  color: var(--flame, #ff5a1f);
}

/* Table */
.table-wrap {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.admin-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: var(--muted-foreground, #6b7280);
  border-bottom: 1px solid var(--border, #e5e7eb);
  background: var(--muted, #f9fafb);
}

.admin-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border, #e5e7eb);
  color: var(--foreground, #1a1a1a);
}

.admin-table tr:last-child td {
  border-bottom: none;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8125rem;
}

.text-muted {
  color: var(--muted-foreground, #6b7280);
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge--status {
  background: var(--muted, #f3f4f6);
  color: var(--muted-foreground, #6b7280);
}
</style>