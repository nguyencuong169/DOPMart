import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hmacSha256Hex } from '../_shared/hmac.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

function payosCreateSignature(
  checksumKey: string,
  fields: { amount: number; cancelUrl: string; description: string; orderCode: number; returnUrl: string },
) {
  const signatureData = [
    `amount=${fields.amount}`,
    `cancelUrl=${fields.cancelUrl}`,
    `description=${fields.description}`,
    `orderCode=${fields.orderCode}`,
    `returnUrl=${fields.returnUrl}`,
  ].join('&')

  return hmacSha256Hex(checksumKey, signatureData)
}

function addReturnContext(url: string, orderId: string, payment: string) {
  const target = new URL(url)
  target.searchParams.set('order', orderId)
  target.searchParams.set('payment', payment)
  return target.toString()
}

Deno.serve(async (request) => {
  const requestId = crypto.randomUUID()

  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') {
    return response({ error: { code: 'METHOD_NOT_ALLOWED', requestId } }, 405)
  }

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return response({ error: { code: 'UNAUTHENTICATED', requestId } }, 401)
  }

  const body = await request.json().catch(() => null) as { orderId?: string } | null
  if (!body?.orderId) {
    return response({ error: { code: 'ORDER_ID_REQUIRED', requestId } }, 400)
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authorization } } },
  )

  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) {
    return response({ error: { code: 'UNAUTHENTICATED', requestId } }, 401)
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { data: order, error: orderError } = await admin
    .schema('mart')
    .from('orders')
    .select('id, order_number, customer_id, grand_total, currency, status')
    .eq('id', body.orderId)
    .eq('customer_id', userData.user.id)
    .single()

  if (orderError || !order) {
    return response({ error: { code: 'ORDER_NOT_FOUND', requestId } }, 404)
  }

  if (order.status !== 'pending_payment') {
    return response({ error: { code: 'ORDER_NOT_PAYABLE', requestId } }, 409)
  }

  const { data: items, error: itemsError } = await admin
    .schema('mart')
    .from('order_items')
    .select('product_name_snapshot, quantity, unit_price')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true })

  if (itemsError) {
    return response({ error: { code: 'ORDER_ITEMS_NOT_FOUND', requestId } }, 500)
  }

  const digits = String(order.order_number).replace(/\D/g, '')
  const providerOrderCode = Number(digits)
  if (!Number.isSafeInteger(providerOrderCode) || providerOrderCode <= 0) {
    return response({ error: { code: 'INVALID_PAYOS_ORDER_CODE', requestId } }, 500)
  }

  const clientId = Deno.env.get('PAYOS_CLIENT_ID')
  const apiKey = Deno.env.get('PAYOS_API_KEY')
  const checksumKey = Deno.env.get('PAYOS_CHECKSUM_KEY')
  const apiBaseUrl = Deno.env.get('PAYOS_API_BASE_URL') ?? 'https://api-merchant.payos.vn'
  const returnUrl = addReturnContext(
    Deno.env.get('PAYOS_RETURN_URL')
      ?? `${Deno.env.get('APP_ORIGIN') ?? 'http://localhost:5173'}/checkout`,
    order.id,
    'payos',
  )
  const cancelUrl = addReturnContext(
    Deno.env.get('PAYOS_CANCEL_URL') ?? returnUrl,
    order.id,
    'payos-cancelled',
  )

  if (!clientId || !apiKey || !checksumKey) {
    return response({ error: { code: 'PAYOS_NOT_CONFIGURED', requestId } }, 503)
  }

  const { data: prepared, error: prepareError } = await admin.rpc('prepare_payos_payment_session', {
    p_order_id: order.id,
    p_provider_order_code: providerOrderCode,
  })

  if (prepareError || !prepared) {
    return response({
      error: {
        code: prepareError?.message?.split(':')[0] ?? 'PAYMENT_SESSION_PREPARE_FAILED',
        requestId,
      },
    }, 500)
  }

  if (prepared.checkoutUrl) {
    return response({
      data: prepared,
      meta: { requestId, provider: 'payos', reused: true },
    })
  }

  const amount = Number(order.grand_total)
  const description = `DOP${String(providerOrderCode).slice(-6)}`
  const expiredAt = Math.floor(Date.now() / 1000) + 15 * 60
  const signature = await payosCreateSignature(checksumKey, {
    amount,
    cancelUrl,
    description,
    orderCode: providerOrderCode,
    returnUrl,
  })

  const payosResponse = await fetch(`${apiBaseUrl}/v2/payment-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': clientId,
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      orderCode: providerOrderCode,
      amount,
      description,
      items: (items ?? []).map((item) => ({
        name: String(item.product_name_snapshot).slice(0, 100),
        quantity: Number(item.quantity),
        price: Number(item.unit_price),
        unit: 'san pham',
      })),
      cancelUrl,
      returnUrl,
      expiredAt,
      signature,
    }),
    signal: AbortSignal.timeout(30_000),
  })

  const provider = await payosResponse.json().catch(() => null) as {
    code?: string
    desc?: string
    data?: {
      paymentLinkId?: string
      checkoutUrl?: string
      qrCode?: string
    }
  } | null

  if (!payosResponse.ok || provider?.code !== '00' || !provider.data?.checkoutUrl) {
    return response({
      error: {
        code: 'PAYOS_CREATE_FAILED',
        message: provider?.desc ?? 'Không thể tạo link thanh toán PayOS.',
        requestId,
      },
    }, 502)
  }

  const { data: session, error: sessionError } = await admin.rpc('attach_payos_payment_session', {
    p_order_id: order.id,
    p_provider_order_code: providerOrderCode,
    p_payment_link_id: provider.data.paymentLinkId ?? null,
    p_checkout_url: provider.data.checkoutUrl,
    p_qr_payload: provider.data.qrCode ?? null,
  })

  if (sessionError) {
    return response({ error: { code: 'PAYMENT_SESSION_SAVE_FAILED', requestId } }, 500)
  }

  return response({
    data: session,
    meta: { requestId, provider: 'payos' },
  })
})
