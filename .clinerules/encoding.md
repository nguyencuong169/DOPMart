# MANDATORY: UTF-8 file I/O

**This is a hard rule, not a preference. It is enforced by tooling, and the
enforcement does not depend on anyone remembering it.**

Every file in this repository is UTF-8. Every read and every write must be
UTF-8, on every task, without exception.

## Why it is enforced

This machine's console is **cp932** (Japanese Windows code page). A single
`Get-Content` → `Set-Content` round trip through PowerShell rewrites the file
and the damage is permanent:

| in the file (UTF-8) | after one PowerShell round trip |
|---|---|
| `CHỌN` (U+1ECC) | `CHềE` (U+1EC1 + `E`) |
| `—` (U+2014) | U+2001 + `E` |

The same round trip can also leave CJK glyphs behind (U+7AB6, U+30FB) when
the bytes happen to land in a double-byte slot.

This has already happened once in this repo. It is recoverable only by
byte-level surgery, so it is prevented instead.

## The rule

### 1. Reading

- Use the `read_files` tool, or `npm run utf8 -- show <file>`, to read a source
  file. Both decode UTF-8 correctly.
- **Never** read a source file with `Get-Content`, `cat`, `type`, or any other
  shell read whose encoding depends on the console code page.

### 2. Writing

- Use the `editor` tool to change a file. It writes UTF-8 and preserves the
  file's BOM and line endings.
- When a scripted write is genuinely needed, use `npm run utf8` — never a
  shell redirect:

  ```powershell
  npm run utf8 -- write <file>          # content on stdin
  npm run utf8 -- patch <file> <spec>   # JSON {"edits":[{"find":"..","replace":".."}]}
  ```

- If you use any other tool to write, state the encoding explicitly
  (`read_text(encoding="utf-8")`, `write_text(..., encoding="utf-8")`) and
  preserve the file's existing BOM and line endings.

### 3. Verifying — required before reporting the task done

Run this after **any** change to a file, and paste the result:

```powershell
npm run check:encoding
```

It fails on any file that is not valid UTF-8, on any file still holding UTF-16,
on any line carrying the mojibake fingerprints, and on any character outside
this project's measured repertoire (it names the offending codepoint).

Do not report a task as complete while `npm run check:encoding` fails, and do
not report it as complete without having run it.

## The gates (these run whether or not anyone remembers)

- **`npm run build` runs `check:encoding` first** (`prebuild`) — a file that
  is not clean UTF-8 cannot be built.
- **`.githooks/pre-commit` refuses the commit** when any file is not clean
  UTF-8. The hook is versioned with the repo, but git only runs hooks from
  `.git/hooks`, so each clone has to be pointed at it once:

  ```powershell
  npm run hooks:install
  ```

  It is already set in this clone (`git config core.hooksPath .githooks`).
  If you ever change that setting, restore it with the same command.

Neither gate can be skipped by forgetting something: the build stops and the
commit is refused.

## Reading back your own work

The console will mangle non-ASCII on display, so never trust what you *see* in
terminal output. Prove what the file holds:

```powershell
npm run utf8 -- show src/data/products.js
```

Non-ASCII comes back as `\uXXXX` escapes — `CH\u1eccN` is `CHỌN` with the
correct O-with-dot-below. That output is exact and survives any code page.

## Keeping the source honest

Vietnamese text (product names, shelf labels) and the em dash `—` are part of
the source, not decoration. Keep them as real UTF-8 characters. CJK, kana and
halfwidth forms never appear in this codebase's prose — if one shows up, it is
mojibake, and `check:encoding` will fail the build.

