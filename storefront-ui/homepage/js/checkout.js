const form = document.querySelector('#delivery');
const fieldNames = ['name','phone','city','ward','street'];
const saved = JSON.parse(localStorage.getItem('dop-delivery') || '{}');
for (const key of fieldNames) form.elements[key].value = saved[key] || '';
form.elements.remember.checked = Boolean(saved.street);
function renderOrder() {
  const cart = JSON.parse(localStorage.getItem('dop-cart') || '{}');
  const selected = new Set(JSON.parse(sessionStorage.getItem('dop-checkout-selection') || '[]'));
  const ids = Object.keys(catalog).filter(id => selected.has(id) && Number.isSafeInteger(cart[id]) && cart[id] > 0);
  const money = value => value.toLocaleString('vi-VN') + 'đ';
  let subtotal = 0;
  const lines = ids.map(id => {
    const [name,price] = catalog[id];
    const amount = price * cart[id];
    subtotal += amount;
    return '<div class="order-line"><img alt="" src="assets/images/'+id+'.webp"><div><b>'+name+'</b><small>× '+cart[id]+'</small></div><strong>'+money(amount)+'</strong></div>';
  });
  document.querySelector('#lines').innerHTML = lines.join('') || '<a href="cart.html">Quay về giỏ hàng để chọn sản phẩm →</a>';
  document.querySelector('#subtotal').textContent = document.querySelector('#total').textContent = money(subtotal);
  document.querySelector('#fee').textContent = money(ids.length ? 20000 : 0);
  document.querySelector('#offer').textContent = ids.length ? '−20.000đ' : '0đ';
  document.querySelector('#place').disabled = !ids.length;
  document.querySelector('.cart-count').textContent = Object.values(cart).filter(Number.isSafeInteger).reduce((sum,n) => sum+n,0);
}
renderOrder();
window.addEventListener('pageshow',renderOrder);
window.addEventListener('storage',renderOrder);
document.querySelector('#cart').onclick = () => location.href = 'cart.html';
document.querySelector('.menu').onclick = () => location.href = 'index.html#categories';
document.querySelector('#favorites').onclick = () => location.href = 'index.html#products';
form.onsubmit = event => {
  event.preventDefault();
  if (form.elements.remember.checked) {
    const address = Object.fromEntries(fieldNames.map(key => [key,form.elements[key].value.trim()]));
    localStorage.setItem('dop-delivery',JSON.stringify(address));
  } else localStorage.removeItem('dop-delivery');
  document.querySelector('#status').textContent = 'Đã kiểm tra thông tin. Đây là bản xem thử, chưa gửi đơn hàng.';
};