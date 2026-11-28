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
        cards = [['cola', 'Đồ uống',20],['lays','Snack',30],['noodle','Mì ly',25],['choco','Bánh kẹo',20]]
          .map(([key,title,percent]) => card('product.html?id='+key,key,catalog[key][0],moneyLabel(catalog[key][1])+' · '+title+' ưu đãi đến '+percent+'%'));
        break;
      case 'combos':
        cards = ['office','energy','noodles'].map(id => card('deals.html#combos','deals/'+id,catalog[id][0],moneyLabel(catalog[id][1])));
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
