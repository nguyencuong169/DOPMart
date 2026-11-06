import {defineStore} from 'pinia'
import {products,categories} from '../data/products'
export const useProductStore=defineStore('products',{
 state:()=>({products,categories,query:'',page:1,pageSize:8,quickProduct:null}),
 getters:{
  filtered:s=>s.products.filter(p=>(p.name+' '+p.categoryName).toLowerCase().includes(s.query.toLowerCase())),
  newProducts:s=>s.products.filter(p=>p.isNew),
  bestSellers:s=>[...s.products].sort((a,b)=>b.sold-a.sold),
  bySlug:s=>slug=>s.products.find(p=>p.slug===slug),
  byCategory:s=>slug=>s.products.filter(p=>p.category===slug)
 },
 actions:{openQuick(product){this.quickProduct=product},closeQuick(){this.quickProduct=null}}
})
