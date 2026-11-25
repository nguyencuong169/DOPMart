import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hmacSha256Hex, safeEqual } from '../_shared/hmac.ts'
import { processVerifiedPayment } from '../_shared/processPayment.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? '*',
  'Content-Type': 'application/json',
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

function momoRequestSignature(body: Record<string, unknown>, accessKey: string) {
  return [
    `accessKey=${accessKey}`,
    `amount=${body.amount ?? ''}`,
    `extraData=${body.extraData ?? ''}`,
    `message=${body.message ?? ''}`,
    `orderId=${body.orderId ?? ''}`,
    `orderInfo=${body.orderInfo ?? ''}`,
    `orderType=${body.orderType ?? ''}`,
    `partnerCode=${body.partnerCode ?? ''}`,
    `payType=${body.payType ?? ''}`,
    `requestId=${body.requestId ?? ''}`,
    `responseTime=${body.responseTime ?? ''}`,
    `resultCode=${body.resultCode ?? ''}`,
    `transId=${body.transId ?? ''}`,
  ].join('&')
}

async function processMomoWebhook(body: Record<string, unknown>) {
  const accessKey = Deno.env.get('MOMO_ACCESS_KEY')
  const secretKey = Deno.env.get('MOMO_SECRET_KEY')
  const partnerCode = Deno.env.get('MOMO_PARTNER_CODE')

  if (!accessKey || !secretKey || !partnerCode) {
    return response({ error: { code: 'MOMO_NOT_CONFIGURED' } }, 503)
  }

  if (body.partnerCode !== partnerCode) {
    return response({ error: { code: 'MOMO_PARTNER_MISMATCH' } }, 400)
  }

  const signature = String(body.signature ?? '')
  const expected = await hmacSha256Hex(secretKey, momoRequestSignature(body, accessKey))

  if (!signature || !safeEqual(signature.toLowerCase(), expected.toLowerCase())) {
    return response({ error: { code: 'PAYMENT_SIGNATURE_INVALID' } }, 400)
  }

  const resultCode = Number(body.resultCode)
  const providerEventId = `momo:${String(body.orderId)}:${String(body.transId)}:${resultCode}`
  const payload = body

  if (resultCode !== 0) {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    const { data, error } = await admin.rpc('mark_mart_payment_failed', {
      p_provider_name: 'momo',
      p_provider_event_id: providerEventId,
      p_external_reference: String(body.orderId),
      p_provider_transaction_id: body.transId ? String(body.transId) : null,
      p_failure_code: String(resultCode),
      p_failure_message: String(body.message ?? 'MoMo payment failed'),
      p_payload: payload,
    })

    if (error) return response({ error: { code: 'PAYMENT_FAILURE_RECORD_FAILED' } }, 500)
    return response({ data })
  }

  const data = await processVerifiedPayment({
    providerName: 'momo',
    providerEventId,
    eventType: 'payment.succeeded',
    externalReference: String(body.orderId),
    providerTransactionId: String(body.transId),
    amount: Number(body.amount),
    currency: 'VND',
    signatureValid: true,
    payload,
  })

  return response({ data })
}

function sortObjectByKey(value: Record<string, unknown>) {
  return Object.keys(value).sort().reduce<Record<string, unknown>>((result, key) => {
    result[key] = value[key]
    return result
  }, {})
}

function payosSignatureData(data: Record<string, unknown>) {
  return Object.keys(data)
    .sort()
    .map((key) => {
      const value = data[key]
      let normalized: string

      if (value === null || value === undefined || value === 'null' || value === 'undefined') {
        normalized = ''
      } else if (Array.isArray(value)) {
        normalized = JSON.stringify(value.map((item) => (
          item && typeof item === 'object' ? sortObjectByKey(item as Record<string, unknown>) : item
        )))
      } else if (typeof value === 'object') {
        normalized = JSON.stringify(sortObjectByKey(value as Record<string, unknown>))
      } else {
        normalized = String(value)
      }

      return `${key}=${normalized}`
    })
    .join('&')
}

async function processPayosWebhook(body: Record<string, unknown>) {
  const checksumKey = Deno.env.get('PAYOS_CHECKSUM_KEY')
  const data = body.data as Record<string, unknown> | null

  if (!checksumKey || !data || typeof data !== 'object') {
    return response({ error: { code: 'PAYOS_NOT_CONFIGURED' } }, 503)
  }

  const signature = String(body.signature ?? '')
  const expected = await hmacSha256Hex(checksumKey, payosSignatureData(data))
  if (!signature || !safeEqual(signature.toLowerCase(), expected.toLowerCase())) {
    return response({ error: { code: 'PAYMENT_SIGNATURE_INVALID' } }, 400)
  }

  const providerOrderCode = Number(data.orderCode)
  if (!Number.isSafeInteger(providerOrderCode) || providerOrderCode <= 0) {
    return response({ error: { code: 'INVALID_PAYOS_ORDER_CODE' } }, 400)
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
  const { data: paymentReference, error: referenceError } = await admin.rpc(
    'get_payos_payment_reference',
    { p_provider_order_code: providerOrderCode },
  )

  if (referenceError) {
    return response({ error: { code: 'PAYMENT_REFERENCE_LOOKUP_FAILED' } }, 500)
  }

  if (!paymentReference) {
    // Return 2xx only after signature verification. The event is valid but
    // cannot be matched to an order, so it must be investigated manually.
    return response({ data: { accepted: true, manualReview: true, reason: 'PAYMENT_NOT_FOUND' } })
  }

  const paymentLinkId = String(data.paymentLinkId ?? providerOrderCode)
  const bankReference = data.reference ? String(data.reference) : ''
  const providerEventId = `payos:${paymentLinkId}:${bankReference || providerOrderCode}`
  const isSuccess = body.success === true
    && String(body.code ?? '') === '00'
    && String(data.code ?? '') === '00'

  if (!isSuccess) {
    const { data: failure, error } = await admin.rpc('mark_mart_payment_failed', {
      p_provider_name: 'payos',
      p_provider_event_id: providerEventId,
      p_external_reference: paymentReference.merchantReference,
      p_provider_transaction_id: bankReference || paymentLinkId,
      p_failure_code: String(data.code ?? body.code ?? 'PAYOS_PAYMENT_FAILED'),
      p_failure_message: String(data.desc ?? body.desc ?? 'PayOS payment failed'),
      p_payload: body,
    })

    if (error) return response({ error: { code: 'PAYMENT_FAILURE_RECORD_FAILED' } }, 500)
    return response({ data: failure })
  }

  if (!bankReference && !paymentLinkId) {
    return response({ error: { code: 'PAYOS_TRANSACTION_REFERENCE_REQUIRED' } }, 400)
  }

  const dataResult = await processVerifiedPayment({
    providerName: 'payos',
    providerEventId,
    eventType: 'payment.succeeded',
    externalReference: String(paymentReference.merchantReference),
    providerTransactionId: bankReference || paymentLinkId,
    amount: Number(data.amount),
    currency: String(data.currency ?? 'VND').toUpperCase() as 'VND',
    signatureValid: true,
    payload: body,
  })

  return response({ data: dataResult })
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return response({ error: { code: 'METHOD_NOT_ALLOWED' } }, 405)
  }

  const rawBody = await request.text()
  let body: unknown

  try {
    body = JSON.parse(rawBody)
  } catch {
    return response({ error: { code: 'INVALID_WEBHOOK_BODY' } }, 400)
  }

  if (!body || typeof body !== 'object') {
    return response({ error: { code: 'INVALID_WEBHOOK_BODY' } }, 400)
  }

  const normalized = body as Record<string, unknown>

  if (normalized.partnerCode && normalized.orderId && normalized.signature) {
    return processMomoWebhook(normalized)
  }

  if (normalized.data && typeof normalized.data === 'object' && normalized.signature) {
    return processPayosWebhook(normalized)
  }

  return response({ error: { code: 'WEBHOOK_PROVIDER_NOT_RECOGNIZED' } }, 400)
})
