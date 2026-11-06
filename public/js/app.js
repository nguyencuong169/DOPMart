'use strict';

/**
 * Giao diện ứng dụng DOP Mart (SPA dùng hash routing, không phụ thuộc framework).
 */

(function () {
  const app = document.getElementById('app');
  const toastRoot = document.getElementById('toast-root');
  const modalRoot = document.getElementById('modal-root');

  const state = {
    user: null,
    isAdmin: false,
    cartCount: 0,
    config: null,
    categories: [],
  };

  /* ----------------------------- Tiện ích ---------------------------- */

  function toast(message, type = 'success') {
    const node = document.createElement('div');
    node.className = `toast ${type}`;
    node.textContent = message;
    toastRoot.appendChild(node);
    setTimeout(() => {
      node.style.opacity = '0';
      node.style.transform = 'translateY(8px)';
      node.style.transition = 'all 0.25s ease';
      setTimeout(() => node.remove(), 260);
    }, 3200);
  }

  function openModal(html) {
    closeModal();
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) closeModal();
    });
    modalRoot.appendChild(backdrop);
    document.addEventListener('keydown', onModalKey);
    return backdrop;
  }

  function onModalKey(event) {
    if (event.key === 'Escape') closeModal();
  }

  function closeModal() {
    modalRoot.innerHTML = '';
    document.removeEventListener('keydown', onModalKey);
  }

  function updateCartBadge(count) {
    if (typeof count === 'number') state.cartCount = count;
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    if (state.cartCount > 0) {
      badge.hidden = false;
      badge.textContent = String(state.cartCount);
    } else {
      badge.hidden = true;
    }
  }

  function renderAccount() {
    const area = document.getElementById('account-area');
    if (!area) return;

    if (state.user) {
      const initial = (state.user.name || 'K').trim().charAt(0).toUpperCase();
      area.innerHTML = `
        <button class="account-btn" id="account-menu-btn" aria-haspopup="menu">
          <span class="avatar">${escapeHtml(initial)}</span>
          <span class="name">${escapeHtml(state.user.name.split(' ')[0])}</span>
          <span aria-hidden="true">▾</span>
        </button>`;
      document.getElementById('account-menu-btn').addEventListener('click', openAccountMenu);
    } else {
      area.innerHTML = `
        <a class="btn btn-ghost btn-sm" href="#/login">Đăng nhập</a>
        <a class="btn btn-sm" href="#/register">Đăng ký</a>`;
    }
  }

  function openAccountMenu() {
    const backdrop = openModal(`
      <h2>Xin chào, ${escapeHtml(state.user.name)}</h2>
      <p class="muted small">${escapeHtml(state.user.email)}</p>
      <div class="filter-list" style="gap:8px">
        <a href="#/orders" data-close-modal>📦 Đơn hàng của tôi</a>
        <a href="#/cart" data-close-modal>🛒 Giỏ hàng</a>
        ${state.isAdmin ? '<a href="#/admin" data-close-modal>⚙️ Trang quản trị</a>' : ''}
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost" data-close-modal>Đóng</button>
        <button class="btn btn-danger" id="logout-btn">Đăng xuất</button>
      </div>
    `);
    backdrop.querySelectorAll('[data-close-modal]').forEach((el) => el.addEventListener('click', closeModal));
    backdrop.querySelector('#logout-btn').addEventListener('click', async () => {
      try {
        await API.post('/api/auth/logout');
      } catch (error) {
        // Bỏ qua lỗi mạng, vẫn xoá trạng thái phía giao diện
      }
      state.user = null;
      state.isAdmin = false;
      closeModal();
      renderAccount();
      toast('Đã đăng xuất', 'info');
      router();
    });
  }

  function renderCategoriesNav() {
    const nav = document.getElementById('nav-categories');
    if (!nav) return;
    const items = state.categories
      .map(
        (category) =>
          `<a href="#/products?category=${encodeURIComponent(category.id)}" data-category="${escapeHtml(category.id)}">${escapeHtml(
            category.emoji,
          )} ${escapeHtml(category.name)}</a>`,
      )
      .join('');
    nav.innerHTML = `<a href="#/products" data-category="all">Tất cả sản phẩm</a>${items}`;
  }

  function markActiveNav(categoryId) {
    document.querySelectorAll('#nav-categories a').forEach((link) => {
      link.classList.toggle('active', link.dataset.category === (categoryId || 'all'));
    });
  }

  async function addToCart(productId, quantity = 1) {
    try {
      const cart = await API.post('/api/cart', { productId, quantity });
      updateCartBadge(cart.count);
      toast(`Đã thêm vào giỏ hàng (${cart.count} sản phẩm)`);
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  function productCard(product) {
    const discount = discountPercent(product);
    const slug = encodeURIComponent(product.slug || product.id);
    return `
      <article class="product-card">
        <a class="product-thumb" href="#/product/${slug}" aria-label="${escapeHtml(product.name)}">
          ${discount ? `<span class="tag-discount">-${discount}%</span>` : ''}
          ${product.stock <= 0 ? '<span class="tag-out">Tạm hết hàng</span>' : ''}
          <span>${escapeHtml(product.emoji)}</span>
        </a>
        <div class="product-body">
          <a class="product-name" href="#/product/${slug}">${escapeHtml(product.name)}</a>
          <span class="product-unit">${escapeHtml(product.unit)}</span>
          <div class="product-price">
            <span class="price">${fmtMoney(product.price)}</span>
            ${product.oldPrice ? `<span class="price-old">${fmtMoney(product.oldPrice)}</span>` : ''}
          </div>
          <div class="product-actions">
            <button class="btn btn-sm" data-add="${escapeHtml(product.id)}" ${product.stock <= 0 ? 'disabled' : ''}>
              ${product.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
            </button>
          </div>
        </div>
      </article>`;
  }

  function productGrid(products) {
    if (!products.length) {
      return `<div class="empty-state"><span class="icon">🔍</span><h2>Không tìm thấy sản phẩm</h2><p>Hãy thử từ khoá khác hoặc bỏ bớt bộ lọc.</p></div>`;
    }
    return `<div class="product-grid">${products.map(productCard).join('')}</div>`;
  }

  function statusBadge(status) {
    const meta = STATUS_META[status] || { label: status, icon: '•' };
    return `<span class="status-badge ${escapeHtml(status)}">${meta.icon} ${escapeHtml(meta.label)}</span>`;
  }

  function emptyState(icon, title, description, actionHtml = '') {
    return `<div class="empty-state">
      <span class="icon">${icon}</span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(description)}</p>
      ${actionHtml}
    </div>`;
  }

  function setLoading(text = 'Đang tải...') {
    app.innerHTML = `<div class="loading-block"><span class="spinner"></span> ${escapeHtml(text)}</div>`;
  }

  function parseRoute() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [pathPart, queryPart] = raw.split('?');
    const path = pathPart || '/';
    let query;
    try {
      query = new URLSearchParams(queryPart || '');
    } catch (error) {
      query = new URLSearchParams();
    }
    return { path, query };
  }

  function buildQuery(params) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') search.set(key, value);
    });
    const text = search.toString();
    return text ? `?${text}` : '';
  }

  /* ------------------------------ Trang chủ -------------------------- */

  async function viewHome() {
    setLoading('Đang tải trang chủ...');
    markActiveNav('all');

    const [featured, newest] = await Promise.all([
      API.get('/api/products' + buildQuery({ featured: 'true', limit: 8 })),
      API.get('/api/products' + buildQuery({ sort: 'newest', limit: 4 })),
    ]);

    const categoriesHtml = state.categories
      .map(
        (category) => `
        <a class="category-card" href="#/products?category=${encodeURIComponent(category.id)}">
          <span class="emoji" aria-hidden="true">${escapeHtml(category.emoji)}</span>
          <span class="name">${escapeHtml(category.name)}</span>
          <span class="count">${category.productCount} sản phẩm</span>
        </a>`,
      )
      .join('');

    app.innerHTML = `
      <section class="hero">
        <h1>Thực phẩm tươi sạch, giá tốt mỗi ngày</h1>
        <p>DOP Mart mang đến gạo ngon, rau củ tươi, sữa, đồ uống và đồ gia dụng chính hãng — đặt online, giao tận nhà trong 2 giờ.</p>
        <div class="hero-actions">
          <a class="btn" href="#/products">Mua sắm ngay</a>
          <a class="btn btn-ghost" href="#/products?sort=price-asc">Xem giá tốt</a>
        </div>
        <div class="hero-points">
          <span>✅ Hàng chính hãng</span>
          <span>🚚 Giao nhanh 2 giờ</span>
          <span>🔁 Đổi trả trong 24 giờ</span>
          <span>🎁 Mã giảm giá mỗi ngày</span>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <div>
            <h2>Danh mục sản phẩm</h2>
            <p>Chọn nhóm hàng bạn cần, DOP Mart giao tận nơi.</p>
          </div>
          <a class="link-more" href="#/products">Xem tất cả →</a>
        </div>
        <div class="category-grid">${categoriesHtml}</div>
      </section>

      <section class="section">
        <div class="section-head">
          <div>
            <h2>🔥 Sản phẩm nổi bật</h2>
            <p>Được khách hàng DOP Mart lựa chọn nhiều nhất tuần này.</p>
          </div>
          <a class="link-more" href="#/products">Xem tất cả →</a>
        </div>
        ${productGrid(featured.items)}
      </section>

      <section class="section">
        <div class="product-grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
          <div class="panel" style="background:linear-gradient(135deg,#fff6ec,#ffe7cc)">
            <h3>🎁 Giảm 10% đơn đầu tiên</h3>
            <p class="small">Nhập mã <strong>DOP10</strong> khi thanh toán để được giảm tối đa 50.000₫.</p>
            <a class="btn btn-orange btn-sm" href="#/products">Săn ưu đãi</a>
          </div>
          <div class="panel" style="background:linear-gradient(135deg,#eafaf1,#d5f2e2)">
            <h3>🚚 Miễn phí vận chuyển</h3>
            <p class="small">Đơn từ ${fmtMoney(state.config ? state.config.freeShippingThreshold : 500000)} được miễn phí giao hàng toàn TP.HCM.</p>
            <a class="btn btn-sm" href="#/products">Mua thêm</a>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <div>
            <h2>Mới lên kệ</h2>
            <p>Những sản phẩm vừa được DOP Mart bổ sung.</p>
          </div>
        </div>
        ${productGrid(newest.items)}
      </section>
    `;
  }

  /* ----------------------------- Sản phẩm ---------------------------- */

  const PRICE_RANGES = [
    { label: 'Dưới 50.000₫', min: 0, max: 50000 },
    { label: '50.000₫ - 150.000₫', min: 50000, max: 150000 },
    { label: '150.000₫ - 500.000₫', min: 150000, max: 500000 },
    { label: 'Trên 500.000₫', min: 500000, max: '' },
  ];

  async function viewProducts(query) {
    setLoading('Đang tải sản phẩm...');

    const q = query.get('q') || '';
    const category = query.get('category') || '';
    const sort = query.get('sort') || 'popular';
    const page = Number(query.get('page')) || 1;
    const min = query.get('min') || '';
    const max = query.get('max') || '';

    markActiveNav(category || 'all');

    const data = await API.get(
      '/api/products' + buildQuery({ q, category, sort, page, min, max, limit: 12 }),
    );

    const categoryName = category
      ? (state.categories.find((item) => item.id === category) || {}).name || 'Danh mục'
      : '';
    const title = q ? `Kết quả tìm kiếm: “${q}”` : categoryName || 'Tất cả sản phẩm';

    const categoryLinks = state.categories
      .map((item) => {
        const active = category === item.id ? 'active' : '';
        const href = '#/products' + buildQuery({ q, category: item.id, sort, min, max });
        return `<a class="${active}" href="${href}">${escapeHtml(item.emoji)} ${escapeHtml(item.name)} (${item.productCount})</a>`;
      })
      .join('');

    const priceLinks = PRICE_RANGES.map((range) => {
      const active = String(range.min) === min && String(range.max) === max ? 'active' : '';
      const href = '#/products' + buildQuery({ q, category, sort, min: range.min, max: range.max });
      return `<a class="${active}" href="${href}">${range.label}</a>`;
    }).join('');

    const sortOptions = [
      ['popular', 'Phổ biến nhất'],
      ['price-asc', 'Giá thấp đến cao'],
      ['price-desc', 'Giá cao đến thấp'],
      ['name-asc', 'Tên A → Z'],
      ['newest', 'Mới nhất'],
    ]
      .map(([value, label]) => `<option value="${value}" ${sort === value ? 'selected' : ''}>${label}</option>`)
      .join('');

    app.innerHTML = `
      <div class="page-head">
        <div>
          <h1>${escapeHtml(title)}</h1>
          <p>Tìm thấy ${data.total} sản phẩm phù hợp tại DOP Mart.</p>
        </div>
      </div>
      <div class="catalog-layout">
        <aside class="filter-panel">
          <div class="filter-group">
            <h3>Danh mục</h3>
            <div class="filter-list">
              <a class="${category ? '' : 'active'}" href="#/products${buildQuery({ q, sort, min, max })}">Tất cả</a>
              ${categoryLinks}
            </div>
          </div>
          <div class="filter-group">
            <h3>Khoảng giá</h3>
            <div class="filter-list">
              <a class="${min || max ? '' : 'active'}" href="#/products${buildQuery({ q, category, sort })}">Mọi mức giá</a>
              ${priceLinks}
            </div>
          </div>
          <div class="filter-group">
            <h3>Cần hỗ trợ?</h3>
            <p class="small muted">Gọi <strong>1900 6868</strong> (7:00 - 22:00) để được tư vấn chọn hàng.</p>
          </div>
        </aside>

        <section>
          <div class="catalog-toolbar">
            <span class="result-count">Trang ${data.page}/${data.totalPages} · ${data.total} sản phẩm</span>
            <label class="small muted">Sắp xếp
              <select id="sort-select" aria-label="Sắp xếp sản phẩm">${sortOptions}</select>
            </label>
          </div>
          ${productGrid(data.items)}
          ${renderPagination(data, { q, category, sort, min, max })}
        </section>
      </div>
    `;

    document.getElementById('sort-select').addEventListener('change', (event) => {
      location.hash = '#/products' + buildQuery({ q, category, sort: event.target.value, min, max });
    });

    app.querySelectorAll('[data-page]').forEach((button) => {
      button.addEventListener('click', () => {
        location.hash = '#/products' + buildQuery({ q, category, sort, min, max, page: button.dataset.page });
      });
    });
  }

  /* --------------------------- Chi tiết sản phẩm --------------------- */

  async function viewProduct(slug) {
    setLoading('Đang tải sản phẩm...');
    const decoded = decodeURIComponent(slug);
    const { product, related } = await API.get(`/api/products/${encodeURIComponent(decoded)}`);
    const category = state.categories.find((item) => item.id === product.category);
    const discount = discountPercent(product);
    markActiveNav(product.category);

    document.title = `${product.name} - DOP Mart`;

    app.innerHTML = `
      <nav class="breadcrumb" aria-label="Đường dẫn">
        <a href="#/">Trang chủ</a><span>/</span>
        <a href="#/products?category=${encodeURIComponent(product.category)}">${escapeHtml(category ? category.name : 'Sản phẩm')}</a><span>/</span>
        ${escapeHtml(product.name)}
      </nav>

      <article class="product-detail">
        <div class="gallery" aria-hidden="true">${escapeHtml(product.emoji)}</div>
        <div class="info">
          <h1>${escapeHtml(product.name)}</h1>
          <div class="detail-meta">
            <span class="pill">${escapeHtml(product.unit)}</span>
            ${
              product.stock > 0
                ? `<span class="pill green">Còn ${product.stock} sản phẩm</span>`
                : '<span class="pill red">Tạm hết hàng</span>'
            }
            ${discount ? `<span class="pill red">Tiết kiệm ${discount}%</span>` : ''}
            <span class="pill">Mã: ${escapeHtml(product.id)}</span>
          </div>

          <div class="detail-price">
            <span class="price">${fmtMoney(product.price)}</span>
            ${product.oldPrice ? `<span class="price-old">${fmtMoney(product.oldPrice)}</span>` : ''}
          </div>
          <p class="small muted">Đã bao gồm VAT · ${product.price >= 500000 ? 'Miễn phí vận chuyển' : `Phí vận chuyển ${fmtMoney(25000)}`}</p>

          <p class="detail-desc">${escapeHtml(product.description)}</p>

          <div class="qty-row">
            <span class="small muted">Số lượng</span>
            <div class="qty-control">
              <button type="button" data-qty-minus aria-label="Giảm số lượng">−</button>
              <input type="number" id="detail-qty" value="1" min="1" max="${Math.max(1, product.stock)}" aria-label="Số lượng" />
              <button type="button" data-qty-plus aria-label="Tăng số lượng">+</button>
            </div>
            <span class="small muted">Tối đa ${product.stock} ${escapeHtml(product.unit)}</span>
          </div>

          <div class="detail-actions">
            <button class="btn" id="detail-add" ${product.stock <= 0 ? 'disabled' : ''}>🛒 Thêm vào giỏ</button>
            <button class="btn btn-outline" id="detail-buy" ${product.stock <= 0 ? 'disabled' : ''}>Mua ngay</button>
          </div>

          <div class="assurance">
            <span>🚚 Giao nhanh 2 giờ nội thành</span>
            <span>✅ Cam kết chính hãng</span>
            <span>🔁 Đổi trả trong 24 giờ</span>
          </div>
        </div>
      </article>

      ${
        related.length
          ? `<section class="section" style="margin-top:28px">
              <div class="section-head"><div><h2>Sản phẩm cùng danh mục</h2><p>Gợi ý thêm cho giỏ hàng của bạn.</p></div></div>
              ${productGrid(related)}
            </section>`
          : ''
      }
    `;

    const qtyInput = document.getElementById('detail-qty');
    const clamp = (value) => Math.min(Math.max(1, value), Math.max(1, product.stock));

    document.querySelector('[data-qty-minus]').addEventListener('click', () => {
      qtyInput.value = String(clamp((Number(qtyInput.value) || 1) - 1));
    });
    document.querySelector('[data-qty-plus]').addEventListener('click', () => {
      qtyInput.value = String(clamp((Number(qtyInput.value) || 1) + 1));
    });
    qtyInput.addEventListener('change', () => {
      qtyInput.value = String(clamp(Number(qtyInput.value) || 1));
    });

    document.getElementById('detail-add').addEventListener('click', () => {
      addToCart(product.id, clamp(Number(qtyInput.value) || 1));
    });

    document.getElementById('detail-buy').addEventListener('click', async () => {
      await addToCart(product.id, clamp(Number(qtyInput.value) || 1));
      location.hash = '#/cart';
    });
  }

  function renderPagination(data, params) {
    if (data.totalPages <= 1) return '';
    const pages = [];
    for (let index = 1; index <= data.totalPages; index += 1) {
      pages.push(
        `<button data-page="${index}" class="${index === data.page ? 'active' : ''}" ${
          index === data.page ? 'disabled' : ''
        }>${index}</button>`,
      );
    }
    return `<div class="pagination">
      <button data-page="${data.page - 1}" ${data.page <= 1 ? 'disabled' : ''}>‹</button>
      ${pages.join('')}
      <button data-page="${data.page + 1}" ${data.page >= data.totalPages ? 'disabled' : ''}>›</button>
    </div>`;
  }




  /* ------------------------------ Giỏ hàng -------------------------- */

  async function viewCart() {
    setLoading('Đang tải giỏ hàng...');
    markActiveNav('all');
    const cart = await API.get('/api/cart');
    updateCartBadge(cart.count);

    if (!cart.items.length) {
      app.innerHTML = emptyState(
        '🛒',
        'Giỏ hàng đang trống',
        'Hãy chọn những sản phẩm tươi ngon của DOP Mart để bắt đầu đơn hàng đầu tiên.',
        '<a class="btn" href="#/products">Mua sắm ngay</a>',
      );
      return;
    }

    const itemsHtml = cart.items
      .map(
        (item) => `
        <div class="cart-item">
          <div class="cart-thumb" aria-hidden="true">${escapeHtml(item.emoji)}</div>
          <div>
            <a class="cart-item-name" href="#/product/${encodeURIComponent(item.slug)}">${escapeHtml(item.name)}</a>
            <div class="cart-item-sub">${escapeHtml(item.unit)} · ${fmtMoney(item.price)} / sản phẩm</div>
            <button class="link-danger" data-remove="${escapeHtml(item.productId)}">Xoá</button>
          </div>
          <div class="cart-item-actions">
            <div class="qty-control">
              <button type="button" data-dec="${escapeHtml(item.productId)}" aria-label="Giảm">−</button>
              <input type="number" value="${item.quantity}" min="1" max="${item.stock}" data-qty="${escapeHtml(
                item.productId,
              )}" aria-label="Số lượng" />
              <button type="button" data-inc="${escapeHtml(item.productId)}" aria-label="Tăng">+</button>
            </div>
            <div class="cart-item-total">${fmtMoney(item.lineTotal)}</div>
          </div>
        </div>`,
      )
      .join('');

    const progress = Math.min(100, Math.round((cart.subtotal / cart.freeShippingThreshold) * 100));

    app.innerHTML = `
      <div class="page-head">
        <div>
          <h1>Giỏ hàng của bạn</h1>
          <p>${cart.count} sản phẩm đang chờ thanh toán.</p>
        </div>
        <a class="btn btn-ghost btn-sm" href="#/products">← Tiếp tục mua sắm</a>
      </div>

      <div class="cart-layout">
        <section class="panel">${itemsHtml}</section>

        <aside class="panel">
          <h2>Tóm tắt đơn hàng</h2>

          <div class="ship-progress">
            <div class="bar"><span style="width:${progress}%"></span></div>
            <p>
              ${
                cart.amountToFreeShipping > 0
                  ? `Mua thêm <strong>${fmtMoney(cart.amountToFreeShipping)}</strong> để được miễn phí vận chuyển.`
                  : '🎉 Đơn của bạn được miễn phí vận chuyển!'
              }
            </p>
          </div>

          <div class="summary-row"><span>Tạm tính</span><span>${fmtMoney(cart.subtotal)}</span></div>
          ${
            cart.discount
              ? `<div class="summary-row" style="color:var(--green-dark)"><span>Giảm giá (${escapeHtml(
                  cart.coupon ? cart.coupon.code : '',
                )})</span><span>-${fmtMoney(cart.discount)}</span></div>`
              : ''
          }
          <div class="summary-row"><span>Phí vận chuyển</span><span>${
            cart.shippingFee ? fmtMoney(cart.shippingFee) : 'Miễn phí'
          }</span></div>

          <form class="coupon-form" id="coupon-form">
            <input type="text" name="code" placeholder="Mã giảm giá (DOP10)" value="${escapeHtml(
              cart.coupon ? cart.coupon.code : '',
            )}" aria-label="Mã giảm giá" />
            <button class="btn btn-sm btn-outline" type="submit">Áp dụng</button>
          </form>
          ${
            cart.coupon
              ? `<p class="coupon-note">Đang áp dụng: <strong>${escapeHtml(
                  cart.coupon.label,
                )}</strong> · <a href="#" id="remove-coupon">Bỏ mã</a></p>`
              : '<p class="coupon-note">Thử mã <code>DOP10</code> hoặc <code>FREESHIP</code>.</p>'
          }

          <div class="summary-row total"><span>Tổng cộng</span><span class="price">${fmtMoney(cart.total)}</span></div>

          <a class="btn btn-block" style="margin-top:14px" href="#/checkout">Tiến hành thanh toán</a>
          <p class="coupon-note" style="margin-top:10px">Thanh toán khi nhận hàng (COD) hoặc chuyển khoản ngân hàng.</p>
        </aside>
      </div>
    `;

    const changeQuantity = async (productId, quantity) => {
      try {
        const updated = await API.patch(`/api/cart/${encodeURIComponent(productId)}`, { quantity });
        updateCartBadge(updated.count);
        await viewCart();
      } catch (error) {
        toast(error.message, 'error');
        await viewCart();
      }
    };

    app.querySelectorAll('[data-inc]').forEach((button) => {
      button.addEventListener('click', () => {
        const input = app.querySelector(`[data-qty="${CSS.escape(button.dataset.inc)}"]`);
        changeQuantity(button.dataset.inc, (Number(input.value) || 1) + 1);
      });
    });

    app.querySelectorAll('[data-dec]').forEach((button) => {
      button.addEventListener('click', () => {
        const input = app.querySelector(`[data-qty="${CSS.escape(button.dataset.dec)}"]`);
        const next = (Number(input.value) || 1) - 1;
        changeQuantity(button.dataset.dec, next <= 0 ? 0 : next);
      });
    });

    app.querySelectorAll('[data-qty]').forEach((input) => {
      input.addEventListener('change', () => {
        changeQuantity(input.dataset.qty, Number(input.value) || 1);
      });
    });

    app.querySelectorAll('[data-remove]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          const updated = await API.del(`/api/cart/${encodeURIComponent(button.dataset.remove)}`);
          updateCartBadge(updated.count);
          toast('Đã xoá sản phẩm khỏi giỏ hàng', 'info');
          await viewCart();
        } catch (error) {
          toast(error.message, 'error');
        }
      });
    });

    document.getElementById('coupon-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const code = event.target.code.value.trim();
      try {
        const updated = await API.post('/api/cart/coupon', { code });
        updateCartBadge(updated.count);
        toast(code ? 'Đã áp dụng mã giảm giá' : 'Đã bỏ mã giảm giá');
        await viewCart();
      } catch (error) {
        toast(error.message, 'error');
      }
    });

    const removeCoupon = document.getElementById('remove-coupon');
    if (removeCoupon) {
      removeCoupon.addEventListener('click', async (event) => {
        event.preventDefault();
        try {
          await API.post('/api/cart/coupon', { code: '' });
          toast('Đã bỏ mã giảm giá', 'info');
          await viewCart();
        } catch (error) {
          toast(error.message, 'error');
        }
      });
    }
  }

  /* ------------------------------ Thanh toán ------------------------ */

  const CITIES = [
    'TP. Hồ Chí Minh',
    'Hà Nội',
    'Đà Nẵng',
    'Cần Thơ',
    'Hải Phòng',
    'Bình Dương',
    'Đồng Nai',
    'Khánh Hòa',
    'Thừa Thiên Huế',
    'Quảng Ninh',
  ];

  async function viewCheckout() {
    setLoading('Đang chuẩn bị thanh toán...');
    markActiveNav('all');
    const cart = await API.get('/api/cart');

    if (!cart.items.length) {
      app.innerHTML = emptyState(
        '🧾',
        'Chưa có sản phẩm để thanh toán',
        'Giỏ hàng của bạn đang trống. Hãy thêm sản phẩm trước khi đặt hàng.',
        '<a class="btn" href="#/products">Chọn sản phẩm</a>',
      );
      return;
    }

    const user = state.user || {};
    const cityOptions = CITIES.map(
      (city) => `<option value="${escapeHtml(city)}">${escapeHtml(city)}</option>`,
    ).join('');

    const summaryLines = cart.items
      .map(
        (item) => `
        <div class="order-line">
          <span>${escapeHtml(item.emoji)} ${escapeHtml(item.name)} × ${item.quantity}</span>
          <span class="nowrap">${fmtMoney(item.lineTotal)}</span>
        </div>`,
      )
      .join('');

    app.innerHTML = `
      <div class="page-head">
        <div>
          <h1>Thanh toán</h1>
          <p>Vui lòng kiểm tra thông tin giao hàng trước khi đặt đơn.</p>
        </div>
        <a class="btn btn-ghost btn-sm" href="#/cart">← Quay lại giỏ hàng</a>
      </div>

      <div class="steps">
        <span class="step"><span class="num">1</span> Giỏ hàng</span>
        <span class="step active"><span class="num">2</span> Thông tin giao hàng</span>
        <span class="step"><span class="num">3</span> Hoàn tất</span>
      </div>

      <div class="checkout-layout">
        <form class="panel" id="checkout-form" novalidate>
          <h2>Thông tin người nhận</h2>
          <div class="form-error" id="checkout-error" hidden></div>

          <div class="field-row">
            <div class="field">
              <label for="fullName">Họ và tên</label>
              <input id="fullName" name="fullName" type="text" required value="${escapeHtml(user.name || '')}" placeholder="Nguyễn Văn A" />
            </div>
            <div class="field">
              <label for="phone">Số điện thoại</label>
              <input id="phone" name="phone" type="tel" required value="${escapeHtml(user.phone || '')}" placeholder="0912345678" />
            </div>
          </div>

          <div class="field">
            <label for="address">Địa chỉ giao hàng</label>
            <input id="address" name="address" type="text" required value="${escapeHtml(user.address || '')}" placeholder="Số nhà, đường, phường/xã, quận/huyện" />
          </div>

          <div class="field">
            <label for="city">Tỉnh / Thành phố</label>
            <select id="city" name="city" required>
              <option value="">— Chọn tỉnh/thành —</option>
              ${cityOptions}
            </select>
          </div>

          <div class="field">
            <label for="note">Ghi chú cho người bán (không bắt buộc)</label>
            <textarea id="note" name="note" placeholder="Ví dụ: giao giờ hành chính, gọi trước khi đến..."></textarea>
          </div>

          <h2 style="margin-top:20px">Phương thức thanh toán</h2>
          <div class="radio-group">
            <label class="radio-card selected">
              <input type="radio" name="paymentMethod" value="cod" checked />
              <span><strong>Thanh toán khi nhận hàng (COD)</strong><br /><span class="small muted">Kiểm tra hàng rồi mới thanh toán cho nhân viên giao hàng.</span></span>
            </label>
            <label class="radio-card">
              <input type="radio" name="paymentMethod" value="bank" />
              <span><strong>Chuyển khoản ngân hàng</strong><br /><span class="small muted">DOP Mart gửi thông tin chuyển khoản sau khi xác nhận đơn.</span></span>
            </label>
          </div>

          <button class="btn btn-block" type="submit" style="margin-top:20px" id="place-order">Đặt hàng · ${fmtMoney(cart.total)}</button>
          <p class="small muted" style="margin-top:10px">Bằng việc đặt hàng, bạn đồng ý với chính sách giao nhận và đổi trả của DOP Mart.</p>
        </form>

        <aside class="panel">
          <h2>Đơn hàng của bạn</h2>
          <div class="order-items">${summaryLines}</div>
          <div class="summary-row" style="margin-top:12px"><span>Tạm tính</span><span>${fmtMoney(cart.subtotal)}</span></div>
          ${cart.discount ? `<div class="summary-row" style="color:var(--green-dark)"><span>Giảm giá</span><span>-${fmtMoney(cart.discount)}</span></div>` : ''}
          <div class="summary-row"><span>Phí vận chuyển</span><span>${cart.shippingFee ? fmtMoney(cart.shippingFee) : 'Miễn phí'}</span></div>
          <div class="summary-row total"><span>Tổng cộng</span><span class="price">${fmtMoney(cart.total)}</span></div>
          ${cart.coupon ? `<p class="coupon-note" style="margin-top:10px">Mã áp dụng: <strong>${escapeHtml(cart.coupon.code)}</strong></p>` : ''}
        </aside>
      </div>
    `;

    const form = document.getElementById('checkout-form');
    const errorBox = document.getElementById('checkout-error');

    form.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        form.querySelectorAll('.radio-card').forEach((card) => card.classList.remove('selected'));
        radio.closest('.radio-card').classList.add('selected');
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorBox.hidden = true;
      const submit = document.getElementById('place-order');
      submit.disabled = true;
      submit.textContent = 'Đang đặt hàng...';

      const data = new FormData(form);
      const payload = {
        fullName: String(data.get('fullName') || '').trim(),
        phone: String(data.get('phone') || '').trim(),
        address: String(data.get('address') || '').trim(),
        city: String(data.get('city') || '').trim(),
        note: String(data.get('note') || '').trim(),
        paymentMethod: String(data.get('paymentMethod') || 'cod'),
      };

      try {
        const result = await API.post('/api/orders', payload);
        updateCartBadge(0);
        showOrderSuccess(result.order);
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.hidden = false;
        submit.disabled = false;
        submit.textContent = `Đặt hàng · ${fmtMoney(cart.total)}`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  function showOrderSuccess(order) {
    markActiveNav('all');
    app.innerHTML = `
      <div class="empty-state" style="max-width:660px;margin:0 auto">
        <span class="icon">🎉</span>
        <h1>Đặt hàng thành công!</h1>
        <p>Cảm ơn bạn đã mua sắm tại DOP Mart. Đơn hàng <strong>${escapeHtml(order.code)}</strong> đã được ghi nhận.</p>
        <div class="panel" style="text-align:left;margin:18px 0">
          <div class="summary-row"><span>Mã đơn hàng</span><strong>${escapeHtml(order.code)}</strong></div>
          <div class="summary-row"><span>Người nhận</span><span>${escapeHtml(order.shipping.fullName)} · ${escapeHtml(order.shipping.phone)}</span></div>
          <div class="summary-row"><span>Địa chỉ</span><span>${escapeHtml(order.shipping.address)}, ${escapeHtml(order.shipping.city)}</span></div>
          <div class="summary-row"><span>Thanh toán</span><span>${order.paymentMethod === 'cod' ? 'Khi nhận hàng (COD)' : 'Chuyển khoản'}</span></div>
          <div class="summary-row total"><span>Tổng cộng</span><span class="price">${fmtMoney(order.total)}</span></div>
        </div>
        <div class="detail-actions" style="justify-content:center">
          <a class="btn" href="#/orders/${encodeURIComponent(order.code)}">Xem đơn hàng</a>
          <a class="btn btn-ghost" href="#/products">Tiếp tục mua sắm</a>
        </div>
      </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ------------------------------- Đơn hàng -------------------------- */

  function orderCard(order, compact = false) {
    const lines = order.items
      .map(
        (item) => `<div class="order-line">
          <span>${escapeHtml(item.emoji)} ${escapeHtml(item.name)} × ${item.quantity}</span>
          <span class="nowrap">${fmtMoney(item.lineTotal)}</span>
        </div>`,
      )
      .join('');

    return `
      <article class="order-card">
        <div class="order-head">
          <div>
            <div class="order-code">Đơn ${escapeHtml(order.code)}</div>
            <div class="order-date">Đặt lúc ${escapeHtml(fmtDate(order.createdAt))}</div>
          </div>
          ${statusBadge(order.status)}
        </div>
        <div class="order-items">${lines}</div>
        <div class="order-foot">
          <div class="order-shipping">
            ${escapeHtml(order.shipping.fullName)} · ${escapeHtml(order.shipping.phone)}<br />
            ${escapeHtml(order.shipping.address)}, ${escapeHtml(order.shipping.city)}
          </div>
          <div style="text-align:right">
            <div class="order-total">${fmtMoney(order.total)}</div>
            ${compact ? '' : `<a class="small" href="#/orders/${encodeURIComponent(order.code)}">Chi tiết →</a>`}
          </div>
        </div>
      </article>`;
  }

  async function viewOrders() {
    setLoading('Đang tải đơn hàng...');
    markActiveNav('all');

    if (!state.user) {
      app.innerHTML = `
        <div class="page-head"><div><h1>Đơn hàng</h1><p>Tra cứu đơn hàng bằng mã đơn hoặc đăng nhập để xem lịch sử.</p></div></div>
        <div class="auth-wrap">
          <h1>Tra cứu đơn hàng</h1>
          <p class="sub">Nhập mã đơn hàng (ví dụ DH1001) để xem tình trạng giao hàng.</p>
          <form id="lookup-form">
            <div class="field">
              <label for="order-code">Mã đơn hàng</label>
              <input id="order-code" name="code" type="text" placeholder="DH1001" required />
            </div>
            <button class="btn btn-block" type="submit">Tra cứu</button>
          </form>
          <p class="auth-alt">Đã có tài khoản? <a href="#/login">Đăng nhập</a> để xem toàn bộ đơn hàng.</p>
        </div>`;

      document.getElementById('lookup-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const code = event.target.code.value.trim().toUpperCase();
        if (!code) return;
        location.hash = `#/orders/${encodeURIComponent(code)}`;
      });
      return;
    }

    const { items } = await API.get('/api/orders');

    app.innerHTML = `
      <div class="page-head">
        <div><h1>Đơn hàng của tôi</h1><p>${items.length} đơn hàng · ${escapeHtml(state.user.name)}</p></div>
        <a class="btn btn-ghost btn-sm" href="#/products">← Tiếp tục mua sắm</a>
      </div>
      ${
        items.length
          ? items.map((order) => orderCard(order)).join('')
          : emptyState('📦', 'Chưa có đơn hàng', 'Bạn chưa đặt đơn nào tại DOP Mart.', '<a class="btn" href="#/products">Mua sắm ngay</a>')
      }
    `;
  }

  async function viewOrderDetail(code) {
    setLoading('Đang tải chi tiết đơn hàng...');
    markActiveNav('all');
    let order;
    try {
      const result = await API.get(`/api/orders/${encodeURIComponent(code)}`);
      order = result.order;
    } catch (error) {
      app.innerHTML = `
        <div class="empty-state">
          <span class="icon">🔎</span>
          <h2>Không xem được đơn hàng</h2>
          <p>${escapeHtml(error.message)}</p>
          <div class="detail-actions" style="justify-content:center">
            <a class="btn" href="#/orders">Tra cứu đơn khác</a>
            <a class="btn btn-ghost" href="#/login">Đăng nhập</a>
          </div>
        </div>`;
      return;
    }

    const timeline = order.statusHistory
      .map(
        (entry) =>
          `<div class="order-line"><span>${statusBadge(entry.status)}</span><span class="small muted">${escapeHtml(
            fmtDate(entry.at),
          )}</span></div>`,
      )
      .join('');

    const canCancel =
      state.user && order.userId === state.user.id && ['pending', 'confirmed'].includes(order.status);

    app.innerHTML = `
      <div class="page-head">
        <div><h1>Chi tiết đơn ${escapeHtml(order.code)}</h1><p>Đặt lúc ${escapeHtml(fmtDate(order.createdAt))}</p></div>
        <a class="btn btn-ghost btn-sm" href="#/orders">← Danh sách đơn</a>
      </div>
      <div class="cart-layout">
        <div>
          ${orderCard(order, true)}
          <div class="panel" style="margin-top:14px">
            <h3>Lịch sử trạng thái</h3>
            ${timeline}
          </div>
        </div>
        <aside class="panel">
          <h2>Thông tin giao hàng</h2>
          <p class="small"><strong>${escapeHtml(order.shipping.fullName)}</strong><br />${escapeHtml(
            order.shipping.phone,
          )}<br />${escapeHtml(order.shipping.address)}, ${escapeHtml(order.shipping.city)}</p>
          ${order.shipping.note ? `<p class="small muted">Ghi chú: ${escapeHtml(order.shipping.note)}</p>` : ''}
          <div class="summary-row"><span>Tạm tính</span><span>${fmtMoney(order.subtotal)}</span></div>
          ${
            order.discount
              ? `<div class="summary-row"><span>Giảm giá</span><span>-${fmtMoney(order.discount)}</span></div>`
              : ''
          }
          <div class="summary-row"><span>Vận chuyển</span><span>${
            order.shippingFee ? fmtMoney(order.shippingFee) : 'Miễn phí'
          }</span></div>
          <div class="summary-row total"><span>Tổng cộng</span><span class="price">${fmtMoney(order.total)}</span></div>
          <p class="small muted" style="margin-top:10px">Thanh toán: ${
            order.paymentMethod === 'cod' ? 'Khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'
          }</p>
          ${canCancel ? '<button class="btn btn-danger btn-block" id="cancel-order" style="margin-top:12px">Huỷ đơn hàng</button>' : ''}
        </aside>
      </div>
    `;

    const cancel = document.getElementById('cancel-order');
    if (cancel) {
      cancel.addEventListener('click', async () => {
        if (!window.confirm(`Huỷ đơn hàng ${order.code}?`)) return;
        cancel.disabled = true;
        try {
          await API.post(`/api/orders/${encodeURIComponent(order.code)}/cancel`);
          toast('Đã huỷ đơn hàng', 'info');
          await viewOrderDetail(order.code);
        } catch (error) {
          toast(error.message, 'error');
          cancel.disabled = false;
        }
      });
    }
  }

  /* ------------------------------ Đăng nhập -------------------------- */

  function renderAuthForm(mode) {
    const isLogin = mode === 'login';
    markActiveNav('all');
    app.innerHTML = `
      <div class="auth-wrap">
        <h1>${isLogin ? 'Đăng nhập DOP Mart' : 'Tạo tài khoản DOP Mart'}</h1>
        <p class="sub">${
          isLogin
            ? 'Đăng nhập để theo dõi đơn hàng và nhận ưu đãi dành riêng cho bạn.'
            : 'Đăng ký miễn phí để mua sắm nhanh hơn và nhận mã giảm giá.'
        }</p>
        <div class="form-error" id="auth-error" hidden></div>
        <form id="auth-form" novalidate>
          ${
            isLogin
              ? ''
              : `<div class="field">
                   <label for="auth-name">Họ và tên</label>
                   <input id="auth-name" name="name" type="text" required placeholder="Nguyễn Văn A" />
                 </div>`
          }
          <div class="field">
            <label for="auth-email">Email</label>
            <input id="auth-email" name="email" type="email" required placeholder="ban@email.com" autocomplete="email" />
          </div>
          <div class="field">
            <label for="auth-password">Mật khẩu</label>
            <input id="auth-password" name="password" type="password" required placeholder="••••••" autocomplete="${
              isLogin ? 'current-password' : 'new-password'
            }" />
            ${isLogin ? '' : '<span class="hint">Tối thiểu 6 ký tự.</span>'}
          </div>
          <button class="btn btn-block" type="submit">${isLogin ? 'Đăng nhập' : 'Đăng ký'}</button>
        </form>
        <p class="auth-alt">
          ${
            isLogin
              ? 'Chưa có tài khoản? <a href="#/register">Đăng ký ngay</a>'
              : 'Đã có tài khoản? <a href="#/login">Đăng nhập</a>'
          }
        </p>
        ${
          isLogin
            ? `<div class="demo-accounts">
                 <strong>Tài khoản demo:</strong><br />
                 Khách: <code>khach@dopmart.vn</code> / <code>Khach@123</code><br />
                 Quản trị: <code>admin@dopmart.vn</code> / <code>Admin@123</code>
               </div>`
            : ''
        }
      </div>
    `;

    const form = document.getElementById('auth-form');
    const errorBox = document.getElementById('auth-error');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorBox.hidden = true;
      const submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;

      const data = new FormData(form);
      const payload = {
        email: String(data.get('email') || '').trim(),
        password: String(data.get('password') || ''),
      };
      if (!isLogin) payload.name = String(data.get('name') || '').trim();

      try {
        const result = await API.post(isLogin ? '/api/auth/login' : '/api/auth/register', payload);
        state.user = result.user;
        state.isAdmin = result.user.role === 'admin';
        updateCartBadge(result.cart ? result.cart.count : state.cartCount);
        renderAccount();
        toast(isLogin ? `Chào mừng trở lại, ${result.user.name}!` : 'Tạo tài khoản thành công!');
        const next = parseRoute().query.get('next');
        location.hash = next ? `#${next}` : '#/';
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.hidden = false;
        submit.disabled = false;
      }
    });
  }

  /* -------------------------------- Quản trị ------------------------ */

  function orderStatusOptions(current) {
    return Object.entries(STATUS_META)
      .map(
        ([value, meta]) =>
          `<option value="${value}" ${value === current ? 'selected' : ''}>${meta.icon} ${meta.label}</option>`,
      )
      .join('');
  }

  async function viewAdmin(query) {
    markActiveNav('all');

    if (!state.user || !state.isAdmin) {
      app.innerHTML = emptyState(
        '🔒',
        'Cần quyền quản trị',
        'Vui lòng đăng nhập bằng tài khoản quản trị viên để quản lý đơn hàng và sản phẩm.',
        '<a class="btn" href="#/login?next=/admin">Đăng nhập quản trị</a>',
      );
      return;
    }

    setLoading('Đang tải bảng điều khiển...');
    const tab = query.get('tab') || 'overview';

    const tabs = [
      ['overview', '📊 Tổng quan'],
      ['orders', '📦 Đơn hàng'],
      ['products', '🛍️ Sản phẩm'],
      ['customers', '👥 Khách hàng'],
    ]
      .map(
        ([value, label]) =>
          `<button data-tab="${value}" class="${tab === value ? 'active' : ''}">${label}</button>`,
      )
      .join('');

    let content = '';

    if (tab === 'orders') {
      const { items } = await API.get('/api/admin/orders');
      const rows = items
        .map(
          (order) => `
          <tr>
            <td><strong>${escapeHtml(order.code)}</strong><br /><span class="small muted">${escapeHtml(
              fmtDate(order.createdAt),
            )}</span></td>
            <td>${escapeHtml(order.shipping.fullName)}<br /><span class="small muted">${escapeHtml(
              order.shipping.phone,
            )}</span></td>
            <td>${order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
            <td class="nowrap">${fmtMoney(order.total)}</td>
            <td><select data-order-status="${escapeHtml(order.code)}">${orderStatusOptions(order.status)}</select></td>
          </tr>`,
        )
        .join('');
      content = `
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th>Đơn hàng</th><th>Khách hàng</th><th>SL</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="5">Chưa có đơn hàng nào.</td></tr>'}</tbody>
          </table>
        </div>`;
    } else if (tab === 'customers') {
      const { items } = await API.get('/api/admin/customers');
      const rows = items
        .map(
          (customer) => `
          <tr>
            <td>${escapeHtml(customer.name)}</td>
            <td>${escapeHtml(customer.email)}</td>
            <td>${escapeHtml(customer.phone || '—')}</td>
            <td>${customer.orderCount}</td>
            <td class="small muted">${escapeHtml(fmtDate(customer.createdAt))}</td>
          </tr>`,
        )
        .join('');
      content = `
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th>Khách hàng</th><th>Email</th><th>Điện thoại</th><th>Đơn hàng</th><th>Tham gia</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }

    if (tab === 'products') {
      const { items } = await API.get('/api/admin/products?limit=60');
      const rows = items
        .map(
          (product) => `
          <tr>
            <td>${escapeHtml(product.emoji)} ${escapeHtml(product.name)}<br /><span class="small muted">${escapeHtml(
              product.id,
            )}</span></td>
            <td>${escapeHtml((state.categories.find((c) => c.id === product.category) || {}).name || product.category)}</td>
            <td class="nowrap">${fmtMoney(product.price)}</td>
            <td>${product.stock}</td>
            <td>${
              product.active === false
                ? '<span class="pill red">Ẩn</span>'
                : '<span class="pill green">Đang bán</span>'
            }</td>
            <td>
              <div class="table-actions">
                <button class="btn btn-sm btn-ghost" data-edit-product="${escapeHtml(product.id)}">Sửa</button>
                <button class="btn btn-sm btn-danger" data-delete-product="${escapeHtml(product.id)}">Xoá</button>
              </div>
            </td>
          </tr>`,
        )
        .join('');
      content = `
        <div class="section-head">
          <p>${items.length} sản phẩm trong danh mục</p>
          <button class="btn btn-sm" id="new-product">＋ Thêm sản phẩm</button>
        </div>
        <div class="table-wrap">
          <table class="data">
            <thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Tồn</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    } else if (tab !== 'orders' && tab !== 'customers') {
      const { stats } = await API.get('/api/admin/stats');
      const cards = [
        ['Doanh thu (trừ đơn huỷ)', fmtMoney(stats.revenue)],
        ['Tổng đơn hàng', fmtNumber(stats.orderCount)],
        ['Giá trị đơn trung bình', fmtMoney(stats.averageOrderValue)],
        ['Khách hàng', fmtNumber(stats.customerCount)],
        ['Sản phẩm đang bán', fmtNumber(stats.productCount)],
        ['Đơn chờ xác nhận', fmtNumber(stats.statusCounts.pending || 0)],
      ]
        .map(
          ([label, value]) =>
            `<div class="stat-card"><span class="label">${label}</span><span class="value">${value}</span></div>`,
        )
        .join('');

      const top = stats.topProducts
        .map(
          (product) =>
            `<div class="order-line"><span>${escapeHtml(product.emoji)} ${escapeHtml(
              product.name,
            )}</span><span>${product.quantity} đã bán</span></div>`,
        )
        .join('');

      const low = stats.lowStock
        .map(
          (product) =>
            `<div class="order-line"><span>${escapeHtml(product.name)}</span><span>${product.stock} ${escapeHtml(
              product.unit,
            )}</span></div>`,
        )
        .join('');

      content = `
        <div class="stat-grid">${cards}</div>
        <div class="cart-layout">
          <div class="panel"><h3>Sản phẩm bán chạy</h3>${
            top || '<p class="small muted">Chưa có dữ liệu bán hàng.</p>'
          }</div>
          <div class="panel"><h3>⚠️ Sắp hết hàng</h3>${
            low || '<p class="small muted">Tồn kho đang ổn định.</p>'
          }</div>
        </div>`;
    }

    app.innerHTML = `
      <div class="page-head">
        <div><h1>Quản trị DOP Mart</h1><p>Xin chào ${escapeHtml(state.user.name)} · vai trò: Quản trị viên</p></div>
        <a class="btn btn-ghost btn-sm" href="#/">Về trang bán hàng</a>
      </div>
      <div class="admin-tabs">${tabs}</div>
      ${content}
    `;

    app.querySelectorAll('[data-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        location.hash = `#/admin?tab=${button.dataset.tab}`;
      });
    });

    app.querySelectorAll('[data-order-status]').forEach((select) => {
      select.addEventListener('change', async () => {
        try {
          await API.patch(`/api/admin/orders/${encodeURIComponent(select.dataset.orderStatus)}`, {
            status: select.value,
          });
          toast('Đã cập nhật trạng thái đơn hàng');
          await viewAdmin(new URLSearchParams({ tab: 'orders' }));
        } catch (error) {
          toast(error.message, 'error');
          await viewAdmin(new URLSearchParams({ tab: 'orders' }));
        }
      });
    });

    const newProduct = document.getElementById('new-product');
    if (newProduct) newProduct.addEventListener('click', () => openProductModal(null));

    app.querySelectorAll('[data-edit-product]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          const { product } = await API.get(`/api/products/${encodeURIComponent(button.dataset.editProduct)}`);
          openProductModal(product);
        } catch (error) {
          toast(error.message, 'error');
        }
      });
    });

    app.querySelectorAll('[data-delete-product]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!window.confirm('Ẩn sản phẩm này khỏi cửa hàng?')) return;
        try {
          await API.del(`/api/admin/products/${encodeURIComponent(button.dataset.deleteProduct)}`);
          toast('Đã ẩn sản phẩm', 'info');
          await viewAdmin(new URLSearchParams({ tab: 'products' }));
        } catch (error) {
          toast(error.message, 'error');
        }
      });
    });
  }


  /* --------------------------- Modal sản phẩm ------------------------ */

  function openProductModal(product) {
    const isEdit = Boolean(product);
    const data = product || {
      name: '',
      category: state.categories[0] ? state.categories[0].id : 'do-kho',
      price: '',
      oldPrice: '',
      unit: '',
      stock: 0,
      emoji: '🛍️',
      description: '',
      tags: [],
      featured: false,
      active: true,
    };

    const categoryOptions = state.categories
      .map(
        (category) =>
          `<option value="${escapeHtml(category.id)}" ${category.id === data.category ? 'selected' : ''}>${escapeHtml(
            category.name,
          )}</option>`,
      )
      .join('');

    const backdrop = openModal(`
      <h2>${isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
      <div class="form-error" id="product-error" hidden></div>
      <form id="product-form">
        <div class="field">
          <label for="p-name">Tên sản phẩm</label>
          <input id="p-name" name="name" required value="${escapeHtml(data.name)}" />
        </div>
        <div class="field-row">
          <div class="field">
            <label for="p-category">Danh mục</label>
            <select id="p-category" name="category">${categoryOptions}</select>
          </div>
          <div class="field">
            <label for="p-unit">Đơn vị</label>
            <input id="p-unit" name="unit" value="${escapeHtml(data.unit)}" placeholder="túi 500g" />
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label for="p-price">Giá bán (₫)</label>
            <input id="p-price" name="price" type="number" min="1" required value="${escapeHtml(data.price)}" />
          </div>
          <div class="field">
            <label for="p-oldPrice">Giá gốc (₫, tuỳ chọn)</label>
            <input id="p-oldPrice" name="oldPrice" type="number" min="0" value="${escapeHtml(data.oldPrice || '')}" />
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label for="p-stock">Tồn kho</label>
            <input id="p-stock" name="stock" type="number" min="0" value="${escapeHtml(data.stock)}" />
          </div>
          <div class="field">
            <label for="p-emoji">Biểu tượng</label>
            <input id="p-emoji" name="emoji" value="${escapeHtml(data.emoji || '🛍️')}" maxlength="4" />
          </div>
        </div>
        <div class="field">
          <label for="p-description">Mô tả</label>
          <textarea id="p-description" name="description">${escapeHtml(data.description)}</textarea>
        </div>
        <div class="field">
          <label for="p-tags">Tags (cách nhau bởi dấu phẩy)</label>
          <input id="p-tags" name="tags" value="${escapeHtml((data.tags || []).join(', '))}" />
        </div>
        <label class="radio-card" style="margin-bottom:10px">
          <input type="checkbox" name="featured" ${data.featured ? 'checked' : ''} />
          <span>Sản phẩm nổi bật (hiển thị ở trang chủ)</span>
        </label>
        <label class="radio-card">
          <input type="checkbox" name="active" ${data.active !== false ? 'checked' : ''} />
          <span>Đang bán (bỏ chọn để ẩn khỏi cửa hàng)</span>
        </label>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-close>Huỷ</button>
          <button type="submit" class="btn">${isEdit ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</button>
        </div>
      </form>
    `);

    backdrop.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', closeModal));

    backdrop.querySelector('#product-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const errorBox = backdrop.querySelector('#product-error');
      errorBox.hidden = true;
      const formData = new FormData(event.target);
      const payload = {
        name: String(formData.get('name') || '').trim(),
        category: String(formData.get('category') || ''),
        price: Number(formData.get('price')) || 0,
        oldPrice: formData.get('oldPrice') ? Number(formData.get('oldPrice')) : null,
        unit: String(formData.get('unit') || '').trim(),
        stock: Number(formData.get('stock')) || 0,
        emoji: String(formData.get('emoji') || '🛍️').trim(),
        description: String(formData.get('description') || '').trim(),
        tags: String(formData.get('tags') || '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        featured: formData.get('featured') === 'on',
        active: formData.get('active') === 'on',
      };

      try {
        if (isEdit) {
          await API.patch(`/api/admin/products/${encodeURIComponent(data.id)}`, payload);
          toast('Đã cập nhật sản phẩm');
        } else {
          await API.post('/api/admin/products', payload);
          toast('Đã thêm sản phẩm mới');
        }
        closeModal();
        await viewAdmin(new URLSearchParams({ tab: 'products' }));
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.hidden = false;
      }
    });
  }

  /* -------------------------------- Router --------------------------- */

  const routes = [
    [/^\/$/, () => viewHome()],
    [/^\/products$/, (match, query) => viewProducts(query)],
    [/^\/product\/([^/]+)$/, (match) => viewProduct(match[1])],
    [/^\/cart$/, () => viewCart()],
    [/^\/checkout$/, () => viewCheckout()],
    [/^\/orders$/, () => viewOrders()],
    [/^\/orders\/([^/]+)$/, (match) => viewOrderDetail(match[1])],
    [/^\/login$/, () => renderAuthForm('login')],
    [/^\/register$/, () => renderAuthForm('register')],
    [/^\/admin$/, (match, query) => viewAdmin(query)],
  ];

  async function router() {
    const { path, query } = parseRoute();
    window.scrollTo({ top: 0 });

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = query.get('q') || '';
    if (path !== '/admin') document.title = 'DOP Mart - Mua sắm trực tuyến mỗi ngày';

    try {
      for (const [pattern, handler] of routes) {
        const match = pattern.exec(path);
        if (match) {
          await handler(match, query);
          return;
        }
      }
      app.innerHTML = emptyState(
        '🧭',
        'Không tìm thấy trang',
        'Đường dẫn bạn mở không tồn tại hoặc đã bị thay đổi.',
        '<a class="btn" href="#/">Về trang chủ</a>',
      );
    } catch (error) {
      console.error('[DOP Mart]', error);
      app.innerHTML = `
        <div class="empty-state">
          <span class="icon">⚠️</span>
          <h2>Không tải được nội dung</h2>
          <p>${escapeHtml(error.message || 'Đã xảy ra lỗi không mong muốn.')}</p>
          <div class="detail-actions" style="justify-content:center">
            <button class="btn" id="retry-btn">Thử lại</button>
            <a class="btn btn-ghost" href="#/">Về trang chủ</a>
          </div>
        </div>`;
      const retry = document.getElementById('retry-btn');
      if (retry) retry.addEventListener('click', router);
    }
  }

  /* ------------------------------ Khởi động -------------------------- */

  async function bootstrap() {
    try {
      const [config, categories, me] = await Promise.all([
        API.get('/api/config'),
        API.get('/api/categories'),
        API.get('/api/auth/me'),
      ]);
      state.config = config;
      state.categories = categories.items || [];
      state.user = me.user;
      state.isAdmin = Boolean(me.isAdmin);
      updateCartBadge(me.cartCount || 0);
      renderCategoriesNav();
      renderAccount();
    } catch (error) {
      toast('Không tải được cấu hình cửa hàng', 'error');
    }

    document.addEventListener('click', (event) => {
      const addButton = event.target.closest('[data-add]');
      if (addButton && !addButton.disabled) {
        addToCart(addButton.dataset.add, 1);
      }
    });

    const searchForm = document.getElementById('search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const value = document.getElementById('search-input').value.trim();
        location.hash = value ? `#/products?q=${encodeURIComponent(value)}` : '#/products';
      });
    }

    window.addEventListener('hashchange', router);
    await router();
  }

  bootstrap();
})();

