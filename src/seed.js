'use strict';

const { hashPassword } = require('./auth');

const CATEGORIES = [
  { id: 'do-kho', name: 'Gạo & Đồ khô', emoji: '🍚' },
  { id: 'do-uong', name: 'Đồ uống', emoji: '🥤' },
  { id: 'sua-banh', name: 'Sữa & Bánh kẹo', emoji: '🥛' },
  { id: 'rau-cu', name: 'Rau củ quả', emoji: '🥬' },
  { id: 'thit-trung', name: 'Thịt, cá & Trứng', emoji: '🍗' },
  { id: 'gia-vi', name: 'Gia vị & Dầu ăn', emoji: '🧂' },
  { id: 'cham-soc', name: 'Chăm sóc cá nhân', emoji: '🧼' },
  { id: 'gia-dung', name: 'Đồ gia dụng', emoji: '🏠' },
];

function product(slug, name, category, price, unit, stock, emoji, description, extra = {}) {
  return {
    id: slug,
    slug,
    name,
    category,
    price,
    oldPrice: extra.oldPrice || null,
    unit,
    stock,
    emoji,
    image: extra.image || '',
    description,
    tags: extra.tags || [],
    featured: Boolean(extra.featured),
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function products() {
  return [
    product('gao-st25-5kg', 'Gạo ST25 thơm ngon 5kg', 'do-kho', 225000, 'túi 5kg', 120, '🍚',
      'Gạo ST25 hạt dài, dẻo thơm, đạt giải gạo ngon nhất thế giới. Phù hợp cho bữa cơm gia đình.',
      { oldPrice: 260000, featured: true, tags: ['gạo', 'st25', 'bán chạy'] }),
    product('gao-lut-huu-co-2kg', 'Gạo lứt hữu cơ 2kg', 'do-kho', 98000, 'túi 2kg', 80, '🌾',
      'Gạo lứt hữu cơ nguyên cám, giàu chất xơ, tốt cho người ăn kiêng.', { tags: ['gạo lứt', 'hữu cơ'] }),
    product('mi-hao-hao-thung-30-goi', 'Mì Hảo Hảo thùng 30 gói', 'do-kho', 135000, 'thùng 30 gói', 60, '🍜',
      'Mì tôm Hảo Hảo vị tôm chua cay quen thuộc, tiện lợi cho mọi gia đình.',
      { featured: true, tags: ['mì', 'ăn liền'] }),
    product('dau-an-tuong-an-1l', 'Dầu ăn Tường An 1 lít', 'gia-vi', 52000, 'chai 1L', 150, '🛢️',
      'Dầu ăn Tường An tinh luyện, giàu vitamin A và E, an toàn cho sức khỏe.', { tags: ['dầu ăn'] }),
    product('nuoc-mam-chinsu-500ml', 'Nước mắm Chin-su cá cơm 500ml', 'gia-vi', 45000, 'chai 500ml', 200, '🧂',
      'Nước mắm cá cơm Chin-su đậm đà, hương vị truyền thống Việt Nam.',
      { featured: true, tags: ['nước mắm', 'gia vị'] }),
    product('muoi-bien-500g', 'Muối biển tinh 500g', 'gia-vi', 12000, 'gói 500g', 300, '🧂',
      'Muối biển tinh khiết, dùng cho nấu ăn và chế biến thực phẩm.', { tags: ['muối'] }),
    product('nuoc-ngot-coca-1-5l', 'Nước ngọt Coca-Cola 1.5L', 'do-uong', 24000, 'chai 1.5L', 180, '🥤',
      'Nước ngọt Coca-Cola vị nguyên bản, giải khát sảng khoái.', { tags: ['nước ngọt'] }),
    product('tra-xanh-khong-do-500ml', 'Trà xanh không độ 500ml', 'do-uong', 11000, 'chai 500ml', 240, '🍵',
      'Trà xanh không độ 0% đường, thanh mát và tốt cho sức khỏe.', { tags: ['trà', 'không đường'] }),
    product('ca-phe-g7-3in1-hop-50-goi', 'Cà phê G7 3in1 hộp 50 gói', 'do-uong', 145000, 'hộp 50 gói', 90, '☕',
      'Cà phê hòa tan G7 3in1 đậm vị, tiện lợi cho ngày dài tỉnh táo.',
      { oldPrice: 165000, featured: true, tags: ['cà phê'] }),
    product('sua-tuoi-vinamilk-1l', 'Sữa tươi Vinamilk 100% 1L', 'sua-banh', 36000, 'hộp 1L', 160, '🥛',
      'Sữa tươi tiệt trùng Vinamilk nguyên chất, bổ sung dưỡng chất mỗi ngày.', { tags: ['sữa'] }),
    product('sua-chua-vinamilk-loc-4', 'Sữa chua Vinamilk lốc 4 hộp', 'sua-banh', 28000, 'lốc 4 hộp', 140, '🍶',
      'Sữa chua ăn Vinamilk bổ sung men sống, hỗ trợ tiêu hóa.', { tags: ['sữa chua'] }),
    product('banh-quy-oreo-133g', 'Bánh quy Oreo 133g', 'sua-banh', 26000, 'gói 133g', 210, '🍪',
      'Bánh quy Oreo nhân kem vani, món ăn vặt được yêu thích.', { tags: ['bánh quy'] }),
    product('banh-trung-thu-hop-4', 'Bánh trung thu hộp 4 bánh', 'sua-banh', 320000, 'hộp 4 bánh', 40, '🥮',
      'Bánh trung thu thập cẩm hộp 4 bánh, quà biếu sang trọng.',
      { oldPrice: 360000, featured: true, tags: ['bánh trung thu', 'quà biếu'] }),
    product('rau-cai-xanh-500g', 'Rau cải xanh 500g', 'rau-cu', 16000, 'bó 500g', 100, '🥬',
      'Rau cải xanh tươi sạch, trồng theo tiêu chuẩn VietGAP.', { tags: ['rau xanh'] }),
    product('ca-rot-500g', 'Cà rốt Đà Lạt 500g', 'rau-cu', 21000, 'túi 500g', 120, '🥕',
      'Cà rốt Đà Lạt giòn ngọt, giàu vitamin A.', { tags: ['củ quả'] }),
    product('ca-chua-500g', 'Cà chua bi 500g', 'rau-cu', 32000, 'hộp 500g', 95, '🍅',
      'Cà chua bi Đà Lạt mọng nước, dùng cho salad và nấu ăn.', { featured: true, tags: ['cà chua'] }),
    product('chuoi-tieu-1kg', 'Chuối tiêu chín 1kg', 'rau-cu', 25000, 'nải 1kg', 70, '🍌',
      'Chuối tiêu chín tự nhiên, ngọt dịu, giàu kali.', { tags: ['trái cây'] }),
    product('uc-ga-tuoi-1kg', 'Ức gà tươi 1kg', 'thit-trung', 89000, 'khay 1kg', 50, '🍗',
      'Ức gà tươi không da, giàu đạm, phù hợp chế độ ăn lành mạnh.',
      { oldPrice: 99000, tags: ['gà', 'giàu đạm'] }),
    product('trung-ga-hop-10', 'Trứng gà hộp 10 quả', 'thit-trung', 35000, 'hộp 10 quả', 130, '🥚',
      'Trứng gà tươi sạch, nguồn đạm quen thuộc cho mọi bữa ăn.', { tags: ['trứng'] }),
    product('ca-basa-fillet-500g', 'Cá basa fillet 500g', 'thit-trung', 65000, 'túi 500g', 75, '🐟',
      'Cá basa fillet cấp đông, thịt trắng mềm, chế biến đa dạng.', { tags: ['cá'] }),
    product('dau-goi-clear-men-630ml', 'Dầu gội Clear Men 630ml', 'cham-soc', 189000, 'chai 630ml', 65, '🧴',
      'Dầu gội Clear Men sạch gàu, hương bạc hà mát lạnh.', { tags: ['dầu gội'] }),
    product('kem-danh-rang-ngoc-bich-100g', 'Kem đánh răng Ngọc Bích 100g', 'cham-soc', 18000, 'tuýp 100g', 220, '🪥',
      'Kem đánh răng Ngọc Bích bảo vệ răng chắc khỏe.', { tags: ['kem đánh răng'] }),
    product('giay-an-lau-da-nang', 'Giấy ăn lau đa năng 3 lớp', 'gia-dung', 42000, 'lốc 6 gói', 110, '🧻',
      'Giấy ăn 3 lớp mềm mịn, thấm hút tốt, an toàn cho da.', { tags: ['giấy ăn'] }),
    product('nuoc-rua-chen-sunlight-1kg', 'Nước rửa chén Sunlight 1kg', 'gia-dung', 58000, 'chai 1kg', 100, '🧽',
      'Nước rửa chén Sunlight sạch bóng, khử mùi hiệu quả.', { tags: ['nước rửa chén'] }),
  ];
}

function users() {
  return [
    {
      id: 'usr_admin',
      name: 'Quản trị viên DOP Mart',
      email: 'admin@dopmart.vn',
      password: hashPassword('Admin@123'),
      phone: '0900000000',
      address: 'Số 1 Đường DOP, Quận 1, TP.HCM',
      role: 'admin',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'usr_demo',
      name: 'Khách Hàng Mẫu',
      email: 'khach@dopmart.vn',
      password: hashPassword('Khach@123'),
      phone: '0912345678',
      address: 'Số 25 Đường Nguyễn Trãi, Quận 5, TP.HCM',
      role: 'customer',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];
}

module.exports = { CATEGORIES, products, users };
