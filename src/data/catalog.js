export function applyCatalogFilters(products,{category='all',stockOnly=false,floor=20,sort='default'}={}){
 let list=[...products]
 if(category!=='all')list=list.filter(p=>p.category===category)
 if(stockOnly)list=list.filter(p=>(p.stock?.[floor]??0)>0)
 const sorts={best:(a,b)=>b.sold-a.sold,rating:(a,b)=>b.rating-a.rating,'price-asc':(a,b)=>a.price-b.price,'price-desc':(a,b)=>b.price-a.price,newest:(a,b)=>Number(b.isNew)-Number(a.isNew)||b.id-a.id}
 if(sorts[sort])list.sort(sorts[sort])
 return list
}
export function paginate(items,page=1,pageSize=8){
 const pages=Math.max(1,Math.ceil(items.length/pageSize));const safePage=Math.min(Math.max(1,Number(page)||1),pages)
 return{items:items.slice((safePage-1)*pageSize,safePage*pageSize),page:safePage,pages,total:items.length,pageSize}
}
