<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef } from "vue";
import { Edit, Package, Plus, RefreshCw, Search, Trash2, X, Upload, Image, FileText } from "lucide-vue-next";
import { deleteMartProduct, upsertMartProduct, type MartAdminProduct } from "../../services/martAdminService";
import { fetchAdminProducts, updateProductStock, uploadProductImage, getProductImageUrl } from "../../lib/supabase";

interface ProductForm {
  name: string;
  slug: string;
  categoryName: string;
  formatSlug: string;
  shelfSlug: string;
  price: number;
  rating: number;
  color: string;
  tint: string;
  description: string;
  isNew: boolean;
  hot: boolean;
  stock: number;
  imageFile: File | null;
  imageUrl: string | null;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ row: number; name?: string; error: string }>;
}

const products = shallowRef<MartAdminProduct[]>([]);
const total = shallowRef(0);
const loading = shallowRef(true);
const saving = shallowRef(false);
const errorMessage = shallowRef("");
const message = shallowRef("");

const page = shallowRef(1);
const pageSize = shallowRef(20);

const searchQuery = shallowRef("");
const filterShelf = shallowRef("");
const filterFormat = shallowRef("");
const sortBy = shallowRef("created_at");
const sortDir = shallowRef("desc");

const showForm = shallowRef(false);
const editingId = shallowRef<number | null>(null);
const stockEditId = shallowRef<number | null>(null);
const stockValue = shallowRef("");

const uploadFile = shallowRef<File | null>(null);
const imagePreview = shallowRef<string | null>(null);

// Import state
const showImport = shallowRef(false);
const importCsv = shallowRef("");
const importFile = shallowRef<File | null>(null);
const importLoading = shallowRef(false);
const importResult = shallowRef<ImportResult | null>(null);

const formats = [
  { value: "chips", label: "Bim bim" },
  { value: "noodles", label: "Mì và đồ ăn liền" },
  { value: "instant", label: "Xúc xích" },
  { value: "chocolate", label: "Chocolate" },
  { value: "drinks", label: "Nước uống" },
  { value: "spicy", label: "Đồ cay" },
  { value: "candy", label: "Kẹo" },
  { value: "healthy", label: "Snack lành mạnh" },
];

const shelves = [
  { value: "snack-man", label: "Snack mặn" },
  { value: "do-cay", label: "Đồ cay" },
  { value: "ngot", label: "Ngọt và bánh" },
  { value: "healthy", label: "Snack lành mạnh" },
  { value: "bua-nhanh", label: "Bữa nhanh" },
  { value: "do-uong", label: "Đồ uống" },
];

const form = reactive<ProductForm>({
  name: "", slug: "", categoryName: "", formatSlug: "chips", shelfSlug: "snack-man",
  price: 0, rating: 0, color: "#ffb82e", tint: "#f5a623", description: "",
  isNew: false, hot: false, stock: 0, imageFile: null, imageUrl: null,
});

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value || 0);
}

function resetForm() {
  Object.assign(form, {
    name: "", slug: "", categoryName: "", formatSlug: "chips", shelfSlug: "snack-man",
    price: 0, rating: 0, color: "#ffb82e", tint: "#f5a623", description: "",
    isNew: false, hot: false, stock: 0, imageFile: null, imageUrl: null,
  });
  uploadFile.value = null;
  imagePreview.value = null;
}

function openCreate() {
  editingId.value = null;
  resetForm();
  showForm.value = true;
}

function openEdit(product: MartAdminProduct) {
  editingId.value = product.id;
  Object.assign(form, {
    name: product.name, slug: product.slug, categoryName: product.categoryName,
    formatSlug: product.format_slug, shelfSlug: product.shelf_slug, price: product.price,
    rating: product.rating, color: product.color, tint: product.tint, description: product.description,
    isNew: product.is_new, hot: product.hot, stock: product.stock, imageFile: null, imageUrl: product.image ?? null,
  });
  uploadFile.value = null;
  imagePreview.value = product.image ?? null;
  showForm.value = true;
}

function getErrorMessage(cause: unknown, fallback: string) {
  const raw = cause instanceof Error ? cause.message : "";
  const code = raw.split(":")[0];
  const messages: Record<string, string> = {
    PRODUCT_NOT_FOUND: "Không tìm thấy sản phẩm.",
    OUT_OF_STOCK: "Không đủ tồn kho.",
    INVALID_ORDER_ITEM: "Dữ liệu đơn hàng không hợp lệ.",
  };
  return messages[code] || raw || fallback;
}

async function loadProducts() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const { data, count } = await fetchAdminProducts({
      page: page.value, pageSize: pageSize.value, search: searchQuery.value,
      shelfSlug: filterShelf.value, formatSlug: filterFormat.value,
      sortBy: sortBy.value, sortDir: sortDir.value,
    });
    products.value = (data as MartAdminProduct[]).map((p) => ({
      ...p, image: p.image ?? getProductImageUrl(`products/${p.slug}.webp`),
    }));
    total.value = count;
  } catch (cause) {
    errorMessage.value = getErrorMessage(cause, "Không thể tải danh sách sản phẩm.");
  } finally {
    loading.value = false;
  }
}

async function saveProduct() {
  if (!form.name.trim()) { errorMessage.value = "Vui lòng nhập tên sản phẩm."; return; }
  if (!form.slug.trim()) { errorMessage.value = "Vui lòng nhập mã định danh (slug)."; return; }
  if (form.price < 0) { errorMessage.value = "Giá không được âm."; return; }

  saving.value = true;
  errorMessage.value = "";
  message.value = "";

  try {
    let imageUrl = form.imageUrl;
    if (uploadFile.value) {
      const filePath = `products/${form.slug}/${Date.now()}-${uploadFile.value.name}`;
      await uploadProductImage(filePath, uploadFile.value);
      imageUrl = getProductImageUrl(filePath);
    }

    const payload = {
      name: form.name, slug: form.slug, category_name: form.categoryName,
      format_slug: form.formatSlug, shelf_slug: form.shelfSlug, price: form.price,
      rating: form.rating, color: form.color, tint: form.tint, description: form.description,
      is_new: form.isNew, hot: form.hot, stock: form.stock, image: imageUrl,
    };

    if (editingId.value) {
      await upsertMartProduct({ ...payload, id: editingId.value });
      message.value = "Đã cập nhật sản phẩm.";
    } else {
      await upsertMartProduct(payload);
      message.value = "Đã tạo sản phẩm mới.";
    }

    showForm.value = false;
    resetForm();
    await loadProducts();
  } catch (cause) {
    errorMessage.value = getErrorMessage(cause, "Không thể lưu sản phẩm.");
  } finally {
    saving.value = false;
  }
}

async function deleteProduct(id: number, name: string) {
  if (!window.confirm(`Xóa sản phẩm "${name}"?`)) return;
  try {
    await deleteMartProduct(id);
    message.value = "Đã xóa sản phẩm.";
    await loadProducts();
  } catch (cause) {
    errorMessage.value = getErrorMessage(cause, "Không thể xóa sản phẩm.");
  }
}

function openStockEdit(product: MartAdminProduct) {
  stockEditId.value = product.id;
  stockValue.value = String(product.stock ?? 0);
}

async function saveStock() {
  const stock = Number(stockValue.value);
  if (!Number.isInteger(stock) || stock < 0) { errorMessage.value = "Tồn kho phải là số nguyên không âm."; return; }
  if (!stockEditId.value) return;
  try {
    await updateProductStock(stockEditId.value, stock);
    message.value = "Đã cập nhật tồn kho.";
    stockEditId.value = null;
    stockValue.value = "";
    await loadProducts();
  } catch (cause) {
    errorMessage.value = getErrorMessage(cause, "Không thể cập nhật tồn kho.");
  }
}

function onImageChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.[0]) return;
  uploadFile.value = input.files[0];
  imagePreview.value = URL.createObjectURL(input.files[0]);
}

function removeImage() {
  uploadFile.value = null;
  imagePreview.value = editingId.value ? form.imageUrl : null;
}

/* ---------------- Import CSV ---------------- */

const importTemplate = `name,slug,categoryName,formatSlug,shelfSlug,price,rating,color,tint,description,isNew,hot,stock,image
Khoai tây cay,khoai-tay-cay,Snack mặn,chips,snack-man,12000,4.9,#ffb82e,#f5a623,"Giòn, cay",1,0,50,
Mì ly tôm,mì-ly-tom,Snack mặn,noodles,snack-man,18000,4.8,#ef3340,#d13a1f,"Mì ly tôm",0,1,40,
`;

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map((h) => h.trim());
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => {
      obj[h] = (values[idx] ?? "").trim();
    });
    rows.push(obj);
  }
  return rows;
}

function boolVal(v: string): boolean {
  return ["1", "true", "yes", "có", "mới"].includes(String(v).trim().toLowerCase());
}

async function runImport() {
  let rows: Array<Record<string, string>> = [];
  if (importFile.value) {
    const text = await importFile.value.text();
    rows = parseCsv(text);
  } else if (importCsv.value.trim()) {
    rows = parseCsv(importCsv.value);
  } else {
    errorMessage.value = "Vui lòng dán CSV hoặc chọn file.";
    return;
  }

  importLoading.value = true;
  errorMessage.value = "";
  const result: ImportResult = { total: rows.length, success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;
    try {
      const name = r.name?.trim();
      const slug = r.slug?.trim();
      if (!name || !slug) throw new Error("Thiếu tên hoặc slug");
      if (Number(r.price) < 0) throw new Error("Giá không được âm");

      await upsertMartProduct({
        name,
        slug,
        category_name: r.categoryName?.trim() || "",
        format_slug: r.formatSlug?.trim() || "chips",
        shelf_slug: r.shelfSlug?.trim() || "snack-man",
        price: Number(r.price) || 0,
        rating: Number(r.rating) || 0,
        color: r.color?.trim() || "#ffb82e",
        tint: r.tint?.trim() || "#f5a623",
        description: r.description?.trim() || "",
        is_new: boolVal(r.isNew ?? "0"),
        hot: boolVal(r.hot ?? "0"),
        stock: Number(r.stock) || 0,
        image: r.image?.trim() || null,
      });
      result.success++;
    } catch (e) {
      result.failed++;
      result.errors.push({
        row: rowNum,
        name: r.name?.trim(),
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  importResult.value = result;
  importLoading.value = false;
  await loadProducts();
}

function closeImport() {
  showImport.value = false;
  importResult.value = null;
  importCsv.value = "";
  importFile.value = null;
}

onMounted(loadProducts);
</script>

<template>
  <div class="products-admin">
    <header class="products-header">
      <div>
        <span class="products-kicker">DOP MART · PRODUCTS</span>
        <h1>Quản lý sản phẩm</h1>
      </div>
      <div class="header-actions">
        <button class="secondary-button" @click="showImport = true"><FileText size="17" /> Import CSV</button>
        <button class="primary-button" @click="openCreate"><Plus size="17" /> Thêm sản phẩm</button>
      </div>
    </header>

    <div v-if="errorMessage" class="admin-alert error">{{ errorMessage }}</div>
    <div v-if="message" class="admin-alert success">{{ message }}</div>

    <div class="filters-bar">
      <div class="search-box"><Search size="16" /><input v-model="searchQuery" type="search" placeholder="Tìm theo tên, mã, danh mục…" @change="loadProducts" /></div>
      <select v-model="filterShelf" @change="loadProducts" class="filter-select"><option value="">Tất cả danh mục</option><option v-for="s in shelves" :key="s.value" :value="s.value">{{ s.label }}</option></select>
      <select v-model="filterFormat" @change="loadProducts" class="filter-select"><option value="">Tất cả định dạng</option><option v-for="f in formats" :key="f.value" :value="f.value">{{ f.label }}</option></select>
      <select v-model="sortBy" @change="loadProducts" class="filter-select"><option value="created_at">Mới nhất</option><option value="name">Tên (A-Z)</option><option value="price">Giá</option><option value="stock">Tồn kho</option><option value="sold">Đã bán</option></select>
      <select v-model="sortDir" @change="loadProducts" class="filter-select"><option value="desc">Giảm dần</option><option value="asc">Tăng dần</option></select>
      <button class="refresh-button" @click="loadProducts" :disabled="loading"><RefreshCw size="16" /></button>
    </div>

    <div class="table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width: 60px;">Ảnh</th>
            <th>Sản phẩm</th>
            <th style="width: 140px;">Danh mục</th>
            <th style="width: 120px;">Định dạng</th>
            <th style="width: 100px;" class="amount">Giá</th>
            <th style="width: 100px;" class="amount">Tồn kho</th>
            <th style="width: 100px;">Trạng thái</th>
            <th style="width: 200px;">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td><div class="product-avatar"><img v-if="product.image" :src="product.image" :alt="product.name" loading="lazy" /><Package v-else size="20" /></div></td>
            <td><div class="product-cell"><strong>{{ product.name }}</strong><small>{{ product.slug }}</small></div></td>
            <td>{{ product.categoryName }}</td>
            <td>{{ product.format_slug }}</td>
            <td class="amount">{{ formatCurrency(product.price) }}</td>
            <td class="amount" :class="{ 'low-stock': (product.stock ?? 0) <= 5 }">{{ product.stock ?? 0 }}</td>
            <td><span class="tag" :class="product.is_new ? 'tag-new' : product.hot ? 'tag-hot' : ''">{{ product.is_new ? "Mới" : product.hot ? "Nổi bật" : "" }}</span></td>
            <td class="actions">
              <button class="icon-button" title="Sửa" @click="openEdit(product)"><Edit size="16" /></button>
              <button class="icon-button" title="Cập nhật tồn kho" @click="openStockEdit(product)"><Image size="16" /></button>
              <button class="icon-button danger" title="Xóa" @click="deleteProduct(product.id, product.name)"><Trash2 size="16" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="products.length === 0 && !loading" class="empty-state">Chưa có sản phẩm nào.</div>

    <div class="pagination" v-if="total > 0">
      <span class="pagination-info">Trang {{ page }} / {{ totalPages }} ({{ total }} sản phẩm)</span>
      <div class="pagination-controls">
        <button class="pagination-btn" :disabled="page === 1" @click="page--; loadProducts()">Trước</button>
        <button class="pagination-btn" :disabled="page >= totalPages" @click="page++; loadProducts()">Tiếp</button>
      </div>
    </div>

    <!-- Form modal -->
    <div v-if="showForm" class="modal-layer" @click.self="showForm = false">
      <form class="modal" @submit.prevent="saveProduct">
        <div class="modal-header"><h2>{{ editingId ? "Sửa sản phẩm" : "Thêm sản phẩm mới" }}</h2><button type="button" class="icon-button" @click="showForm = false"><X size="19" /></button></div>
        <div class="form-grid">
          <label>Tên sản phẩm <span style="color:#b42318">*</span><input v-model="form.name" type="text" required placeholder="Ví dụ: Khoai tây cay bùng vị" /></label>
          <label>Mã định danh (slug) <span style="color:#b42318">*</span><input v-model="form.slug" type="text" required placeholder="khoai-tay-cay-bung-vi" /></label>
          <label>Danh mục</label><select v-model="form.categoryName" class="filter-select"><option value="Snack mặn">Snack mặn</option><option value="Đồ cay">Đồ cay</option><option value="Ngọt và bánh">Ngọt và bánh</option><option value="Snack lành mạnh">Snack lành mạnh</option><option value="Bữa nhanh">Bữa nhanh</option><option value="Đồ uống">Đồ uống</option></select>
          <label>Định dạng</label><select v-model="form.formatSlug" class="filter-select"><option v-for="f in formats" :key="f.value" :value="f.value">{{ f.label }}</option></select>
          <label>Giá (đồng)</label><input v-model.number="form.price" type="number" min="0" />
          <label>Tồn kho (tổng)</label><input v-model.number="form.stock" type="number" min="0" />
          <label>Đánh giá (0-5)</label><input v-model.number="form.rating" type="number" min="0" max="5" step="0.1" />
          <label>Màu chủ đạo</label><input v-model="form.color" type="color" />
          <label>Màu nhấn</label><input v-model="form.tint" type="color" />
          <label class="wide">Mô tả</label><textarea v-model="form.description" rows="3" placeholder="Mô tả sản phẩm…"></textarea>
          <label class="checkbox-field wide"><input type="checkbox" v-model="form.isNew" /> Sản phẩm mới</label>
          <label class="checkbox-field wide"><input type="checkbox" v-model="form.hot" /> Nổi bật</label>
          <label class="wide">Ảnh sản phẩm</label>
          <div class="image-uploader wide"><input type="file" accept="image/*" @change="onImageChange" /><div class="image-preview"><img v-if="imagePreview" :src="imagePreview" alt="preview" /><Upload v-else size="28" /><button type="button" class="remove-image" v-if="imagePreview && editingId" @click="removeImage">Xóa ảnh</button></div></div>
        </div>
        <div class="modal-footer"><button type="button" class="secondary-button" @click="showForm = false">Hủy</button><button type="submit" class="primary-button" :disabled="saving">{{ saving ? "Đang lưu…" : "Lưu sản phẩm" }}</button></div>
      </form>
    </div>

    <!-- Stock edit modal -->
    <div v-if="stockEditId" class="modal-layer" @click.self="stockEditId = null">
      <form class="modal" @submit.prevent="saveStock">
        <div class="modal-header"><h2>Cập nhật tồn kho</h2><button type="button" class="icon-button" @click="stockEditId = null"><X size="19" /></button></div>
        <div class="form-grid wide"><label>Tồn kho mới (tổng)</label><input v-model.number="stockValue" type="number" min="0" required autofocus /></div>
        <div class="modal-footer"><button type="button" class="secondary-button" @click="stockEditId = null">Hủy</button><button type="submit" class="primary-button">Cập nhật</button></div>
      </form>
    </div>

    <!-- Import CSV modal -->
    <div v-if="showImport" class="modal-layer" @click.self="closeImport">
      <form class="modal" @submit.prevent="runImport">
        <div class="modal-header"><h2>Import sản phẩm từ CSV</h2><button type="button" class="icon-button" @click="closeImport"><X size="19" /></button></div>
        <div class="form-grid wide">
          <label>Tệp CSV <span style="color:#b42318">*</span></label>
          <input type="file" accept=".csv" @change="(e) => { importFile.value = (e.target as HTMLInputElement).files?.[0] ?? null; }" />
          <small class="muted">Hoặc dán nội dung CSV bên dưới</small>
          <textarea v-model="importCsv" rows="8" placeholder="name,slug,categoryName,formatSlug,shelfSlug,price,rating,color,tint,description,isNew,hot,stock,image"></textarea>
          <details class="csv-help" style="margin-top: 8px;">
            <summary style="cursor: pointer; font-weight: 800; color: #645b53;">Mẫu CSV (nhấn để xem)</summary>
            <pre style="margin: 6px 0 0; background: #fbf9f5; border: 1px solid #d9cec1; border-radius: 8px; padding: 10px; font-size: 12px; overflow: auto;">{{ importTemplate }}</pre>
          </details>
          <small class="muted">Lưu ý: cột <code>isNew</code>, <code>hot</code> nhận 1/0. Cột <code>image</code> để trống nếu không có ảnh.</small>
        </div>
        <div class="modal-footer">
          <button type="button" class="secondary-button" @click="closeImport">Hủy</button>
          <button type="submit" class="primary-button" :disabled="importLoading">{{ importLoading ? "Đang nhập…" : "Chạy import" }}</button>
        </div>
      </form>
    </div>

    <!-- Import result modal -->
    <div v-if="importResult" class="modal-layer" @click.self="importResult = null">
      <form class="modal" style="max-width: 700px;">
        <div class="modal-header"><h2>Kết quả import</h2><button type="button" class="icon-button" @click="importResult = null"><X size="19" /></button></div>
        <div class="form-grid wide" style="gap: 12px;">
          <div style="background:#e8f7ea;border:1px solid #b9e3cc;border-radius:10px;padding:16px;">
            <div style="font-size:12px;color:#216b37;font-weight:800;text-transform:uppercase;letter-spacing:.1em;">Thành công</div>
            <div style="font-size:32px;font-weight:900;color:#191919;">{{ importResult.success }}</div>
          </div>
          <div v-if="importResult.failed > 0" style="background:#fff0ef;border:1px solid #f5c6bf;border-radius:10px;padding:16px;">
            <div style="font-size:12px;color:#9b211a;font-weight:800;text-transform:uppercase;letter-spacing:.1em;">Thất bại</div>
            <div style="font-size:32px;font-weight:900;color:#191919;">{{ importResult.failed }}</div>
          </div>
          <div v-if="importResult.failed > 0">
            <label style="font-size:12px;font-weight:800;color:#645b53;">Chi tiết lỗi</label>
            <ul style="margin:8px 0 0;padding-left:18px;color:#191919;font-size:13px;max-height:200px;overflow:auto;border:1px solid #d9cec1;border-radius:8px;background:#fff;padding:10px;">
              <li v-for="err in importResult.errors" :key="err.row">
                Dòng {{ err.row }}<span v-if="err.name" style="color:#645b53;font-weight:600;"> ({{ err.name }})</span>: {{ err.error }}
              </li>
            </ul>
          </div>
        </div>
        <div class="modal-footer"><button type="button" class="primary-button" @click="importResult = null; closeImport()">Đóng</button></div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.products-admin { max-width: 1200px; margin: 0 auto; padding: 24px; }
.products-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.products-header div { display: flex; flex-direction: column; gap: 4px; }
.products-kicker { color: #7b6f64; font-size: 10px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
.products-header h1 { margin: 0; font-size: clamp(28px, 4vw, 36px); font-weight: 900; letter-spacing: -.02em; }
.header-actions { display: flex; gap: 10px; }
.primary-button, .secondary-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; border: 2px solid var(--ink, #191919); border-radius: 12px; padding: 0 18px; color: var(--ink, #191919); font-weight: 900; cursor: pointer; transition: transform .15s, box-shadow .15s; }
.primary-button { background: var(--ink, #191919); color: #fff; box-shadow: 3px 3px 0 var(--ink, #191919); }
.primary-button:hover:not(:disabled) { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 var(--ink, #191919); }
.primary-button:disabled { opacity: .6; cursor: not-allowed; }
.secondary-button { background: #fff; }
.secondary-button:hover { background: #f1e9dc; }
.refresh-button { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #d9cec1; border-radius: 10px; background: #fff; padding: 8px 12px; color: #645b53; cursor: pointer; font-size: 12px; }
.refresh-button:disabled { opacity: .5; cursor: not-allowed; }
.filters-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 14px; }
.search-box { display: flex; align-items: center; gap: 8px; border: 1.5px solid #c8beb2; border-radius: 10px; background: #fff; padding: 8px 12px; min-width: 220px; }
.search-box input { width: 100%; border: 0; outline: 0; background: transparent; font: inherit; font-size: 13px; }
.filter-select { border: 1.5px solid #c8beb2; border-radius: 10px; background: #fff; padding: 8px 12px; font: inherit; font-size: 13px; color: #191919; cursor: pointer; min-width: 150px; }
.admin-alert { border-radius: 10px; padding: 10px 14px; font-size: 13px; font-weight: 700; margin-bottom: 12px; }
.admin-alert.error { background: #fff0ef; color: #9b211a; border: 1px solid #f5c6bf; }
.admin-alert.success { background: #e8f7ea; color: #216b37; border: 1px solid #b9e3cc; }
.table-wrap { overflow-x: auto; border: 1.5px solid #d9cec1; border-radius: 18px; background: #fffdf7; margin-bottom: 16px; }
.admin-table { width: 100%; min-width: 900px; border-collapse: collapse; font-size: 13px; }
.admin-table th { padding: 14px 16px; border-bottom: 1.5px solid #d9cec1; color: #756a61; font-size: 11px; letter-spacing: .07em; text-align: left; text-transform: uppercase; }
.admin-table td { padding: 14px 16px; border-bottom: 1px solid #ebe2d8; vertical-align: middle; }
.product-cell { display: flex; align-items: center; gap: 10px; }
.product-cell strong, .product-cell small { display: block; }
.product-cell small { margin-top: 3px; color: #8a7f74; font-size: 11px; }
.product-avatar { display: grid; place-items: center; width: 44px; height: 44px; overflow: hidden; border-radius: 12px; background: #f1e9dc; color: #191919; }
.product-avatar img { width: 100%; height: 100%; object-fit: cover; }
.amount { font-variant-numeric: tabular-nums; font-weight: 900; white-space: nowrap; }
.low-stock { color: #b42318; }
.tag { display: inline-flex; margin-right: 5px; border-radius: 999px; padding: 4px 8px; font-size: 10px; font-weight: 900; }
.tag-new { background: #e0f2fe; color: #075985; }
.tag-hot { background: #ffe4e6; color: #9f1239; }
.actions { display: flex; justify-content: flex-end; gap: 6px; }
.icon-button { display: inline-grid; place-items: center; width: 34px; height: 34px; border: 1px solid #d9cec1; border-radius: 9px; background: transparent; color: #645b53; cursor: pointer; }
.icon-button:hover { background: #f1e9dc; color: #191919; }
.icon-button.danger:hover { background: #fff1f0; color: #b42318; }
.empty-state { min-height: 120px; color: #8a7f74; text-align: center; }
.pagination { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
.pagination-info { color: #645b53; font-size: 13px; font-weight: 800; }
.pagination-controls { display: flex; gap: 8px; }
.pagination-btn { border: 1.5px solid #c8beb2; border-radius: 10px; background: #fff; padding: 6px 14px; font: inherit; font-weight: 800; cursor: pointer; color: #191919; }
.pagination-btn:disabled { opacity: .5; cursor: not-allowed; }
.modal-layer { position: fixed; inset: 0; z-index: 30; display: grid; place-items: center; background: rgb(25 25 25 / .4); padding: 20px; }
.modal { width: min(760px, 95%); max-height: 90svh; overflow: auto; border: 2px solid var(--ink, #191919); border-radius: 20px; background: #fffdf7; box-shadow: 7px 7px 0 var(--ink, #191919); padding: 24px; }
.modal-header, .modal-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.modal-header h2 { margin: 7px 0 0; font-family: var(--font-display); font-size: 32px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
.form-grid label { display: grid; gap: 7px; color: #645b53; font-size: 12px; font-weight: 800; }
.form-grid input:not([type='checkbox']), .form-grid select, .form-grid textarea { width: 100%; border: 1.5px solid #c8beb2; border-radius: 10px; background: #fff; padding: 10px 11px; color: #191919; font: inherit; font-weight: 500; }
.form-grid input[type='color'] { width: 100%; height: 40px; border: 0; background: transparent; }
.wide { grid-column: 1 / -1; }
.checkbox-field { display: flex !important; align-items: center; grid-template-columns: auto 1fr; gap: 8px !important; }
.modal-footer { justify-content: flex-end; margin-top: 20px; border-top: 1px solid #ded5ca; padding-top: 18px; }
.image-uploader { border: 2px dashed #c8beb2; border-radius: 12px; padding: 16px; text-align: center; background: #fbf9f5; position: relative; }
.image-uploader input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; z-index: 2; }
.image-preview { position: relative; display: inline-block; }
.image-preview img { max-width: 160px; max-height: 160px; border-radius: 10px; border: 1px solid #d9cec1; }
.remove-image { margin-top: 8px; font-size: 11px; font-weight: 800; color: #b42318; background: transparent; border: 0; cursor: pointer; padding: 0; }
.csv-help pre { margin: 6px 0 0; background: #fbf9f5; border: 1px solid #d9cec1; border-radius: 8px; padding: 10px; font-size: 12px; overflow: auto; }
.muted { color: #8a7f74; font-size: 12px; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; background: #f1e9dc; padding: 2px 6px; border-radius: 4px; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 760px) { .products-admin { padding: 12px; } .filters-bar { flex-direction: column; align-items: stretch; } .form-grid { grid-template-columns: 1fr; } .products-header { flex-direction: column; align-items: stretch; } .header-actions { width: 100%; justify-content: space-between; } }
</style>
