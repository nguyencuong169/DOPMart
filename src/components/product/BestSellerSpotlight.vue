<script setup>
import {ref,onMounted,onBeforeUnmount} from 'vue'
import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger.js'
import {ArrowRight,ShoppingBag} from 'lucide-vue-next'
import {useProductStore} from '../../stores/productStore'
import {useCartStore} from '../../stores/cartStore'
gsap.registerPlugin(ScrollTrigger)
const store=useProductStore(),cart=useCartStore(),root=ref(null),products=store.bestSellers.slice(0,4)
let ctx
onMounted(()=>{ctx=gsap.context(()=>{const panels=gsap.utils.toArray('.spotlight-panel');panels.forEach((panel,i)=>{const product=panel.querySelector('.spotlight-product');const info=panel.querySelector('.spotlight-info');gsap.timeline({scrollTrigger:{trigger:panel,start:'top 82%',end:'center 48%',scrub:1}}).fromTo(product,{x:window.innerWidth*.65,rotation:10,scale:.72,opacity:.2},{x:0,rotation:0,scale:1,opacity:1,ease:'none'}).fromTo(info,{x:130,opacity:0},{x:0,opacity:1,ease:'none'},.18);if(i<panels.length-1){gsap.to(panel,{scale:.94,opacity:.3,scrollTrigger:{trigger:panel,start:'center 35%',end:'bottom top',scrub:1}})}})},root.value)})
onBeforeUnmount(()=>ctx?.revert())
</script>
<template><section ref="root" class="bestseller-story"><div class="story-intro"><span>TO OFFICE FAVORITES →</span><h2>Món ngon<br>đang được săn.</h2><p>Cuộn xuống để từng best seller bước vào spotlight.</p></div><article v-for="(product,index) in products" :key="product.id" class="spotlight-panel" :style="{'--spot-color':product.color}"><div class="spotlight-rank"><small>OFFICE FAVORITE</small><b>#{{index+1}}</b></div><div class="spotlight-stage"><div class="spotlight-word">DOP<br>PICK</div><img class="spotlight-product" :src="product.image" :alt="product.name"/></div><div class="spotlight-info"><span>{{product.categoryName}} · TOP {{index+1}}</span><h3>{{product.name}}</h3><div class="spotlight-rating">★★★★★ <small>{{product.rating}} · {{product.sold}} đã bán</small></div><p>{{product.description}}</p><strong>{{product.price.toLocaleString('vi-VN')}} ₫</strong><div><button class="spotlight-buy" @click="cart.add(product)">Thêm vào giỏ <ShoppingBag/></button><RouterLink :to="`/product/${product.slug}`">Xem chi tiết <ArrowRight/></RouterLink></div></div></article><RouterLink class="spotlight-all" to="/products?sort=best">Xem toàn bộ bảng bán chạy <ArrowRight/></RouterLink></section></template>
