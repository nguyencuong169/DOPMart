const form = document.querySelector('#delivery');
const fieldNames = ['name','phone','city','ward','street'];
const saved = JSON.parse(localStorage.getItem('dop-delivery') || '{}');
for (const key of fieldNames) form.elements[key].value = saved[key] || '';
document.querySelectorAll('.address-choice select').forEach(select => {
  const field = form.elements[select.dataset.field];
  const known = [...select.options].some(option => option.value === field.value);
  select.value = known ? field.value : 'other';
  function sync() {
    const custom = select.value === 'other';
    field.hidden = !custom;
    field.required = custom;
    if (!custom) field.value = select.value;
  }
  select.onchange = () => {
    if (select.value === 'other') field.value = '';
    sync();
    if (!field.hidden) field.focus();
  };
  sync();
});
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
    return '<div class="order-line"><img alt="" src="assets/images/'+(['office','energy','noodles'].includes(id) ? 'deals/' : '')+id+'.webp"><div><b>'+name+'</b><small>× '+cart[id]+'</small></div><strong>'+money(amount)+'</strong></div>';
  });
  document.querySelector('#lines').innerHTML = lines.join('') || '<a href="cart.html">Quay về giỏ hàng để chọn sản phẩm →</a>';
  document.querySelector('#subtotal').textContent = document.querySelector('#total').textContent = money(subtotal);
  document.querySelector('#fee').textContent = money(ids.length ? 20000 : 0);
  document.querySelector('#offer').textContent = ids.length ? '−20.000đ' : '0đ';
  document.querySelector('#place').disabled = !ids.length;
  updateCartBadge(Object.keys(catalog).filter(id => cart[id] > 0).length);
}
renderOrder();
window.addEventListener('pageshow',renderOrder);
window.addEventListener('storage',renderOrder);
form.onsubmit = event => {
  event.preventDefault();
  if (form.elements.remember.checked) {
    const address = Object.fromEntries(fieldNames.map(key => [key,form.elements[key].value.trim()]));
    localStorage.setItem('dop-delivery',JSON.stringify(address));
  } else localStorage.removeItem('dop-delivery');
  document.querySelector('#status').textContent = 'Đã kiểm tra thông tin. Đây là bản xem thử, chưa gửi đơn hàng.';
};