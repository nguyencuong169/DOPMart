<script setup>
import { ref, onMounted } from "vue";
import { supabase, uploadProductImage, getProductImageUrl } from "@/lib/supabase";
import { imageOfFormat } from "@/data/products";
import { Search, Plus, Edit, Trash2, Save, X, Package } from "lucide-vue-next";

const products = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const showForm = ref(false);
const editing = ref(null);
const form = ref({
  name: "", slug: "", category: "", categoryName: "", price: null,
  format: "chips", shelf: "snack-man", color: "#ffb82e", tint: "#f5a623",
  description: "", isNew: false, hot: false, stock14: 0, stock20: 0, image: null, rating: 0,
});

const formats = [
  { slug: "chips", name: "Bim bim" }, { slug: "noodles", name: "Mì & đồ ăn liền" },
  { slug: "instant", name: "Xúc xích" }, { slug: "chocolate", name: "Chocolate" },
  { slug: "drinks", name: "Nước uống" }, { slug: "spicy", name: "Đồ cay" },
  { slug: "candy", name: "Kẹo" }, { slug: "healthy", name: "Snack lành mạnh" },
];

const shelves = [
  { slug: "snack-man", name: "Snack mặn" }, { slug: "do-cay", name: "Đồ cay" },
  { slug: "ngot", name: "Ngọt & bánh" }, { slug: "healthy", name: "Snack lành mạnh" },
  { slug: "bua-nhanh", name: "Bụp cơm" }, { slug: "do-uong", name: "Đồ uống" },
];

const loadProducts = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase.from("products").select("*").order("id", { ascending: true });
    if (error) throw error;
    products.value = (data || []).map((p) => ({ ...p, isNew: Boolean(p.is_new), hot: Boolean(p.hot), image: imageOfFormat[p.format_slug] }));
  } catch (e) {
    alert("Lỗi tải sản phẩm: " + e.message);
  } finally { loading.value = false; }
};

const filteredProducts = ref([]);
const filterProducts = () => {
  const q = searchQuery.value.toLowerCase();
  filteredProducts.value = products.value.filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
};

const openCreate = () => {
  editing.value = null;
  form.value = { name: "", slug: "", category: "", categoryName: "", price: null, format: "chips", shelf: "snack-man", color: "#ffb82e", tint: "#f5a623", description: "", isNew: false, hot: false, stock14: 0, stock20: 0, image: null };
  showForm.value = true;
};

const openEdit = (p) => {
  editing.value = p.id;
  form.value = {
    name: p.name, slug: p.slug, category: p.shelf_slug, categoryName: p.category_name, price: p.price,
    format: p.format_slug, shelf: p.shelf_slug, color: p.color, tint: p.tint, description: p.description,
    isNew: Boolean(p.is_new), hot: Boolean(p.hot), stock14: p.stock_floor_14, stock20: p.stock_floor_20, image: p.image, rating: p.rating,
  };
  showForm.value = true;
};

const saveProduct = async () => {
  let imageUrl = form.value.image;
  if (imageFile.value) {
    const filePath = `products/${Date.now()}_${imageFile.value.name.replace(/\s+/g, "_")}`;
    const { error: upErr } = await uploadProductImage(filePath, imageFile.value);
    if (upErr) throw upErr;
    imageUrl = getProductImageUrl(filePath);
  }
  const payload = {
    name: form.value.name,
    slug: form.value.slug || form.value.name.toLowerCase().replace(/\s+/g, "-"),
    format_slug: form.value.format, shelf_slug: form.value.shelf,
    category_name: form.value.categoryName || form.value.shelf,
    price: Number(form.value.price) || 0, color: form.value.color, tint: form.value.tint,
    description: form.value.description, is_new: Boolean(form.value.isNew), hot: Boolean(form.value.hot),
    rating: Number(form.value.rating) || 0,
    stock_floor_14: Number(form.value.stock14) || 0, stock_floor_20: Number(form.value.stock20) || 0,
    tags: [], notes: [],
    image: imageUrl,
  };
  try {
    if (editing.value) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.value);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) throw error;
    }
    showForm.value = false;
    await loadProducts();
  } catch (e) { alert("Lỗi lưu sản phẩm: " + e.message); }
};

const deleteProduct = async (id) => {
  if (!confirm("Xóa sản phẩm này?")) return;
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    await loadProducts();
  } catch (e) { alert("Lỗi xóa sản phẩm: " + e.message); }
};

const formatCurrency = (v) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v || 0);

const imageFile = ref(null);
const imagePreview = ref(null);

const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Vui lòng chọn file ảnh (jpg, png, webp)");
    return;
  }
  imageFile.value = file;
  imagePreview.value = URL.createObjectURL(file);
};

onMounted(() => {
  loadProducts().then(filterProducts);
});
</script>

<template>
  <div class="admin-products">
    <div class="page-header">
      <h1 class="page-title">Quản lý sản phẩm</h1>
      <button class="btn btn--primary" @click="openCreate">
        <Plus :size="18" /> Thêm sản phẩm
      </button>
    </div>

    <div class="search-bar">
      <Search :size="18" class="search-icon" />
      <input v-model="searchQuery" @input="filterProducts" placeholder="Tìm sản phẩm..." class="search-input" />
    </div>

    <div class="table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:60px">Ảnh</th>
            <th>Tên sản phẩm</th>
            <th>Danh mục</th>
            <th style="width:120px">Giá</th>
            <th style="width:130px">Tồn kho (14/20)</th>
            <th class="text-center" style="width:100px">Mới / Hot</th>
            <th class="text-center" style="width:110px">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filteredProducts" :key="p.id">
            <td>
              <div class="product-avatar" :style="{ backgroundColor: p.color }">
                <img v-if="p.image" :src="p.image" :alt="p.name" class="product-image" />
                <Package v-else :size="16" />
              </div>
            </td>
            <td>{{ p.name }}</td>
            <td><span class="badge">{{ p.category_name }}</span></td>
            <td class="mono">{{ formatCurrency(p.price) }}</td>
            <td class="mono text-muted">{{ p.stock_floor_14 }} / {{ p.stock_floor_20 }}</td>
            <td class="text-center">
              <span v-if="p.isNew" class="badge badge--success">Mới</span>
              <span v-else-if="p.hot" class="badge badge--warning">Hot</span>
              <span v-else class="badge text-muted">—</span>
            </td>
            <td class="text-center actions">
              <button class="icon-btn" @click="openEdit(p)" title="Sửa"><Edit :size="16" /></button>
              <button class="icon-btn icon-btn--danger" @click="deleteProduct(p.id)" title="Xóa"><Trash2 :size="16" /></button>
            </td>
          </tr>
          <tr v-if="filteredProducts.length === 0"><td colspan="7" class="empty">Không tìm thấy sản phẩm nào</td></tr>
        </tbody>
      </table>
    </div>

    <Transition name="fade">
      <div v-if="showForm" class="modal-overlay" @click="showForm = false"></div>
    </Transition>
    <Transition name="slide-fade">
      <div v-if="showForm" class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editing ? "Sửa sản phẩm" : "Thêm sản phẩm mới" }}</h3>
          <button class="modal-close" @click="showForm = false"><X :size="20" /></button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-field">
              <label class="form-label">Tên sản phẩm</label>
              <input v-model="form.name" class="form-input" placeholder="Ví dụ: Khoai tây cay" />
            </div>
            <div class="form-field">
              <label class="form-label">Slug</label>
              <input v-model="form.slug" class="form-input" placeholder="khoai-tay-cay" />
            </div>
            <div class="form-field">
              <label class="form-label">Danh mục (shelf)</label>
              <select v-model="form.shelf" class="form-select">
                <option v-for="s in shelves" :key="s.slug" :value="s.slug">{{ s.name }}</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Định dạng (format)</label>
              <select v-model="form.format" class="form-select">
                <option v-for="f in formats" :key="f.slug" :value="f.slug">{{ f.name }}</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Giá (VNĐ)</label>
              <input type="number" v-model.number="form.price" class="form-input" />
            </div>
            <div class="form-field">
              <label class="form-label">Đánh giá (0–5)</label>
              <input type="number" v-model.number="form.rating" min="0" max="5" step="0.1" class="form-input" />
            </div>
            <div class="form-field">
              <label class="form-label">Màu sắc</label>
              <input type="color" v-model="form.color" class="form-color" />
            </div>
            <div class="form-field span-2">
              <label class="form-label">Màu nhấn (tint)</label>
              <input type="color" v-model="form.tint" class="form-color" />
            </div>
            <div class="form-field">
              <label class="form-label">Tồn kho tầng 14</label>
              <input type="number" v-model.number="form.stock14" class="form-input" />
            </div>
            <div class="form-field">
              <label class="form-label">Tồn kho tầng 20</label>
              <input type="number" v-model.number="form.stock20" class="form-input" />
            </div>
            <div class="form-field span-2">
              <label class="form-label">Mô tả</label>
              <textarea v-model="form.description" class="form-input" rows="3"></textarea>
            </div>
            <div class="form-field span-2">
              <label class="form-label">Ảnh sản phẩm</label>
              <input type="file" accept="image/*" @change="handleImageChange" class="form-input" />
              <div v-if="imagePreview || form.image" class="image-preview-wrap">
                <img :src="imagePreview || form.image" :alt="form.name" class="preview-img" />
              </div>
              <p class="form-hint">Chọn ảnh mới để upload (jpg, png, webp)</p>
            </div>
            <div class="form-field span-2 form-toggle">
              <label class="form-label">Trạng thái</label>
              <div class="toggle-row">
                <label class="toggle-item"><input type="checkbox" v-model="form.isNew" /> Mới</label>
                <label class="toggle-item"><input type="checkbox" v-model="form.hot" /> Hot</label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="showForm = false">Hủy</button>
          <button class="btn btn--primary" @click="saveProduct"><Save :size="16" /> {{ editing ? "Cập nhật" : "Tạo mới" }}</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.admin-products {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--foreground, #1a1a1a);
  margin: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
}

.btn--primary {
  background: var(--flame, #ff5a1f);
  color: #ffffff;
  border-color: var(--flame, #ff5a1f);
}

.btn--primary:hover {
  opacity: 0.9;
}

.btn {
  background: var(--background, #ffffff);
  color: var(--foreground, #1a1a1a);
  border-color: var(--border, #e5e7eb);
}

.btn:hover {
  background: var(--muted, #f3f4f6);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--muted, #f9fafb);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 10px;
  width: 320px;
}

.search-icon {
  color: var(--muted-foreground, #9ca3af);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.875rem;
  color: var(--foreground, #1a1a1a);
}

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

.admin-table tr:last-child td { border-bottom: none; }

.product-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.text-center { text-align: center; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.8125rem; }
.text-muted { color: var(--muted-foreground, #6b7280); }

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge--success { background: var(--green-ink, #156b3d); color: #ffffff; }
.badge--warning { background: var(--red-ink, #b81f2b); color: #ffffff; }
.badge.text-muted { background: var(--muted, #f3f4f6); color: var(--muted-foreground, #9ca3af); }

.actions { gap: 0.5rem; }
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  color: var(--muted-foreground, #6b7280);
}
.icon-btn:hover { background: var(--muted, #f3f4f6); }
.icon-btn--danger:hover { background: #fef2f2; color: #b91c1c; }

.empty {
  text-align: center;
  padding: 2rem;
  color: var(--muted-foreground, #9ca3af);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.4);
  backdrop-filter: blur(2px);
  z-index: 50;
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(720px, 92vw);
  max-height: 85vh;
  background: var(--popover, #ffffff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 12px;
  box-shadow: var(--shadow-2, 0 10px 15px -3px rgb(0 0 0 / 0.1));
  z-index: 51;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translate(-50%, -40%); }
  to { opacity: 1; transform: translate(-50%, -50%); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border, #e5e7eb);
}

.modal-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--foreground, #1a1a1a);
  margin: 0;
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  color: var(--muted-foreground, #6b7280);
}
.modal-close:hover { background: var(--muted, #f3f4f6); }

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-field.span-2 { grid-column: span 2; }

.form-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--muted-foreground, #6b7280);
  margin-bottom: 0.375rem;
}

.form-input, .form-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 8px;
  background: var(--background, #ffffff);
  color: var(--foreground, #1a1a1a);
  font-size: 0.875rem;
  outline: none;
}
.form-input:focus, .form-select:focus { border-color: var(--flame, #ff5a1f); }

.form-color {
  width: 100%;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: none;
  cursor: pointer;
}

.toggle-row {
  display: flex;
  gap: 1rem;
  margin-top: 0.25rem;
}

.toggle-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--foreground, #1a1a1a);
  cursor: pointer;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--border, #e5e7eb);
  background: var(--muted, #f9fafb);
}

.image-preview-wrap {
  margin-top: 0.5rem;
}
.preview-img {
  width: 120px;
  height: 120px;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 10px;
  object-fit: cover;
  background: var(--muted, #f3f4f6);
}
.form-hint {
  font-size: 0.75rem;
  color: var(--muted-foreground, #9ca3af);
  margin-top: 0.25rem;
}
</style>