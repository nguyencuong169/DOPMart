(() => {
  const ids = ['cola', 'water', 'lays', 'choco', 'noodle'];
  const sections = {cola:'drink', water:'drink', lays:'snack', choco:'candy', noodle:'instant'};
  const delivered = samples.filter(order => order[3] === 'done').map(order => order[5]);
  const current = new URLSearchParams(location.search).get('id');
  const item = ids.includes(current) ? current : 'cola';
  const frequency = (id, orders) => orders.filter(items => items.includes(id)).length;
  const ranked = (options, orders) => options.slice().sort((a,b) => frequency(b,orders) - frequency(a,orders));
  const product = id => card('product.html?id=' + id, id, catalog[id][0], moneyLabel(catalog[id][1]));
  function moneyLabel(value) { return value.toLocaleString('vi-VN') + 'đ'; }
  function card(url, image, title, caption) {
    return `<a class="shelf-card" href="${url}"><img loading="lazy" src="assets/images/${image}.webp" alt=""><b>${title}</b><span>${caption}</span></a>`;
  }
  for (const shelf of document.querySelectorAll('[data-shelf]')) {
    let cards;
    switch (shelf.dataset.shelf) {
      case 'sales':
        cards = Object.entries(saleReferencePrices).map(([id, original]) => {
          const [name, price] = catalog[id];
          const discount = Math.round(100 * (original - price) / original);
          return `<a class="shelf-card sale-card" href="product.html?id=${id}">
            <span class="sale-label">−${discount}%</span>
            <img loading="lazy" src="assets/images/${id}.webp" alt="">
            <b>${name}</b>
            <div class="sale-prices"><strong aria-label="Giá sau giảm ${moneyLabel(price)}">${moneyLabel(price)}</strong>
              <del aria-label="Giá trước giảm ${moneyLabel(original)}">${moneyLabel(original)}</del></div>
          </a>`;
        });
        break;
      case 'combos':
        cards = ['office','energy','noodles'].map(id => {
          const [name, price] = catalog[id];
          return `<a class="combo-offer" href="deals.html#combos">
            <div><b>${name}</b><span>${moneyLabel(price)}</span></div>
            <img loading="lazy" src="assets/images/deals/${id}.webp" alt="">
          </a>`;
        });
        break;
      case 'best':
        cards = ranked(ids, delivered).slice(0,4).map(product);
        break;
      case 'related':
        cards = ids.filter(id => id !== item && sections[id] === sections[item]).map(product);
        break;
      case 'pairs': {
        const orders = delivered.filter(items => items.includes(item));
        cards = ranked(ids.filter(id => id !== item && sections[id] !== sections[item] && frequency(id,orders)),orders).slice(0,3).map(product);
        break;
      }
    }
    if (cards.length) shelf.innerHTML = cards.join('');
    else shelf.closest('section').hidden = true;
  }
})();
