'use strict';

/**
 * Ứng dụng HTTP của DOP Mart: REST API + phục vụ giao diện tĩnh.
 * Không sử dụng thư viện ngoài, chỉ dùng các module có sẵn của Node.js.
 */

const fs = require('node:fs');
const path = require('node:path');

const db = require('./db');
const auth = require('./auth');
const CATEGORIES = require('./seed').CATEGORIES;
const {
  HttpError,
  readJson,
  parseCookies,
  sessionCookie,
  normalizeEmail,
  cleanString,
  formatVnd,
} = require('./utils');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const COOKIE_NAME = 'dop_session';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const routes = [];

function route(method, pattern, handler) {
  const keys = [];
  const source = pattern
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  routes.push({ method, regex: new RegExp(`^${source}/?$`), keys, handler });
}

function respond(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  };
  res.writeHead(status, headers);
  res.end(body);
}

function createContext(req, res, url) {
  const cookies = parseCookies(req);
  const rawToken = cookies[COOKIE_NAME] || null;
  const session = rawToken ? db.getSession(rawToken) : null;
  const token = session ? rawToken : null;
  const user = session && session.userId ? db.findUserById(session.userId) : null;

  return {
    req,
    res,
    url,
    params: {},
    query: url.searchParams,
    body: {},
    token,
    session,
    user,
    setCookies: [],
    ensureSession() {
      if (this.token) return this.token;
      const created = db.createSession(null);
      this.token = created.token;
      this.session = created;
      this.setCookies.push(sessionCookie(created.token, 7 * 24 * 60 * 60));
      return created.token;
    },
  };
}

function requireUser(ctx) {
  if (!ctx.user) throw new HttpError(401, 'Vui lòng đăng nhập để tiếp tục');
  return ctx.user;
}

function requireAdmin(ctx) {
  const user = requireUser(ctx);
  if (user.role !== 'admin') throw new HttpError(403, 'Bạn không có quyền truy cập chức năng này');
  return user;
}

/** Loại bỏ dữ liệu nội bộ (khoá phiên của khách) trước khi trả về cho client. */
function publicOrder(order) {
  if (!order) return order;
  const clone = { ...order };
  delete clone.guestKey;
  return clone;
}

const ok = (body, status = 200) => ({ status, body });

/* ------------------------------------------------------------------ */
/* Tuyến đường công khai                                               */
/* ------------------------------------------------------------------ */

route('GET', '/api/health', () =>
  ok({
    status: 'ok',
    name: 'DOP Mart API',
    version: '1.0.0',
    time: new Date().toISOString(),
  }),
);

route('GET', '/api/config', () =>
  ok({
    storeName: 'DOP Mart',
    freeShippingThreshold: db.FREE_SHIPPING_THRESHOLD,
    shippingFee: db.SHIPPING_FEE,
    freeShippingText: `Miễn phí giao hàng cho đơn từ ${formatVnd(db.FREE_SHIPPING_THRESHOLD)}`,
    coupons: Object.values(db.COUPONS).map(({ code, label }) => ({ code, label })),
    categories: CATEGORIES,
    orderStatuses: db.ORDER_STATUSES,
  }),
);

route('GET', '/api/categories', () => {
  const items = CATEGORIES.map((category) => ({
    ...category,
    productCount: db.listProducts({ category: category.id, limit: 1 }).total,
  }));
  return ok({ items });
});

route('GET', '/api/products', (ctx) => {
  const result = db.listProducts({
    q: ctx.query.get('q') || '',
    category: ctx.query.get('category') || '',
    tag: ctx.query.get('tag') || '',
    sort: ctx.query.get('sort') || 'popular',
    min: ctx.query.get('min'),
    max: ctx.query.get('max'),
    featured: ctx.query.get('featured'),
    page: ctx.query.get('page'),
    limit: ctx.query.get('limit'),
  });
  return ok(result);
});

route('GET', '/api/products/:id', (ctx) => {
  const product = db.findProduct(ctx.params.id);
  const isAdmin = Boolean(ctx.user && ctx.user.role === 'admin');
  if (!product || (product.active === false && !isAdmin)) throw new HttpError(404, 'Không tìm thấy sản phẩm');
  const related = db
    .listProducts({ category: product.category, limit: 5 })
    .items.filter((item) => item.id !== product.id)
    .slice(0, 4);
  return ok({ product, related });
});

/* ------------------------------------------------------------------ */
/* Xác thực                                                            */
/* ------------------------------------------------------------------ */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateRegister(body) {
  const name = cleanString(body.name, 80);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (name.length < 2) throw new HttpError(400, 'Vui lòng nhập họ tên (ít nhất 2 ký tự)');
  if (!EMAIL_PATTERN.test(email)) throw new HttpError(400, 'Email không hợp lệ');
  const problem = auth.passwordProblem(password);
  if (problem) throw new HttpError(400, problem);

  return { name, email, password, phone: cleanString(body.phone, 20), address: cleanString(body.address, 200) };
}

function startUserSession(ctx, user) {
  if (ctx.token) {
    db.attachUserToSession(ctx.token, user.id);
    return ctx.token;
  }
  const session = db.createSession(user.id);
  ctx.token = session.token;
  ctx.setCookies.push(sessionCookie(session.token, 7 * 24 * 60 * 60));
  return session.token;
}

route('POST', '/api/auth/register', (ctx) => {
  const data = validateRegister(ctx.body);
  if (db.findUserByEmail(data.email)) throw new HttpError(409, 'Email này đã được sử dụng');

  const user = db.createUser({
    name: data.name,
    email: data.email,
    passwordHash: auth.hashPassword(data.password),
    phone: data.phone,
    address: data.address,
  });
  const token = startUserSession(ctx, user);
  return ok({ user: db.publicUser(user), cart: db.cartSummary(token) }, 201);
});

route('POST', '/api/auth/login', (ctx) => {
  const email = normalizeEmail(ctx.body.email);
  const password = String(ctx.body.password || '');
  if (!email || !password) throw new HttpError(400, 'Vui lòng nhập email và mật khẩu');

  const user = db.findUserByEmail(email);
  if (!user || !auth.verifyPassword(password, user.password)) {
    throw new HttpError(401, 'Email hoặc mật khẩu không đúng');
  }
  const token = startUserSession(ctx, user);
  return ok({ user: db.publicUser(user), cart: db.cartSummary(token) });
});

route('POST', '/api/auth/logout', (ctx) => {
  if (ctx.token) db.deleteSession(ctx.token);
  ctx.setCookies.push(sessionCookie('', 0));
  return ok({ loggedOut: true });
});

route('GET', '/api/auth/me', (ctx) => {
  const cart = ctx.token ? db.cartSummary(ctx.token) : null;
  return ok({
    user: db.publicUser(ctx.user),
    cartCount: cart ? cart.count : 0,
    isAdmin: Boolean(ctx.user && ctx.user.role === 'admin'),
  });
});

route('PUT', '/api/auth/profile', (ctx) => {
  const user = requireUser(ctx);
  const name = cleanString(ctx.body.name, 80);
  const phone = cleanString(ctx.body.phone, 20);
  const address = cleanString(ctx.body.address, 200);
  if (name && name.length < 2) throw new HttpError(400, 'Họ tên quá ngắn');
  if (phone && !/^\+?\d{9,12}$/.test(phone.replace(/[\s.-]/g, ''))) {
    throw new HttpError(400, 'Số điện thoại không hợp lệ');
  }

  const updated = db.updateUser(user.id, { name: name || user.name, phone, address });
  return ok({ user: db.publicUser(updated) });
});

/* ------------------------------------------------------------------ */
/* Giỏ hàng                                                            */
/* ------------------------------------------------------------------ */

route('GET', '/api/cart', (ctx) => {
  if (!ctx.token) {
    return ok({
      items: [],
      count: 0,
      subtotal: 0,
      discount: 0,
      shippingFee: 0,
      total: 0,
      coupon: null,
      freeShippingThreshold: db.FREE_SHIPPING_THRESHOLD,
      amountToFreeShipping: db.FREE_SHIPPING_THRESHOLD,
    });
  }
  return ok(db.cartSummary(ctx.token));
});

route('POST', '/api/cart', (ctx) => {
  const token = ctx.ensureSession();
  const productId = cleanString(ctx.body.productId || ctx.body.id, 120);
  if (!productId) throw new HttpError(400, 'Thiếu thông tin sản phẩm');
  const cart = db.addToCart(token, productId, ctx.body.quantity === undefined ? 1 : ctx.body.quantity);
  return ok(cart, 201);
});

route('PATCH', '/api/cart/:productId', (ctx) => {
  const token = ctx.ensureSession();
  const cart = db.updateCartItem(token, ctx.params.productId, ctx.body.quantity);
  return ok(cart);
});

route('DELETE', '/api/cart/:productId', (ctx) => {
  const token = ctx.ensureSession();
  return ok(db.removeCartItem(token, ctx.params.productId));
});

route('DELETE', '/api/cart', (ctx) => {
  const token = ctx.ensureSession();
  db.clearCart(token);
  return ok(db.cartSummary(token));
});

route('POST', '/api/cart/coupon', (ctx) => {
  const token = ctx.ensureSession();
  return ok(db.applyCoupon(token, ctx.body.code));
});

/* ------------------------------------------------------------------ */
/* Đơn hàng                                                            */
/* ------------------------------------------------------------------ */

route('POST', '/api/orders', (ctx) => {
  const token = ctx.ensureSession();
  const body = ctx.body || {};
  const shipping = body.shipping || {
    fullName: body.fullName,
    phone: body.phone,
    address: body.address,
    city: body.city,
    note: body.note,
  };
  const order = db.createOrder({
    token,
    userId: ctx.user ? ctx.user.id : null,
    shipping,
    paymentMethod: body.paymentMethod || 'cod',
    note: body.note || '',
  });
  return ok({ order: publicOrder(order), orderCode: order.code }, 201);
});

route('GET', '/api/orders', (ctx) => {
  const user = requireUser(ctx);
  return ok({ items: db.listOrders({ userId: user.id, status: ctx.query.get('status') || '' }).map(publicOrder) });
});

route('GET', '/api/orders/:code', (ctx) => {
  const order = db.findOrder(ctx.params.code);
  if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');

  const isAdmin = Boolean(ctx.user && ctx.user.role === 'admin');
  const isOwner = Boolean(ctx.user && order.userId && order.userId === ctx.user.id);
  const isGuestOwner = Boolean(
    !order.userId && order.guestKey && ctx.token && order.guestKey === db.tokenFingerprint(ctx.token),
  );

  if (!isOwner && !isAdmin && !isGuestOwner) {
    throw new HttpError(401, 'Vui lòng đăng nhập hoặc dùng đúng trình duyệt đã đặt đơn để xem đơn hàng này');
  }
  return ok({ order: publicOrder(order) });
});

route('POST', '/api/orders/:code/cancel', (ctx) => {
  const user = requireUser(ctx);
  const order = db.findOrder(ctx.params.code);
  if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  if (order.userId !== user.id) throw new HttpError(403, 'Bạn không có quyền huỷ đơn hàng này');
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new HttpError(400, 'Đơn hàng đang được xử lý, không thể huỷ');
  }
  return ok({ order: publicOrder(db.updateOrderStatus(order.code, 'cancelled')) });
});

/* ------------------------------------------------------------------ */
/* Quản trị                                                            */
/* ------------------------------------------------------------------ */

function validateProductPayload(body, { partial = false } = {}) {
  const name = cleanString(body.name, 200);
  const category = cleanString(body.category, 50);
  const price = Number(body.price);
  const stock = Number(body.stock);
  const unit = cleanString(body.unit, 40);
  const emoji = cleanString(body.emoji, 8);
  const description = cleanString(body.description, 1000);
  const tags = Array.isArray(body.tags)
    ? body.tags.map((tag) => cleanString(tag, 30)).filter(Boolean).slice(0, 8)
    : cleanString(body.tags, 200)
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 8);

  if (!partial || body.name !== undefined) {
    if (name.length < 2) throw new HttpError(400, 'Tên sản phẩm quá ngắn');
  }
  if (!partial || body.category !== undefined) {
    if (!CATEGORIES.some((item) => item.id === category)) throw new HttpError(400, 'Danh mục không hợp lệ');
  }
  if (!partial || body.price !== undefined) {
    if (!Number.isFinite(price) || price <= 0) throw new HttpError(400, 'Giá sản phẩm phải lớn hơn 0');
  }
  if (!partial || body.stock !== undefined) {
    if (!Number.isFinite(stock) || stock < 0) throw new HttpError(400, 'Số lượng tồn kho không hợp lệ');
  }

  return {
    name,
    category,
    price,
    stock,
    unit,
    emoji: emoji || '🛍️',
    description,
    tags,
    oldPrice: body.oldPrice ? Number(body.oldPrice) : null,
    featured: body.featured === true || body.featured === 'true',
    active: body.active === undefined ? true : body.active !== false && body.active !== 'false',
  };
}

function buildProductPatch(body) {
  const payload = validateProductPayload(body, { partial: true });
  const patch = {};
  for (const key of ['name', 'category', 'price', 'stock', 'unit', 'emoji', 'description', 'tags']) {
    if (body[key] !== undefined) patch[key] = payload[key];
  }
  if (body.oldPrice !== undefined) patch.oldPrice = payload.oldPrice;
  if (body.featured !== undefined) patch.featured = payload.featured;
  if (body.active !== undefined) patch.active = payload.active;
  return patch;
}


route('GET', '/api/admin/stats', (ctx) => {
  requireAdmin(ctx);
  return ok({ stats: db.stats() });
});

route('GET', '/api/admin/orders', (ctx) => {
  requireAdmin(ctx);
  return ok({ items: db.listOrders({ status: ctx.query.get('status') || '', limit: Number(ctx.query.get('limit')) || 100 }).map(publicOrder) });
});

route('PATCH', '/api/admin/orders/:code', (ctx) => {
  requireAdmin(ctx);
  const order = db.findOrder(ctx.params.code);
  if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  const status = cleanString(ctx.body.status, 30);
  if (!db.ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Trạng thái không hợp lệ');
  return ok({ order: publicOrder(db.updateOrderStatus(order.code, status)) });
});

route('GET', '/api/admin/products', (ctx) => {
  requireAdmin(ctx);
  const result = db.listProducts({
    includeInactive: true,
    limit: Number(ctx.query.get('limit')) || 60,
    q: ctx.query.get('q') || '',
    category: ctx.query.get('category') || '',
    sort: ctx.query.get('sort') || 'name-asc',
  });
  return ok(result);
});

route('POST', '/api/admin/products', (ctx) => {
  requireAdmin(ctx);
  const payload = validateProductPayload(ctx.body);
  return ok({ product: db.createProduct(payload) }, 201);
});

route('PATCH', '/api/admin/products/:id', (ctx) => {
  requireAdmin(ctx);
  const existing = db.findProduct(ctx.params.id);
  if (!existing) throw new HttpError(404, 'Không tìm thấy sản phẩm');
  const product = db.updateProduct(existing.id, buildProductPatch(ctx.body));
  return ok({ product });
});

route('DELETE', '/api/admin/products/:id', (ctx) => {
  requireAdmin(ctx);
  const existing = db.findProduct(ctx.params.id);
  if (!existing) throw new HttpError(404, 'Không tìm thấy sản phẩm');
  db.deleteProduct(existing.id);
  return ok({ deleted: true, id: existing.id });
});

route('POST', '/api/coupons/validate', (ctx) => {
  const code = String(ctx.body.code || '').trim().toUpperCase();
  const coupon = db.COUPONS[code];
  if (!coupon) throw new HttpError(400, 'Mã giảm giá không hợp lệ');
  return ok({ code: coupon.code, label: coupon.label, valid: true });
});

route('GET', '/api/admin/customers', (ctx) => {
  requireAdmin(ctx);
  return ok({ items: db.listCustomers() });
});

/* ------------------------------------------------------------------ */
/* Tệp tĩnh & bộ điều phối                                             */
/* ------------------------------------------------------------------ */

function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    pathname = '/';
  }
  if (pathname.includes('\0')) return false;
  if (pathname === '/') pathname = '/index.html';

  let filePath = path.join(PUBLIC_DIR, path.normalize(pathname));
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) return false;

  let stat = null;
  try {
    stat = fs.statSync(filePath);
  } catch {
    stat = null;
  }

  if (!stat || !stat.isFile()) {
    if (path.extname(pathname)) return false;
    filePath = path.join(PUBLIC_DIR, 'index.html');
    if (!fs.existsSync(filePath)) return false;
  }

  const ext = path.extname(filePath).toLowerCase();
  const data = fs.readFileSync(filePath);
  res.writeHead(200, {
    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    'Content-Length': data.length,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=300',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  res.end(req.method === 'HEAD' ? undefined : data);
  return true;
}

async function handleRequest(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  try {
    if (!url.pathname.startsWith('/api/')) {
      if (serveStatic(req, res, url)) return;
      return respond(res, 404, { error: 'Không tìm thấy trang' });
    }

    const ctx = createContext(req, res, url);
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      ctx.body = await readJson(req);
    }

    let pathMatched = false;
    for (const entry of routes) {
      const match = entry.regex.exec(url.pathname);
      if (!match) continue;
      pathMatched = true;
      if (entry.method !== req.method) continue;

      entry.keys.forEach((key, index) => {
        try {
          ctx.params[key] = decodeURIComponent(match[index + 1]);
        } catch {
          ctx.params[key] = match[index + 1];
        }
      });

      const result = await entry.handler(ctx);
      const headers = ctx.setCookies.length ? { 'Set-Cookie': ctx.setCookies } : {};
      return respond(res, result.status || 200, result.body, headers);
    }

    if (pathMatched) return respond(res, 405, { error: 'Phương thức không được hỗ trợ' });
    return respond(res, 404, { error: 'Không tìm thấy API' });
  } catch (error) {
    if (error instanceof HttpError) {
      return respond(res, error.status, { error: error.message, details: error.details });
    }
    console.error('[dopmart] Lỗi xử lý yêu cầu:', error);
    return respond(res, 500, { error: 'Đã xảy ra lỗi phía máy chủ' });
  }
}

module.exports = { handleRequest, routes, PUBLIC_DIR, MIME_TYPES };



