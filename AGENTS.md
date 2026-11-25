# DOPMart — agent instructions

Vue 3 (Vite, Pinia, Vue Router, Tailwind, shadcn-vue/reka-nova) frontend with a Supabase backend. Single package (`dop-mart-frontend`), npm lockfile. App source lives in `src/`; `@/` aliases `./src` (vite + tsconfig).

## Developer commands
- `npm run dev` — Vite dev server
- `npm run build` — Vite build. Runs `check:encoding` first via `prebuild`; a non-UTF-8 file blocks the build.
- `npm run preview` — preview production build
- `node tests/catalog.test.mjs` — local pure unit test (catalog filters + pagination). No services, no network. No npm script; run with node directly.
- `npm run test:mart` — remote smoke test against live Supabase. Skips unless `DOPMART_ADMIN_EMAIL/PASSWORD` and `DOPMART_CUSTOMER_EMAIL/PASSWORD` are set; reads `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` from `.env.local`.
- `npm run check:encoding` — validate every file is clean UTF-8. Run after any file change, before reporting done.
- `npm run utf8 -- show|write|patch <file>` — UTF-8-safe read/write/patch (scripts/utf8.mjs)
- `npm run hooks:install` — install versioned pre-commit hook (`git config core.hooksPath .githooks`)
- `npm run check:catalog` / `check:contrast` — data / contrast checks

## UTF-8 is mandatory (enforced by tooling)
The console on this machine is cp932 (Japanese Windows). A PowerShell `Get-Content` → `Set-Content` round trip silently corrupts UTF-8 (Vietnamese letters lose bytes, em dashes break). This has already happened once and needed byte-level surgery.
- Never read/write source files with shell tools whose encoding depends on the console code page (`Get-Content`, `cat`, `type`, PowerShell redirects). Use the editor tool, `read_files`, or `npm run utf8`.
- For scripted writes use `npm run utf8 -- write <file>` or `-- patch <file> <spec>`; otherwise state `encoding="utf-8"` explicitly and preserve BOM/line endings.
- Run `npm run check:encoding` after any change. CJK/kana/halfwidth in prose is mojibake and will fail.
- The pre-commit hook (`.githooks/pre-commit`) refuses non-UTF-8 commits; install once per clone with `npm run hooks:install`. If `core.hooksPath` is changed, restore it with the same command.

## Environment
- Copy `.env.example` to `.env.local` to run the dev server or tests with real Supabase values.
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are browser-safe (anon key). PayOS and `ORDER_EXPIRY_SECRET` are backend-only: set via Supabase CLI secrets, never in `VITE_*` variables, never commit them.
- Supabase project ref: `znwgqdaqxxynxoltuhpp`. Schema: `supabase/schema.sql`, seed: `supabase/seed.sql`, migrations: `supabase/migrations/`.

## Entrypoints & layout
- `src/main.js` — createApp + Pinia + router, mounts `#app`
- `src/router/index.js` — routes; lazy-loaded views under `src/views/`; `authGuard`/`adminGuard` protect `/admin`, `/profile`, `/orders`, `/checkout`
- `src/lib/supabase.ts` — Supabase client, `getCurrentUser`, `isAdmin`, `ensureCartForUser` (a near-duplicate `src/lib/supabase.js` also exists)
- `src/stores/` — Pinia stores (cart, favorite, floor, product, user; `.js` and `.ts` variants)
- `src/data/catalog.js` — `applyCatalogFilters`, `paginate`
- `src/services/martAdminService.ts`, `src/services/martOrderService.ts`
- `src/features/ordering/`

## Testing
- `tests/mart-contract.test.mjs`: remote contract tests (RPC admin/customer boundaries, self-demotion block `CANNOT_CHANGE_OWN_ROLE`). Requires credentials; skips gracefully without them.
- `tests/catalog.test.mjs`: 10 local assertions; run with plain `node`.

## Verification (what exists)
There is no eslint and no `tsc`/`lint` npm script; tsconfig is `strict: true` but not enforced by a script. Practical order: `npm run check:encoding` → `npm run build` → `node tests/catalog.test.mjs` (+ `npm run test:mart` only with credentials).

## Existing instruction sources (preserve)
- `.clinerules/encoding.md` — the UTF-8 rule above (source of truth; enforced by build prebuild and pre-commit)
- `.clinerules/typography-audit.md` — typography standard for UI edits: fluid `clamp()` headings, Vietnamese diacritic line-height room, `tabular-nums` for prices, WCAG 4.5:1
- `.clinerules/vue-to-supabase.md` — skill: derive Postgres schema + RLS from Vue sources
- `CLAUDE.md` — graphify knowledge graph at `graphify-out/`: run `graphify query "<question>"` before the first grep/read for codebase questions; `graphify update .` after modifying code; `graph.json` is rewritten whole on every build, so a large diff is expected, not churn.
