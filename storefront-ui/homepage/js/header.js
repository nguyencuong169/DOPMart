// Render synchronously so each page can attach its catalog or cart behavior.
(() => {
  const header = document.currentScript.parentElement;
  const page = header.dataset.page;
  const compact = ['cart', 'checkout', 'product', 'products'].includes(page);
  const logo = compact ? 'compact' : 'accented';
  const icon = name => `<svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24"><use href="assets/images/ui-icons.svg#${name}"/></svg>`;
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
