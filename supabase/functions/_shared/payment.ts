export interface VerifiedPaymentEvent {
  providerName: 'vietqr' | 'payos' | 'momo' | 'zalopay'
  providerEventId: string
  eventType: string
  externalReference: string
  providerTransactionId: string
  amount: number
  currency: 'VND'
  signatureValid: true
  payload: Record<string, unknown>
}

export interface PaymentProviderAdapter {
  verifyWebhook(request: Request): Promise<VerifiedPaymentEvent>
}

export interface PaymentProcessingResult {
  accepted: boolean
  processed: boolean
  duplicate?: boolean
  manualReview?: boolean
  reason?: string
  orderId?: string
  paymentId?: string
}
