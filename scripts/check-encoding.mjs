#!/usr/bin/env node
/* Encoding guard - every file in the repo is UTF-8, and no file may carry the
   mojibake that a stray console code page leaves behind.
 *
 * Two corruption routes exist on this machine, both measured rather than
 * guessed:
 *
 *   Route A - UTF-8 bytes read as cp932 (the Japanese Windows code page):
 *     a Vietnamese name becomes two CJK glyphs and an em dash becomes
 *     U+7AB6 U+30FB. The file stays valid UTF-8, so only the characters give
 *     it away.
 *
 *   Route B - a PowerShell Get-Content | Set-Content round trip: cp932 decodes
 *     the bytes and cp932 re-encodes them, and the sequence is lossy, so an
 *     em dash turns into U+2001 followed by "E". The file stays valid UTF-8 and
 *     every character still looks like Vietnamese.
 *
 * Run: npm run check:encoding */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SKIP = new Set(['node_modules', 'dist', 'coverage'])
/* dot-directories are tool caches by default (.next, .turbo, .chrome-prof, ...),
   so they are skipped - except the few that hold this project's own files */
const KEEP_DOT = new Set(['.clinerules', '.continue', '.githooks', '.github'])
const EXT = new Set(['.vue', '.js', '.mjs', '.cjs', '.css', '.json', '.html', '.md', '.yml', '.yaml'])

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue
    if (name.startsWith('.') && !KEEP_DOT.has(name)) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (EXT.has(extname(name))) out.push(full)
  }
  return out
}

/* The repertoire this project is allowed to use, measured from its own source:
   ASCII, Latin-1, Latin Extended-A and -Additional (every Vietnamese letter
   lives in the last one), plus the punctuation, arrows, symbols, currency and
   emoji it actually uses. Anything else is mojibake. */
const ALLOWED = [
  [0x0009, 0x000d], // tab, LF, CR
  [0x0020, 0x007e], // printable ASCII
  [0x00a0, 0x00ff], // Latin-1 Supplement
  [0x0100, 0x017f], // Latin Extended-A
  [0x0180, 0x024f], // Latin Extended-B
  [0x1e00, 0x1eff], // Latin Extended Additional - the Vietnamese letters
  [0x2013, 0x2014], // en dash, em dash
  [0x2018, 0x2019], // curly quotes
  [0x201c, 0x201d], // curly double quotes
  [0x2022, 0x2022], // bullet
  [0x2026, 0x2026], // ellipsis
  [0x2039, 0x203a], // single angle quotes
  [0x20a0, 0x20bf], // currency symbols
  [0x2190, 0x2199], // arrows
  [0x2200, 0x22ff], // mathematical operators
  [0x2300, 0x23ff], // misc technical
  [0x2500, 0x257f], // box drawing
  [0x2600, 0x27bf], // misc symbols, dingbats
  [0x2b00, 0x2bff], // misc symbols and arrows
  [0xfe00, 0xfe0f], // variation selectors
  [0x1f000, 0x1faff], // emoji
]
const isAllowed = (cp) => ALLOWED.some(([lo, hi]) => cp >= lo && cp <= hi)

/* the fingerprints the corruption leaves, checked before the repertoire test
   so the error message can name the cause */
const FINGERPRINTS = [
  [/\u2E80-\u9FFF\uFF00-\uFFEF/, 'CJK, kana or halfwidth characters (UTF-8 read as cp932)'],
  [/\uFFFD/, 'a replacement character (a decode that already failed)'],
  [/\u2000-\u200A/, 'an exotic space (U+2000-U+200A)'],
]

const errors = []
const lines = ['file                                        encoding  mojibake']

for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).replace(/\\/g, '/')
  const bytes = readFileSync(file)

  /* UTF-16 is valid text but not what this repo ships: it hides the real
     content behind NULs and breaks every diff. */
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    errors.push(rel + ' is UTF-16LE - re-encode it as UTF-8')
    lines.push(rel.padEnd(42) + ' UTF-16   FAIL')
    continue
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    errors.push(rel + ' is UTF-16BE - re-encode it as UTF-8')
    lines.push(rel.padEnd(42) + ' UTF-16   FAIL')
    continue
  }

  let text
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    errors.push(rel + ' is not valid UTF-8')
    lines.push(rel.padEnd(42) + ' invalid  FAIL')
    continue
  }

  const fileLines = text.split('\n')
  let bad = 0
  let why = ''
  for (let i = 0; i < fileLines.length; i++) {
    const line = fileLines[i]
    const hit = FINGERPRINTS.find(([rx]) => rx.test(line))
    if (hit) {
      bad = i + 1
      why = hit[1]
      break
    }
    const odd = [...line].find((c) => !isAllowed(c.codePointAt(0)))
    if (odd) {
      bad = i + 1
      why =
        'U+' +
        odd.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') +
        ' is not in this project repertoire'
      break
    }
  }
  if (bad) {
    errors.push(rel + ':' + bad + ' holds mojibake - ' + why)
    lines.push(rel.padEnd(42) + ' utf-8    FAIL')
    continue
  }
  lines.push(rel.padEnd(42) + ' utf-8    ok')
}

lines.push(
  errors.length
    ? '\n' + errors.length + ' encoding problem(s)'
    : '\nevery file is UTF-8 and free of mojibake'
)
console.log(lines.join('\n'))
if (errors.length) {
  for (const e of errors) console.error('  ' + e)
  process.exit(1)
}
