<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef } from 'vue'
import { Edit, Package, Plus, RefreshCw, Search, Trash2, X } from 'lucide-vue-next'
import { imageOfFormat } from '../../data/products'
import {
  deleteMartProduct,
  getMartAdminProducts,
  upsertMartProduct,
  type MartAdminProduct,
} from '../../services/martAdminService'

interface ProductForm {
  name: string
  slug: string
  categoryName: string
  formatSlug: string
  shelfSlug: string
  price: number
  rating: number
  color: string
  tint: string
  description: string
  isNew: boolean
  hot: boolean
  initialStock: number
}

const products = shallowRef<MartAdminProduct[]>([])
const loading = shallowRef(true)
const saving = shallowRef(false)
const errorMessage = shallowRef('')
const searchQuery = shallowRef('')
const showForm = shallowRef(false)
const editingId = shallowRef<number | null>(null)

const formats = [
  { value: 'chips', label: 'Bim bim' },
  { value: 'noodles', label: 'Mì và đồ ăn liền' },
  { value: 'instant', label: 'Xúc xích' },
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'drinks', label: 'Nước uống' },
  { value: 'spicy', label: 'Đồ cay' },
  { value: 'candy', label: 'Kẹo' },
  { value: 'healthy', label: 'Snack lành mạnh' },
]

const shelves = [
  { value: 'snack-man', label: 'Snack mặn' },
  { value: 'do-cay', label: 'Đồ cay' },
  { value: 'ngot', label: 'Ngọt và bánh' },
  { value: 'healthy', label: 'Snack lành mạnh' },
  { value: 'bua-nhanh', label: 'Bữa nhanh' },
  { value: 'do-uong', label: 'Đồ uống' },
]

const form = reactive<ProductForm>({
  name: '', slug: '', categoryName: '', formatSlug: 'chips', shelfSlug: 'snack-man',
  price: 0, rating: 0, color: '#ffb82e', tint: '#f5a623', description: '',
  isNew: false, hot: false, initialStock: 0,
})

const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return products.value
  return products.value.filter((product) => (
    `${product.name} ${product.slug} ${product.categoryName}`.toLowerCase().includes(query)
  ))
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0,
  }).format(value || 0)
}

function resetForm() {
  Object.assign(form, {
    name: '', slug: '', categoryName: '', formatSlug: 'chips', shelfSlug: 'snack-man',
    price: 0, rating: 0, color: '#ffb82e', tint: '#f5a623', description: '',
    isNew: false, hot: false, initialStock: 0,
  })
}

function openCreate() {
  editingId.value = null
  resetForm()
  showForm.value = true
}

function openEdit(product: MartAdminProduct) {
  editingId.value = product.id
  Object.assign(form, {
    name: product.name,
    slug: product.slug,
    categoryName: product.categoryName,
    formatSlug: product.formatSlug,
    shelfSlug: product.shelfSlug,
    price: product.price,
    rating: product.rating,
    color: product.color,
    tint: product.tint,
    description: product.description,
    isNew: product.isNew,
    hot: product.hot,
    initialStock: 0,
  })
  showForm.value = true
}

function getErrorMessage(cause: unknown, fallback: string) {
  const raw = cause instanceof Error ? cause.message : ''
  const code = raw.split(':')[0]
  const messages: Record<string, string> = {
    PRODUCT_HAS_ORDERS: 'Sản phẩm đã có trong đơn hàng, không thể xóa.',
    PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm.',
    INVALID_PRODUCT_PAYLOAD: 'Vui lòng kiểm tra lại thông tin sản phẩm.',
    '23505': 'Slug sản phẩm đã tồn tại.',
  }
  return messages[code] ?? raw ?? fallback
}

async function loadProducts() {
  loading.value = true
  errorMessage.value = ''
  try {
    products.value = await getMartAdminProducts()
  } catch (cause) {
    errorMessage.value = getErrorMessage(cause, 'Không thể tải danh sách sản phẩm.')
  } finally {
    loading.value = false
  }
}

async function saveProduct() {
  if (!form.name.trim() || !form.slug.trim() || form.price < 0) {
    errorMessage.value = 'Tên, slug và giá sản phẩm là bắt buộc.'
    return
  }

  saving.value = true
  errorMessage.value = ''
  try {
    await upsertMartProduct({
      id: editingId.value ?? undefined,
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      categoryName: form.categoryName.trim() || form.shelfSlug,
      formatSlug: form.formatSlug,
      shelfSlug: form.shelfSlug,
      price: Number(form.price),
      rating: Number(form.rating),
      color: form.color,
      tint: form.tint,
      description: form.description.trim(),
      isNew: form.isNew,
      hot: form.hot,
      initialStock: editingId.value ? 0 : Number(form.initialStock),
    })
    showForm.value = false
    await loadProducts()
  } catch (cause) {
    errorMessage.value = getErrorMessage(cause, 'Không thể lưu sản phẩm.')
  } finally {
    saving.value = false
  }
}

async function removeProduct(product: MartAdminProduct) {
  if (!window.confirm(`Xóa sản phẩm “${product.name}”?`)) return
  errorMessage.value = ''
  try {
    await deleteMartProduct(product.id)
    await loadProducts()
  } catch (cause) {
    errorMessage.value = getErrorMessage(cause, 'Không thể xóa sản phẩm.')
  }
}

onMounted(loadProducts)
</script>

<template>
  <section class="admin-products" aria-labelledby="products-heading">
    <header class="products-header">
      <div>
        <span class="products-kicker">DOP MART · CATALOG</span>
        <h1 id="products-heading" class="products-title">Quản lý sản phẩm</h1>
        <p class="products-lead">Cập nhật thông tin và giá bán. Tồn kho thực tế được điều chỉnh trong Operations.</p>
      </div>
      <div class="header-actions">
        <button type="button" class="secondary-button" :disabled="loading" @click="loadProducts">
          <RefreshCw :size="16" :class="{ spinning: loading }" aria-hidden="true" />
          Làm mới
        </button>
        <button type="button" class="primary-button" @click="openCreate">
          <Plus :size="17" aria-hidden="true" />
          Thêm sản phẩm
        </button>
      </div>
    </header>

    <div v-if="errorMessage" class="admin-alert" role="alert">{{ errorMessage }}</div>

    <label class="search-box">
      <Search :size="18" aria-hidden="true" />
      <span class="sr-only">Tìm sản phẩm</span>
      <input v-model="searchQuery" type="search" placeholder="Tìm theo tên, slug, danh mục…" />
    </label>

    <div v-if="loading && !products.length" class="empty-state" role="status">Đang tải sản phẩm…</div>

    <div v-else class="table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>Danh mục</th>
            <th>Giá bán</th>
            <th>Tồn khả dụng</th>
            <th>Trạng thái</th>
            <th><span class="sr-only">Thao tác</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in filteredProducts" :key="product.id">
            <td class="product-cell">
              <span class="product-avatar" :style="{ backgroundColor: product.color }">
                <img v-if="imageOfFormat[product.formatSlug]" :src="imageOfFormat[product.formatSlug]" :alt="product.name" />
                <Package v-else :size="17" aria-hidden="true" />
              </span>
              <span><strong>{{ product.name }}</strong><small>{{ product.slug }}</small></span>
            </td>
            <td>{{ product.categoryName }}</td>
            <td class="amount">{{ formatCurrency(product.price) }}</td>
            <td class="amount" :class="{ 'low-stock': product.availableQty <= 5 }">
              {{ product.availableQty }}
              <small>{{ product.reservedQty ? `${product.reservedQty} đang giữ` : 'không giữ' }}</small>
            </td>
            <td>
              <span v-if="product.isNew" class="tag tag-new">Mới</span>
              <span v-if="product.hot" class="tag tag-hot">Hot</span>
              <span v-if="!product.isNew && !product.hot" class="muted">Đang bán</span>
            </td>
            <td class="actions">
              <button type="button" class="icon-button" title="Sửa sản phẩm" @click="openEdit(product)">
                <Edit :size="16" aria-hidden="true" />
              </button>
              <button type="button" class="icon-button danger" title="Xóa sản phẩm" @click="removeProduct(product)">
                <Trash2 :size="16" aria-hidden="true" />
              </button>
            </td>
          </tr>
          <tr v-if="!filteredProducts.length"><td colspan="6" class="empty-state">Không tìm thấy sản phẩm phù hợp.</td></tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="modal-layer" @click.self="showForm = false">
      <form class="modal" @submit.prevent="saveProduct">
        <header class="modal-header">
          <div><span class="products-kicker">CATALOG EDITOR</span><h2>{{ editingId ? 'Sửa sản phẩm' : 'Thêm sản phẩm' }}</h2></div>
          <button type="button" class="icon-button" aria-label="Đóng" @click="showForm = false"><X :size="19" /></button>
        </header>
        <div class="form-grid">
          <label>Tên sản phẩm<input v-model="form.name" required /></label>
          <label>Slug<input v-model="form.slug" required /></label>
          <label>Danh mục<select v-model="form.shelfSlug"><option v-for="shelf in shelves" :key="shelf.value" :value="shelf.value">{{ shelf.label }}</option></select></label>
          <label>Format<select v-model="form.formatSlug"><option v-for="format in formats" :key="format.value" :value="format.value">{{ format.label }}</option></select></label>
          <label>Giá bán (VND)<input v-model.number="form.price" type="number" min="0" required /></label>
          <label>Rating<input v-model.number="form.rating" type="number" min="0" max="5" step="0.1" /></label>
          <label>Màu chính<input v-model="form.color" type="color" /></label>
          <label>Màu nền<input v-model="form.tint" type="color" /></label>
          <label v-if="!editingId">Tồn đầu kỳ<input v-model.number="form.initialStock" type="number" min="0" /></label>
          <label class="wide">Mô tả<textarea v-model="form.description" rows="3" /></label>
          <label class="checkbox-field"><input v-model="form.isNew" type="checkbox" /> Sản phẩm mới</label>
          <label class="checkbox-field"><input v-model="form.hot" type="checkbox" /> Bán chạy</label>
        </div>
        <footer class="modal-footer">
          <button type="button" class="secondary-button" @click="showForm = false">Hủy</button>
          <button type="submit" class="primary-button" :disabled="saving">{{ saving ? 'Đang lưu…' : 'Lưu sản phẩm' }}</button>
        </footer>
      </form>
    </div>
  </section>
</template>

<style scoped>
.admin-products { display: grid; gap: 24px; }
.products-header, .header-actions { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
.header-actions { align-items: center; }
.products-kicker { color: #756a61; font-size: 11px; font-weight: 900; letter-spacing: .1em; }
.products-title { margin: 8px 0 6px; font-family: var(--font-display, sans-serif); font-size: clamp(34px, 5vw, 56px); line-height: .95; letter-spacing: -.04em; }
.products-lead { max-width: 60ch; margin: 0; color: #756a61; font-size: 14px; line-height: 1.5; }
.primary-button, .secondary-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 2px solid var(--ink, #191919); border-radius: 11px; padding: 10px 13px; color: var(--ink, #191919); font-weight: 900; cursor: pointer; }
.primary-button { background: #ffd338; box-shadow: 3px 3px 0 var(--ink, #191919); }
.secondary-button { background: #fffdf7; }
.primary-button:disabled, .secondary-button:disabled { cursor: wait; opacity: .55; }
.spinning { animation: spin .8s linear infinite; }
.admin-alert { border: 1.5px solid #b42318; border-radius: 12px; background: #fff1f0; padding: 12px 14px; color: #8e1c16; font-weight: 700; }
.search-box { display: flex; align-items: center; gap: 9px; width: min(440px, 100%); border: 1.5px solid #c8beb2; border-radius: 12px; background: #fffdf7; padding: 11px 13px; color: #756a61; }
.search-box input { width: 100%; border: 0; outline: 0; background: transparent; font: inherit; }
.table-wrap { overflow-x: auto; border: 1.5px solid #d9cec1; border-radius: 18px; background: #fffdf7; }
.admin-table { width: 100%; min-width: 850px; border-collapse: collapse; font-size: 13px; }
.admin-table th { padding: 14px 16px; border-bottom: 1.5px solid #d9cec1; color: #756a61; font-size: 11px; letter-spacing: .07em; text-align: left; text-transform: uppercase; }
.admin-table td { padding: 14px 16px; border-bottom: 1px solid #ebe2d8; vertical-align: middle; }
.product-cell { display: flex; align-items: center; gap: 11px; min-width: 260px; }
.product-cell strong, .product-cell small, .amount small { display: block; }
.product-cell small, .amount small { margin-top: 4px; color: #8a7f74; font-size: 11px; }
.product-avatar { display: grid; place-items: center; width: 44px; height: 44px; overflow: hidden; border-radius: 12px; color: #191919; }
.product-avatar img { width: 100%; height: 100%; object-fit: cover; }
.amount { font-variant-numeric: tabular-nums; font-weight: 900; white-space: nowrap; }
.low-stock { color: #b42318; }
.tag { display: inline-flex; margin-right: 5px; border-radius: 999px; padding: 5px 8px; font-size: 11px; font-weight: 900; }
.tag-new { background: #e0f2fe; color: #075985; }
.tag-hot { background: #ffe4e6; color: #9f1239; }
.muted { color: #8a7f74; font-size: 12px; }
.actions { display: flex; justify-content: flex-end; gap: 6px; }
.icon-button { display: inline-grid; place-items: center; width: 34px; height: 34px; border: 1px solid #d9cec1; border-radius: 9px; background: transparent; color: #645b53; cursor: pointer; }
.icon-button:hover { background: #f1e9dc; color: #191919; }
.icon-button.danger:hover { background: #fff1f0; color: #b42318; }
.empty-state { min-height: 120px; color: #8a7f74; text-align: center; }
.modal-layer { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; background: rgb(25 25 25 / .38); padding: 20px; }
.modal { width: min(720px, 100%); max-height: 90svh; overflow: auto; border: 2px solid var(--ink); border-radius: 20px; background: #fffdf7; box-shadow: 7px 7px 0 var(--ink); padding: 24px; }
.modal-header, .modal-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.modal-header h2 { margin: 7px 0 0; font-family: var(--font-display); font-size: 32px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 24px; }
.form-grid label { display: grid; gap: 7px; color: #645b53; font-size: 12px; font-weight: 800; }
.form-grid input:not([type='checkbox']), .form-grid select, .form-grid textarea { width: 100%; border: 1.5px solid #c8beb2; border-radius: 10px; background: #fff; padding: 10px 11px; color: #191919; font: inherit; font-weight: 500; }
.form-grid input[type='color'] { width: 100%; height: 40px; border: 0; background: transparent; }
.wide { grid-column: 1 / -1; }
.checkbox-field { display: flex !important; align-items: center; grid-template-columns: auto 1fr; gap: 8px !important; }
.modal-footer { justify-content: flex-end; margin-top: 24px; border-top: 1px solid #ded5ca; padding-top: 18px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 760px) { .products-header, .header-actions { align-items: stretch; flex-direction: column; } .header-actions, .primary-button, .secondary-button { width: 100%; } .form-grid { grid-template-columns: 1fr; } .wide { grid-column: auto; } }
</style>
