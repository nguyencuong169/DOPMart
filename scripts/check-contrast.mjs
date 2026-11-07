/* P0-02 evidence: WCAG contrast for every secondary-text token pair in use.
   No browser needed — the ratios are computed from the same hex values the CSS uses. */
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
lines.push(fails ? `\n${fails} token pair(s) below 4.5:1` : '\nall tokens in use pass AA (4.5:1)')
console.log(lines.join('\n'))
