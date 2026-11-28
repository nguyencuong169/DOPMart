const grid = document.querySelector('.catalog-grid');
const originalOrder = Array.from(grid.children);
const priceOf = card => Number(card.querySelector('.price').textContent.replace(/\D/g, ''));
document.querySelector('#sort').addEventListener('change', event => {
  const order = event.target.value;
  const sorted = originalOrder.slice();
  if (order !== 'default') {
    const direction = order === 'asc' ? 1 : -1;
    sorted.sort((a, b) => direction * (priceOf(a) - priceOf(b)));
  }
  grid.append(...sorted);
});
const query = new URLSearchParams(location.search).get('q');
if (query) {
  const search = document.querySelector('.store-search input');
  search.value = query;
  search.dispatchEvent(new Event('input'));
}
