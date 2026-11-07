import chipsImage from '../assets/products/chips.webp'
import spicyImage from '../assets/products/spicy.webp'
import noodlesImage from '../assets/products/noodles.webp'
import instantImage from '../assets/products/instant.webp'
import chocolateImage from '../assets/products/chocolate.webp'
import candyImage from '../assets/products/candy.webp'
import drinksImage from '../assets/products/drinks.webp'
import healthyImage from '../assets/products/healthy.webp'

/* ONE source of categories: tiles, card labels, nav menu and the catalogue
   validator all read this list — `name` is the label on every card, so the tile
   text and the card text can never drift apart again. `photo` records what the
   packshot really shows; the name of a product may only use those words. */
export const categories = [
  {
    slug: 'chips',
    name: 'Bim bim',
    icon: '🍟',
    color: '#ffb82e',
    image: chipsImage,
    photo: {
      shows: 'túi snack vị mặn',
      keywords: ['khoai', 'bim bim', 'snack', 'bánh gạo', 'phô mai', 'bbq', 'ngô'],
    },
  },
  {
    slug: 'noodles',
    name: 'Mì & đồ ăn liền',
    icon: '🍜',
    color: '#ef3340',
    image: noodlesImage,
    photo: { shows: 'ly mì ăn liền', keywords: ['mì ly', 'mì', 'ly'] },
  },
  {
    slug: 'instant',
    name: 'Ăn liền',
    icon: '🌭',
    color: '#31a354',
    image: instantImage,
    photo: {
      shows: 'gói ăn liền',
      keywords: ['xúc xích', 'cá viên', 'cháo', 'ăn liền'],
    },
  },
  {
    slug: 'chocolate',
    name: 'Chocolate',
    icon: '🍫',
    color: '#6f3d27',
    image: chocolateImage,
    photo: { shows: 'thanh chocolate', keywords: ['chocolate', 'ca cao', 'xốp'] },
  },
  {
    slug: 'drinks',
    name: 'Nước uống',
    icon: '🥤',
    color: '#7a32a8',
    image: drinksImage,
    photo: { shows: 'lon soda trái cây', keywords: ['soda', 'lon', 'nước', 'trà'] },
  },
  {
    slug: 'spicy',
    name: 'Đồ cay',
    icon: '🌶️',
    color: '#ff5a1f',
    image: spicyImage,
    photo: { shows: 'gói đồ cay', keywords: ['cay', 'khô', 'gà', 'que'] },
  },
  {
    slug: 'candy',
    name: 'Kẹo',
    icon: '🍬',
    color: '#ef5b9a',
    image: candyImage,
    photo: { shows: 'gói kẹo', keywords: ['kẹo', 'gum'] },
  },
  {
    slug: 'healthy',
    name: 'Snack lành mạnh',
    icon: '🌿',
    color: '#31a354',
    image: healthyImage,
    photo: {
      shows: 'túi hạt & granola rang mộc',
      keywords: ['hạt', 'granola', 'điều', 'nhân', 'rang'],
    },
  },
]

export const photoSubjects = Object.fromEntries(
  categories.map((c) => [c.slug, { file: `${c.slug}.webp`, ...c.photo }])
)
const img = Object.fromEntries(categories.map((c) => [c.slug, c.image]))
const catName = Object.fromEntries(categories.map((c) => [c.slug, c.name]))
const colors = Object.fromEntries(categories.map((c) => [c.slug, c.color]))
const seed=[
 [1,'khoai-tay-cay-bung-vi','Khoai tây cay bùng vị','chips',12000,4.9,186,0,1,8,12],
 [2,'hat-hon-hop-rang-moc','Hạt hỗn hợp rang mộc','healthy',15000,4.8,149,1,0,10,9],
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
 [22,'soda-cola-chanh','Soda cola chanh','drinks',12000,4.8,238,0,1,24,19],
 [23,'soda-chanh-mat-ong','Soda chanh mật ong','drinks',15000,4.7,128,1,0,17,13],
 [24,'soda-dua-nhiet-doi','Soda dứa nhiệt đới','drinks',18000,4.9,192,0,1,15,12],
 [25,'soda-khoang-chanh','Soda khoáng chanh','drinks',13000,4.6,66,0,0,11,14],
 [26,'hat-dieu-rang-muoi','Hạt điều rang muối','healthy',28000,4.9,116,1,0,5,7],
 [27,'hat-hanh-nhan','Hạnh nhân rang giòn','healthy',30000,4.8,95,0,0,6,8],
 [28,'granola-mini','Granola mini cup','healthy',25000,4.7,78,1,0,4,6],
 [29,'banh-gao-pho-mai','Bánh gạo phô mai','chips',16000,4.7,88,1,0,9,7],
 [30,'mi-ly-hai-san','Mì ly hải sản','noodles',21000,4.8,137,1,1,8,10],
 [31,'xuc-xich-pho-mai','Xúc xích phô mai','instant',14000,4.8,159,1,1,12,9],
 [32,'soda-dao-co-ga','Soda đào có ga','drinks',16000,4.6,104,1,0,14,11]
]

const heroMeta={
  chips:{tags:['Giòn rụm','Đậm vị'],notes:[['Giòn 2 lớp','Chiên giòn rồi rắc phô mai'],['Phô mai thật','Không bột bắp pha'],['Túi 50g','Vừa một giờ nghỉ']]},
  healthy:{tags:['Rang mộc','Giàu đạm'],notes:[['Rang không dầu','Giữ nguyên vị hạt'],['Đạm thực vật','No lâu hơn bánh ngọt'],['Túi 150g','Chia được 3 lần ăn']]},
  noodles:{tags:['Cay bùng vị','3 phút'],notes:[['Sa tế tôm','Nước dùng nêm sẵn'],['3 phút','Chỉ cần nước sôi'],['Ly 65g','Có topping sấy']]},
  drinks:{tags:['Lạnh 4°C','Trái cây thật'],notes:[['Lấy từ tủ mát','Uống ngay tại tầng'],['Không phẩm màu','Vị trái cây tự nhiên'],['Lon 330ml','Vừa một buổi chiều']]},
  instant:{tags:['Mở là ăn','Đạm cao'],notes:[['Không cần hâm','Xé gói là dùng'],['Từ thịt thật','Không bột nhão'],['Gói tiện','Bỏ túi áo được']]},
  chocolate:{tags:['Ca cao 55%','Tan trong miệng'],notes:[['Ca cao 55%','Đắng dịu, hậu ngọt'],['Không dầu cọ','Chỉ bơ ca cao'],['Viên nhỏ','Chia nhiều lần']]},
  candy:{tags:['Ngọt thanh','Không ngấy'],notes:[['Ngọt thanh','Không gắt cổ'],['Túi zip','Giữ thơm lâu'],['Chia sẻ','Gói 20 viên']]},
  spicy:{tags:['Cay 3 lớp','Ăn liền'],notes:[['Ớt khô 3 loại','Cay từ từ rồi bùng'],['Ăn liền','Không cần chế biến'],['Gói 40g','Đủ một lần ăn']]},
}

export const products=seed.map(([id,slug,name,category,price,rating,sold,isNew,hot,s14,s20])=>({
 id,slug,name,category,categoryName:catName[category],price,rating,sold,image:img[category],isNew:Boolean(isNew),hot:Boolean(hot),color:colors[category],
 description:`${name} được chọn cho DOP Mart với khẩu phần tiện lợi, phù hợp giờ nghỉ nhanh tại văn phòng tầng 14 và 20.`,
 tags:heroMeta[category].tags,
 notes:heroMeta[category].notes,
 stock:{14:s14,20:s20}
}))
