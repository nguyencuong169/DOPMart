import chipsImage from '../assets/products/chips.png'
import spicyImage from '../assets/products/spicy.png'
import noodlesImage from '../assets/products/noodles.png'
import instantImage from '../assets/products/instant.png'
import chocolateImage from '../assets/products/chocolate.png'
import candyImage from '../assets/products/candy.png'
import drinksImage from '../assets/products/drinks.png'
import healthyImage from '../assets/products/healthy.png'

export const categories=[
 {slug:'chips',name:'Bim bim',icon:'🍟'}, {slug:'noodles',name:'Mì ly',icon:'🍜'},
 {slug:'instant',name:'Ăn liền',icon:'🌭'}, {slug:'chocolate',name:'Chocolate',icon:'🍫'},
 {slug:'drinks',name:'Nước uống',icon:'🥤'}, {slug:'spicy',name:'Đồ cay',icon:'🌶️'},
 {slug:'candy',name:'Kẹo',icon:'🍬'}, {slug:'healthy',name:'Healthy',icon:'🌿'}
]

const img={chips:chipsImage,spicy:spicyImage,healthy:healthyImage,instant:instantImage,noodles:noodlesImage,drinks:drinksImage,chocolate:chocolateImage,candy:candyImage}
const catName={chips:'Bim bim',noodles:'Mì & đồ ăn liền',instant:'Ăn liền',chocolate:'Chocolate',drinks:'Nước uống',spicy:'Đồ cay',candy:'Kẹo',healthy:'Snack lành mạnh'}
const colors={chips:'#ffb82e',noodles:'#ef3340',instant:'#31a354',chocolate:'#6f3d27',drinks:'#7a32a8',spicy:'#ff5a1f',candy:'#ef5b9a',healthy:'#31a354'}
const seed=[
 [1,'khoai-tay-cay-bung-vi','Khoai tây cay bùng vị','chips',12000,4.9,186,0,1,8,12],
 [2,'rong-bien-nuong-gion','Rong biển nướng giòn','healthy',15000,4.8,149,1,0,10,9],
 [3,'mi-ly-tom-cay','Mì ly tôm cay','noodles',18000,4.9,226,0,1,7,14],
 [4,'soda-trai-cay-nhiet-doi','Soda trái cây nhiệt đới','drinks',14000,4.7,172,1,0,16,11],
 [5,'khoai-tay-vi-pho-mai','Khoai tây vị phô mai','chips',13000,4.8,118,1,0,6,13],
 [6,'bim-bim-vi-bbq','Bim bim BBQ khói','chips',12000,4.6,94,0,0,11,7],
 [7,'snack-ngo-ngot','Snack ngô ngọt giòn tan','chips',10000,4.7,83,0,0,9,15],
 [8,'que-khoai-tay-cay','Que khoai tây cay','spicy',11000,4.8,132,0,1,4,10],
 [9,'mi-ly-bo-ham','Mì ly bò hầm','noodles',19000,4.8,154,0,1,9,8],
 [10,'mi-ly-kim-chi','Mì ly kim chi','noodles',20000,4.7,101,1,1,5,11],
 [11,'mi-xao-cay','Mì xào cay','spicy',22000,4.9,198,0,1,3,9],
 [12,'chao-ly-thit-bam','Cháo ly thịt bằm','instant',17000,4.5,62,0,0,7,6],
 [13,'xuc-xich-tiet-trung','Xúc xích ăn liền','instant',10000,4.8,211,0,1,18,16],
 [14,'ga-xe-cay','Gà xé cay đóng gói','spicy',25000,4.9,174,1,1,6,4],
 [15,'ca-vien-an-lien','Cá viên ăn liền','instant',16000,4.6,76,1,0,8,10],
 [16,'chocolate-sua','Chocolate sữa mini','chocolate',18000,4.8,143,0,0,12,8],
 [17,'chocolate-hanh-nhan','Chocolate hạnh nhân','chocolate',22000,4.9,167,1,0,7,5],
 [18,'wafer-chocolate','Bánh xốp chocolate','chocolate',12000,4.6,89,0,0,10,12],
 [19,'keo-deo-trai-cay','Kẹo dẻo trái cây','candy',15000,4.7,119,1,0,13,9],
 [20,'keo-bac-ha','Kẹo bạc hà mát lạnh','candy',10000,4.5,71,0,0,14,18],
 [21,'keo-gum-chanh','Gum vị chanh','candy',9000,4.6,97,0,0,20,15],
 [22,'cola-lanh','Cola lạnh','drinks',12000,4.8,238,0,1,24,19],
 [23,'tra-chanh-mat-ong','Trà chanh mật ong','drinks',15000,4.7,128,1,0,17,13],
 [24,'ca-phe-sua-lon','Cà phê sữa lon','drinks',18000,4.9,192,0,1,15,12],
 [25,'nuoc-khoang-co-ga','Nước khoáng có ga','drinks',13000,4.6,66,0,0,11,14],
 [26,'hat-dieu-rang-muoi','Hạt điều rang muối','healthy',28000,4.9,116,1,0,5,7],
 [27,'hat-hanh-nhan','Hạnh nhân rang giòn','healthy',30000,4.8,95,0,0,6,8],
 [28,'granola-mini','Granola mini cup','healthy',25000,4.7,78,1,0,4,6],
 [29,'banh-gao-pho-mai','Bánh gạo phô mai','chips',16000,4.7,88,1,0,9,7],
 [30,'mi-ly-hai-san','Mì ly hải sản','noodles',21000,4.8,137,1,1,8,10],
 [31,'xuc-xich-pho-mai','Xúc xích phô mai','instant',14000,4.8,159,1,1,12,9],
 [32,'tra-dao-co-ga','Trà đào có ga','drinks',16000,4.6,104,1,0,14,11]
]

export const products=seed.map(([id,slug,name,category,price,rating,sold,isNew,hot,s14,s20])=>({
 id,slug,name,category,categoryName:catName[category],price,rating,sold,image:img[category],isNew:Boolean(isNew),hot:Boolean(hot),color:colors[category],
 description:`${name} được chọn cho DOP Mart với khẩu phần tiện lợi, phù hợp giờ nghỉ nhanh tại văn phòng tầng 14 và 20.`,
 stock:{14:s14,20:s20}
}))
