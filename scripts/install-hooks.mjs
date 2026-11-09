#!/usr/bin/env node
/* Install the encoding gate for this clone.
 *
 * The hook lives in .githooks/ so it is versioned with the repo, but git only
 * runs hooks from .git/hooks by default — so the clone has to point at it once:
 *
 *   node scripts/install-hooks.mjs      (or: npm run hooks:install)
 *
 * Safe to run more than once.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const HOOKS = join(ROOT, '.githooks')

if (!existsSync(join(HOOKS, 'pre-commit'))) {
  console.error(`install-hooks: no hook at ${relative(ROOT, HOOKS)}/pre-commit`)
  process.exit(1)
}

execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: ROOT })

const current = execFileSync('git', ['config', '--get', 'core.hooksPath'], {
  cwd: ROOT,
  encoding: 'utf8',
}).trim()

if (current !== '.githooks') {
  console.error(`install-hooks: core.hooksPath is "${current}", expected ".githooks"`)
  process.exit(1)
}

console.log('install-hooks: core.hooksPath = .githooks (the encoding gate is active)')
