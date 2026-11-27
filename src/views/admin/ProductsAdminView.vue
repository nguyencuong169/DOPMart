<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef } from 'vue'
import {
  Edit,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  Upload,
  Image,
  FileText,
} from 'lucide-vue-next'
import {
  deleteMartProduct,
  upsertMartProduct,
  type MartAdminProduct,
} from '../../services/martAdminService'
import {
  fetchAdminProducts,
  updateProductStock,
  uploadProductImage,
  getProductImageUrl,
} from '../../lib/supabase'

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
  stock: number
  imageFile: File | null
  imageUrl: string | null
}

interface ImportResult {
  total: number
  success: number
  failed: number
  errors: Array<{ row: number; name?: string; error: string }>
}

const products = shallowRef<MartAdminProduct[]>([])
const total = shallowRef(0)
const loading = shallowRef(true)
const saving = shallowRef(false)
const errorMessage = shallowRef('')
const message = shallowRef('')

const page = shallowRef(1)
const pageSize = shallowRef(20)

const searchQuery = shallowRef('')
const filterShelf = shallowRef('')
const filterFormat = shallowRef('')
const sortBy = shallowRef('created_at')
const sortDir = shallowRef('desc')

const showForm = shallowRef(false)
const editingId = shallowRef<number | null>(null)
const stockEditId = shallowRef<number | null>(null)
const stockValue = shallowRef('')

const uploadFile = shallowRef<File | null>(null)
const imagePreview = shallowRef<string | null>(null)

const showImport = shallowRef(false)
const importCsv = shallowRef('')
const importFile = shallowRef<File | null>(null)
const importLoading = shallowRef(false)
const importResult = shallowRef<ImportResult | null>(null)

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
  name: '',
  slug: '',
  categoryName: '',
  formatSlug: 'chips',
  shelfSlug: 'snack-man',
  price: 0,
  rating: 0,
  color: '#ffb82e',
  tint: '#f5a623',
  description: '',
  isNew: false,
  hot: false,
  stock: 0,
  imageFile: null,
  imageUrl: null,
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function resetForm() {
  Object.assign(form, {
    name: '',
    slug: '',
    categoryName: '',
    formatSlug: 'chips',
    shelfSlug: 'snack-man',
    price: 0,
    rating: 0,
    color: '#ffb82e',
    tint: '#f5a623',
    description: '',
    isNew: false,
    hot: false,
    stock: 0,
    imageFile: null,
    imageUrl: null,
  })
  uploadFile.value = null
  imagePreview.value = null
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
    formatSlug: product.format_slug,
    shelfSlug: product.shelf_slug,
    price: product.price,
    rating: product.rating,
    color: product.color,
    tint: product.tint,
    description: product.description,
    isNew: product.is_new,
    hot: product.hot,
    stock: product.stock,
    imageFile: null,
    imageUrl: product.image ?? null,
  })
  uploadFile.value = null
  imagePreview.value = product.image ?? null
  showForm.value = true
}

function getErrorMessage(cause: unknown, fallback: string) {
  const raw = cause instanceof Error ? cause.message : ''
  const code = raw.split(':')[0]
  const messages: Record<string, string> = {
    PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm.',
    OUT_OF_STOCK: 'Không đủ tồn kho.',
    INVALID_ORDER_ITEM: 'Dữ liệu đơn hàng không hợp lệ.',
  }
  return messages[code] || raw || fallback
}

async function loadProducts() {
  loading.value = true
  errorMessage.value = ''
  try {
    const { data, count } = await fetchAdminProducts({
      page: page.value,
      pageSize: pageSize.value,
      search: searchQuery.value,
      shelfSlug: filterShelf.value,
      formatSlug: filterFormat.value,
      sortBy: sortBy.value,
      sortDir: sortDir.value,
    })
    products.value = (data as MartAdminProduct[]).map(p => ({
      ...p,
      image: p.image ?? getProductImageUrl(`products/${p.slug}.webp`),
    }))
    total.value = count
  } catch (cause) {
    errorMessage.value = getErrorMessage(cause, 'Không thể tải danh sách sản phẩm.')
  } finally {
    loading.value = false
  }
}

async function saveProduct() {
  if (!form.name.trim()) {
    errorMessage.value = 'Vui lòng nhập tên sản phẩm.'
    return
  }
  if (!form.slug.trim()) {
    errorMessage.value = 'Vui lòng nhập mã định danh (slug).'
    return
  }
  if (form.price < 0) {
    errorMessage.value = 'Giá không được âm.'
    return
  }

  saving.value = true
  errorMessage.value = ''
  message.value = ''

  try {
    let imageUrl = form.imageUrl
    if (uploadFile.value) {
      const filePath = `products/${form.slug}/${Date.now()}-${uploadFile.value.name}`
      await uploadProductImage(filePath, uploadFile.value)
      imageUrl = getProductImageUrl(filePath)
    }

    const payload = {
      name: form.name,
      slug: form.slug,
      category_name: form.categoryName,
      format_slug: form.formatSlug,
      shelf_slug: form.shelfSlug,
      price: form.price,
      rating: form.rating,
      color: form.color,
      tint: form.tint,
      description: form.description,
      is_new: form.isNew,
      hot: form.hot,
      stock: form.stock,
      image: imageUrl,
    }

    if (editingId.value) {
      await upsertMartProduct({ ...payload, id: editingId.value })
      message.value = 'Đã cập nhật sản phẩm.'
    } else {
      await upsertMartProduct(payload)
      message.value = 'Đã tạo sản phẩm mới.'
    }

    showForm.value = false
    resetForm()
    await loadProducts()
  } catch (cause) {
    errorMessage.value = getErrorMessage(cause, 'Không thể lưu sản phẩm.')
  } finally {
    saving.value = false
  }
}

async function deleteProduct(id: number, name: string) {
  if (!window.confirm(`Xóa sản phẩm "${name}"?`)) return
  try {
    await deleteMartProduct(id)
    message.value = 'Đã xóa sản phẩm.'
    await loadProducts()
  } catch (cause) {
    errorMessage.value = getErrorMessage(cause, 'Không thể xóa sản phẩm.')
  }
}

function openStockEdit(product: MartAdminProduct) {
  stockEditId.value = product.id
  stockValue.value = String(product.stock ?? 0)
}

async function saveStock() {
  const stock = Number(stockValue.value)
  if (!Number.isInteger(stock) || stock < 0) {
    errorMessage.value = 'Tồn kho phải là số nguyên không âm.'
    return
  }
  if (!stockEditId.value) return
  try {
    await updateProductStock(stockEditId.value, stock)
    message.value = 'Đã cập nhật tồn kho.'
    stockEditId.value = null
    stockValue.value = ''
    await loadProducts()
  } catch (cause) {
    errorMessage.value = getErrorMessage(cause, 'Không thể cập nhật tồn kho.')
  }
}

function onImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.[0]) return
  uploadFile.value = input.files[0]
  imagePreview.value = URL.createObjectURL(input.files[0])
}

function removeImage() {
  uploadFile.value = null
  imagePreview.value = editingId.value ? form.imageUrl : null
}

/* ---------------- Import CSV ---------------- */

const importTemplate = `name,slug,categoryName,formatSlug,shelfSlug,price,rating,color,tint,description,isNew,hot,stock,image
Khoai tây cay,khoai-tay-cay,Snack mặn,chips,snack-man,12000,4.9,#ffb82e,#f5a623,"Giòn, cay",1,0,50,
Mì ly tôm,mì-ly-tom,Snack mặn,noodles,snack-man,18000,4.8,#ef3340,#d13a1f,"Mì ly tôm",0,1,40,
`

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length === 0) return []
  const header = lines[0].split(',').map(h => h.trim())
  const rows: Array<Record<string, string>> = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const obj: Record<string, string> = {}
    header.forEach((h, idx) => {
      obj[h] = (values[idx] ?? '').trim()
    })
    rows.push(obj)
  }
  return rows
}

function boolVal(v: string): boolean {
  return ['1', 'true', 'yes', 'có', 'mới'].includes(String(v).trim().toLowerCase())
}

async function runImport() {
  let rows: Array<Record<string, string>> = []
  if (importFile.value) {
    const text = await importFile.value.text()
    rows = parseCsv(text)
  } else if (importCsv.value.trim()) {
    rows = parseCsv(importCsv.value)
  } else {
    errorMessage.value = 'Vui lòng dán CSV hoặc chọn file.'
    return
  }

  importLoading.value = true
  errorMessage.value = ''
  const result: ImportResult = { total: rows.length, success: 0, failed: 0, errors: [] }

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 2
    try {
      const name = r.name?.trim()
      const slug = r.slug?.trim()
      if (!name || !slug) throw new Error('Thiếu tên hoặc slug')
      if (Number(r.price) < 0) throw new Error('Giá không được âm')

      await upsertMartProduct({
        name,
        slug,
        category_name: r.categoryName?.trim() || '',
        format_slug: r.formatSlug?.trim() || 'chips',
        shelf_slug: r.shelfSlug?.trim() || 'snack-man',
        price: Number(r.price) || 0,
        rating: Number(r.rating) || 0,
        color: r.color?.trim() || '#ffb82e',
        tint: r.tint?.trim() || '#f5a623',
        description: r.description?.trim() || '',
        is_new: boolVal(r.isNew ?? '0'),
        hot: boolVal(r.hot ?? '0'),
        stock: Number(r.stock) || 0,
        image: r.image?.trim() || null,
      })
      result.success++
    } catch (e) {
      result.failed++
      result.errors.push({
        row: rowNum,
        name: r.name?.trim(),
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  importResult.value = result
  importLoading.value = false
  await loadProducts()
}

function closeImport() {
  showImport.value = false
  importResult.value = null
  importCsv.value = ''
  importFile.value = null
}

onMounted(loadProducts)
</script>

<template>
  <div class="products-admin">
    <header class="products-header">
      <div>
        <span class="products-kicker">DOP MART · PRODUCTS</span>
        <h1>Quản lý sản phẩm</h1>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="showImport = true">
          <FileText size="17" /> Import CSV
        </button>
        <button class="btn-primary" @click="openCreate"><Plus size="17" /> Thêm sản phẩm</button>
      </div>
    </header>

    <div v-if="errorMessage" class="ad-alert ad-alert--error">{{ errorMessage }}</div>
    <div v-if="message" class="ad-alert ad-alert--success">{{ message }}</div>

    <div class="filters-bar">
      <div class="ad-search">
        <Search size="16" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Tìm theo tên, mã, danh mục…"
          @change="loadProducts"
        />
      </div>
      <select v-model="filterShelf" @change="loadProducts" class="ad-select">
        <option value="">Tất cả danh mục</option>
        <option v-for="s in shelves" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <select v-model="filterFormat" @change="loadProducts" class="ad-select">
        <option value="">Tất cả định dạng</option>
        <option v-for="f in formats" :key="f.value" :value="f.value">{{ f.label }}</option>
      </select>
      <select v-model="sortBy" @change="loadProducts" class="ad-select">
        <option value="created_at">Mới nhất</option>
        <option value="name">Tên (A-Z)</option>
        <option value="price">Giá</option>
        <option value="stock">Tồn kho</option>
        <option value="sold">Đã bán</option>
      </select>
      <select v-model="sortDir" @change="loadProducts" class="ad-select">
        <option value="desc">Giảm dần</option>
        <option value="asc">Tăng dần</option>
      </select>
      <button class="ad-btn-refresh" @click="loadProducts" :disabled="loading">
        <RefreshCw size="16" />
      </button>
    </div>

    <div class="table-wrap">
      <table class="ad-table">
        <thead>
          <tr>
            <th style="width: 52px">Ảnh</th>
            <th>Sản phẩm</th>
            <th style="width: 150px">Danh mục</th>
            <th style="width: 130px">Định dạng</th>
            <th style="width: 110px" class="amount">Giá</th>
            <th style="width: 110px" class="amount">Tồn kho</th>
            <th style="width: 110px">Trạng thái</th>
            <th style="width: 170px">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td>
              <div class="product-avatar">
                <img v-if="product.image" :src="product.image" :alt="product.name" loading="lazy" />
                <Package v-else size="18" />
              </div>
            </td>
            <td>
              <div class="product-cell">
                <strong>{{ product.name }}</strong>
                <small>{{ product.slug }}</small>
              </div>
            </td>
            <td>{{ product.categoryName }}</td>
            <td>{{ product.format_slug }}</td>
            <td class="amount">{{ formatCurrency(product.price) }}</td>
            <td class="amount" :class="{ 'low-stock': (product.stock ?? 0) <= 5 }">
              {{ product.stock ?? 0 }}
            </td>
            <td>
              <span
                class="ad-tag"
                :class="{
                  'ad-tag--new': product.is_new,
                  'ad-tag--hot': product.hot,
                }"
              >
                {{ product.is_new ? 'Mới' : product.hot ? 'Nổi bật' : '' }}
              </span>
            </td>
            <td class="actions">
              <button class="ad-icon-btn" title="Sửa" @click="openEdit(product)">
                <Edit size="16" />
              </button>
              <button class="ad-icon-btn" title="Cập nhật tồn kho" @click="openStockEdit(product)">
                <Image size="16" />
              </button>
              <button
                class="ad-icon-btn ad-icon-btn--danger"
                title="Xóa"
                @click="deleteProduct(product.id, product.name)"
              >
                <Trash2 size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="products.length === 0 && !loading" class="ad-empty">Chưa có sản phẩm nào.</div>

    <div class="pagination" v-if="total > 0">
      <span class="pagination-info"
        >Trang {{ page }} / {{ totalPages }} ({{ total }} sản phẩm)</span
      >
      <div class="pagination-controls">
        <button
          class="ad-pagination-btn"
          :disabled="page === 1"
          @click="
            page--
            loadProducts()
          "
        >
          Trước
        </button>
        <button
          class="ad-pagination-btn"
          :disabled="page >= totalPages"
          @click="
            page++
            loadProducts()
          "
        >
          Tiếp
        </button>
      </div>
    </div>

    <!-- Form modal -->
    <div v-if="showForm" class="ad-modal-layer" @click.self="showForm = false">
      <form class="ad-modal" @submit.prevent="saveProduct">
        <div class="ad-modal-header">
          <h2>{{ editingId ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới' }}</h2>
          <button type="button" class="ad-icon-btn" @click="showForm = false">
            <X size="19" />
          </button>
        </div>
        <div class="ad-form-grid">
          <label class="ad-field">
            <span>Tên sản phẩm <span class="req">*</span></span>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Ví dụ: Khoai tây cay bùng vị"
            />
          </label>
          <label class="ad-field">
            <span>Mã định danh (slug) <span class="req">*</span></span>
            <input v-model="form.slug" type="text" required placeholder="khoai-tay-cay-bung-vi" />
          </label>
          <label class="ad-field">
            <span>Danh mục</span>
            <select v-model="form.categoryName" class="ad-select">
              <option value="Snack mặn">Snack mặn</option>
              <option value="Đồ cay">Đồ cay</option>
              <option value="Ngọt và bánh">Ngọt và bánh</option>
              <option value="Snack lành mạnh">Snack lành mạnh</option>
              <option value="Bữa nhanh">Bữa nhanh</option>
              <option value="Đồ uống">Đồ uống</option>
            </select>
          </label>
          <label class="ad-field">
            <span>Định dạng</span>
            <select v-model="form.formatSlug" class="ad-select">
              <option v-for="f in formats" :key="f.value" :value="f.value">{{ f.label }}</option>
            </select>
          </label>
          <label class="ad-field">
            <span>Giá (đồng)</span>
            <input v-model.number="form.price" type="number" min="0" />
          </label>
          <label class="ad-field">
            <span>Tồn kho (tổng)</span>
            <input v-model.number="form.stock" type="number" min="0" />
          </label>
          <label class="ad-field">
            <span>Đánh giá (0-5)</span>
            <input v-model.number="form.rating" type="number" min="0" max="5" step="0.1" />
          </label>
          <label class="ad-field ad-field--wide">
            <span>Màu chủ đạo</span>
            <input v-model="form.color" type="color" />
          </label>
          <label class="ad-field ad-field--wide">
            <span>Màu nhấn</span>
            <input v-model="form.tint" type="color" />
          </label>
          <label class="ad-field ad-field--wide">
            <span>Mô tả</span>
            <textarea v-model="form.description" rows="3" placeholder="Mô tả sản phẩm…"></textarea>
          </label>
          <label class="ad-field ad-field--wide ad-checkbox">
            <input type="checkbox" v-model="form.isNew" />
            <span>Sản phẩm mới</span>
          </label>
          <label class="ad-field ad-field--wide ad-checkbox">
            <input type="checkbox" v-model="form.hot" />
            <span>Nổi bật</span>
          </label>
          <label class="ad-field ad-field--wide">
            <span>Ảnh sản phẩm</span>
            <div class="ad-image-uploader">
              <input type="file" accept="image/*" @change="onImageChange" />
              <div class="ad-image-preview">
                <img v-if="imagePreview" :src="imagePreview" alt="preview" />
                <Upload v-else size="28" />
                <button
                  type="button"
                  class="ad-remove-image"
                  v-if="imagePreview && editingId"
                  @click="removeImage"
                >
                  Xóa ảnh
                </button>
              </div>
            </div>
          </label>
        </div>
        <div class="ad-modal-footer">
          <button type="button" class="btn-secondary" @click="showForm = false">Hủy</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Đang lưu…' : 'Lưu sản phẩm' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Stock edit modal -->
    <div v-if="stockEditId" class="ad-modal-layer" @click.self="stockEditId = null">
      <form class="ad-modal" @submit.prevent="saveStock">
        <div class="ad-modal-header">
          <h2>Cập nhật tồn kho</h2>
          <button type="button" class="ad-icon-btn" @click="stockEditId = null">
            <X size="19" />
          </button>
        </div>
        <div class="ad-form-grid ad-form-grid--wide">
          <label class="ad-field">
            <span>Tồn kho mới (tổng)</span>
            <input v-model.number="stockValue" type="number" min="0" required autofocus />
          </label>
        </div>
        <div class="ad-modal-footer">
          <button type="button" class="btn-secondary" @click="stockEditId = null">Hủy</button>
          <button type="submit" class="btn-primary">Cập nhật</button>
        </div>
      </form>
    </div>

    <!-- Import CSV modal -->
    <div v-if="showImport" class="ad-modal-layer" @click.self="closeImport">
      <form class="ad-modal" @submit.prevent="runImport">
        <div class="ad-modal-header">
          <h2>Import sản phẩm từ CSV</h2>
          <button type="button" class="ad-icon-btn" @click="closeImport">
            <X size="19" />
          </button>
        </div>
        <div class="ad-form-grid ad-form-grid--wide">
          <label class="ad-field">
            <span>Tệp CSV <span class="req">*</span></span>
            <input
              type="file"
              accept=".csv"
              @change="
                e => {
                  importFile.value = (e.target as HTMLInputElement).files?.[0] ?? null
                }
              "
            />
            <small class="ad-muted">Hoặc dán nội dung CSV bên dưới</small>
          </label>
          <label class="ad-field ad-field--wide">
            <textarea
              v-model="importCsv"
              rows="8"
              placeholder="name,slug,categoryName,formatSlug,shelfSlug,price,rating,color,tint,description,isNew,hot,stock,image"
            ></textarea>
          </label>
          <details class="ad-csv-help">
            <summary style="cursor: pointer; font-weight: 800">Mẫu CSV (nhấn để xem)</summary>
            <pre>{{ importTemplate }}</pre>
          </details>
          <small class="ad-muted"
            >Lưu ý: cột <code>isNew</code>, <code>hot</code> nhận 1/0. Cột <code>image</code> để
            trống nếu không có ảnh.</small
          >
        </div>
        <div class="ad-modal-footer">
          <button type="button" class="btn-secondary" @click="closeImport">Hủy</button>
          <button type="submit" class="btn-primary" :disabled="importLoading">
            {{ importLoading ? 'Đang nhập…' : 'Chạy import' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Import result modal -->
    <div v-if="importResult" class="ad-modal-layer" @click.self="importResult = null">
      <form class="ad-modal" style="max-width: 700px">
        <div class="ad-modal-header">
          <h2>Kết quả import</h2>
          <button type="button" class="ad-icon-btn" @click="importResult = null">
            <X size="19" />
          </button>
        </div>
        <div class="ad-form-grid ad-form-grid--wide" style="gap: var(--sp-3)">
          <div
            style="
              background: #e8f7ea;
              border: var(--bw) solid #b9e3cc;
              border-radius: var(--ad-radius);
              padding: var(--sp-3);
            "
          >
            <div
              style="
                font-size: var(--fs-xs);
                color: #216b37;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: var(--tracking-kicker);
              "
            >
              Thành công
            </div>
            <div style="font-size: 32px; font-weight: 900; color: var(--ink)">
              {{ importResult.success }}
            </div>
          </div>
          <div
            v-if="importResult.failed > 0"
            style="
              background: #fff0ef;
              border: var(--bw) solid #f5c6bf;
              border-radius: var(--ad-radius);
              padding: var(--sp-3);
            "
          >
            <div
              style="
                font-size: var(--fs-xs);
                color: #9b211a;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: var(--tracking-kicker);
              "
            >
              Thất bại
            </div>
            <div style="font-size: 32px; font-weight: 900; color: var(--ink)">
              {{ importResult.failed }}
            </div>
          </div>
          <div v-if="importResult.failed > 0">
            <label style="font-size: var(--fs-xs); font-weight: 800; color: #645b53"
              >Chi tiết lỗi</label
            >
            <ul
              style="
                margin: var(--sp-1) 0 0;
                padding-left: var(--sp-3);
                color: #191919;
                font-size: var(--fs-sm);
                max-height: 200px;
                overflow: auto;
                border: var(--bw) solid #d9cec1;
                border-radius: var(--ad-radius);
                background: #fff;
                padding: var(--sp-2);
              "
            >
              <li v-for="err in importResult.errors" :key="err.row">
                Dòng {{ err.row
                }}<span v-if="err.name" style="color: #645b53; font-weight: 600">
                  ({{ err.name }})</span
                >: {{ err.error }}
              </li>
            </ul>
          </div>
        </div>
        <div class="ad-modal-footer">
          <button
            type="button"
            class="btn-primary"
            @click="
              importResult = null
              closeImport()
            "
          >
            Đóng
          </button>
        </div>
      </form>
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
  --ad-flame: var(--flame, #ff5a1f);
  --ad-yellow: var(--yellow, #ffd233);
  --ad-radius: 14px;
  --ad-shadow: 4px 4px 0 var(--ink, #1a1a1a);
}

.products-admin {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--sp-3);
}

.products-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}

.products-header > div {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.products-kicker {
  color: #7b6f64;
  font-size: var(--fs-xs);
  font-weight: 900;
  letter-spacing: var(--tracking-kicker);
  text-transform: uppercase;
}

.products-header h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(28px, 4vw, 36px);
  font-weight: 800;
  letter-spacing: var(--tracking-display);
  color: var(--ad-ink);
}

.header-actions {
  display: flex;
  gap: var(--sp-1);
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
  min-height: 44px;
  border: var(--bw-bold) solid var(--ad-ink);
  border-radius: var(--ad-radius);
  padding: 0 var(--sp-3);
  color: var(--ad-ink);
  font-weight: 800;
  font-family: var(--font-ui);
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  font-size: var(--fs-sm);
}

.btn-primary {
  background: var(--ad-ink);
  color: #fff;
  box-shadow: var(--ad-shadow);
}

.btn-primary:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 6px 6px 0 var(--ad-ink);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--ad-paper);
}

.btn-secondary:hover {
  background: var(--ad-muted-bg);
}

.ad-btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  border: var(--bw) solid #c8beb2;
  border-radius: var(--ad-radius);
  background: var(--ad-paper);
  padding: var(--sp-1) var(--sp-2);
  color: #645b53;
  cursor: pointer;
  font-size: var(--fs-xs);
}

.ad-btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-1);
  align-items: center;
  margin-bottom: var(--sp-2);
}

.ad-search {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  border: var(--bw-bold) solid #c8beb2;
  border-radius: var(--ad-radius);
  background: var(--ad-paper);
  padding: var(--sp-1) var(--sp-2);
  min-width: 220px;
}

.ad-search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  font-size: var(--fs-sm);
  color: var(--ad-ink);
}

.ad-select {
  border: var(--bw-bold) solid #c8beb2;
  border-radius: var(--ad-radius);
  background: var(--ad-paper);
  padding: var(--sp-1) var(--sp-2);
  font: inherit;
  font-size: var(--fs-sm);
  color: var(--ad-ink);
  cursor: pointer;
  min-width: 150px;
  outline: 0;
}

.ad-alert {
  border-radius: var(--ad-radius);
  padding: var(--sp-2) var(--sp-3);
  font-size: var(--fs-sm);
  font-weight: 800;
  margin-bottom: var(--sp-2);
}

.ad-alert--error {
  background: #fff0ef;
  color: #9b211a;
  border: var(--bw) solid #f5c6bf;
}

.ad-alert--success {
  background: #e8f7ea;
  color: #216b37;
  border: var(--bw) solid #b9e3cc;
}

.table-wrap {
  overflow-x: auto;
  border: var(--bw-bold) solid #d9cec1;
  border-radius: var(--ad-radius);
  background: var(--ad-paper);
  margin-bottom: var(--sp-2);
}

.ad-table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
  font-size: var(--fs-sm);
}

.ad-table th {
  padding: var(--sp-2) var(--sp-3);
  border-bottom: var(--bw) solid #d9cec1;
  color: #756a61;
  font-size: var(--fs-xs);
  letter-spacing: var(--tracking-kicker);
  text-align: left;
  text-transform: uppercase;
  font-weight: 800;
  background: var(--ad-muted-bg);
}

.ad-table td {
  padding: var(--sp-2) var(--sp-3);
  border-bottom: var(--bw) solid #ebe2d8;
  vertical-align: middle;
  color: var(--ad-ink);
}

.ad-table tr:last-child td {
  border-bottom: none;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
}

.product-cell strong,
.product-cell small {
  display: block;
}

.product-cell small {
  margin-top: 2px;
  color: #8a7f74;
  font-size: var(--fs-xs);
}

.product-avatar {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border-radius: 10px;
  background: #f1e9dc;
  color: #191919;
}

.product-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.amount {
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  white-space: nowrap;
}

.low-stock {
  color: #b42318;
}

.ad-tag {
  display: inline-flex;
  border-radius: 999px;
  padding: 3px 8px;
  font-size: var(--fs-xs);
  font-weight: 800;
}

.ad-tag--new {
  background: #e0f2fe;
  color: #075985;
}

.ad-tag--hot {
  background: #ffe4e6;
  color: #9f1239;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sp-1);
}

.ad-icon-btn {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: var(--bw) solid #d9cec1;
  border-radius: 9px;
  background: transparent;
  color: #645b53;
  cursor: pointer;
}

.ad-icon-btn:hover {
  background: #f1e9dc;
  color: #191919;
}

.ad-icon-btn--danger:hover {
  background: #fff1f0;
  color: #b42318;
}

.ad-empty {
  min-height: 120px;
  color: #8a7f74;
  text-align: center;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--sp-1);
}

.pagination-info {
  color: #645b53;
  font-size: var(--fs-sm);
  font-weight: 800;
}

.pagination-controls {
  display: flex;
  gap: var(--sp-1);
}

.ad-pagination-btn {
  border: var(--bw-bold) solid #c8beb2;
  border-radius: var(--ad-radius);
  background: var(--ad-paper);
  padding: var(--sp-1) var(--sp-2);
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  color: var(--ad-ink);
}

.ad-pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modals */
.ad-modal-layer {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  background: rgb(25, 25, 25, 0.4);
  padding: var(--sp-3);
}

.ad-modal {
  width: min(760px, 95%);
  max-height: 90svh;
  overflow: auto;
  border: var(--bw-bold) solid var(--ad-ink);
  border-radius: 20px;
  background: var(--ad-paper);
  box-shadow: var(--ad-shadow);
  padding: var(--sp-3);
}

.ad-modal-header,
.ad-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}

.ad-modal-header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 32px;
}

.ad-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
  margin-top: var(--sp-2);
}

.ad-form-grid--wide {
  grid-template-columns: 1fr;
}

.ad-field {
  display: grid;
  gap: var(--sp-1);
  color: #645b53;
  font-size: var(--fs-xs);
  font-weight: 800;
}

.ad-field--wide {
  grid-column: 1 / -1;
}

.ad-checkbox {
  display: flex !important;
  align-items: center;
  grid-template-columns: auto 1fr !important;
  gap: var(--sp-1) !important;
}

.ad-field input:not([type='checkbox']),
.ad-field select,
.ad-field textarea {
  width: 100%;
  border: var(--bw-bold) solid #c8beb2;
  border-radius: var(--ad-radius);
  background: var(--ad-paper);
  padding: var(--sp-1) var(--sp-2);
  color: #191919;
  font: inherit;
  font-weight: 500;
  outline: 0;
}

.ad-field input[type='color'] {
  width: 100%;
  height: 40px;
  border: 0;
  background: transparent;
}

.ad-field textarea {
  font-family: inherit;
}

.req {
  color: #b42318;
}

.ad-modal-footer {
  justify-content: flex-end;
  margin-top: var(--sp-3);
  border-top: var(--bw) solid #ded5ca;
  padding-top: var(--sp-2);
}

.ad-image-uploader {
  border: var(--bw-bold) dashed #c8beb2;
  border-radius: var(--ad-radius);
  padding: var(--sp-2);
  text-align: center;
  background: #fbf9f5;
  position: relative;
}

.ad-image-uploader input[type='file'] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.ad-image-preview {
  position: relative;
  display: inline-block;
}

.ad-image-preview img {
  max-width: 160px;
  max-height: 160px;
  border-radius: 10px;
  border: var(--bw) solid #d9cec1;
}

.ad-remove-image {
  margin-top: var(--sp-1);
  font-size: var(--fs-xs);
  font-weight: 800;
  color: #b42318;
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 0;
}

.ad-csv-help pre {
  margin: var(--sp-1) 0 0;
  background: #fbf9f5;
  border: var(--bw) solid #d9cec1;
  border-radius: var(--ad-radius);
  padding: var(--sp-2);
  font-size: var(--fs-xs);
  overflow: auto;
}

.ad-muted {
  color: #8a7f74;
  font-size: var(--fs-xs);
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--fs-xs);
  background: #f1e9dc;
  padding: 2px 6px;
  border-radius: 4px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 760px) {
  .products-admin {
    padding: var(--sp-1);
  }
  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .ad-form-grid {
    grid-template-columns: 1fr;
  }
  .products-header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
