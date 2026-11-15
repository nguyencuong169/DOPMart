# Graph Report - DOPMart  (2026-11-14)

## Corpus Check
- Corpus is ~38,201 words - fits in a single context window. You may not need a graph.

## Summary
- 588 nodes · 919 edges · 41 communities (36 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 35
- Community 36
- Community 37

## God Nodes (most connected - your core abstractions)
1. `vue` - 46 edges
2. `lucide-vue-next` - 28 edges
3. `cn` - 23 edges
4. `useProductStore` - 18 edges
5. `reka-ui` - 17 edges
6. `useCartStore` - 14 edges
7. `@vueuse/core` - 12 edges
8. `useFloorStore` - 11 edges
9. `compilerOptions` - 11 edges
10. `scripts` - 10 edges

## Surprising Connections (you probably didn't know these)
- `softInk` --calls--> `tintOn()`  [EXTRACTED]
  src/components/product/HeroCarousel.vue → src/utils/color.js
- `nameAccent` --calls--> `tintOn()`  [EXTRACTED]
  src/components/product/HeroCarousel.vue → src/utils/color.js
- `tone` --calls--> `relativeLuminance()`  [EXTRACTED]
  src/components/product/HeroCarousel.vue → src/utils/color.js
- `tone` --calls--> `surfaceTone()`  [EXTRACTED]
  src/components/product/HeroCarousel.vue → src/utils/color.js
- `Props` --references--> `ButtonVariants`  [EXTRACTED]
  src/components/ui/button/Button.vue → src/components/ui/button/index.ts

## Import Cycles
- 2-file cycle: `src/components/ui/button/Button.vue -> src/components/ui/button/index.ts -> src/components/ui/button/Button.vue`
- 2-file cycle: `src/components/ui/badge/Badge.vue -> src/components/ui/badge/index.ts -> src/components/ui/badge/Badge.vue`

## Communities (41 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (32): discount, emit, fontTick, head, isGrid, lowStock, nameVisible, props (+24 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (34): counts, errors, formatBySlug, formatOwner, formats, ids, names, namesByFormat (+26 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (38): accent, accentNext, applyParallax(), clearRingInline(), clearSteps(), clearTimer(), clock, current (+30 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (30): atTop, bump, cart, catalog, catEl, catOpen, closeCats(), closeMenu() (+22 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (18): lucide-vue-next, cart, cart, close(), closeEl, drawerEl, floor, focusables() (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (24): gsap@3.12.5, gsap, root, store, applyCatalogFilters(), paginate(), base, category (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (22): aliases, components, composables, lib, ui, utils, font, iconLibrary (+14 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (21): CREAM, css, GREEN, GREEN_INK, hex(), INK, lin(), lines (+13 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (19): contextLength, maxTokens, temperature, mcpServers, args, command, name, models (+11 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (13): reka-ui@^2.11.0, reka-ui, emits, forwarded, props, delegatedProps, forwardedProps, props (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (13): vue-router@4.5.0, vue-router, inputEl, isMac, q, router, all, cat (+5 more)

### Community 11 - "Community 11"
Cohesion: 0.19
Nodes (9): cn, vue, props, props, props, props, props, props (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (6): floor, ranked, rest, root, store, top

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (13): compilerOptions, baseUrl, jsx, lib, module, moduleResolution, paths, resolveJsonModule (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (13): dependencies, cn@^0.5.2, lucide-vue-next@0.468.0, motion-v@^2.11.1, pinia@2.3.0, shadcn-vue@^2.9.0, @supabase/supabase-js@^2.49.0, tw-animate-css@^1.4.0 (+5 more)

### Community 15 - "Community 15"
Cohesion: 0.21
Nodes (11): devDependencies, autoprefixer@^10.6.2, postcss@^8.5.32, tailwindcss@^3.4.19, name, private, type, version (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (9): @lucide/vue@^1.72.0, @lucide/vue, delegatedProps, emits, forwarded, props, delegatedProps, forwardedProps (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.17
Nodes (8): cart, combos, current, index, ITEM_TAGS, PALETTES, sectionEl, store

### Community 18 - "Community 18"
Cohesion: 0.42
Nodes (7): pinia, ensureCartForUser(), getCurrentUser(), isSupabaseReady, supabase, load(), useFavoriteStore

### Community 19 - "Community 19"
Cohesion: 0.24
Nodes (6): favorites, floor, store, useProductStore, route, s

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (10): scripts, build, check:catalog, check:contrast, check:encoding, dev, hooks:install, prebuild (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.22
Nodes (6): catalog, stats, FLOORS, favorites, homeNewProducts, store

### Community 22 - "Community 22"
Cohesion: 0.22
Nodes (8): active, bySold(), current, link, shown, store, tabs, uid

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (7): @vueuse/core@^15.0.0, @vueuse/core, delegatedProps, props, delegatedProps, forwardedProps, props

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (7): cart, current, fav, index, items, next, products

### Community 25 - "Community 25"
Cohesion: 0.36
Nodes (6): class-variance-authority@^0.7.1, class-variance-authority, Props, props, buttonVariants, ButtonVariants

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (6): cart, floor, p, route, router, s

### Community 27 - "Community 27"
Cohesion: 0.29
Nodes (6): cart, offers, products, root, load(), useCartStore

### Community 28 - "Community 28"
Cohesion: 0.29
Nodes (4): delegatedProps, emits, forwarded, props

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (6): readFloor(), useFloorStore, cart, floor, method, name

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (6): cart, floor, maxDiscount, offers, s, saving

### Community 31 - "Community 31"
Cohesion: 0.33
Nodes (4): vite@^6.4.5, @vitejs/plugin-vue@5.2.1, vite, @vitejs/plugin-vue

### Community 32 - "Community 32"
Cohesion: 0.47
Nodes (4): delegatedProps, props, badgeVariants, BadgeVariants

### Community 33 - "Community 33"
Cohesion: 0.33
Nodes (3): Catalogue(), routes, cart

### Community 35 - "Community 35"
Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

### Community 37 - "Community 37"
Cohesion: 0.67
Nodes (3): allowScripts, esbuild@0.25.12, vue-demi@0.14.10

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vue` connect `Community 11` to `Community 0`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 9`, `Community 10`, `Community 12`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 19`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 32`, `Community 33`, `Community 35`, `Community 36`?**
  _High betweenness centrality (0.242) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.04609929078014184 - nodes in this community are weakly interconnected._
- **Why does `lucide-vue-next` connect `Community 4` to `Community 0`, `Community 2`, `Community 3`, `Community 5`, `Community 10`, `Community 12`, `Community 14`, `Community 15`, `Community 17`, `Community 21`, `Community 22`, `Community 24`, `Community 26`, `Community 27`, `Community 30`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05353535353535353 - nodes in this community are weakly interconnected._
- **Why does `useProductStore` connect `Community 19` to `Community 0`, `Community 2`, `Community 3`, `Community 5`, `Community 10`, `Community 12`, `Community 17`, `Community 21`, `Community 22`, `Community 24`, `Community 26`, `Community 27`, `Community 30`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07781649245063879 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06258890469416785 - nodes in this community are weakly interconnected._