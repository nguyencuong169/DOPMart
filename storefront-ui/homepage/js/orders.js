// Preview fixtures mirror the approved order list. Historical totals include the
// discounts and delivery charges recorded at purchase, independent of today's cart.
const states = {all:'Tất cả',waiting:'Chờ xác nhận',shipping:'Đang giao',done:'Đã giao',cancelled:'Đã hủy'};
const samples = [
 ['241128-0038','28','10:24','done',99000,['cola','lays','noodle','water','choco']],
 ['241126-0029','26','14:08','shipping',72000,['water','choco','lays','cola']],
 ['241125-0027','25','09:16','waiting',118000,['cola','noodle','water','lays','choco']],
 ['241122-0021','22','16:37','done',85000,['lays','choco','water']],
 ['241118-0019','18','11:02','cancelled',33000,['cola','lays']],
 ['241117-0018','17','12:40','done',45000,['choco']],
 ['241116-0016','16','08:15','shipping',23000,['cola','noodle']],
 ['241115-0015','15','10:12','done',22000,['cola','water']],
 ['241114-0014','14','15:20','done',26000,['lays','noodle']],
 ['241113-0011','13','09:45','done',15000,['cola']],
 ['241111-0009','11','18:30','done',25000,['lays','water']],
 ['241109-0005','09','13:05','done',53000,['choco','noodle']]
];
const orders = samples.map(([id,day,time,state,total,items]) => ({id:'DOP'+id,date:'2026-11-'+day,time,state,total,items}));
const form = document.querySelector('#filters');
const tabs = document.querySelector('#tabs');
const stateSelect = form.elements.state;
const list = document.querySelector('#list');
const dialog = document.querySelector('#detail');
const money = value => value.toLocaleString('vi-VN') + 'đ';
const displayDate = value => value.split('-').reverse().join('/');
const normalize = value => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('đ','d');
let page = 1;
stateSelect.innerHTML = Object.entries(states).map(([key,label]) => '<option value="'+key+'">'+(key==='all'?'Tất cả trạng thái':label)+'</option>').join('');
function filteredOrders() {
 const {query,from,to,state} = form.elements;
 const term = normalize(query.value.trim());
 return orders.filter(order => (state.value==='all'||order.state===state.value)
   && (!from.value||order.date>=from.value) && (!to.value||order.date<=to.value)
   && normalize([order.id,...order.items.map(id=>catalog[id][0])].join(' ')).includes(term));
}
function row(order) {
 const {id,date,time,state,total,items} = order;
 const previewSize = id === 'DOP241125-0027' ? 2 : 3;
 const photos = items.slice(0,previewSize).map(key=>'<img src="assets/images/'+key+'.webp" alt="'+catalog[key][0]+'">').join('');
 const buttons = (state==='done'?'<button class="buy" data-action="buy">Mua lại</button>':'')
   + '<button data-action="detail">Xem chi tiết →</button>'
   + (state==='waiting'?'<button data-action="cancel">Hủy đơn</button>':'');
 return '<article class="order" data-id="'+id+'"><div><b>Đơn hàng #'+id+'</b><small>'+displayDate(date)+' · '+time+'</small></div><div class="thumbs">'+photos+(items.length>previewSize?'<span>+'+(items.length-previewSize)+'</span>':'')+'</div><div>Tổng tiền<strong>'+money(total)+'</strong></div><div><span class="badge-state '+state+'">'+states[state]+'</span><small>'+({done:'Đã nhận hàng: '+displayDate(date),shipping:id==='DOP241126-0029'?'Dự kiến: 26/11/2026 (15:30)':'Đang giao hàng',waiting:'Đang xử lý đơn hàng',cancelled:'Đơn hàng đã được hủy'}[state])+'</small></div><div class="actions-row">'+buttons+'</div></article>';
}
const phoneTabs = window.matchMedia('(max-width: 600px)');
let revealedState;
function updateTabEdges() {
 const maxScroll = tabs.scrollWidth - tabs.clientWidth;
 tabs.classList.toggle('more-left', tabs.scrollLeft > 1);
 tabs.classList.toggle('more-right', maxScroll - tabs.scrollLeft > 1);
}
function revealSelectedTab() {
 if (phoneTabs.matches && revealedState !== stateSelect.value) {
  const active = tabs.querySelector('[aria-pressed="true"]');
  const bounds = tabs.getBoundingClientRect();
  const item = active.getBoundingClientRect();
  if (item.right > bounds.right - 18) tabs.scrollLeft += item.right - bounds.right + 18;
  else if (item.left < bounds.left + 12) tabs.scrollLeft += item.left - bounds.left - 12;
  revealedState = stateSelect.value;
 }
 updateTabEdges();
}
tabs.addEventListener('scroll', updateTabEdges, {passive:true});
new ResizeObserver(() => { revealedState = undefined; revealSelectedTab(); }).observe(tabs);
function render() {
 for (const key of ['from','to']) {
  const input = form.elements[key];
  input.parentElement.classList.toggle('has-value', Boolean(input.value));
 }
 tabs.innerHTML = Object.entries(states).map(([key,label])=>'<button data-state="'+key+'" aria-pressed="'+(stateSelect.value===key)+'">'+label+' ('+orders.filter(o=>key==='all'||o.state===key).length+')</button>').join('');
 revealSelectedTab();
 const matches=filteredOrders(), pages=Math.ceil(matches.length/5);
 page=Math.min(page,Math.max(1,pages));
 const visible=matches.slice((page-1)*5,page*5);
 list.innerHTML=visible.map(row).join('') || '<p class="empty">Không tìm thấy đơn hàng phù hợp.</p>';
 document.querySelector('#count').textContent='Hiển thị '+visible.length+' / '+matches.length+' đơn hàng';
 document.querySelector('#pages').innerHTML=(!pages?'':'<button aria-label="Trang trước" data-page="'+(page-1)+'" '+(page===1?'disabled':'')+'>‹</button>')+Array.from({length:pages},(_,i)=>'<button data-page="'+(i+1)+'" '+(i+1===page?'aria-current="page"':'')+'>'+(i+1)+'</button>').join('')+(!pages?'':'<button aria-label="Trang sau" data-page="'+(page+1)+'" '+(page===pages?'disabled':'')+'>›</button>');
}
form.oninput=()=>{page=1;render()};
form.onsubmit=e=>e.preventDefault();
form.onreset = event => {
 event.preventDefault();
 for (const field of ['query','from','to']) form.elements[field].value = '';
 stateSelect.value = 'all';
 page = 1;
 render();
};
tabs.onclick=e=>{if(e.target.dataset.state){stateSelect.value=e.target.dataset.state;page=1;render()}};
document.querySelector('#pages').onclick=e=>{if(e.target.dataset.page){page=Number(e.target.dataset.page);render()}};
function cartCount(){
 const cart=JSON.parse(localStorage.getItem('dop-cart')||'{}');
 updateCartBadge(Object.values(cart).filter(q=>q>0).length);
}
list.onclick=e=>{
 const button=e.target.closest('[data-action]'); if(!button)return;
 const order=orders.find(o=>o.id===button.closest('.order').dataset.id);
 if(button.dataset.action==='buy'){
  const cart=JSON.parse(localStorage.getItem('dop-cart')||'{}');
  for(const key of order.items) cart[key]=(cart[key]||0)+1;
  localStorage.setItem('dop-cart',JSON.stringify(cart));location.href='cart.html';return;
 }
 if(button.dataset.action==='cancel'){
  if(confirm('Hủy đơn hàng mẫu #'+order.id+'?')){order.state='cancelled';render()}return;
 }
 dialog.querySelector('h2').textContent='#'+order.id;
 dialog.querySelector('div').innerHTML='<p>'+displayDate(order.date)+' · '+states[order.state]+'</p>'+order.items.map(key=>'<p>'+catalog[key][0]+'</p>').join('')+'<p><b>Tổng tiền: '+money(order.total)+'</b></p>';
 dialog.showModal();
};
document.querySelector('#cart').onclick=()=>location.href='cart.html';
document.querySelector('.menu').onclick=()=>location.href='index.html#categories';
document.querySelector('.search').oninput=e=>{form.elements.query.value=e.target.value;page=1;render()};
cartCount();render();

const mobileFilters = form.querySelector('.mobile-filter-toggle');
mobileFilters.onclick = () => {
 const open = form.classList.toggle('filters-open');
 mobileFilters.setAttribute('aria-expanded', String(open));
};
