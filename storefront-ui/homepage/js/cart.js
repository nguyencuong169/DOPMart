const cart = JSON.parse(localStorage.getItem('dop-cart') || '{}');
const selected = new Set(Object.keys(cart));
const get = id => document.getElementById(id);
const money = value => value.toLocaleString('vi-VN') + 'đ';
function render() {
  const ids = Object.keys(catalog).filter(id => cart[id] > 0);
  const chosen = ids.filter(id => selected.has(id));
  const subtotal = chosen.reduce((sum,id) => sum + cart[id] * catalog[id][1], 0);
  const fee = chosen.length ? 20000 : 0;
  get('caption').textContent = 'Có ' + ids.length + ' sản phẩm trong giỏ';
  get('row-count').textContent = 'Sản phẩm (' + ids.length + ')';
  updateCartBadge(ids.length);
  get('rows').innerHTML = ids.map(id => {
    const [name, price, stock] = catalog[id];
    return `<div class="line" data-id="${id}">
      <input type="checkbox" aria-label="Chọn ${name}" ${selected.has(id) ? 'checked' : ''}>
      <div class="item-name"><img src="assets/images/${['office','energy','noodles'].includes(id) ? 'deals/' : ''}${id}.webp" alt=""><div><b>${name}</b><small>${stock ? 'Còn '+stock+' sản phẩm' : ''}</small></div></div>
      <b class="unit amount">${money(price)}</b><div class="stepper"><button data-action="minus" aria-label="Giảm ${name}" ${cart[id] <= 1 ? 'disabled' : ''}>−</button><b>${cart[id]}</b><button data-action="plus" aria-label="Tăng ${name}">+</button></div>
      <b class="amount">${money(price * cart[id])}</b><button class="trash" data-action="delete" aria-label="Xóa ${name}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/></svg></button></div>`;
  }).join('') || '<p>Giỏ hàng của bạn đang trống.</p>';
  get('subtotal-label').textContent = 'Tạm tính (' + chosen.length + ' sản phẩm)';
  get('subtotal').textContent = get('total').textContent = money(subtotal);
  get('shipping').textContent = money(fee);
  get('discount').textContent = (fee ? '−' : '') + money(fee);
  document.querySelectorAll('.select-all').forEach(box => {
    box.checked = ids.length > 0 && chosen.length === ids.length;
    box.indeterminate = chosen.length > 0 && chosen.length < ids.length;
  });
  document.querySelector('.pay').disabled = !chosen.length;
}
function save() { localStorage.setItem('dop-cart',JSON.stringify(cart)); render(); }
get('rows').onclick = event => {
  const row = event.target.closest('[data-id]');
  if (!row) return;
  const id = row.dataset.id;
  if (event.target.type === 'checkbox') {
    if (event.target.checked) selected.add(id); else selected.delete(id);
    render(); return;
  }
  const action = event.target.closest('button')?.dataset.action;
  if (action === 'plus') cart[id]++;
  else if (action === 'minus') cart[id] = Math.max(1,cart[id]-1);
  else if (action === 'delete') { delete cart[id]; selected.delete(id); }
  else return;
  save();
};
document.querySelectorAll('.select-all').forEach(box => box.onchange = () => {
  selected.clear();
  if (box.checked) Object.keys(cart).forEach(id => selected.add(id));
  render();
});
get('remove-selected').onclick = () => {
  selected.forEach(id => delete cart[id]); selected.clear(); save();
};
document.querySelector('.pay').onclick = () => {
  sessionStorage.setItem('dop-checkout-selection', JSON.stringify([...selected]));
  location.href = 'checkout.html';
};
render();
