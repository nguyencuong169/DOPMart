import { supabase } from '../lib/supabase'
import type {
  CreateMartOrderCommand,
  CreateMartOrderResult,
  MartOrder,
  MartOrderSummary,
} from '../types/mart-order'
import { MartOrderError } from '../types/mart-order'

const MOCK_ORDER_KEY = 'dopmart-mvp-orders-v1'

function readMockOrders(): MartOrder[] {
  if (typeof localStorage === 'undefined') return []

  try {
    return JSON.parse(localStorage.getItem(MOCK_ORDER_KEY) ?? '[]') as MartOrder[]
  } catch {
    return []
  }
}

function writeMockOrders(orders: MartOrder[]) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(MOCK_ORDER_KEY, JSON.stringify(orders))
}

function createMockOrder(command: CreateMartOrderCommand, products: any[]): CreateMartOrderResult {
  const existing = readMockOrders().find(
    (order) => order.payment?.merchantReference === command.idempotencyKey,
  )

  if (existing) return { order: existing, isMock: true }

  const items = command.items.map((item) => {
    const product = products.find((candidate) => Number(candidate.id) === item.productId)

    if (!product) {
      throw new MartOrderError('PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm trong giỏ hàng.')
    }

    const unitPrice = Number(product.price)
    return {
      productId: item.productId,
      name: product.name,
      sku: product.slug ?? String(product.id),
      unitPrice,
      quantity: item.quantity,
      discountAmount: 0,
      lineTotal: unitPrice * item.quantity,
    }
  })

  const now = new Date()
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString()
  const orderId = crypto.randomUUID()
  const orderNumber = `DOP-DEMO-${String(Date.now()).slice(-6)}`
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0)

  const order: MartOrder = {
    id: orderId,
    orderNumber,
    status: 'pending_payment',
    fulfillmentMethod: command.fulfillment.method,
    deliveryLocation: command.fulfillment.deliveryLocation,
    subtotal: total,
    discountTotal: 0,
    deliveryFee: 0,
    grandTotal: total,
    currency: 'VND',
    expiresAt,
    createdAt: now.toISOString(),
    items,
    payment: {
      id: crypto.randomUUID(),
      method: command.payment.method,
      status: 'pending',
      amount: total,
      currency: 'VND',
      merchantReference: command.idempotencyKey,
      expiresAt,
    },
  }

  writeMockOrders([...readMockOrders(), order])
  return { order, isMock: true }
}

function mapRpcError(error: { message?: string; code?: string; details?: unknown }) {
  const raw = error.message ?? 'Không thể tạo đơn hàng.'
  const code = raw.split(':')[0] || error.code || 'INTERNAL_ERROR'

  const messages: Record<string, string> = {
    OUT_OF_STOCK: 'Một sản phẩm vừa hết hàng. Vui lòng kiểm tra lại giỏ hàng.',
    DELIVERY_LOCATION_REQUIRED: 'Vui lòng nhập vị trí giao hàng trong văn phòng.',
    USER_PROFILE_REQUIRED: 'Tài khoản chưa được kích hoạt cho DOP Mart.',
    INVALID_PAYMENT_METHOD: 'Phương thức thanh toán không hợp lệ.',
    ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng.',
    ORDER_NOT_CANCELLABLE: 'Đơn hàng không còn có thể hủy.',
  }

  return new MartOrderError(code, messages[code] ?? raw, error.details)
}

export async function createMartOrder(
  command: CreateMartOrderCommand,
  products: any[],
): Promise<CreateMartOrderResult> {
  if (!command.items.length) {
    throw new MartOrderError('ITEMS_REQUIRED', 'Giỏ hàng đang trống.')
  }

  if (!supabase) {
    return createMockOrder(command, products)
  }

  const rpcRequest = {
    ...command,
    items: command.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    })),
  }

  const { data, error } = await supabase.rpc('create_mart_order', {
    p_request: rpcRequest,
  })

  if (error) throw mapRpcError(error)

  return {
    order: data as MartOrder,
    isMock: false,
  }
}

export async function getMartOrder(orderId: string): Promise<MartOrder> {
  if (!supabase) {
    const order = readMockOrders().find((candidate) => candidate.id === orderId)
    if (!order) throw new MartOrderError('ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.')
    return order
  }

  const { data, error } = await supabase.rpc('get_mart_order', {
    p_order_id: orderId,
  })

  if (error) throw mapRpcError(error)
  return data as MartOrder
}

export async function getMyMartOrders(): Promise<MartOrderSummary[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('get_mart_my_orders')
  if (error) throw mapRpcError(error)
  return (data ?? []) as MartOrderSummary[]
}

export async function createMomoPayment(orderId: string): Promise<{
  checkoutUrl?: string
  qrPayload?: string
  requestId?: string
}> {
  if (!supabase) {
    throw new MartOrderError('MOMO_NOT_CONFIGURED', 'MoMo chỉ khả dụng khi đã cấu hình Supabase.')
  }

  const { data, error } = await supabase.functions.invoke('create-momo-payment', {
    body: { orderId },
  })

  if (error) throw new MartOrderError('MOMO_CREATE_FAILED', error.message)
  if (data?.error) {
    throw new MartOrderError(data.error.code ?? 'MOMO_CREATE_FAILED', data.error.message ?? 'Không thể tạo phiên MoMo.')
  }

  return {
    checkoutUrl: data?.data?.checkoutUrl,
    qrPayload: data?.data?.qrPayload,
    requestId: data?.meta?.requestId,
  }
}

export async function createPayosPayment(orderId: string): Promise<{
  checkoutUrl?: string
  qrPayload?: string
  requestId?: string
}> {
  if (!supabase) {
    throw new MartOrderError('PAYOS_NOT_CONFIGURED', 'PayOS chỉ hoạt động khi đã cấu hình Supabase.')
  }

  const { data, error } = await supabase.functions.invoke('create-payos-payment', {
    body: { orderId },
  })

  if (error) throw new MartOrderError('PAYOS_CREATE_FAILED', error.message)
  if (data?.error) {
    throw new MartOrderError(
      data.error.code ?? 'PAYOS_CREATE_FAILED',
      data.error.message ?? 'Không thể tạo link VietQR PayOS.',
    )
  }

  return {
    checkoutUrl: data?.data?.checkoutUrl,
    qrPayload: data?.data?.qrPayload,
    requestId: data?.meta?.requestId,
  }
}

export async function cancelMartOrder(orderId: string): Promise<MartOrder> {
  if (!supabase) {
    const orders = readMockOrders()
    const index = orders.findIndex((candidate) => candidate.id === orderId)
    const order = orders[index]

    if (!order) throw new MartOrderError('ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.')
    if (order.status !== 'pending_payment') {
      throw new MartOrderError('ORDER_NOT_CANCELLABLE', 'Đơn hàng không còn có thể hủy.')
    }

    const cancelled = { ...order, status: 'cancelled' as const }
    orders[index] = cancelled
    writeMockOrders(orders)
    return cancelled
  }

  const { data, error } = await supabase.rpc('cancel_mart_order', {
    p_order_id: orderId,
  })

  if (error) throw mapRpcError(error)
  return data as MartOrder
}

export function simulateMockPayment(orderId: string): MartOrder {
  const orders = readMockOrders()
  const index = orders.findIndex((candidate) => candidate.id === orderId)
  const order = orders[index]

  if (!order) throw new MartOrderError('ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.')
  if (order.status !== 'pending_payment' || !order.payment) {
    throw new MartOrderError('PAYMENT_ALREADY_PROCESSED', 'Thanh toán đã được xử lý.')
  }

  const paid: MartOrder = {
    ...order,
    status: 'confirmed',
    payment: {
      ...order.payment,
      status: 'succeeded',
      paidAt: new Date().toISOString(),
    },
  }

  orders[index] = paid
  writeMockOrders(orders)
  return paid
}
