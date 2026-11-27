function updateCartBadge(quantity) {
  const button = document.querySelector('#cart');
  const badge = button.querySelector('.cart-count');
  badge.textContent = String(quantity);
  badge.classList.toggle('is-empty', quantity === 0);
  button.setAttribute('aria-label', quantity ? 'Giỏ hàng, ' + quantity + ' loại sản phẩm' : 'Giỏ hàng trống');
}
