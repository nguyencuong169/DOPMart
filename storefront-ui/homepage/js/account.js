const readCart = () => JSON.parse(localStorage.getItem('dop-cart') || '{}');
function refreshBadge() {
  updateCartBadge(Object.values(readCart()).filter(quantity => quantity > 0).length);
}
refreshBadge();
window.addEventListener('pageshow', refreshBadge);
document.querySelector('#cart').onclick = () => location.href = 'cart.html';
document.querySelector('#favorites').onclick = () => location.hash = 'saved';
document.querySelector('.menu').onclick = () => location.href = 'index.html#categories';
document.querySelector('.mobile-search').onclick = () => location.href = 'index.html#products';
document.querySelectorAll('[name=pay]').forEach(option => {
  if (option.value === localStorage.getItem('dop-account-pay')) option.checked = true;
  option.onchange = () => localStorage.setItem('dop-account-pay', option.value);
});
let timer;
document.querySelectorAll('[data-add]').forEach(button => button.onclick = () => {
  const cart = readCart();
  const id = button.dataset.add;
  cart[id] = (cart[id] || 0) + 1;
  localStorage.setItem('dop-cart', JSON.stringify(cart));
  refreshBadge();
  const toast = document.querySelector('.toast');
  toast.textContent = 'Đã thêm sản phẩm vào giỏ hàng';
  toast.hidden = false;
  clearTimeout(timer);
  timer = setTimeout(() => toast.hidden = true, 1800);
});
const editor = document.querySelector('#editor');
const editorForm = editor.querySelector('form');
const model = JSON.parse(localStorage.getItem('dop-account-demo') || '{"addresses":[],"payment":[]}');
const identityFields = [...document.querySelectorAll('#personal dt')].map(el => el.textContent);
const definitions = {personal: identityFields, addresses: ['Tên địa chỉ','Địa chỉ cụ thể'], payment: ['Tên phương thức','Mô tả']};
function showIdentity(values) {
  document.querySelectorAll('#personal dd').forEach((dd,i) => dd.textContent = values[i]);
  document.querySelector('[data-name]').textContent = values[0];
  document.querySelector('.welcome p').textContent = values[1] + '  ·  ' + values[2];
}
function addEntry(group, values, index) {
  const entry = document.createElement(group === 'payment' ? 'label' : 'div');
  entry.className = 'entry';
  const copy = document.createElement('div');
  for (const [i,text] of values.entries()) {
    const line = document.createElement(i === 0 ? 'b' : 'small');
    line.textContent = text;
    copy.append(line);
  }
  entry.append(copy);
  if (group === 'payment') {
    const radio = document.createElement('input');
    radio.type = 'radio'; radio.name = 'pay'; radio.value = 'extra-' + index;
    radio.checked = localStorage.getItem('dop-account-pay') === radio.value;
    radio.onchange = () => localStorage.setItem('dop-account-pay', radio.value);
    entry.append(radio);
  }
  document.getElementById(group).append(entry);
  if (group === 'addresses') document.querySelector('.tiles a[href="#addresses"] i').textContent = 2 + model.addresses.length;
}
if (model.personal) showIdentity(model.personal);
for (const group of ['addresses','payment']) model[group].forEach((v,i) => addEntry(group,v,i));
document.querySelectorAll('[data-editor]').forEach(button => button.onclick = () => {
  const group = button.dataset.editor;
  editorForm.dataset.group = group;
  editor.querySelector('h2').textContent = button.textContent.replace('+ ','');
  const inputs = editor.querySelector('.inputs');
  inputs.replaceChildren();
  definitions[group].forEach((title,i) => {
    const label = document.createElement('label');
    label.textContent = title;
    const input = document.createElement('input');
    input.name = String(i); input.required = true;
    if (group === 'personal') input.value = document.querySelectorAll('#personal dd')[i].textContent;
    label.append(input); inputs.append(label);
  });
  editor.showModal();
});
editor.querySelector('.dismiss').onclick = () => editor.close();
editorForm.onsubmit = event => {
  event.preventDefault();
  const group = editorForm.dataset.group;
  const values = [...new FormData(editorForm).values()].map(value => value.trim());
  if (values.some(value => !value)) return;
  if (group === 'personal') { model.personal = values; showIdentity(values); }
  else { model[group].push(values); addEntry(group, values, model[group].length-1); }
  localStorage.setItem('dop-account-demo', JSON.stringify(model));
  editor.close();
};
