<script setup>
import {computed,ref,watch} from 'vue'
import {useRoute} from 'vue-router'
import {useProductStore} from '../stores/productStore'
import ProductGrid from '../components/product/ProductGrid.vue'
import Pagination from '../components/common/Pagination.vue'
const s=useProductStore(),route=useRoute(),page=ref(1),pageSize=8
const cat=computed(()=>s.categories.find(c=>c.slug===route.params.slug));const all=computed(()=>s.byCategory(route.params.slug));const pages=computed(()=>Math.max(1,Math.ceil(all.value.length/pageSize)));const list=computed(()=>all.value.slice((page.value-1)*pageSize,page.value*pageSize));watch(()=>route.params.slug,()=>page.value=1)
</script><template><main class="page catalog-page"><div class="page-title category-title"><span class="category-emoji">{{cat?.icon}}</span><div><span class="kicker">SHOP BY CATEGORY</span><h1>{{cat?.name||'Danh mục'}}</h1><p>{{all.length}} sản phẩm mẫu đang có.</p></div></div><ProductGrid :products="list"/><Pagination :page="page" :pages="pages" @change="page=$event"/></main></template>
