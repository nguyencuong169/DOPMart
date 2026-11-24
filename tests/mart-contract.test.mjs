import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { createClient } from '@supabase/supabase-js'

function readLocalEnv() {
  try {
    return Object.fromEntries(
      fs.readFileSync('.env.local', 'utf8')
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const index = line.indexOf('=')
          return [line.slice(0, index), line.slice(index + 1)]
        }),
    )
  } catch {
    return {}
  }
}

const localEnv = readLocalEnv()
const config = {
  url: process.env.VITE_SUPABASE_URL ?? localEnv.VITE_SUPABASE_URL,
  key: process.env.VITE_SUPABASE_ANON_KEY ?? localEnv.VITE_SUPABASE_ANON_KEY,
  adminEmail: process.env.DOPMART_ADMIN_EMAIL,
  adminPassword: process.env.DOPMART_ADMIN_PASSWORD,
  customerEmail: process.env.DOPMART_CUSTOMER_EMAIL,
  customerPassword: process.env.DOPMART_CUSTOMER_PASSWORD,
}

const hasCredentials = Object.values(config).every(Boolean)

function createTestClient() {
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function signIn(client, email, password) {
  const result = await client.auth.signInWithPassword({ email, password })
  assert.ifError(result.error)
}

test('admin contract exposes new mart boundaries and protects self-demotion', async (t) => {
  if (!hasCredentials) {
    t.skip('Set DOPMART_ADMIN_EMAIL/PASSWORD and DOPMART_CUSTOMER_EMAIL/PASSWORD to run remote smoke tests.')
    return
  }

  const client = createTestClient()
  await signIn(client, config.adminEmail, config.adminPassword)

  const [users, products, promotions] = await Promise.all([
    client.rpc('get_mart_admin_users'),
    client.rpc('get_mart_admin_products'),
    client.rpc('get_mart_admin_promotions'),
  ])

  assert.ifError(users.error)
  assert.ifError(products.error)
  assert.ifError(promotions.error)
  assert.ok(Array.isArray(users.data))
  assert.ok(Array.isArray(products.data))
  assert.ok(Array.isArray(promotions.data))

  const session = await client.auth.getSession()
  assert.ok(session.data.session?.user.id)

  const selfDemotion = await client.rpc('update_mart_user_role', {
    p_user_id: session.data.session.user.id,
    p_role: 'customer',
  })
  assert.match(selfDemotion.error?.message ?? '', /^CANNOT_CHANGE_OWN_ROLE/)

  await client.auth.signOut()
})

test('customer contract returns only customer order history and cannot read admin users', async (t) => {
  if (!hasCredentials) {
    t.skip('Set DOPMART_ADMIN_EMAIL/PASSWORD and DOPMART_CUSTOMER_EMAIL/PASSWORD to run remote smoke tests.')
    return
  }

  const client = createTestClient()
  await signIn(client, config.customerEmail, config.customerPassword)

  const orders = await client.rpc('get_mart_my_orders')
  assert.ifError(orders.error)
  assert.ok(Array.isArray(orders.data))

  const adminUsers = await client.rpc('get_mart_admin_users')
  assert.match(adminUsers.error?.message ?? '', /^FORBIDDEN/)

  await client.auth.signOut()
})
