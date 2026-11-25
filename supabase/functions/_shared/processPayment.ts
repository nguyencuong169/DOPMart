import type { PaymentProcessingResult, VerifiedPaymentEvent } from './payment.ts'
import { createSupabaseAdmin } from './supabaseAdmin.ts'

export async function processVerifiedPayment(
  event: VerifiedPaymentEvent,
): Promise<PaymentProcessingResult> {
  const supabase = createSupabaseAdmin()

  const { data, error } = await supabase.rpc('process_mart_payment_webhook', {
    p_provider_name: event.providerName,
    p_provider_event_id: event.providerEventId,
    p_event_type: event.eventType,
    p_external_reference: event.externalReference,
    p_provider_transaction_id: event.providerTransactionId,
    p_amount: event.amount,
    p_currency: event.currency,
    p_signature_valid: event.signatureValid,
    p_payload: event.payload,
  })

  if (error) throw error
  return data as PaymentProcessingResult
}
