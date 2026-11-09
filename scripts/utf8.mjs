#!/usr/bin/env node
/* UTF-8 safe file I/O — the sanctioned way to read and write source files.
 *
 * Why this exists: this machine's console is cp932 (Japanese Windows code
 * page). A single `Get-Content` -> `Set-Content` round trip through PowerShell
 * turns "CHỌN" (U+1ECC) into "CHềE" (U+1EC1 + "E") and an em dash into
 * U+2001 + "E", and the damage is permanent. Shell round trips are therefore
 * banned for source files; this tool is the replacement.
 *
 * Every write preserves the file's existing BOM and line endings, and every
 * write is verified after the fact.
 *
 *   node scripts/utf8.mjs read  <file>              raw content to stdout (UTF-8)
 *   node scripts/utf8.mjs show  <file>              content as codepoint escapes
 *   node scripts/utf8.mjs write <file>               content from stdin
 *   node scripts/utf8.mjs patch <file> <spec.json>  {"edits":[{"find":"..","replace":"..","all":true}]}
 *   node scripts/utf8.mjs verify [file...]          encoding check
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { relative, dirname, resolve } from 'node:path'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const BOM = Buffer.from([0xef, 0xbb, 0xbf])
/* the codepoints a UTF-8 -> cp932 mis-decode leaves behind: CJK, kana and the
   halfwidth forms. Written as escapes so this file stays pure ASCII — a
   literal CJK range would trip its own mojibake check. */
const SUSPECT = /[\u2e80-\u9fff\u8c48-\ufaff]/

const fail = (msg) => {
  console.error(`utf8: ${msg}`)
  process.exit(1)
}

/* piping into `Select-Object -First N` closes the pipe early; that is not an
   error, so exit quietly instead of throwing an unhandled EPIPE */
process.stdout.on('error', (e) => {
  if (e.code === 'EPIPE') process.exit(0)
  throw e
})

const show = (p) => relative(ROOT, resolve(p)).replace(/\\/g, '/')

/* Non-ASCII escaped as \uXXXX: the console here is cp932, so printing a raw
   "Ọ" or "—" comes back mangled and unreadable. Escapes are proof of what the
   file actually holds, and they survive any code page. */
const escapeAscii = (s) =>
  s.replace(/[^\x20-\x7e]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))

/* --- reading ------------------------------------------------------------ */
function readRaw(file) {
  if (!existsSync(file)) fail(`no such file: ${show(file)}`)
  const bytes = readFileSync(file)
  const hasBom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf
  const body = hasBom ? bytes.subarray(3) : bytes
  let text
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(body)
  } catch {
    fail(`${show(file)} is not valid UTF-8`)
  }
  /* the line ending the file already uses, so a rewrite does not churn it */
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  return { text, hasBom, eol }
}

/* --- writing ------------------------------------------------------------ */
function writeRaw(file, text) {
  const { hasBom, eol } = readRaw(file)
  /* normalise to the file's own convention, then encode strictly as UTF-8 */
  const normalised = text.replace(/\r\n/g, '\n').replace(/\n/g, eol)
  const body = Buffer.from(normalised, 'utf8')
  writeFileSync(file, hasBom ? Buffer.concat([BOM, body]) : body)

  /* verify by reading it straight back — never trust the write blindly */
  const back = readFileSync(file)
  const backText = new TextDecoder('utf-8', { fatal: true }).decode(
    back.subarray(0, 3).equals(BOM) ? back.subarray(3) : back
  )
  if (backText !== normalised) fail(`${show(file)} did not round-trip; not trusting the write`)
  if (SUSPECT.test(backText)) fail(`${show(file)} still holds mojibake after the write`)
  return { hasBom, eol }
}

/* --- commands ----------------------------------------------------------- */
const [cmd, ...args] = process.argv.slice(2)

switch (cmd) {
  case 'read': {
    if (!args[0]) fail('usage: utf8.mjs read <file>')
    process.stdout.write(readRaw(args[0]).text)
    break
  }

  case 'show': {
    if (!args[0]) fail('usage: utf8.mjs show <file>')
    const { text, hasBom, eol } = readRaw(args[0])
    console.log(`${show(args[0])}  bom=${hasBom ? 'yes' : 'no'}  eol=${eol === '\r\n' ? 'CRLF' : 'LF'}`)
    text.split(/\r?\n/).forEach((line, i) => {
      if (line === '') return
      console.log(`${String(i + 1).padStart(4)} ${escapeAscii(line)}`)
    })
    break
  }

  case 'write': {
    if (!args[0]) fail('usage: utf8.mjs write <file>  (content on stdin)')
    const text = readFileSync(0, 'utf8')
    writeRaw(args[0], text)
    console.log(`wrote ${show(args[0])} as UTF-8`)
    break
  }

  case 'patch': {
    if (!args[0] || !args[1]) fail('usage: utf8.mjs patch <file> <spec.json>')
    const spec = JSON.parse(readFileSync(args[1], 'utf8'))
    let text = readRaw(args[0]).text
    for (const edit of spec.edits ?? []) {
      if (!text.includes(edit.find)) fail(`pattern not found in ${show(args[0])}: ${JSON.stringify(edit.find)}`)
      text = edit.all
        ? text.split(edit.find).join(edit.replace)
        : text.replace(edit.find, edit.replace)
    }
    writeRaw(args[0], text)
    console.log(`patched ${show(args[0])} as UTF-8`)
    break
  }

  case 'verify': {
    const files = args.length ? args : [args[0]]
    const targets = files.filter(Boolean)
    let bad = 0
    for (const f of targets) {
      const bytes = readFileSync(f)
      if (bytes[0] === 0xff && bytes[1] === 0xfe) {
        console.error(`${show(f)}: UTF-16LE`)
        bad++
        continue
      }
      let text
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(
          bytes.subarray(0, 3).equals(BOM) ? bytes.subarray(3) : bytes
        )
      } catch {
        console.error(`${show(f)}: not valid UTF-8`)
        bad++
        continue
      }
      const line = text.split('\n').findIndex((l) => SUSPECT.test(l)) + 1
      if (line) {
        console.error(`${show(f)}:${line}: mojibake`)
        bad++
        continue
      }
      console.log(`${show(f)}: utf-8 ok`)
    }
    if (bad) fail(`${bad} file(s) are not clean UTF-8`)
    break
  }

  default:
    fail(`unknown command ${cmd ? `"${cmd}" ` : ''}(read|show|write|patch|verify)`)
}
