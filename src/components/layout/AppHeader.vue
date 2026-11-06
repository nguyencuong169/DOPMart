<script setup>
import {computed,ref,onMounted,onBeforeUnmount} from 'vue'
import {useRoute} from 'vue-router'
import {ShoppingBag,Menu,X} from 'lucide-vue-next'
import SearchBox from '../common/SearchBox.vue'
import FloorSelector from '../common/FloorSelector.vue'
import {useCartStore} from '../../stores/cartStore'
const route=useRoute(),cart=useCartStore(),scrolled=ref(false),mobileOpen=ref(false),inHero=ref(false),menuOpen=ref(false)
const exactProducts=computed(()=>route.path==='/products'&&!route.query.filter&&!route.query.sort)
const exactNew=computed(()=>route.path==='/products'&&route.query.filter==='new')
const exactBest=computed(()=>route.path==='/products'&&route.query.sort==='best')
function update(){scrolled.value=window.scrollY>54}
function close(){mobileOpen.value=false}
function closeMenu(){menuOpen.value=false}
function onMouseEnter(){inHero.value=true}
function onMouseLeave(){inHero.value=false}
function toggleMenu(){const isMobile=window.innerWidth<=760;if(isMobile){mobileOpen.value=!mobileOpen.value}else{menuOpen.value=!menuOpen.value}}
const isOpen=computed(()=>mobileOpen.value||menuOpen.value)
onMounted(()=>{update();window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',syncMenuMode)})
onBeforeUnmount(()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',syncMenuMode)})
function syncMenuMode(){const isMobile=window.innerWidth<=760;if(isMobile){if(menuOpen.value){mobileOpen.value=true;menuOpen.value=false}}else{if(mobileOpen.value){menuOpen.value=true;mobileOpen.value=false}}}
</script>
<template><header class="dop-header" :class="{scrolled,'on-hero':route.path==='/'&&!scrolled,'in-hero':inHero,'menu-open':menuOpen}" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave"><RouterLink to="/" class="dop-nav-logo"><span>DOP</span><b>mart</b><small>Mini mart · Big happy</small></RouterLink><nav class="dop-nav" :class="{open:mobileOpen}"><RouterLink to="/products" :class="{active:exactProducts}" @click="close">Sản phẩm</RouterLink><RouterLink to="/products?filter=new" :class="{active:exactNew}" @click="close">Mới</RouterLink><RouterLink to="/products?sort=best" :class="{active:exactBest}" @click="close">Bán chạy</RouterLink><a href="/#deals" @click="close">Khuyến mãi</a><a href="/#about" @click="close">About us</a><a href="/#how-it-works" @click="close">Cách đặt</a></nav><div class="dop-nav-actions"><div class="nav-search"><SearchBox/></div><FloorSelector/><button class="cart-button" @click="cart.open=true"><ShoppingBag/><span>{{cart.count}}</span></button><button class="nav-toggle" @click="toggleMenu" :aria-label="isOpen?'Đóng menu':'Mở menu'"><X v-if="isOpen"/><Menu v-else/></button></div><div class="dop-desktop-menu" :class="{open:menuOpen}"><div class="dop-desktop-menu__inner"><nav class="dop-nav"><RouterLink to="/products" :class="{active:exactProducts}" @click="closeMenu">Sản phẩm</RouterLink><RouterLink to="/products?filter=new" :class="{active:exactNew}" @click="closeMenu">Mới</RouterLink><RouterLink to="/products?sort=best" :class="{active:exactBest}" @click="closeMenu">Bán nhanh</RouterLink><a href="/#deals" @click="closeMenu">Khuyến mãi</a><a href="/#about" @click="closeMenu">About us</a><a href="/#how-it-works" @click="closeMenu">Cách đặt</a></nav><div class="dop-desktop-menu__actions"><div class="nav-search"><SearchBox/></div><FloorSelector/><button class="cart-button" @click="cart.open=true"><ShoppingBag/><span>{{cart.count}}</span></button></div></div></div></header></template>
