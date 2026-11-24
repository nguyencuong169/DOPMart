import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type OrderRequest = {
  items: Array<{ productId: number; quantity: number }>
  fulfillment: {
    method: 'pickup' | 'office_delivery'
    deliveryLocation?: string
    note?: string
  }
  payment: {
    method: 'vietqr' | 'momo' | 'zalopay'
  }
  idempotencyKey: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  })
}

function invalid(message: string, requestId: string) {
  return response({
    error: {
      code: 'INVALID_REQUEST',
      message,
      requestId,
    },
  }, 400)
}

function isValidRequest(value: unknown): value is OrderRequest {
  if (!value || typeof value !== 'object') return false
  const input = value as Partial<OrderRequest>
  if (!Array.isArray(input.items) || input.items.length === 0) return false
  if (!input.fulfillment || !input.payment || !input.idempotencyKey) return false
  if (!['pickup', 'office_delivery'].includes(input.fulfillment.method)) return false
  if (!['vietqr', 'momo', 'zalopay'].includes(input.payment.method)) return false
  return input.items.every((item) => (
    Number.isInteger(item.productId)
    && Number.isInteger(item.quantity)
    && item.productId > 0
    && item.quantity > 0
    && item.quantity <= 99
  ))
}

Deno.serve(async (request) => {
  const requestId = crypto.randomUUID()

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return response({ error: { code: 'METHOD_NOT_ALLOWED', requestId } }, 405)
  }

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return response({ error: { code: 'UNAUTHENTICATED', requestId } }, 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return invalid('Request body must be valid JSON.', requestId)
  }

  if (!isValidRequest(body)) {
    return invalid('Invalid order payload.', requestId)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    },
  )

  const { data, error } = await supabase.rpc('create_mart_order', {
    p_request: {
      ...body,
      items: body.items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
    },
  })

  if (error) {
    return response({
      error: {
        code: error.message.split(':')[0] ?? 'INTERNAL_ERROR',
        message: 'Không thể tạo đơn hàng.',
        requestId,
      },
    }, 400)
  }

  return response({ data, meta: { requestId } })
})
