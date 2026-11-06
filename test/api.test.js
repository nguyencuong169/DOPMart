'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

// Dùng thư mục dữ liệu tạm để không ảnh hưởng dữ liệu thật.
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'dopmart-test-'));
process.env.DOP_DATA_DIR = TMP_DIR;
process.env.NODE_ENV = 'test';

const { handleRequest } = require('../src/app');

let server;
let baseUrl;

test.before(async () => {
  server = http.createServer((req, res) => {
    handleRequest(req, res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
});

function createClient() {
  let cookie = '';

  async function request(method, url, body) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (cookie) headers.Cookie = cookie;

    const response = await fetch(baseUrl + url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (typeof response.headers.getSetCookie === 'function') {
      for (const value of response.headers.getSetCookie()) {
        if (value.startsWith('dop_session=')) cookie = value.split(';')[0];
      }
    }

    const text = await response.text();
    let parsed = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch (error) {
        parsed = text;
      }
    }
    return { status: response.status, body: parsed, headers: response.headers };
  }

  return {
    get: (url) => request('GET', url),
    post: (url, body) => request('POST', url, body === undefined ? {} : body),
    patch: (url, body) => request('PATCH', url, body === undefined ? {} : body),
    del: (url) => request('DELETE', url),
    get cookie() {
      return cookie;
    },
  };
}

async function loginAs(email, password) {
  const client = createClient();
  const result = await client.post('/api/auth/login', { email, password });
  assert.equal(result.status, 200, `đăng nhập ${email} thất bại: ${JSON.stringify(result.body)}`);
  return client;
}

/* ------------------------------ Khởi động ---------------------------- */

test('GET /api/health trả về trạng thái ok', async () => {
  const client = createClient();
  const result = await client.get('/api/health');
  assert.equal(result.status, 200);
  assert.equal(result.body.status, 'ok');
  assert.equal(result.body.name, 'DOP Mart API');
});

test('GET /api/config trả về cấu hình cửa hàng', async () => {
  const client = createClient();
  const result = await client.get('/api/config');
  assert.equal(result.status, 200);
  assert.equal(result.body.storeName, 'DOP Mart');
  assert.equal(result.body.freeShippingThreshold, 500000);
  assert.equal(result.body.shippingFee, 25000);
  assert.ok(result.body.categories.length >= 8);
  assert.ok(result.body.coupons.some((coupon) => coupon.code === 'DOP10'));
});

test('GET /api/categories trả về số lượng sản phẩm mỗi danh mục', async () => {
  const client = createClient();
  const { status, body } = await client.get('/api/categories');
  assert.equal(status, 200);
  assert.ok(body.items.length >= 8);
  const total = body.items.reduce((sum, item) => sum + item.productCount, 0);
  assert.equal(total, 24);
});
/* ------------------------------- Sản phẩm ---------------------------- */

test('GET /api/products hỗ trợ tìm kiếm, lọc, sắp xếp và phân trang', async () => {
  const client = createClient();

  const all = await client.get('/api/products?limit=50');
  assert.equal(all.status, 200);
  assert.equal(all.body.total, 24);

  const search = await client.get('/api/products?q=gao');
  assert.equal(search.body.total, 2, 'tìm "gao" không dấu phải khớp sản phẩm Gạo');

  const accented = await client.get('/api/products?q=' + encodeURIComponent('sữa'));
  assert.ok(accented.body.total >= 2);

  const category = await client.get('/api/products?category=rau-cu');
  assert.ok(category.body.total >= 4);
  assert.ok(category.body.items.every((item) => item.category === 'rau-cu'));

  const cheap = await client.get('/api/products?sort=price-asc&limit=3');
  const prices = cheap.body.items.map((item) => item.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));

  const page2 = await client.get('/api/products?limit=5&page=2');
  assert.equal(page2.body.page, 2);
  assert.equal(page2.body.limit, 5);
  assert.equal(page2.body.items.length, 5);
  assert.equal(page2.body.totalPages, Math.ceil(page2.body.total / 5));

  const featured = await client.get('/api/products?featured=true');
  assert.ok(featured.body.total > 0);
  assert.ok(featured.body.items.every((item) => item.featured === true));

  const priceRange = await client.get('/api/products?min=0&max=20000');
  assert.ok(priceRange.body.items.every((item) => item.price <= 20000));
  assert.equal(priceRange.body.total, 4, 'các sản phẩm dưới 20.000₫: trà xanh, muối, rau cải, kem đánh răng');
});

test('GET /api/products/:id trả về chi tiết và sản phẩm liên quan', async () => {
  const client = createClient();
  const { status, body } = await client.get('/api/products/gao-st25-5kg');
  assert.equal(status, 200);
  assert.equal(body.product.name, 'Gạo ST25 thơm ngon 5kg');
  assert.ok(body.related.length > 0);
  assert.ok(body.related.every((item) => item.id !== 'gao-st25-5kg'));

  const missing = await client.get('/api/products/khong-ton-tai');
  assert.equal(missing.status, 404);
});

/* -------------------------------- Giỏ hàng --------------------------- */

test('Giỏ hàng: thêm, cập nhật, áp mã giảm giá và xoá sản phẩm', async () => {
  const client = createClient();

  const added = await client.post('/api/cart', { productId: 'gao-st25-5kg', quantity: 1 });
  assert.equal(added.status, 201);
  assert.equal(added.body.count, 1);
  assert.equal(added.body.subtotal, 225000);
  assert.equal(added.body.shippingFee, 25000);
  assert.equal(added.body.total, 250000);
  assert.ok(client.cookie, 'phải tạo cookie phiên cho khách');

  const added2 = await client.post('/api/cart', { productId: 'sua-tuoi-vinamilk-1l', quantity: 1 });
  assert.equal(added2.body.count, 2);
  assert.equal(added2.body.subtotal, 261000);

  const updated = await client.patch('/api/cart/gao-st25-5kg', { quantity: 2 });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.count, 3);
  assert.equal(updated.body.subtotal, 486000);

  const coupon = await client.post('/api/cart/coupon', { code: 'dop10' });
  assert.equal(coupon.status, 200);
  assert.equal(coupon.body.coupon.code, 'DOP10');
  assert.equal(coupon.body.discount, 48600);
  assert.equal(coupon.body.total, 486000 - 48600 + 25000);

  const invalidCoupon = await client.post('/api/cart/coupon', { code: 'SAIMa' });
  assert.equal(invalidCoupon.status, 400);

  const removed = await client.del('/api/cart/sua-tuoi-vinamilk-1l');
  assert.equal(removed.status, 200);
  assert.equal(removed.body.count, 2);

  const tooMany = await client.patch('/api/cart/gao-st25-5kg', { quantity: 9999 });
  assert.equal(tooMany.status, 409);

  const cleared = await client.del('/api/cart');
  assert.equal(cleared.status, 200);
  assert.equal(cleared.body.count, 0);
  assert.equal(cleared.body.coupon, null);
});

test('Giỏ hàng: từ chối sản phẩm không tồn tại và vượt tồn kho', async () => {
  const client = createClient();
  const missing = await client.post('/api/cart', { productId: 'khong-co', quantity: 1 });
  assert.equal(missing.status, 404);

  const tooMany = await client.post('/api/cart', { productId: 'gao-st25-5kg', quantity: 1000 });
  assert.equal(tooMany.status, 409);

  const invalidQty = await client.post('/api/cart', { productId: 'gao-st25-5kg', quantity: 0 });
  assert.equal(invalidQty.status, 400);
});

/* ------------------------------- Đơn hàng ---------------------------- */

test('Khách vãng lai đặt hàng: miễn phí ship, trừ tồn kho, tra cứu được đơn', async () => {
  const client = createClient();
  const guest = createClient();

  const before = await client.get('/api/products/gao-st25-5kg');
  const stockBefore = before.body.product.stock;

  await client.post('/api/cart', { productId: 'gao-st25-5kg', quantity: 3 });
  const order = await client.post('/api/orders', {
    fullName: 'Trần Thị B',
    phone: '0987654321',
    address: '45 Nguyễn Huệ, Quận 1',
    city: 'TP. Hồ Chí Minh',
    paymentMethod: 'cod',
  });

  assert.equal(order.status, 201);
  assert.equal(order.body.order.subtotal, 675000);
  assert.equal(order.body.order.shippingFee, 0, 'đơn từ 500.000₫ phải miễn phí vận chuyển');
  assert.equal(order.body.order.total, 675000);
  assert.equal(order.body.order.status, 'pending');
  assert.equal(order.body.order.guestKey, undefined, 'không được lộ khoá phiên của khách');
  assert.match(order.body.order.code, /^DH\d+$/);

  const code = order.body.order.code;
  const after = await client.get('/api/products/gao-st25-5kg');
  assert.equal(after.body.product.stock, stockBefore - 3);

  const cart = await client.get('/api/cart');
  assert.equal(cart.body.count, 0, 'giỏ hàng phải được xoá sau khi đặt');

  const ownLookup = await client.get(`/api/orders/${code}`);
  assert.equal(ownLookup.status, 200);
  assert.equal(ownLookup.body.order.code, code);

  const otherLookup = await guest.get(`/api/orders/${code}`);
  assert.equal(otherLookup.status, 401, 'người khác không được xem đơn của khách vãng lai');
});

test('Đặt hàng: kiểm tra dữ liệu giao hàng và giỏ trống', async () => {
  const client = createClient();

  const emptyOrder = await client.post('/api/orders', {
    fullName: 'Nguyễn Văn C',
    phone: '0912345678',
    address: '12 Lê Lợi, Quận 1',
    city: 'TP. Hồ Chí Minh',
  });
  assert.equal(emptyOrder.status, 400);
  assert.match(emptyOrder.body.error, /trống/i);

  await client.post('/api/cart', { productId: 'muoi-bien-500g', quantity: 1 });

  const badPhone = await client.post('/api/orders', {
    fullName: 'Nguyễn Văn C',
    phone: 'abc',
    address: '12 Lê Lợi, Quận 1',
    city: 'TP. Hồ Chí Minh',
  });
  assert.equal(badPhone.status, 400);

  const badCity = await client.post('/api/orders', {
    fullName: 'Nguyễn Văn C',
    phone: '0912345678',
    address: '12 Lê Lợi, Quận 1',
  });
  assert.equal(badCity.status, 400);

  const badPayment = await client.post('/api/orders', {
    fullName: 'Nguyễn Văn C',
    phone: '0912345678',
    address: '12 Lê Lợi, Quận 1',
    city: 'TP. Hồ Chí Minh',
    paymentMethod: 'bitcoin',
  });
  assert.equal(badPayment.status, 400);
});

test('Khách đã đăng nhập: xem danh sách đơn và huỷ đơn hoàn kho', async () => {
  const client = await loginAs('khach@dopmart.vn', 'Khach@123');

  const productBefore = await client.get('/api/products/trung-ga-hop-10');
  const stockBefore = productBefore.body.product.stock;

  await client.post('/api/cart', { productId: 'trung-ga-hop-10', quantity: 2 });
  const created = await client.post('/api/orders', {
    fullName: 'Khách Hàng Mẫu',
    phone: '0912345678',
    address: 'Số 25 Đường Nguyễn Trãi, Quận 5',
    city: 'TP. Hồ Chí Minh',
    paymentMethod: 'bank',
  });
  assert.equal(created.status, 201);
  const code = created.body.order.code;

  const list = await client.get('/api/orders');
  assert.equal(list.status, 200);
  assert.ok(list.body.items.some((item) => item.code === code));

  const cancelled = await client.post(`/api/orders/${code}/cancel`);
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.body.order.status, 'cancelled');

  const productAfter = await client.get('/api/products/trung-ga-hop-10');
  assert.equal(productAfter.body.product.stock, stockBefore, 'huỷ đơn phải hoàn lại tồn kho');

  const cancelAgain = await client.post(`/api/orders/${code}/cancel`);
  assert.equal(cancelAgain.status, 400);
});

/* -------------------------------- Xác thực --------------------------- */

test('Đăng ký tài khoản mới và đăng nhập', async () => {
  const client = createClient();

  const register = await client.post('/api/auth/register', {
    name: 'Người Dùng Mới',
    email: 'newuser@dopmart.vn',
    password: 'MatKhau123',
  });
  assert.equal(register.status, 201);
  assert.equal(register.body.user.email, 'newuser@dopmart.vn');
  assert.equal(register.body.user.role, 'customer');
  assert.equal(register.body.user.password, undefined, 'không được trả về mật khẩu');
  assert.ok(client.cookie);

  const me = await client.get('/api/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.user.name, 'Người Dùng Mới');
  assert.equal(me.body.isAdmin, false);

  const duplicate = await createClient().post('/api/auth/register', {
    name: 'Người Dùng Mới',
    email: 'newuser@dopmart.vn',
    password: 'MatKhau123',
  });
  assert.equal(duplicate.status, 409);

  const badEmail = await createClient().post('/api/auth/register', {
    name: 'Sai Email',
    email: 'sai-email',
    password: 'MatKhau123',
  });
  assert.equal(badEmail.status, 400);

  const shortPassword = await createClient().post('/api/auth/register', {
    name: 'Mật Khẩu Ngắn',
    email: 'short@dopmart.vn',
    password: '123',
  });
  assert.equal(shortPassword.status, 400);

  const okLogin = await createClient().post('/api/auth/login', {
    email: 'newuser@dopmart.vn',
    password: 'MatKhau123',
  });
  assert.equal(okLogin.status, 200);

  const wrong = await createClient().post('/api/auth/login', {
    email: 'newuser@dopmart.vn',
    password: 'sai-mat-khau',
  });
  assert.equal(wrong.status, 401);

  const logout = await client.post('/api/auth/logout');
  assert.equal(logout.status, 200);
  const meAfter = await createClient().get('/api/auth/me');
  assert.equal(meAfter.body.user, null);
});

/* -------------------------------- Quản trị -------------------------- */

test('Quản trị: phân quyền, thống kê và quản lý sản phẩm/đơn hàng', async () => {
  const customer = await loginAs('khach@dopmart.vn', 'Khach@123');
  const forbidden = await customer.get('/api/admin/stats');
  assert.equal(forbidden.status, 403);

  const admin = await loginAs('admin@dopmart.vn', 'Admin@123');
  const me = await admin.get('/api/auth/me');
  assert.equal(me.body.isAdmin, true);

  const statResult = await admin.get('/api/admin/stats');
  assert.equal(statResult.status, 200);
  assert.ok(statResult.body.stats.orderCount >= 2);
  assert.ok(statResult.body.stats.productCount >= 20);
  assert.ok(statResult.body.stats.revenue > 0);
  assert.ok(Array.isArray(statResult.body.stats.lowStock));

  const created = await admin.post('/api/admin/products', {
    name: 'Nước mắm thử nghiệm',
    category: 'gia-vi',
    price: 88000,
    stock: 12,
    unit: 'chai 750ml',
    emoji: '🍶',
    description: 'Sản phẩm dùng cho kiểm thử tự động.',
    tags: ['thử nghiệm'],
    featured: true,
  });
  assert.equal(created.status, 201);
  const newId = created.body.product.id;
  assert.equal(created.body.product.price, 88000);
  assert.equal(created.body.product.featured, true);

  const patched = await admin.patch(`/api/admin/products/${newId}`, { price: 99000, stock: 7 });
  assert.equal(patched.status, 200);
  assert.equal(patched.body.product.price, 99000);
  assert.equal(patched.body.product.stock, 7);
  assert.equal(patched.body.product.name, 'Nước mắm thử nghiệm', 'PATCH không được ghi đè trường không gửi');

  const invalidCategory = await admin.post('/api/admin/products', {
    name: 'Sản phẩm sai danh mục',
    category: 'khong-ton-tai',
    price: 1000,
    stock: 1,
  });
  assert.equal(invalidCategory.status, 400);

  const invalidPrice = await admin.post('/api/admin/products', {
    name: 'Sản phẩm sai giá',
    category: 'do-kho',
    price: 0,
    stock: 1,
  });
  assert.equal(invalidPrice.status, 400);

  const adminList = await admin.get('/api/admin/products?limit=60');
  assert.ok(adminList.body.items.some((item) => item.id === newId));

  const hidden = await admin.del(`/api/admin/products/${newId}`);
  assert.equal(hidden.status, 200);

  const anon = createClient();
  const hiddenAnon = await anon.get(`/api/products/${newId}`);
  assert.equal(hiddenAnon.status, 404, 'sản phẩm đã ẩn không hiển thị với khách');

  const hiddenAdmin = await admin.get(`/api/products/${newId}`);
  assert.equal(hiddenAdmin.status, 200, 'quản trị vẫn xem được sản phẩm đã ẩn');
  assert.equal(hiddenAdmin.body.product.active, false);

  const orders = await admin.get('/api/admin/orders');
  assert.equal(orders.status, 200);
  assert.ok(orders.body.items.length >= 2);
  assert.ok(orders.body.items.every((order) => order.guestKey === undefined));

  const target = orders.body.items.find((order) => order.status !== 'cancelled');
  const shipped = await admin.patch(`/api/admin/orders/${target.code}`, { status: 'shipping' });
  assert.equal(shipped.status, 200);
  assert.equal(shipped.body.order.status, 'shipping');
  assert.ok(shipped.body.order.statusHistory.some((entry) => entry.status === 'shipping'));

  const badStatus = await admin.patch(`/api/admin/orders/${target.code}`, { status: 'khong-hop-le' });
  assert.equal(badStatus.status, 400);

  const customers = await admin.get('/api/admin/customers');
  assert.equal(customers.status, 200);
  assert.ok(customers.body.items.some((item) => item.email === 'khach@dopmart.vn'));

  const anonAdmin = createClient();
  const unauthorized = await anonAdmin.get('/api/admin/orders');
  assert.equal(unauthorized.status, 401);
});

/* ------------------------------ Giao diện ---------------------------- */

test('Phục vụ giao diện tĩnh và chặn truy cập ngoài thư mục public', async () => {
  const home = await fetch(`${baseUrl}/`);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-type'), /text\/html/);
  const html = await home.text();
  assert.match(html, /DOP Mart/);
  assert.match(html, /\/js\/app\.js/);

  const css = await fetch(`${baseUrl}/css/styles.css`);
  assert.equal(css.status, 200);
  assert.match(css.headers.get('content-type'), /text\/css/);

  const script = await fetch(`${baseUrl}/js/api.js`);
  assert.equal(script.status, 200);
  assert.match(script.headers.get('content-type'), /javascript/);

  const spaRoute = await fetch(`${baseUrl}/products`);
  assert.equal(spaRoute.status, 200);
  assert.match(await spaRoute.text(), /DOP Mart/);

  const unknownApi = await fetch(`${baseUrl}/api/khong-ton-tai`);
  assert.equal(unknownApi.status, 404);

  const traversal = await fetch(`${baseUrl}/%2e%2e/src/db.js`);
  assert.equal(traversal.status, 404, 'không được để lộ mã nguồn ngoài thư mục public');

  const wrongMethod = await fetch(`${baseUrl}/api/health`, { method: 'DELETE' });
  assert.equal(wrongMethod.status, 405);
});

