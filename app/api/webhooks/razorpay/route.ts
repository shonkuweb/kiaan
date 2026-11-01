import { NextRequest } from 'next/server';
import { updateOrderPayment, getOrderByRazorpayOrderId } from '../../../lib/server/db';
import { verifyRazorpayWebhookSignature } from '../../../lib/server/razorpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    if (!signature) {
      return Response.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
    }

    // Verify webhook signature
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('[Razorpay Webhook] Invalid webhook signature detected.');
      return Response.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const eventData = JSON.parse(rawBody);
    const event = eventData.event;

    const paymentEntity = eventData.payload?.payment?.entity;
    const orderEntity = eventData.payload?.order?.entity;

    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const paymentId = paymentEntity?.id;

    if (razorpayOrderId) {
      const existingOrder = getOrderByRazorpayOrderId(razorpayOrderId);

      if (event === 'payment.captured' || event === 'order.paid') {
        updateOrderPayment(razorpayOrderId, {
          status: 'Confirmed',
          paymentId: paymentId || existingOrder?.paymentId,
          paymentStatus: 'paid',
        });
        console.log(`[Razorpay Webhook] Order ${razorpayOrderId} confirmed and paid. Payment ID: ${paymentId}`);
      } else if (event === 'payment.failed') {
        updateOrderPayment(razorpayOrderId, {
          paymentStatus: 'failed',
        });
        console.log(`[Razorpay Webhook] Payment failed for order ${razorpayOrderId}.`);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('[Razorpay Webhook Error]', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Webhook processing error' },
      { status: 500 }
    );
  }
}
