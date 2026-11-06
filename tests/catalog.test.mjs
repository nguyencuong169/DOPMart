import assert from 'node:assert/strict'
import {applyCatalogFilters,paginate} from '../src/data/catalog.js'
const p=[
{id:1,category:'chips',price:12000,rating:4.6,sold:20,isNew:false,stock:{14:0,20:2}},
{id:2,category:'drinks',price:18000,rating:4.9,sold:50,isNew:true,stock:{14:3,20:0}},
{id:3,category:'chips',price:10000,rating:4.8,sold:30,isNew:true,stock:{14:4,20:5}},
{id:4,category:'candy',price:15000,rating:4.5,sold:10,isNew:false,stock:{14:2,20:1}},
{id:5,category:'chips',price:22000,rating:4.7,sold:40,isNew:false,stock:{14:1,20:3}}
]
assert.deepEqual(applyCatalogFilters(p,{category:'chips'}).map(x=>x.id),[1,3,5])
assert.deepEqual(applyCatalogFilters(p,{stockOnly:true,floor:20}).map(x=>x.id),[1,3,4,5])
assert.deepEqual(applyCatalogFilters(p,{sort:'price-asc'}).map(x=>x.id),[3,1,4,2,5])
assert.deepEqual(applyCatalogFilters(p,{sort:'price-desc'}).map(x=>x.id),[5,2,4,1,3])
assert.deepEqual(applyCatalogFilters(p,{sort:'best'}).map(x=>x.id),[2,5,3,1,4])
assert.deepEqual(applyCatalogFilters(p,{sort:'rating'}).map(x=>x.id),[2,3,5,1,4])
assert.deepEqual(applyCatalogFilters(p,{sort:'newest'}).slice(0,2).map(x=>x.id),[3,2])
assert.deepEqual(applyCatalogFilters(p,{category:'chips',stockOnly:true,floor:14,sort:'price-asc'}).map(x=>x.id),[3,5])
let r=paginate(Array.from({length:17},(_,i)=>i+1),2,8);assert.equal(r.pages,3);assert.deepEqual(r.items,[9,10,11,12,13,14,15,16]);assert.equal(r.total,17)
r=paginate([1,2],99,8);assert.equal(r.page,1);assert.deepEqual(r.items,[1,2])
console.log('catalog tests: 10/10 passed')
