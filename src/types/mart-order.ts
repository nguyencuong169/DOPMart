export type FulfillmentMethod = 'pickup' | 'office_delivery'

export type PaymentMethod = 'vietqr' | 'momo' | 'zalopay'

export type MartOrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'manual_review'

export type MartPaymentStatus =
  'created' | 'pending' | 'succeeded' | 'failed' | 'expired' | 'refunded' | 'manual_review'

export interface CreateMartOrderItem {
  productId: number
  quantity: number
}

export interface CreateMartOrderCommand {
  items: CreateMartOrderItem[]
  fulfillment: {
    method: FulfillmentMethod
    deliveryLocation?: string
    note?: string
  }
  payment: {
    method: PaymentMethod
  }
  idempotencyKey: string
}

export interface MartOrderItem {
  productId: number
  name: string
  sku: string
  unitPrice: number
  quantity: number
  discountAmount: number
  lineTotal: number
}

export interface MartPayment {
  id: string
  method: PaymentMethod
  status: MartPaymentStatus
  amount: number
  currency: 'VND'
  merchantReference: string
  qrPayload?: string
  checkoutUrl?: string
  expiresAt?: string
  paidAt?: string
}

export interface MartOrder {
  id: string
  orderNumber: string
  status: MartOrderStatus
  fulfillmentMethod: FulfillmentMethod
  deliveryLocation?: string
  subtotal: number
  discountTotal: number
  deliveryFee: number
  grandTotal: number
  currency: 'VND'
  expiresAt?: string
  createdAt: string
  items: MartOrderItem[]
  payment?: MartPayment
}

export interface MartOrderSummary {
  id: string
  orderNumber: string
  status: MartOrderStatus
  fulfillmentMethod: FulfillmentMethod
  deliveryLocation?: string
  grandTotal: number
  currency: 'VND'
  createdAt: string
  itemCount: number
  paymentStatus: string
}

export interface CreateMartOrderResult {
  order: MartOrder
  isMock: boolean
}

export class MartOrderError extends Error {
  readonly code: string
  readonly details?: unknown

  constructor(code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'MartOrderError'
    this.code = code
    this.details = details
  }
}
