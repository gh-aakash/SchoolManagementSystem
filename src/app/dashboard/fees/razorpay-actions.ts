'use server'

import Razorpay from 'razorpay'
import crypto from 'crypto'

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function createRazorpayOrder(amount: number, receiptId: string) {
    try {
        const options = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: receiptId,
        }

        const order = await razorpay.orders.create(options)
        return { orderId: order.id, amount: order.amount, currency: order.currency }
    } catch (error) {
        console.error('Razorpay Order Creation Error:', error)
        return { error: 'Failed to create payment order' }
    }
}

export async function verifyRazorpayPayment(
    orderId: string,
    paymentId: string,
    signature: string
) {
    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(orderId + '|' + paymentId)
        .digest('hex')

    if (generatedSignature === signature) {
        return { success: true }
    } else {
        return { error: 'Payment verification failed' }
    }
}
