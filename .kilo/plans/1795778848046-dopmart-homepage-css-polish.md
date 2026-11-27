# Plan: DOP Mart homepage CSS polish (make-interfaces-feel-better)

**Goal:** Polish `storefront-ui/homepage/index.html` per the make-interfaces-feel-better principles.
**Mode:** full — entire requested scope (typography, surfaces, animations, icons, performance).
**Files in scope:**
- `storefront-ui/homepage/index.html` (reference only — no HTML/JSX changes allowed)
- `storefront-ui/homepage/css/tokens.css`
- `storefront-ui/homepage/css/base.css`
- `storefront-ui/homepage/css/components.css`
- `storefront-ui/homepage/css/layout.css`
- `storefront-ui/homepage/css/pages/home.css`

## Styling system (do NOT introduce a second system)
Plain CSS + CSS custom properties (tokens). No Tailwind, no CSS-in-JS. All edits must be plain CSS in the existing files, reusing existing variables (`--brand`, `--accent`, `--ink`, `--background`, `--surface`, `--border`, `--muted`, `--radius`, `--shadow`) and/or `opacity`/`transform`. No new hex colors.

## Absolute constraints (user)
- Do NOT change layout (flex/grid).
- Do NOT change the color palette.
- Do NOT change fonts.
- Do NOT add or remove HTML/JSX elements.
- Only refine: concentric border-radius, optical alignment, layered box-shadows, hover/active/focus states, hit areas >= 40px, transition curves/durations (ease-out, interruptible, specific properties — never `all`).

## Decisions
- Shadows: keep `--ink` (#17140d) tone with alpha, split into two transparent layers (Principle 3). No new color.
- Hover states: use `opacity` only (no new color). Active/press: `transform: scale(0.96)` exactly (Principle 12). Focus-visible: reuse existing `outline: 3px solid #926300` from `base.css:1`.
- Transitions: specific properties (`transform`, `opacity`, `background-color`, `border-color`, `color`), `ease-out`, 0.2s hover / 0.15s active. Never `transition: all` (Principle 14).
- Hit areas: `.add` min-height 44px; mobile-nav buttons (touch) min-height 44px + padding; dense desktop minimum 40px respected (Principle 16).
- Concentric border-radius: no nested filled surfaces exist in this HTML, so Clear — no change required. Noted: `.benefits.card` has a dead/conflicting radius declaration (`.card` 16px overridden by `.benefits` 40px) but no nested surface, so no user impact.
- Optical alignment: no reliable finding without render; not actionable from source alone. Marked Not reviewed (would need browser inspect).

## Findings (grouped by principle)

### Interruptible animations / hover-active-focus states (MEDIUM)
| Location | Before | After |
|---|---|---|
| `css/components.css:1` `.btn`, `.btn.secondary`, `.icon` | No `:hover`/`:active`/`:focus-visible`; no `transition` | Add `transition: transform .15s ease-out, opacity .2s ease-out, background-color/border-color/color .2s ease-out`; `:hover{opacity:<n>}`; `:active{transform:scale(.96)}` |
| `css/pages/home.css:1` `.category` | Only `.category.active{outline}`; no hover/active; no transition | Add transition; `:hover{opacity:.92}`; `:active{transform:scale(.96)}` |
| `css/pages/home.css:1` `.add` | Brand-filled add-to-cart button; no hover/active; hit area unconstrained | Ensure `min-height:44px`; add transition, `:hover{opacity:.92}`, `:active{transform:scale(.96)}` |
| `css/layout.css` `@media(max-width:600px) .mobile-nav button` | `background:none;font-size:12px;display:grid;gap:4px;text-align:center` (~22px touch hit area) | Add `min-height:44px;padding:6px 0` |

Why: interactive controls give no feedback on hover/press/focus (usability, repeated on every trigger). Principles 4 (interruptible transitions), 12 (scale 0.96), 14 (specific properties), 16 (44px touch / 40px dense desktop).

### Layered box-shadows (MEDIUM)
| Location | Before | After |
|---|---|---|
| `css/tokens.css:1` `--shadow` | `0 3px 12px #38220d08` (single flat layer) | `0 1px 2px #17140d0f, 0 4px 16px #17140d08` (two transparent layers, --ink tone) |

Why: Principle 3 — layered transparent shadows for depth; single flat shadow reads as a dirty edge rather than elevation. Applied to `.card` (incl. `.product`, `.combo`, `.benefits`) and `.toast`.

### Concentric border-radius (Clear — no change)
No nested filled surfaces exist in this HTML (`.card`, `.benefits`, `.btn`, `.category`, `.search`, `.toast`, `.brand-title`, `.slogan` all contain no inner rounded surface), so outer = inner + padding has no applicable case. The `.benefits.card` radius override (16px -> 40px) is harmless because `.benefits` has no rounded child. Nothing to edit.

### Optical alignment (Not reviewed from source)
Requires rendered inspection (`.heart` absolute placement `right:5px;top:3px`; `.add` svg centering). Not actionable without browser; deferred to verification.

## Considered but rejected
| Location | Candidate | Rejected because |
|---|---|---|
| `css/tokens.css:1` | Pure black `#000000` shadow layers | Would introduce a color outside the existing palette; --ink alpha keeps depth within palette |
| `css/components.css:1` | `.btn:hover{background:<darker brand>}` | Requires a new hex color not in the palette; `opacity` achieves feedback without new color |
| `css/pages/home.css:1` | `.category:hover{background:#f3e6d2}` | New hex outside palette; `opacity:.92` uses no new color |
| `css/pages/home.css:1` | Add `box-shadow`/border to `.card:hover` | `.card` already has border+shadow via token; a hover lift via `translateY` is sufficient and layout-safe |
| All files | Font smoothing `-webkit-font-smoothing: antialiased` on root | Out of user's stated scope (only radius/shadow/states/hit-area/transitions) |
| All files | Image 1px outline (oklch black/white) | Out of user's stated scope |

## Ordered implementation tasks
1. `css/tokens.css:1` — replace `--shadow` value with the two-layer transparent version.
2. `css/components.css:1` — extend `.btn`, `.btn.secondary`, `.icon`, `.card` with transition + `:hover`/`:active` (and `.card:hover` lift).
3. `css/pages/home.css:1` — extend `.category` and `.add` with transition + `:hover`/`:active`; ensure `.add` `min-height:44px`.
4. `css/layout.css` — inside `@media(max-width:600px)`, add `min-height:44px;padding:6px 0` to `.mobile-nav button`.

## Verification
- `npm run check:encoding` — confirm all edited CSS files remain clean UTF-8 (mandatory, enforced by build/pre-commit).
- Manual browser walkthrough of `index.html`: hover, focus (Tab), active/press, loading (filter/search), empty state; confirm motion at 10% speed (Browser Animations panel) is interruptible and uses ease-out; confirm no layout/color/font/HTML changes vs. baseline.
- Confirm `.add`, `.category`, `.btn`, `.icon`, mobile-nav buttons each show hover + press (scale 0.96) + focus feedback.
- **Not verified yet:** none of the above commands have been run against the changes (no edits made yet in this session).

## Verdict (pre-implementation)
`Needs changes` — all findings are MEDIUM or Clear; no HIGH findings. Once edits are applied and verification passes, verdict becomes `Approve` if no actionable findings remain.
