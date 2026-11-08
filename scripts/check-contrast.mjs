/* P0-02 evidence: WCAG contrast for every secondary-text token pair in use.
   No browser needed — the ratios are computed from the same hex values the CSS uses. */
import { readFileSync } from 'node:fs'

const hex = (h) => {
  const c = h.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
}
const lin = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const lum = (h) => {
  const [r, g, b] = hex(h).map(lin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

const pairs = [
  ['on-cream', '#4a4238', '#fff9ee', 'meta on paper'],
  ['on-yellow', '#5a4400', '#ffd338', 'hero copy on sun'],
  ['on-black', '#f3ece0', '#191919', 'footer links'],
  ['on-purple', '#f4e7ff', '#7a32a8', 'spotlight description'],
  ['on-red', '#fff9ee', '#b81f2b', 'SAVE badge'],
  ['hero tone-mid', '#101010', '#31a354', 'copy on green slide'],
  ['hero tone-mid', '#101010', '#ef3340', 'copy on berry slide'],
  ['hero tone-deep', '#fff9ee', '#7a32a8', 'copy on purple slide'],
  ['low stock', '#8a4b00', '#fff9ee', 'low-stock label'],
  ['old price', '#4a4238', '#fff9ee', 'strike-through price'],
  ['on-promo', '#101010', '#ef5b9a', 'deal card text on pink'],
  ['on-promo', '#101010', '#ff5a1f', 'deal card text on orange'],
  ['on-promo', '#101010', '#ef3340', 'deal card text on red'],
  ['on-promo-soft', '#17120f', '#ef5b9a', 'strike price on pink'],
  ['on-promo-soft', '#17120f', '#ef3340', 'strike price on red'],
  ['BEFORE sale price', '#ef3340', '#fff9ee', 'was used on cards'],
  ['BEFORE strike price', '#888888', '#fff9ee', 'was used on deal cards'],
  ['BEFORE badge', '#ffffff', '#ef3340', 'was used on combo badge'],
]

let fails = 0
const lines = ['pair            fg        bg        ratio   AA(4.5)']
for (const [name, fg, bg, note] of pairs) {
  const r = ratio(fg, bg)
  const ok = r >= 4.5
  const before = name.startsWith('BEFORE')
  if (!ok && !before) fails++
  lines.push(
    `${name.padEnd(18)} ${fg} ${bg} ${r.toFixed(2).padStart(6)}  ${ok ? 'pass' : 'FAIL'}  ${note}`
  )
}

/* deal cards: the surface is the product's own dominant colour, so every tint in
   products.js must clear 4.5:1 with whichever text token surfaceTone() picks */
const src = readFileSync(new URL('../src/data/products.js', import.meta.url), 'utf8')
const tints = [...src.matchAll(/^\s{2}([a-z]+):\s*['"](#[0-9a-f]{6})['"],?$/gim)].map((m) => [m[1], m[2]])
const INK = '#101010'
const CREAM = '#fff9ee'
lines.push('\ndeal-card tints (text colour is picked by the higher ratio):')
if (!tints.length) {
  fails++
  lines.push('  no tintOfFormat entries parsed')
}
for (const [format, hex] of tints) {
  const withCream = ratio(CREAM, hex)
  const withInk = ratio(INK, hex)
  const dark = withCream > withInk
  const best = Math.max(withCream, withInk)
  const ok = best >= 4.5
  if (!ok) fails++
  lines.push(
    `  ${format.padEnd(11)} ${hex} ${(dark ? 'cream' : 'ink #101010').padEnd(10)} ${best.toFixed(2)}  ${ok ? 'pass' : 'FAIL'}`
  )
}

/* the hero carousel paints the copy straight onto the product's shelf colour, so every
   shelf the carousel can show has to clear AA with the token pair the component derives
   (surfaceTone for the copy, tintOn for the secondary line and the accent word). */
const shelvesSrc = src.split("export const shelves = [")[1]?.split("/* the UI browses")[0] ?? ""
const shelfColours = [...shelvesSrc.matchAll(/slug:\s*"([a-z-]+)",[\s\S]*?color:\s*"(#[0-9a-f]{6})"/g)].map(
  (m) => [m[1], m[2]]
)
lines.push("\nhero planes (copy sits on the product colour):")
if (!shelfColours.length) {
  fails++
  lines.push("  no shelf colours parsed")
}
const CREAM_TOKEN = "#fff9ee"
const INK_TOKEN = "#101010"
const mix = (from, to, t) => {
  const ch = (hex, i) => parseInt(hex.replace("#", "").slice(i, i + 2), 16)
  const out = [0, 2, 4].map((i) =>
    Math.round(ch(from, i) * (1 - t) + ch(to, i) * t)
      .toString(16)
      .padStart(2, "0")
  )
  return `#${out.join("")}`
}
const tintOn = (surface, min) => {
  const toward = ratio(CREAM_TOKEN, surface) > ratio(INK_TOKEN, surface) ? CREAM_TOKEN : INK_TOKEN
  for (let step = 0; step <= 20; step++) {
    const tint = mix(surface, toward, step / 20)
    if (ratio(tint, surface) >= min) return tint
  }
  return toward
}
for (const [slug, hex] of shelfColours) {
  const cream = ratio(CREAM_TOKEN, hex) > ratio(INK_TOKEN, hex)
  const primary = cream ? CREAM_TOKEN : INK_TOKEN
  const soft = tintOn(hex, 4.5)
  const accent = tintOn(hex, 3)
  const primaryRatio = ratio(primary, hex)
  const softRatio = ratio(soft, hex)
  const accentRatio = ratio(accent, hex)
  const ok = primaryRatio >= 4.5 && softRatio >= 4.5 && accentRatio >= 3
  if (!ok) fails++
  lines.push(
    `  ${slug.padEnd(11)} ${hex} ${(cream ? "cream" : "ink").padEnd(6)} copy ${primaryRatio
      .toFixed(2)
      .padStart(5)}  soft ${softRatio.toFixed(2).padStart(5)}  name ${accentRatio.toFixed(2).padStart(5)}  ${
      ok ? "pass" : "FAIL"
    }`
  )
}

lines.push(fails ? `\n${fails} contrast problem(s)` : '\nall tokens in use pass AA (4.5:1)')
console.log(lines.join('\n'))
