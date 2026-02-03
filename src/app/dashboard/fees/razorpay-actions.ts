import { gatewayFetch } from '@/lib/gateway'

export async function createRazorpayOrder(amount: number, receiptId: string) {
    try {
        const order = await gatewayFetch('/api/finance/payments/create-order', {
            method: 'POST',
            body: JSON.stringify({ amount, receipt_id: receiptId })
        })
        return order
    } catch (error: any) {
        console.error('Razorpay Order Creation Error:', error)
        return { error: error.message }
    }
}

export async function verifyRazorpayPayment(
    orderId: string,
    paymentId: string,
    signature: string
) {
    try {
        const result = await gatewayFetch('/api/finance/payments/verify', {
            method: 'POST',
            body: JSON.stringify({
                order_id: orderId,
                payment_id: paymentId,
                signature: signature
            })
        })
        return result
    } catch (error: any) {
        return { error: error.message }
    }
}
