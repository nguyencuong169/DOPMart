const savedCodes = new Set(JSON.parse(localStorage.getItem('dop-saved-vouchers') || '[]'));
for (const button of document.querySelectorAll('.voucher [data-code]')) {
  function update() {
    button.disabled = savedCodes.has(button.dataset.code);
    button.textContent = button.disabled ? 'Đã lưu' : 'Lưu mã';
  }
  button.onclick = () => {
    savedCodes.add(button.dataset.code);
    localStorage.setItem('dop-saved-vouchers',JSON.stringify([...savedCodes]));
    update();
  };
  update();
}

const cart = JSON.parse(localStorage.getItem('dop-cart') || '{}');
const count = document.querySelector('.cart-count');
function updateCount() { count.textContent = Object.values(cart).filter(n => n > 0).length; }
updateCount();
document.querySelectorAll('[data-add]').forEach(button => button.onclick = () => {
  const id = button.dataset.add;
  cart[id] = (cart[id] || 0) + 1;
  localStorage.setItem('dop-cart',JSON.stringify(cart));
  updateCount();
  const status = document.querySelector('.toast');
  status.hidden = false;
  status.textContent = 'Đã thêm combo vào giỏ hàng';
  setTimeout(() => status.hidden = true,1800);
});
document.querySelector('#cart').onclick = () => location.href = 'cart.html';
document.querySelector('.menu').onclick = () => location.hash = 'categories';
