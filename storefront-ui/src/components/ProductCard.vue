<script setup lang="ts">
import {money,type Product} from '../catalog'
defineProps<{product:Product;favorite:boolean;quantity:number}>()
defineEmits<{add:[id:number];favorite:[id:number]}>()
</script>
<template><article class="product-card"><div class="picture" :style="{background:product.color}"><span class="tag">DOP PICK</span><button class="heart" :aria-label="'Yêu thích '+product.name" :aria-pressed="favorite" @click="$emit('favorite',product.id)">{{favorite?'♥':'♡'}}</button><ProductArt :id="product.id"/></div><small>{{product.category}} · {{product.taste}}</small><h3>{{product.name}}</h3><p class="stock">&#9679; Còn {{product.stock}} sản phẩm</p><div class="buy"><b>{{money(product.price)}}</b><button :disabled="quantity>=product.stock" :aria-label="'Thêm '+product.name" @click="$emit('add',product.id)">+</button></div></article></template>
<script lang="ts">
import ProductArt from './ProductArt.vue'
export default {components:{ProductArt}}
</script>
<style scoped>.stock{font-size:12px;color:#365b40;margin:4px 0 12px}.product-card button:disabled{opacity:.45;cursor:not-allowed}.product-card h3{min-height:2.4em}.product-card small{letter-spacing:0}</style>