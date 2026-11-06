'use strict';

/**
 * Lớp dữ liệu của DOP Mart.
 * Dữ liệu lưu trong một tệp JSON (mặc định data/db.json), ghi nguyên tử
 * (ghi tệp tạm rồi đổi tên) để tránh hỏng dữ liệu.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const seed = require('./seed');
const { HttpError, slugify } = require('./utils');

const DATA_DIR = process.env.DOP_DATA_DIR
  ? path.resolve(process.env.DOP_DATA_DIR)
  : path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const FREE_SHIPPING_THRESHOLD = 500000;
const SHIPPING_FEE = 25000;

const COUPONS = {
  DOP10: { code: 'DOP10', type: 'percent', value: 10, maxDiscount: 50000, label: 'Giảm 10% (tối đa 50.000₫)' },
  FREESHIP: { code: 'FREESHIP', type: 'shipping', value: 0, maxDiscount: SHIPPING_FEE, label: 'Miễn phí vận chuyển' },
};

const ORDER_STATUSES = ['pending', 'confirmed', 'packing', 'shipping', 'delivered', 'cancelled'];

let state = null;

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function nowIso() {
  return new Date().toISOString();
}

function emptyState() {
  return {
    version: 1,
    createdAt: nowIso(),
    products: seed.products(),
    users: seed.users(),
    orders: [],
    sessions: [],
    carts: {},
    counters: { order: 1000 },
  };
}

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load() {
  if (state) return state;
  ensureDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      state = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (error) {
      console.error('[db] Không đọc được data/db.json, khởi tạo dữ liệu mới:', error.message);
      state = emptyState();
    }
  } else {
    state = emptyState();
  }

  const base = emptyState();
  for (const key of Object.keys(base)) {
    if (state[key] === undefined) state[key] = base[key];
  }
  if (!Array.isArray(state.products) || state.products.length === 0) state.products = seed.products();
  if (!Array.isArray(state.users) || state.users.length === 0) state.users = seed.users();
  if (!Array.isArray(state.orders)) state.orders = [];
  if (!Array.isArray(state.sessions)) state.sessions = [];
  if (!state.carts || typeof state.carts !== 'object' || Array.isArray(state.carts)) state.carts = {};
  if (!state.counters || typeof state.counters.order !== 'number') {
    state.counters = { order: 1000, ...(state.counters || {}) };
  }

  pruneSessions();
  save();
  return state;
}

function save() {
  if (!state) return;
  ensureDir();
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

/* ------------------------------------------------------------------ */
/* Người dùng & phiên đăng nhập                                        */
/* ------------------------------------------------------------------ */

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    address: user.address || '',
    role: user.role || 'customer',
    createdAt: user.createdAt,
  };
}

function findUserByEmail(email) {
  load();
  const value = String(email || '').trim().toLowerCase();
  return state.users.find((user) => user.email.toLowerCase() === value) || null;
}

function findUserById(id) {
  load();
  return state.users.find((user) => user.id === id) || null;
}

function createUser({ name, email, passwordHash, phone, address }) {
  load();
  const user = {
    id: newId('usr'),
    name,
    email: String(email).trim().toLowerCase(),
    password: passwordHash,
    phone: phone || '',
    address: address || '',
    role: 'customer',
    createdAt: nowIso(),
  };
  state.users.push(user);
  save();
  return user;
}

function updateUser(id, patch = {}) {
  load();
  const user = findUserById(id);
  if (!user) return null;
  for (const key of ['name', 'phone', 'address']) {
    if (patch[key] !== undefined) user[key] = String(patch[key]).trim();
  }
  if (patch.password) user.password = patch.password;
  save();
  return user;
}


function pruneSessions() {
  const now = Date.now();
  const before = state.sessions.length;
  state.sessions = state.sessions.filter((session) => session.expiresAt > now);
  if (state.sessions.length !== before) {
    const alive = new Set(state.sessions.map((session) => session.token));
    for (const token of Object.keys(state.carts)) {
      if (!alive.has(token)) delete state.carts[token];
    }
  }
}

function createSession(userId = null) {
  load();
  const session = {
    token: crypto.randomBytes(32).toString('hex'),
    userId: userId || null,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  state.sessions.push(session);
  save();
  return session;
}

function getSession(token) {
  load();
  if (!token) return null;
  const session = state.sessions.find((item) => item.token === token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    deleteSession(token);
    return null;
  }
  return session;
}

function attachUserToSession(token, userId) {
  const session = getSession(token);
  if (!session) return null;
  session.userId = userId;
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  save();
  return session;
}

function deleteSession(token) {
  if (!state || !token) return;
  const index = state.sessions.findIndex((item) => item.token === token);
  if (index === -1) return;
  state.sessions.splice(index, 1);
  save();
}

/* ------------------------------------------------------------------ */
/* Sản phẩm                                                            */
/* ------------------------------------------------------------------ */

function normalizeProduct(product) {
  return {
    id: product.id,
    slug: product.slug || product.id,
    name: product.name,
    category: product.category,
    price: Number(product.price) || 0,
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
    unit: product.unit || '',
    stock: Number.isFinite(Number(product.stock)) ? Number(product.stock) : 0,
    emoji: product.emoji || '🛍️',
    image: product.image || '',
    description: product.description || '',
    tags: Array.isArray(product.tags) ? product.tags : [],
    featured: Boolean(product.featured),
    active: product.active !== false,
    createdAt: product.createdAt || nowIso(),
  };
}

function findProduct(idOrSlug) {
  load();
  const key = String(idOrSlug || '');
  if (!key) return null;
  const normalized = key.toLowerCase();
  return (
    state.products.find((product) => product.id === key) ||
    state.products.find((product) => String(product.slug).toLowerCase() === normalized) ||
    null
  );
}

function foldText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function listProducts(query = {}) {
  load();
  const search = String(query.q || '').trim().toLowerCase();
  const foldedSearch = foldText(search);
  const category = String(query.category || '').trim();
  const tag = String(query.tag || '').trim().toLowerCase();
  const sort = String(query.sort || 'popular');
  const hasMin = query.min !== undefined && query.min !== null && query.min !== '';
  const hasMax = query.max !== undefined && query.max !== null && query.max !== '';
  const min = hasMin ? Number(query.min) : null;
  const max = hasMax ? Number(query.max) : null;
  const includeInactive = query.includeInactive === true || query.includeInactive === 'true';
  const featuredOnly = query.featured === true || query.featured === 'true';
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(60, Math.max(1, Number.parseInt(query.limit, 10) || 12));

  let items = state.products.filter((product) => (includeInactive ? true : product.active !== false));

  if (search) {
    items = items.filter((product) => {
      const haystack = [product.name, product.description, ...(product.tags || [])].join(' ');
      return haystack.toLowerCase().includes(search) || foldText(haystack).includes(foldedSearch);
    });
  }
  if (category && category !== 'all') {
    items = items.filter((product) => product.category === category);
  }
  if (tag) {
    items = items.filter((product) => (product.tags || []).some((value) => String(value).toLowerCase() === tag));
  }
  if (Number.isFinite(min)) items = items.filter((product) => product.price >= min);
  if (Number.isFinite(max)) items = items.filter((product) => product.price <= max);
  if (featuredOnly) items = items.filter((product) => product.featured);

  const sorters = {
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    'name-asc': (a, b) => a.name.localeCompare(b.name, 'vi'),
    newest: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
    popular: (a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name, 'vi'),
  };
  items = items.slice().sort(sorters[sort] || sorters.popular);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  return { items: items.slice(start, start + limit), total, page, limit, totalPages };
}

function createProduct(payload) {
  load();
  const baseSlug = slugify(payload.slug || payload.name) || newId('sp');
  let slug = baseSlug;
  let suffix = 1;
  while (state.products.some((product) => product.slug === slug)) {
    slug = `${baseSlug}-${suffix++}`;
  }
  const product = normalizeProduct({ ...payload, id: slug, slug, createdAt: nowIso() });
  state.products.push(product);
  save();
  return product;
}

function updateProduct(id, patch) {
  load();
  const product = findProduct(id);
  if (!product) return null;
  const allowed = ['name', 'category', 'price', 'oldPrice', 'unit', 'stock', 'emoji', 'image', 'description', 'tags', 'featured', 'active'];
  for (const key of allowed) {
    if (patch[key] !== undefined) product[key] = patch[key];
  }
  Object.assign(product, normalizeProduct(product));
  save();
  return product;
}

function deleteProduct(id) {
  load();
  const product = findProduct(id);
  if (!product) return false;
  product.active = false;
  save();
  return true;
}

/* ------------------------------------------------------------------ */
/* Giỏ hàng                                                            */
/* ------------------------------------------------------------------ */

function getCart(token) {
  load();
  if (!state.carts[token]) {
    state.carts[token] = { items: [], couponCode: null, updatedAt: nowIso() };
  }
  const cart = state.carts[token];
  if (!Array.isArray(cart.items)) cart.items = [];
  return cart;
}

function parseQuantity(value) {
  const quantity = Number.parseInt(value, 10);
  if (!Number.isFinite(quantity) || quantity < 1) {
    throw new HttpError(400, 'Số lượng không hợp lệ');
  }
  return quantity;
}

function quantityLimit(product) {
  return Math.min(99, Math.max(0, product.stock));
}

function addToCart(token, productId, quantity) {
  const product = findProduct(productId);
  if (!product || product.active === false) throw new HttpError(404, 'Không tìm thấy sản phẩm');
  const qty = parseQuantity(quantity === undefined ? 1 : quantity);
  const cart = getCart(token);
  const line = cart.items.find((item) => item.productId === product.id);
  const desired = (line ? line.quantity : 0) + qty;
  if (desired > quantityLimit(product)) {
    throw new HttpError(409, `Sản phẩm "${product.name}" chỉ còn ${product.stock} ${product.unit}`.trim());
  }
  if (line) {
    line.quantity = desired;
  } else {
    cart.items.push({ productId: product.id, quantity: qty, addedAt: nowIso() });
  }
  cart.updatedAt = nowIso();
  save();
  return cartSummary(token);
}

function updateCartItem(token, productId, quantity) {
  const product = findProduct(productId);
  if (!product) throw new HttpError(404, 'Không tìm thấy sản phẩm');
  const cart = getCart(token);
  const index = cart.items.findIndex((item) => item.productId === product.id);
  if (index === -1) throw new HttpError(404, 'Sản phẩm không có trong giỏ hàng');

  const qty = Number.parseInt(quantity, 10);
  if (!Number.isFinite(qty)) throw new HttpError(400, 'Số lượng không hợp lệ');
  if (qty <= 0) {
    cart.items.splice(index, 1);
  } else {
    if (qty > quantityLimit(product)) {
      throw new HttpError(409, `Sản phẩm "${product.name}" chỉ còn ${product.stock} ${product.unit}`.trim());
    }
    cart.items[index].quantity = qty;
  }
  cart.updatedAt = nowIso();
  save();
  return cartSummary(token);
}

function removeCartItem(token, productId) {
  const cart = getCart(token);
  cart.items = cart.items.filter((item) => item.productId !== productId);
  cart.updatedAt = nowIso();
  save();
  return cartSummary(token);
}

function clearCart(token) {
  const cart = getCart(token);
  cart.items = [];
  cart.couponCode = null;
  cart.updatedAt = nowIso();
  save();
  return cart;
}

function applyCoupon(token, code) {
  const cart = getCart(token);
  const value = String(code || '').trim().toUpperCase();
  if (!value) {
    cart.couponCode = null;
    save();
    return cartSummary(token);
  }
  if (!COUPONS[value]) throw new HttpError(400, 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
  if (cart.items.length === 0) throw new HttpError(400, 'Giỏ hàng đang trống, chưa thể áp dụng mã');
  cart.couponCode = value;
  cart.updatedAt = nowIso();
  save();
  return cartSummary(token);
}

function cartSummary(token) {
  load();
  const cart = getCart(token);
  const items = [];

  for (const line of cart.items) {
    const product = state.products.find((item) => item.id === line.productId);
    if (!product || product.active === false) continue;
    const quantity = Math.max(1, Math.min(line.quantity, Math.max(product.stock, 0)));
    if (quantity <= 0) continue;
    items.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      emoji: product.emoji,
      unit: product.unit,
      stock: product.stock,
      quantity,
      lineTotal: product.price * quantity,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const coupon = cart.couponCode ? COUPONS[cart.couponCode] : null;
  let discount = 0;
  let shippingFee = 0;

  if (items.length > 0) {
    shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    if (coupon && coupon.type === 'percent') {
      discount = Math.min(Math.round((subtotal * coupon.value) / 100), coupon.maxDiscount);
    } else if (coupon && coupon.type === 'shipping') {
      shippingFee = 0;
    }
  }

  return {
    items,
    count,
    subtotal,
    discount,
    shippingFee,
    total: Math.max(0, subtotal - discount + shippingFee),
    coupon: coupon ? { code: coupon.code, label: coupon.label } : null,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    amountToFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
  };
}
/* ------------------------------------------------------------------ */
/* Đơn hàng                                                            */
/* ------------------------------------------------------------------ */

function validateShipping(shipping = {}) {
  const fullName = String(shipping.fullName || '').trim();
  const phone = String(shipping.phone || '').trim();
  const address = String(shipping.address || '').trim();
  const city = String(shipping.city || '').trim();

  if (fullName.length < 2) throw new HttpError(400, 'Vui lòng nhập họ tên người nhận');
  if (!/^\+?\d{9,12}$/.test(phone.replace(/[\s.-]/g, ''))) {
    throw new HttpError(400, 'Số điện thoại không hợp lệ (9-12 chữ số)');
  }
  if (address.length < 5) throw new HttpError(400, 'Vui lòng nhập địa chỉ giao hàng chi tiết');
  if (!city) throw new HttpError(400, 'Vui lòng chọn tỉnh/thành phố');

  return { fullName, phone, address, city, note: String(shipping.note || '').trim().slice(0, 500) };
}

function nextOrderCode() {
  state.counters.order += 1;
  return `DH${state.counters.order}`;
}

function tokenFingerprint(token) {
  if (!token) return null;
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function createOrder({ token, userId = null, shipping, paymentMethod = 'cod', note = '' }) {
  load();
  const cart = getCart(token);
  const summary = cartSummary(token);
  if (!summary.items.length) throw new HttpError(400, 'Giỏ hàng đang trống');

  const receiver = validateShipping({ ...shipping, note: note || (shipping && shipping.note) });
  if (!['cod', 'bank'].includes(paymentMethod)) {
    throw new HttpError(400, 'Phương thức thanh toán không hợp lệ');
  }

  const items = [];
  for (const item of summary.items) {
    const product = state.products.find((entry) => entry.id === item.productId);
    if (!product || product.active === false) throw new HttpError(409, `Sản phẩm "${item.name}" đã ngừng bán`);
    if (product.stock < item.quantity) {
      throw new HttpError(409, `Sản phẩm "${product.name}" chỉ còn ${product.stock} ${product.unit}`.trim());
    }
    items.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      unit: product.unit,
      emoji: product.emoji,
      lineTotal: product.price * item.quantity,
    });
  }

  for (const item of items) {
    const product = state.products.find((entry) => entry.id === item.productId);
    product.stock -= item.quantity;
  }

  const createdAt = nowIso();
  const order = {
    id: newId('ord'),
    code: nextOrderCode(),
    userId: userId || null,
    items,
    subtotal: summary.subtotal,
    discount: summary.discount,
    shippingFee: summary.shippingFee,
    total: summary.total,
    coupon: summary.coupon,
    shipping: receiver,
    paymentMethod,
    status: 'pending',
    statusHistory: [{ status: 'pending', at: createdAt }],
    guestKey: userId ? null : tokenFingerprint(token),
    createdAt,
    updatedAt: createdAt,
  };

  state.orders.push(order);
  cart.items = [];
  cart.couponCode = null;
  cart.updatedAt = createdAt;
  save();
  return order;
}

function listOrders({ userId = null, status = '', limit = 50 } = {}) {
  load();
  let orders = state.orders.slice();
  if (userId) orders = orders.filter((order) => order.userId === userId);
  if (status && status !== 'all') orders = orders.filter((order) => order.status === status);
  orders.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return orders.slice(0, Math.min(200, Math.max(1, Number(limit) || 50)));
}

function findOrder(idOrCode) {
  load();
  const key = String(idOrCode || '').toUpperCase();
  if (!key) return null;
  return state.orders.find((order) => order.code.toUpperCase() === key || order.id === idOrCode) || null;
}

function updateOrderStatus(idOrCode, status) {
  load();
  const order = findOrder(idOrCode);
  if (!order) return null;
  if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Trạng thái đơn hàng không hợp lệ');
  if (order.status === status) return order;
  if (order.status === 'cancelled') throw new HttpError(400, 'Đơn hàng đã huỷ, không thể đổi trạng thái');
  if (order.status === 'delivered') throw new HttpError(400, 'Đơn hàng đã giao, không thể đổi trạng thái');

  if (status === 'cancelled') {
    for (const item of order.items) {
      const product = state.products.find((entry) => entry.id === item.productId);
      if (product) product.stock += item.quantity;
    }
  }

  order.status = status;
  order.updatedAt = nowIso();
  order.statusHistory.push({ status, at: order.updatedAt });
  save();
  return order;
}



function listCustomers() {
  load();
  return state.users
    .filter((user) => user.role !== 'admin')
    .map((user) => ({
      ...publicUser(user),
      orderCount: state.orders.filter((order) => order.userId === user.id).length,
    }));
}

function stats() {
  load();
  const orders = state.orders;
  const valid = orders.filter((order) => order.status !== 'cancelled');
  const revenue = valid.reduce((sum, order) => sum + order.total, 0);
  const statusCounts = {};
  for (const status of ORDER_STATUSES) statusCounts[status] = 0;
  for (const order of orders) statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;

  const qtyByProduct = new Map();
  for (const order of valid) {
    for (const item of order.items) {
      const current = qtyByProduct.get(item.productId) || { name: item.name, emoji: item.emoji, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += item.lineTotal;
      qtyByProduct.set(item.productId, current);
    }
  }
  const topProducts = [...qtyByProduct.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  return {
    revenue,
    orderCount: orders.length,
    statusCounts,
    customerCount: state.users.filter((user) => user.role !== 'admin').length,
    productCount: state.products.filter((product) => product.active !== false).length,
    lowStock: state.products
      .filter((product) => product.active !== false && product.stock <= 20)
      .map((product) => ({ id: product.id, name: product.name, stock: product.stock, unit: product.unit }))
      .slice(0, 10),
    topProducts,
    averageOrderValue: valid.length ? Math.round(revenue / valid.length) : 0,
  };
}

module.exports = {
  COUPONS,
  ORDER_STATUSES,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  load,
  save,
  publicUser,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  createSession,
  getSession,
  attachUserToSession,
  deleteSession,
  findProduct,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
  cartSummary,
  createOrder,
  tokenFingerprint,
  listOrders,
  findOrder,
  updateOrderStatus,
  listCustomers,
  stats,
};

