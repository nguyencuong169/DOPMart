#!/usr/bin/env node
/* Catalogue guard.
   The shop reuses one packshot per category, so a product name may only use words
   the photo can actually show ("Rong biển nướng giòn" on a bag of Mixed Nuts fails).
   Run: npm run check:catalog */
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../src/data/products.js', import.meta.url), 'utf8')
const errors = []

const deaccent = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()

/* --- categories: slug, label, photo keywords --- */
const categories = []
const catRe = /slug:\s*'([a-z]+)',?\s*[\s\S]{0,220}?name:\s*'([^']+)'[\s\S]{0,220}?keywords:\s*\[([^\]]*)\]/g
let m
while ((m = catRe.exec(src))) {
  const keywords = m[3]
    .split(',')
    .map((k) => k.trim().replace(/^'|'$/g, '').trim())
    .filter(Boolean)
  categories.push({ slug: m[1], name: m[2], keywords })
}

/* --- seed rows: [id, slug, name, category, price, rating, sold, isNew, hot, s14, s20] --- */
const products = []
const rowRe =
  /\[\s*(\d+)\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([a-z]+)'\s*,\s*(\d+)\s*,\s*([\d.]+)\s*,\s*(\d+)\s*,\s*([01])\s*,\s*([01])\s*,\s*(\d+)\s*,\s*(\d+)\s*\]/g
while ((m = rowRe.exec(src))) {
  products.push({
    id: Number(m[1]),
    slug: m[2],
    name: m[3],
    category: m[4],
    price: Number(m[5]),
    rating: Number(m[6]),
    sold: Number(m[7]),
    stock14: Number(m[10]),
    stock20: Number(m[11]),
  })
}

/* --- 1. the files are parsed at all --- */
if (!categories.length) errors.push('Không đọc được categories — kiểm tra src/data/products.js')
if (!products.length) errors.push('Không đọc được seed sản phẩm — kiểm tra src/data/products.js')

/* --- 2. categories + photos --- */
const catBySlug = new Map(categories.map((c) => [c.slug, c]))
const seenCat = new Set()
for (const c of categories) {
  if (seenCat.has(c.slug)) errors.push(`category "${c.slug}" bị khai báo hai lần`)
  seenCat.add(c.slug)
  if (!c.name.trim()) errors.push(`category "${c.slug}" thiếu tên hiển thị`)
  if (!c.keywords.length) errors.push(`category "${c.slug}" thiếu keywords của ảnh`)
}

/* --- 3. products --- */
const ids = new Map()
const slugs = new Map()
const names = new Map()
const used = new Set()

for (const p of products) {
  if (ids.has(p.id)) errors.push(`id ${p.id} trùng: "${p.name}" và "${ids.get(p.id)}"`)
  ids.set(p.id, p.name)

  if (slugs.has(p.slug)) errors.push(`slug "${p.slug}" trùng giữa hai sản phẩm`)
  slugs.set(p.slug, p.name)

  const nameKey = deaccent(p.name)
  if (names.has(nameKey)) errors.push(`hai sản phẩm cùng tên: "${p.name}" (id ${names.get(nameKey)} & ${p.id})`)
  names.set(nameKey, p.id)

  if (!/^[a-z0-9-]+$/.test(p.slug)) errors.push(`slug "${p.slug}" phải là kebab-case không dấu`)
  if (p.price <= 0) errors.push(`"${p.name}" có giá không hợp lệ: ${p.price}`)
  if (p.rating < 0 || p.rating > 5) errors.push(`"${p.name}" có rating ngoài 0–5: ${p.rating}`)
  if (p.sold < 0) errors.push(`"${p.name}" có sold âm`)
  if (p.stock14 < 0 || p.stock20 < 0) errors.push(`"${p.name}" có tồn kho âm`)

  const cat = catBySlug.get(p.category)
  if (!cat) {
    errors.push(`"${p.name}" dùng category lạ "${p.category}"`)
    continue
  }
  used.add(p.category)

  /* the actual P0 rule: the name must describe what the packshot shows */
  const hit = cat.keywords.some((k) => nameKey.includes(deaccent(k)))
  if (!hit) {
    errors.push(
      `"${p.name}" không khớp ảnh của ${cat.slug} (ảnh cho thấy: ${cat.photo?.shows ?? cat.keywords.join(', ')})`
    )
  }
}

/* --- 4. coverage: no empty tile, no unused category --- */
for (const c of categories) {
  if (!used.has(c.slug)) errors.push(`category "${c.slug}" không có sản phẩm nào`)
}

/* --- report --- */
const summary = `${products.length} sản phẩm · ${categories.length} danh mục · 1 ảnh/danh mục`
if (errors.length) {
  console.error(`✗ check:catalog — ${errors.length} lỗi (${summary})\n`)
  for (const e of errors) console.error(`  • ${e}`)
  process.exit(1)
}
console.log(`✓ check:catalog — ${summary}, mọi tên sản phẩm khớp ảnh`)
