<script setup>
import {computed,ref,watch} from 'vue'
import {useRoute} from 'vue-router'
import {SlidersHorizontal} from 'lucide-vue-next'
import {useProductStore} from '../stores/productStore'
import {useFloorStore} from '../stores/floorStore'
import {applyCatalogFilters,paginate} from '../data/catalog'
import ProductGrid from '../components/product/ProductGrid.vue'
import Pagination from '../components/common/Pagination.vue'
const s=useProductStore(),floor=useFloorStore(),route=useRoute()
const page=ref(1),category=ref('all'),sort=ref(route.query.sort==='best'?'best':'default'),stockOnly=ref(false),pageSize=8
const base=computed(()=>route.query.filter==='new'?s.newProducts:s.products)
const filtered=computed(()=>applyCatalogFilters(base.value,{category:category.value,stockOnly:stockOnly.value,floor:floor.floor,sort:sort.value}))
const pagination=computed(()=>paginate(filtered.value,page.value,pageSize))
const pages=computed(()=>pagination.value.pages)
const list=computed(()=>pagination.value.items)
watch([category,sort,stockOnly,()=>route.query],()=>page.value=1,{deep:true})
watch(pages,v=>{if(page.value>v)page.value=v})
</script>
<template><main class="page catalog-page"><div class="page-title catalog-title"><div><span class="kicker">DOP SHELF · 32 PICKS</span><h1>Tủ snack hôm nay</h1><p>{{filtered.length}} món đang chờ bạn tại tầng {{floor.floor}}.</p></div><div class="catalog-stat"><b>{{s.products.length}}</b><span>sản phẩm</span></div></div><section class="catalog-toolbar"><div class="filter-label"><SlidersHorizontal/> BỘ LỌC</div><div class="category-chips"><button :class="{active:category==='all'}" @click="category='all'">Tất cả</button><button v-for="c in s.categories" :key="c.slug" :class="{active:category===c.slug}" @click="category=c.slug">{{c.icon}} {{c.name}}</button></div><div class="catalog-actions"><label><input v-model="stockOnly" type="checkbox"/> Còn hàng {{floor.floor}}F</label><select v-model="sort"><option value="default">Mặc định</option><option value="best">Bán chạy</option><option value="rating">Đánh giá cao</option><option value="price-asc">Giá thấp → cao</option><option value="price-desc">Giá cao → thấp</option></select></div></section><ProductGrid :products="list"/><Pagination :page="page" :pages="pages" @change="page=$event"/></main></template>
