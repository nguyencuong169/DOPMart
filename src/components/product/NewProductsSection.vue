<script setup>
import {ArrowRight,Sparkles} from 'lucide-vue-next'
import ProductGrid from './ProductGrid.vue'
defineProps({products:Array})
</script>
<template><section class="section new-products-section"><div class="new-products-banner"><div><span><Sparkles/> NEW THIS WEEK</span><h2>Mới lên kệ,<br>thử trước đồng nghiệp.</h2></div><RouterLink to="/products?filter=new" class="primary">Xem món mới <ArrowRight/></RouterLink></div><ProductGrid :products="products.slice(0,4)"/></section></template>
