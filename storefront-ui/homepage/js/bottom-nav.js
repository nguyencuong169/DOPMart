(() => {
  const page = location.pathname.split('/').pop() || 'index.html';
  const items = [
    ['home', 'Trang chủ', 'index.html'],
    ['grid', 'Danh mục', 'products.html'],
    ['heart', 'Yêu thích', 'products.html#favorites'],
    ['orders', 'Đơn hàng', 'orders.html'],
    ['account', 'Tài khoản', 'account.html']
  ];
  const nav = document.createElement('nav');
  nav.className = 'store-bottom';
  nav.setAttribute('aria-label', 'Điều hướng dưới');
  for (const [icon, label, href] of items) {
    const link = document.createElement('a');
    link.href = href;
    if (icon === 'heart') link.id = 'mobile-fav';
    if (href === page || (icon === 'grid' && page === 'product.html') ||
        (icon === 'account' && page === 'login.html')) link.setAttribute('aria-current', 'location');
    link.innerHTML = `<svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24"><use href="assets/images/ui-icons.svg#${icon}"/></svg><span>${label}</span>`;
    nav.append(link);
  }
  document.currentScript.before(nav);
})();
