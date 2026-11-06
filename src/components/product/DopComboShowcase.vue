<script setup>
import {ref,computed} from 'vue'
import {ChevronLeft,ChevronRight,ShoppingBag,Sparkles} from 'lucide-vue-next'
import {useProductStore} from '../../stores/productStore'
import {useCartStore} from '../../stores/cartStore'
const store=useProductStore(),cart=useCartStore(),index=ref(0)
const combos=computed(()=>[
 {name:'Deadline Rescue',tag:'MÌ + NƯỚC + SNACK',ids:[3,22,1],price:39000,old:42000,color:'#ef3340',copy:'Cứu đói nhanh trước một buổi họp dài.'},
 {name:'Afternoon Recharge',tag:'HEALTHY + DRINK',ids:[26,23],price:37000,old:43000,color:'#137c58',copy:'Nhẹ bụng nhưng vẫn đủ năng lượng cho buổi chiều.'},
 {name:'Team Sharing Box',tag:'4 MÓN CHIA SẺ',ids:[5,13,19,24],price:55000,old:63000,color:'#7a32a8',copy:'Một combo vui vẻ để chia cùng đồng đội.'}
].map(c=>({...c,items:c.ids.map(id=>store.products.find(p=>p.id===id)).filter(Boolean)})))
const current=computed(()=>combos.value[index.value]);function move(d){index.value=(index.value+d+combos.value.length)%combos.value.length}function add(){current.value.items.forEach(p=>cart.add(p,1))}
</script>
<template><section class="dop-combo" :style="{'--combo-color':current.color}"><div class="combo-pattern">DOP MIX · LOVE PRICE · DOP MIX · LOVE PRICE</div><div class="combo-copy"><span><Sparkles/> DOP COMBO</span><h2>Mix đúng mood.<br>Giá thật yêu.</h2><p>DOP chọn sẵn những món hợp nhau để bạn không mất thời gian suy nghĩ.</p><div class="combo-nav"><button @click="move(-1)"><ChevronLeft/></button><span>0{{index+1}} / 0{{combos.length}}</span><button @click="move(1)"><ChevronRight/></button></div></div><div class="combo-stage"><div class="combo-burst"></div><TransitionGroup name="combo-pop" tag="div" class="combo-products"><img v-for="(item,i) in current.items" :key="current.name+item.id" :src="item.image" :alt="item.name" :style="{'--i':i,'--total':current.items.length}"/></TransitionGroup><div class="combo-badge">SAVE<br><b>{{(current.old-current.price).toLocaleString('vi-VN')}}₫</b></div></div><div class="combo-info"><small>{{current.tag}}</small><h3>{{current.name}}</h3><p>{{current.copy}}</p><ul><li v-for="item in current.items" :key="item.id">{{item.name}}</li></ul><span><s>{{current.old.toLocaleString('vi-VN')}} ₫</s><b>{{current.price.toLocaleString('vi-VN')}} ₫</b></span><button @click="add">Thêm cả combo <ShoppingBag/></button></div></section></template>
