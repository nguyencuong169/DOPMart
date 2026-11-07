#!/usr/bin/env node
/* Catalogue guard — the catalogue has two layers on purpose:
   · formats  → what the packshot shows (one photo each); a product name may only
                use words that its own photo can show.
   · shelves  → what the shopper browses (6 mutually exclusive shelves); every
                format must sit in exactly one shelf, and every shelf needs stock.
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

/* --- formats: slug, label, photo keywords --- */
const formats = []
const formatRe =
  /slug:\s*'([a-z-]+)',?\s*[\s\S]{0,120}?name:\s*'([^']+)'[\s\S]{0,200}?image:\s*\w+[\s\S]{0,200}?keywords:\s*\[([^\]]*)\]/g
let m
while ((m = formatRe.exec(src))) {
  formats.push({
    slug: m[1],
    name: m[2],
    keywords: m[3]
      .split(',')
      .map((k) => k.trim().replace(/^'|'$/g, '').trim())
      .filter(Boolean),
  })
}

/* --- shelves: slug, label, member formats (quote-style agnostic) --- */
const shelves = []
const shelfRe =
  /slug:\s*['"]([a-z-]+)['"],?\s*[\s\S]{0,200}?name:\s*['"]([^'"]+)['"][\s\S]{0,240}?formats:\s*\[([^\]]*)\]/g
while ((m = shelfRe.exec(src))) {
  shelves.push({
    slug: m[1],
    name: m[2],
    formats: m[3]
      .split(',')
      .map((f) => f.trim().replace(/^['"]|['"]$/g, '').trim())
      .filter(Boolean),
  })
}

/* --- seed rows: [id, slug, name, format, price, rating, sold, isNew, hot, s14, s20] --- */
const products = []
const rowRe =
  /\[\s*(\d+)\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([a-z-]+)'\s*,\s*(\d+)\s*,\s*([\d.]+)\s*,\s*(\d+)\s*,\s*([01])\s*,\s*([01])\s*,\s*(\d+)\s*,\s*(\d+)\s*\]/g
while ((m = rowRe.exec(src))) {
  products.push({
    id: Number(m[1]),
    slug: m[2],
    name: m[3],
    format: m[4],
    price: Number(m[5]),
    rating: Number(m[6]),
    sold: Number(m[7]),
    stock14: Number(m[10]),
    stock20: Number(m[11]),
  })
}

if (!formats.length) errors.push('không đọc được `formats`')
if (!shelves.length) errors.push('không đọc được `shelves`')
if (!products.length) errors.push('không đọc được seed sản phẩm')

/* --- 1. formats ↔ shelves: exactly one shelf per format --- */
const formatBySlug = new Map(formats.map((f) => [f.slug, f]))
const seenFormat = new Set()
for (const f of formats) {
  if (seenFormat.has(f.slug)) errors.push(`format "${f.slug}" khai báo hai lần`)
  seenFormat.add(f.slug)
  if (!f.keywords.length) errors.push(`format "${f.slug}" thiếu keywords của ảnh`)
}
const seenShelf = new Set()
const formatOwner = new Map()
for (const s of shelves) {
  if (seenShelf.has(s.slug)) errors.push(`shelf "${s.slug}" khai báo hai lần`)
  seenShelf.add(s.slug)
  if (!s.formats.length) errors.push(`shelf "${s.slug}" chưa gán format nào`)
  for (const f of s.formats) {
    if (!formatBySlug.has(f)) {
      errors.push(`shelf "${s.slug}" trỏ tới format lạ "${f}"`)
      continue
    }
    if (formatOwner.has(f))
      errors.push(`format "${f}" nằm ở hai shelf: "${formatOwner.get(f)}" và "${s.slug}"`)
    formatOwner.set(f, s.slug)
  }
}
for (const f of formats) {
  if (!formatOwner.has(f.slug)) errors.push(`format "${f.slug}" không thuộc shelf nào`)
}

/* --- 2. products --- */
const ids = new Map()
const slugs = new Map()
const names = new Map()
const shelfStock = new Map()

for (const p of products) {
  if (ids.has(p.id)) errors.push(`id ${p.id} trùng: "${p.name}" và "${ids.get(p.id)}"`)
  ids.set(p.id, p.name)
  if (slugs.has(p.slug)) errors.push(`slug "${p.slug}" trùng giữa hai sản phẩm`)
  slugs.set(p.slug, p.name)
  const nameKey = deaccent(p.name)
  if (names.has(nameKey)) errors.push(`hai sản phẩm cùng tên: "${p.name}"`)
  names.set(nameKey, p.id)

  if (!/^[a-z0-9-]+$/.test(p.slug)) errors.push(`slug "${p.slug}" phải là kebab-case không dấu`)
  if (p.price <= 0) errors.push(`"${p.name}" có giá không hợp lệ: ${p.price}`)
  if (p.rating < 0 || p.rating > 5) errors.push(`"${p.name}" có rating ngoài 0–5: ${p.rating}`)
  if (p.sold < 0) errors.push(`"${p.name}" có sold âm`)
  if (p.stock14 < 0 || p.stock20 < 0) errors.push(`"${p.name}" có tồn kho âm`)

  const format = formatBySlug.get(p.format)
  if (!format) {
    errors.push(`"${p.name}" dùng format lạ "${p.format}"`)
    continue
  }
  const shelf = formatOwner.get(p.format)
  shelfStock.set(shelf, (shelfStock.get(shelf) ?? 0) + 1)

  /* the P0 rule: the name must describe what the packshot shows */
  const hit = format.keywords.some((k) => nameKey.includes(deaccent(k)))
  if (!hit) {
    errors.push(`"${p.name}" không khớp ảnh của format ${format.slug} (ảnh: ${format.keywords.join(', ')})`)
  }
}

/* --- 3. one packshot, one product name (P0-01) -----------------------------
   the shop owns eight photos; if a format carries two different names the shopper
   sees the same can under two labels. Adding a product therefore requires a new
   photo, which is the point. */
const namesByFormat = new Map()
for (const p of products) {
  if (!namesByFormat.has(p.format)) namesByFormat.set(p.format, [])
  namesByFormat.get(p.format).push(p.name)
}
for (const [format, names] of namesByFormat) {
  if (new Set(names.map(deaccent)).size > 1) {
    errors.push(
      `ảnh của format "${format}" dùng cho ${names.length} sản phẩm khác tên (${names.join(' · ')}) — mỗi sản phẩm cần ảnh riêng`
    )
  }
}

/* --- 4. every shelf has stock --- */
for (const s of shelves) {
  if (!shelfStock.get(s.slug)) errors.push(`shelf "${s.slug}" (${s.name}) không có sản phẩm nào`)
}

const summary = `${products.length} sản phẩm · ${formats.length} format ảnh · ${shelves.length} kệ`
if (errors.length) {
  console.error(`✗ check:catalog — ${errors.length} lỗi (${summary})\n`)
  for (const e of errors) console.error(`  • ${e}`)
  process.exit(1)
}
const counts = shelves.map((s) => `${s.name}:${shelfStock.get(s.slug)}`).join(' · ')
console.log(`✓ check:catalog — ${summary}\n  ${counts}\n  mọi tên sản phẩm khớp ảnh, mọi format thuộc đúng một kệ`)
