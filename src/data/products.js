import chipsImage from '../assets/products/chips.webp'
import spicyImage from '../assets/products/spicy.webp'
import noodlesImage from '../assets/products/noodles.webp'
import instantImage from '../assets/products/instant.webp'
import chocolateImage from '../assets/products/chocolate.webp'
import candyImage from '../assets/products/candy.webp'
import drinksImage from '../assets/products/drinks.webp'
import healthyImage from '../assets/products/healthy.webp'

/* One source of photo formats: each packshot photo belongs to exactly one format,
   and a product name may only use words that its photo can show.
   `name` here is the internal format label — the shopper-facing label is the shelf. */
export const formats = [
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
    name: 'Xúc xích',
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

/* --- the shelf taxonomy the shopper actually browses -----------------------
   formats = what the packshot shows (one photo each, enforced by check:catalog).
   shelves = the six things a person looks for in a five-minute break.
   One axis, mutually exclusive — no "Mì & đồ ăn liền" sitting next to "Ăn liền",
   no "Chocolate" next to "Kẹo", no taste axis crossing the food-type axis. */
export const shelves = [
  {
    slug: "snack-man",
    name: "Snack mặn",
    tagline: "Giòn, mặn, mở là ăn",
    icon: "🍟",
    color: "#ffb82e",
    formats: ["chips"],
  },
  {
    slug: "do-cay",
    name: "Đồ cay",
    tagline: "Cay từ từ rồi bùng",
    icon: "🌶️",
    color: "#ff5a1f",
    formats: ["spicy"],
  },
  {
    slug: "ngot",
    name: "Ngọt & bánh",
    tagline: "Tráng miệng trong 5 phút",
    icon: "🍫",
    color: "#ef5b9a",
    formats: ["chocolate", "candy"],
  },
  {
    slug: "healthy",
    name: "Healthy",
    tagline: "Hạt & granola rang mộc",
    icon: "🌿",
    color: "#137c58",
    formats: ["healthy"],
  },
  {
    slug: "bua-nhanh",
    name: "Bữa nhanh",
    tagline: "Mì, cháo, xúc xích — 3 phút",
    icon: "🍜",
    color: "#ef3340",
    formats: ["noodles", "instant"],
  },
  {
    slug: "do-uong",
    name: "Đồ uống",
    tagline: "Soda lạnh 4°C, uống ngay",
    icon: "🥤",
    color: "#7a32a8",
    formats: ["drinks"],
  },
]
/* the UI browses shelves; this alias keeps one name for "what the shopper picks" */
export const categories = shelves

/* the poster head for the grid card reads as a shelf slogan, never as the
   product name: two short ad lines, line 1 solid in the shelf colour,
   line 2 hollow ink. The shelf card splits the product name instead. */
export const headWords = {
  "do-uong": ["NƯỚC MÁT", "GIẢI KHÁT"],
  "bua-nhanh": ["MÌ NÓNG", "ĂN LIỀN"],
  "snack-man": ["GIÒN RỤM", "SNACK MẶN"],
  "do-cay": ["CAY NỒNG", "BỐC KHÓI"],
  ngot: ["NGỌT NGÀO", "BÁNH KẸO"],
  healthy: ["HẠT RANG", "LÀNH MẠNH"],
};

export const photoSubjects = Object.fromEntries(
  formats.map((f) => [f.slug, { file: `${f.slug}.webp`, ...f.photo }])
)
const imageOfFormat = Object.fromEntries(formats.map((f) => [f.slug, f.image]))
const shelfOfFormat = Object.fromEntries(shelves.flatMap((s) => s.formats.map((f) => [f, s])))

/* the dominant colour of each packshot — used by the deal card so the info block
   matches the product in front of it instead of the shelf it sits on */
const tintOfFormat = {
  chips: "#f5a623",
  healthy: "#2f6b31",
  noodles: "#d13a1f",
  drinks: "#6d2a9b",
  chocolate: "#5e3323",
  candy: "#e0457b",
  spicy: "#c62f14",
  instant: "#b52a26",
}
const seed=[
 [1,'khoai-tay-cay-bung-vi','Khoai tây cay bùng vị','chips',12000,4.9,186,0,1,8,12],
 [2,'hat-hon-hop-rang-moc','Hạt hỗn hợp rang mộc','healthy',15000,4.8,149,0,0,10,9],
 [3,'mi-ly-tom-cay','Mì ly tôm cay','noodles',18000,4.9,226,0,1,7,14],
 [4,'soda-trai-cay-nhiet-doi','Soda trái cây nhiệt đới','drinks',14000,4.7,238,0,1,16,11],
 [5,'chocolate-sua-mini','Chocolate sữa mini','chocolate',18000,4.8,143,1,0,6,13],
 [6,'keo-deo-trai-cay','Kẹo dẻo trái cây','candy',15000,4.7,119,1,0,11,7],
 [7,'que-khoai-tay-cay','Que khoai tây cay','spicy',11000,4.8,132,1,0,9,15],
 [8,'xuc-xich-an-lien','Xúc xích ăn liền','instant',10000,4.8,211,1,0,4,10]
]

export const heroMeta={
  chips:{tags:['Giòn rụm','Đậm vị'],notes:[['Giòn 2 lớp','Chiên giòn rồi rắc phô mai'],['Phô mai thật','Không bột bắp pha'],['Túi 50g','Vừa một giờ nghỉ']]},
  healthy:{tags:['Rang mộc','Giàu đạm'],notes:[['Rang không dầu','Giữ nguyên vị hạt'],['Đạm thực vật','No lâu hơn bánh ngọt'],['Túi 150g','Chia được 3 lần ăn']]},
  noodles:{tags:['Cay bùng vị','3 phút'],notes:[['Sa tế tôm','Nước dùng nêm sẵn'],['3 phút','Chỉ cần nước sôi'],['Ly 65g','Có topping sấy']]},
  drinks:{tags:['Lạnh 4°C','Trái cây thật'],notes:[['Lấy từ tủ mát','Uống ngay tại tầng'],['Không phẩm màu','Vị trái cây tự nhiên'],['Lon 330ml','Vừa một buổi chiều']]},
  instant:{tags:['Mở là ăn','Đạm cao'],notes:[['Không cần hâm','Xé gói là dùng'],['Từ thịt thật','Không bột nhão'],['Gói tiện','Bỏ túi áo được']]},
  chocolate:{tags:['Ca cao 55%','Tan trong miệng'],notes:[['Ca cao 55%','Đắng dịu, hậu ngọt'],['Không dầu cọ','Chỉ bơ ca cao'],['Viên nhỏ','Chia nhiều lần']]},
  candy:{tags:['Ngọt thanh','Không ngấy'],notes:[['Ngọt thanh','Không gắt cổ'],['Túi zip','Giữ thơm lâu'],['Chia sẻ','Gói 20 viên']]},
  spicy:{tags:['Cay 3 lớp','Ăn liền'],notes:[['Ớt khô 3 loại','Cay từ từ rồi bùng'],['Ăn liền','Không cần chế biến'],['Gói 40g','Đủ một lần ăn']]},
}

/* seed rows keep the photo format; the product exposes both layers:
   `format` → image + hero tags, `category`/`categoryName` → the shelf the shopper sees */
export const products=seed.map(([id,slug,name,format,price,rating,sold,isNew,hot,s14,s20])=>{
 const shelf=shelfOfFormat[format]
 return{
  id,slug,name,
  format,
  category:shelf.slug,
  categoryName:shelf.name,
  price,rating,sold,
  image:imageOfFormat[format],
  isNew:Boolean(isNew),
  hot:Boolean(hot),
  color:shelf.color,
  tint:tintOfFormat[format],
    description:`${name} được chọn cho DOP Mart với khẩu phần tiện lợi, phù hợp giờ nghỉ nhanh tại văn phòng tầng 14 và 20.`,
  tags:heroMeta[format].tags,
  notes:heroMeta[format].notes,
  stock:{14:s14,20:s20},
 }
})
