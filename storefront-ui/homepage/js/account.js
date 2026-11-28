const readCart = () => JSON.parse(localStorage.getItem('dop-cart') || '{}');
function refreshBadge() {
  updateCartBadge(Object.values(readCart()).filter(quantity => quantity > 0).length);
}
refreshBadge();
window.addEventListener('pageshow', refreshBadge);
document.querySelectorAll('[name=pay]').forEach(option => {
  if (option.value === localStorage.getItem('dop-account-pay')) option.checked = true;
  option.onchange = () => localStorage.setItem('dop-account-pay', option.value);
});
let timer;
document.querySelectorAll('[data-add]').forEach(button => button.onclick = function () {
  const cart = readCart();
  const id = this.dataset.add;
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
  return entry;
}
const addressPanel = document.querySelector('#addresses');
if (!model.addressBook) {
  const defaults = [...addressPanel.querySelectorAll('.entry')].map(row => [
    row.querySelector('b').textContent, row.querySelector('small:last-child').textContent
  ]);
  model.addressBook = defaults.concat(model.addresses);
}
function renderAddresses() {
  addressPanel.querySelectorAll('.entry').forEach(row => row.remove());
  model.addressBook.forEach((values, index) => {
    const row = addEntry('addresses', values, index);
    row.prepend(document.querySelector('.sidebar a[href="#addresses"] svg').cloneNode(true));
    if (index === 0) {
      const badge = document.createElement('small');
      badge.className = 'default';
      badge.textContent = 'Mặc định';
      row.querySelector('div').prepend(badge);
    }
    for (const [label, path] of [
      ['Sửa', 'M3 21l5-1 13-13-4-4L4 16zM14 6l4 4'],
      ['Xóa', 'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7']
    ]) {
      const button = document.createElement('button');
      button.className = 'address-action';
      button.setAttribute('aria-label', label + ' ' + values[0]);
      button.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="' + path + '"/></svg>';
      button.onclick = () => {
        if (label === 'Sửa') openEditor('addresses', 'Sửa địa chỉ', index);
        else if (confirm('Xóa địa chỉ ' + values[0] + '?')) {
          model.addressBook.splice(index, 1);
          saveModel();
          renderAddresses();
        }
      };
      row.append(button);
    }
  });
  document.querySelector('.tiles a[href="#addresses"] i').textContent = model.addressBook.length;
}
function saveModel() {
  localStorage.setItem('dop-account-demo', JSON.stringify(model));
}
if (model.personal) showIdentity(model.personal);
model.payment.forEach((values, index) => addEntry('payment', values, index));
renderAddresses();
function openEditor(group, title, index) {
  editorForm.dataset.index = index ?? '';
  editorForm.dataset.group = group;
  editor.querySelector('h2').textContent = title;
  const inputs = editor.querySelector('.inputs');
  inputs.replaceChildren();
  definitions[group].forEach((title,i) => {
    const label = document.createElement('label');
    label.textContent = title;
    const input = document.createElement('input');
    input.name = String(i); input.required = true;
    if (group === 'personal') input.value = document.querySelectorAll('#personal dd')[i].textContent;
    if (index !== undefined) input.value = model.addressBook[index][i];
    label.append(input); inputs.append(label);
  });
  editor.showModal();
}
document.querySelectorAll('[data-editor]').forEach(button => {
  button.onclick = () => openEditor(button.dataset.editor, button.textContent.replace('+ ',''));
});
editor.querySelector('.dismiss').onclick = () => editor.close();
editorForm.onsubmit = event => {
  event.preventDefault();
  const group = editorForm.dataset.group;
  const values = [...new FormData(editorForm).values()].map(value => value.trim());
  if (values.some(value => !value)) return;
  if (group === 'personal') { model.personal = values; showIdentity(values); }
  else if (group === 'addresses') {
    const index = editorForm.dataset.index;
    if (index === '') model.addressBook.push(values);
    else model.addressBook[Number(index)] = values;
    renderAddresses();
  }
  else { model[group].push(values); addEntry(group, values, model[group].length-1); }
  localStorage.setItem('dop-account-demo', JSON.stringify(model));
  editor.close();
};

const savedGrid = document.querySelector('.saved-grid');
const savedCards = [...savedGrid.children];
const favoriteKey = 'dop-fav';
const sampleIds = savedCards.map(card => card.querySelector('[data-add]').dataset.add);
if (localStorage.getItem(favoriteKey) === null) {
  localStorage.setItem(favoriteKey, JSON.stringify(sampleIds));
}
const waterCard = savedCards[0].cloneNode(true);
waterCard.querySelector('img').src = 'assets/images/water.webp';
waterCard.querySelector('b').textContent = 'Nước suối Lavie 500ml';
waterCard.querySelector('footer').firstChild.textContent = '7.000đ';
const waterButton = waterCard.querySelector('button');
waterButton.dataset.add = 'water';
waterButton.setAttribute('aria-label', 'Thêm nước suối Lavie vào giỏ');
waterButton.onclick = savedCards[0].querySelector('button').onclick;
savedCards.push(waterCard);
function renderFavorites() {
  const ids = new Set(JSON.parse(localStorage.getItem(favoriteKey) || '[]'));
  savedGrid.replaceChildren();
  for (const card of savedCards) {
    const id = card.querySelector('[data-add]').dataset.add;
    if (!ids.has(id)) continue;
    savedGrid.append(card);
    if (card.querySelector('.saved-heart')) continue;
    const heart = document.createElement('button');
    heart.className = 'saved-heart';
    heart.textContent = '♡';
    heart.setAttribute('aria-label', 'Bỏ yêu thích ' + card.querySelector('b').textContent);
    heart.onclick = () => {
      const current = new Set(JSON.parse(localStorage.getItem(favoriteKey) || '[]'));
      current.delete(id);
      localStorage.setItem(favoriteKey, JSON.stringify([...current]));
      renderFavorites();
    };
    card.prepend(heart);
  }
  document.querySelector('.tiles a[href="#saved"] i').textContent = ids.size;
  if (!savedGrid.childElementCount) savedGrid.textContent = 'Chưa có sản phẩm yêu thích.';
}
window.addEventListener('pageshow', renderFavorites);
renderFavorites();
