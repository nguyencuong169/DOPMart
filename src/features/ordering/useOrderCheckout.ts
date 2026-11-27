import { computed, shallowRef } from 'vue'
import {
  createMartOrder,
  createMomoPayment,
  createPayosPayment,
} from '../../services/martOrderService'
import type {
  CreateMartOrderCommand,
  CreateMartOrderResult,
  FulfillmentMethod,
  PaymentMethod,
} from '../../types/mart-order'
import { MartOrderError } from '../../types/mart-order'

export function useOrderCheckout(cart: any, getProducts: () => any[]) {
  const method = shallowRef<FulfillmentMethod>('pickup')
  const paymentMethod = shallowRef<PaymentMethod>('vietqr')
  const deliveryLocation = shallowRef('')
  const note = shallowRef('')
  const submitting = shallowRef(false)
  const result = shallowRef<CreateMartOrderResult | null>(null)
  const error = shallowRef<MartOrderError | null>(null)

  const total = computed(() => Number(cart.total ?? 0))
  const canSubmit = computed(() => {
    if (submitting.value || !cart.items.length) return false
    return method.value !== 'office_delivery' || deliveryLocation.value.trim().length > 0
  })

  async function submit() {
    if (!canSubmit.value) {
      error.value = new MartOrderError(
        method.value === 'office_delivery' ? 'DELIVERY_LOCATION_REQUIRED' : 'ITEMS_REQUIRED',
        method.value === 'office_delivery'
          ? 'Vui lòng nhập vị trí giao hàng trong văn phòng.'
          : 'Giỏ hàng đang trống.'
      )
      return
    }

    submitting.value = true
    error.value = null

    const command: CreateMartOrderCommand = {
      items: cart.items.map((item: any) => ({
        productId: Number(item.id),
        quantity: Number(item.qty),
      })),
      fulfillment: {
        method: method.value,
        deliveryLocation: deliveryLocation.value.trim() || undefined,
        note: note.value.trim() || undefined,
      },
      payment: {
        method: paymentMethod.value,
      },
      idempotencyKey: crypto.randomUUID(),
    }

    try {
      result.value = await createMartOrder(command, getProducts())

      if (
        result.value.order.payment?.method === 'momo' &&
        result.value.order.payment.status === 'pending' &&
        !result.value.isMock
      ) {
        const momoSession = await createMomoPayment(result.value.order.id)
        result.value = {
          ...result.value,
          order: {
            ...result.value.order,
            payment: {
              ...result.value.order.payment,
              checkoutUrl: momoSession.checkoutUrl,
              qrPayload: momoSession.qrPayload,
            },
          },
        }
      }
      if (
        result.value.order.payment?.method === 'vietqr' &&
        result.value.order.payment.status === 'pending' &&
        !result.value.isMock
      ) {
        const payosSession = await createPayosPayment(result.value.order.id)
        result.value = {
          ...result.value,
          order: {
            ...result.value.order,
            payment: {
              ...result.value.order.payment,
              checkoutUrl: payosSession.checkoutUrl,
              qrPayload: payosSession.qrPayload,
            },
          },
        }
      }
      if (result.value.order.status !== 'pending_payment') {
        await cart.clear()
      }
    } catch (cause) {
      error.value =
        cause instanceof MartOrderError
          ? cause
          : new MartOrderError('INTERNAL_ERROR', 'Không thể tạo đơn hàng. Vui lòng thử lại.')
    } finally {
      submitting.value = false
    }
  }

  function reset() {
    result.value = null
    error.value = null
  }

  return {
    method,
    paymentMethod,
    deliveryLocation,
    note,
    submitting,
    result,
    error,
    total,
    canSubmit,
    submit,
    reset,
  }
}
