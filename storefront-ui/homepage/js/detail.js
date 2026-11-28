const ids = ['cola', 'lays', 'choco', 'water', 'noodle'];
const requested = new URLSearchParams(location.search).get('id');
const id = ids.includes(requested) ? requested : 'cola';
const [name, price, stock] = catalog[id];
const get = selector => document.querySelector(selector);
const read = (key, fallback) => JSON.parse(localStorage.getItem(key) || fallback);
const priceText = price.toLocaleString('vi-VN') + 'đ';
document.title = name + ' | DOP Mart';
get('#name').textContent = name;
get('.detail-price').textContent = priceText;
get('#photo').src = 'assets/images/' + id + '.webp';
get('#photo').alt = name;
get('#stock').textContent = stock ? 'Còn ' + stock + ' sản phẩm' : '';
for (const item of [id, ...ids.filter(other => other !== id)].slice(0, 3)) {
  const link = document.createElement('a');
  link.href = 'product.html?id=' + item;
  if (item === id) link.setAttribute('aria-current', 'page');
  const image = new Image();
  image.src = 'assets/images/' + item + '.webp';
  image.alt = catalog[item][0];
  link.append(image);
  get('.thumbs').append(link);
}
let quantity = 1;
function refresh() {
  const cart = read('dop-cart', '{}');
  updateCartBadge(Object.values(cart).filter(value => value > 0).length);
  const available = stock === undefined ? Infinity : Math.max(0, stock - (cart[id] || 0));
  quantity = Math.min(quantity, available);
  get('#quantity').value = quantity;
  get('#less').disabled = quantity <= 1;
  get('#more').disabled = quantity >= available;
  get('#buy').disabled = quantity === 0;
  const saved = read('dop-fav', '[]').includes(id);
  get('#save').textContent = saved ? '♥' : '♡';
  get('#save').setAttribute('aria-pressed', String(saved));
}
get('#more').onclick = () => { quantity++; refresh(); };
get('#less').onclick = () => { quantity--; refresh(); };
let timer;
get('#buy').onclick = () => {
  refresh();
  if (!quantity) return;
  const cart = read('dop-cart', '{}');
  cart[id] = (cart[id] || 0) + quantity;
  localStorage.setItem('dop-cart', JSON.stringify(cart));
  quantity = 1;
  refresh();
  get('.toast').textContent = 'Đã thêm ' + name + ' vào giỏ hàng';
  get('.toast').hidden = false;
  clearTimeout(timer);
  timer = setTimeout(() => get('.toast').hidden = true, 2000);
};
get('#save').onclick = () => {
  const favorites = new Set(read('dop-fav', '[]'));
  if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
  localStorage.setItem('dop-fav', JSON.stringify([...favorites]));
  refresh();
};
const categories = { cola: 'Đồ uống', lays: 'Snack', choco: 'Bánh kẹo', water: 'Đồ uống', noodle: 'Mì & Ăn liền' };
const descriptions = {
  cola: 'Nước ngọt có ga Coca-Cola, lon 330 ml.',
  lays: 'Snack khoai tây Lay’s Classic, gói 52 g.',
  choco: 'Bánh Choco Pie, hộp 12 cái.',
  water: 'Nước suối La Vie, chai 500 ml.',
  noodle: 'Mì ly Hảo Hảo vị tôm chua cay.'
};
const sections = {description: descriptions[id], info: 'Danh mục: ' + categories[id], reviews: 'Chưa có đánh giá.'};
for (const button of document.querySelectorAll('[data-section]')) {
  button.onclick = () => {
    for (const tab of document.querySelectorAll('[data-section]')) tab.setAttribute('aria-pressed', String(tab === button));
    get('#copy').textContent = sections[button.dataset.section];
  };
}
get('[data-section]').click();

refresh();
window.addEventListener('pageshow', refresh);
