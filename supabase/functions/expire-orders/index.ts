import { safeEqual } from '../_shared/hmac.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'content-type, x-order-expiry-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') {
    return response({ error: { code: 'METHOD_NOT_ALLOWED' } }, 405)
  }

  const configuredSecret = Deno.env.get('ORDER_EXPIRY_SECRET')
  const providedSecret = request.headers.get('x-order-expiry-secret') ?? ''
  if (!configuredSecret) {
    return response({ error: { code: 'ORDER_EXPIRY_NOT_CONFIGURED' } }, 503)
  }
  if (!safeEqual(providedSecret, configuredSecret)) {
    return response({ error: { code: 'UNAUTHORIZED' } }, 401)
  }

  const body = await request.json().catch(() => ({})) as { limit?: number }
  const limit = Number.isInteger(body.limit) ? Math.min(Math.max(body.limit as number, 1), 1000) : 100

  const admin = createSupabaseAdmin()
  const { data, error } = await admin.rpc('expire_mart_pending_orders', {
    p_limit: limit,
  })

  if (error) {
    return response({ error: { code: 'ORDER_EXPIRY_FAILED', message: error.message } }, 500)
  }

  return response({ data })
})
