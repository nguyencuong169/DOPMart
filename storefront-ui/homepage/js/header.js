// Render synchronously so each page can attach its catalog or cart behavior.
(() => {
  const header = document.currentScript.parentElement;
  const page = header.dataset.page;
  const compact = ['cart', 'checkout', 'product', 'products'].includes(page);
  const logo = compact ? 'compact' : 'accented';
  const paths = {
    menu: 'M3 6h18M3 12h18M3 18h18',
    search: 'M17 17l5 5M19 10a8 8 0 1 1-16 0 8 8 0 1 1 16 0',
    heart: 'M12 21l-8-8C-2 6 6 0 12 7c6-7 14-1 8 6z',
    account: 'M16 7a4 4 0 1 1-8 0 4 4 0 1 1 8 0M3 21q0-8 9-8t9 8z',
    cart: 'M2 3h3l3 13h11l3-10H6M10 21a1 1 0 1 1-2 0 1 1 0 1 1 2 0M20 21a1 1 0 1 1-2 0 1 1 0 1 1 2 0'
  };
  const icon = name => '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="' + paths[name] + '"/></svg>';
  header.innerHTML = `<div class="store-bar">
    <a class="store-menu" href="products.html#categories" aria-label="Danh mục">${icon('menu')}</a>
    <a class="store-logo" href="index.html" aria-label="DOP Mart – Trang chủ">
      <svg class="desktop-wordmark" aria-hidden="true" viewBox="0 0 ${compact ? 257 : 315} 67"><use href="assets/images/dop-mart.svg#${logo}"/></svg>
      <svg class="mobile-wordmark" aria-hidden="true" viewBox="0 0 257 67"><use href="assets/images/dop-mart.svg#compact"/></svg>
    </a>
    <nav aria-label="Điều hướng chính">
      <a href="products.html">Sản phẩm</a><a href="products.html#categories">Danh mục</a>
      ${compact ? '' : '<a href="deals.html#combos">Combo</a>'}
      <a href="deals.html">Ưu đãi</a><a href="index.html#hero">Về DOP Mart</a>
    </nav>
    <form class="store-search" action="products.html" role="search" id="header-search">
      ${icon('search')}<input type="search" name="q" aria-label="Tìm sản phẩm" placeholder="Tìm sản phẩm, danh mục…">
    </form>
    <div class="store-actions">
      <button class="store-search-toggle" aria-controls="header-search" aria-expanded="false" aria-label="Tìm kiếm">${icon('search')}</button>
      <a id="favorites" href="${page === 'account' ? '#saved' : 'products.html#favorites'}" aria-label="Yêu thích">${icon('heart')}</a>
      <a class="store-account" href="${['account','orders'].includes(page) ? 'account.html' : 'login.html'}" aria-label="Tài khoản">${icon('account')}</a>
      <a id="cart" href="cart.html" aria-label="Giỏ hàng">${icon('cart')}<sup class="cart-count is-empty">0</sup></a>
    </div></div>`;
  const active = {deals: 'nav a[href="deals.html"]', products: 'nav a[href="products.html"]', account: '.store-account', cart: '#cart'};
  if (active[page]) header.querySelector(active[page]).setAttribute('aria-current', 'page');
  const toggle = header.querySelector('.store-search-toggle');
  toggle.onclick = () => {
    const open = header.classList.toggle('search-open');
    toggle.setAttribute('aria-expanded', String(open));
    if (open) header.querySelector('input').focus();
  };
})();
