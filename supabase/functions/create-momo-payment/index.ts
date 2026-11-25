import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hmacSha256Hex } from '../_shared/hmac.ts'

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function corsHeadersFor(request: Request) {
  const origin = request.headers.get('Origin')
  const appOrigin = Deno.env.get('APP_ORIGIN')
  const isDevOrigin = origin ? /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) : false
  return {
    ...corsHeaders,
    'Access-Control-Allow-Origin': isDevOrigin ? origin! : appOrigin ?? '*',
  }
}

function response(body: unknown, status = 200, request?: Request) {
  return new Response(JSON.stringify(body), { status, headers: request ? corsHeadersFor(request) : corsHeaders })
}

Deno.serve(async (request) => {
  const requestId = crypto.randomUUID()

  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeadersFor(request) })
  if (request.method !== 'POST') {
    return response({ error: { code: 'METHOD_NOT_ALLOWED', requestId } }, 405, request)
  }

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return response({ error: { code: 'UNAUTHENTICATED', requestId } }, 401, request)
  }

  const body = await request.json().catch(() => null) as { orderId?: string } | null
  if (!body?.orderId) {
    return response({ error: { code: 'ORDER_ID_REQUIRED', requestId } }, 400, request)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authorization } } },
  )

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return response({ error: { code: 'UNAUTHENTICATED', requestId } }, 401, request)
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
    return response({ error: { code: 'ORDER_NOT_FOUND', requestId } }, 404, request)
  }

  if (order.status !== 'pending_payment') {
    return response({ error: { code: 'ORDER_NOT_PAYABLE', requestId } }, 409, request)
  }

  const partnerCode = Deno.env.get('MOMO_PARTNER_CODE')
  const accessKey = Deno.env.get('MOMO_ACCESS_KEY')
  const secretKey = Deno.env.get('MOMO_SECRET_KEY')
  const apiBaseUrl = Deno.env.get('MOMO_API_BASE_URL') ?? 'https://test-payment.momo.vn'
  const ipnUrl = Deno.env.get('MOMO_IPN_URL')
    ?? `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`
  const redirectUrl = Deno.env.get('MOMO_REDIRECT_URL')
    ?? `${Deno.env.get('APP_ORIGIN') ?? 'http://localhost:5173'}/checkout?order=${order.id}&payment=momo`

  if (!partnerCode || !accessKey || !secretKey) {
    return response({ error: { code: 'MOMO_NOT_CONFIGURED', requestId } }, 503, request)
  }

  const amount = Number(order.grand_total)
  const extraData = ''
  const orderInfo = `Thanh toan DOP Mart ${order.order_number}`
  const requestType = 'captureWallet'
  const signaturePayload = [
    `accessKey=${accessKey}`,
    `amount=${amount}`,
    `extraData=${extraData}`,
    `ipnUrl=${ipnUrl}`,
    `orderId=${order.order_number}`,
    `orderInfo=${orderInfo}`,
    `partnerCode=${partnerCode}`,
    `redirectUrl=${redirectUrl}`,
    `requestId=${requestId}`,
    `requestType=${requestType}`,
  ].join('&')

  const momoResponse = await fetch(`${apiBaseUrl}/v2/gateway/api/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({
      partnerCode,
      requestType,
      ipnUrl,
      redirectUrl,
      orderId: order.order_number,
      amount,
      orderInfo,
      requestId,
      extraData,
      signature: await hmacSha256Hex(secretKey, signaturePayload),
      lang: 'vi',
    }),
    signal: AbortSignal.timeout(30_000),
  })

  const provider = await momoResponse.json()
  if (!momoResponse.ok || provider.resultCode !== 0) {
    return response({
      error: {
        code: 'MOMO_CREATE_FAILED',
        message: provider.message ?? 'MoMo không thể tạo phiên thanh toán.',
        requestId,
      },
    }, 502, request)
  }

  const { data: session, error: sessionError } = await admin.rpc('attach_momo_payment_session', {
    p_order_id: order.id,
    p_request_id: requestId,
    p_provider_transaction_id: provider.transId ? String(provider.transId) : null,
    p_pay_url: provider.payUrl ?? null,
    p_qr_payload: provider.qrCodeUrl ?? null,
  })

  if (sessionError) {
    return response({ error: { code: 'PAYMENT_SESSION_SAVE_FAILED', requestId } }, 500, request)
  }

  return response({
    data: {
      ...session,
      deeplink: provider.deeplink ?? null,
      resultCode: provider.resultCode,
    },
    meta: { requestId },
  }, request)
})
