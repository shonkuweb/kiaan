import { NextRequest } from 'next/server';
import { updateOrderPayment, getOrderById } from '../../../../lib/server/db';
import { verifyRazorpayPaymentSignature } from '../../../../lib/server/razorpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return Response.json(
        { error: 'Incomplete payment verification payload.' },
        { status: 400 }
      );
    }

    // Verify HMAC-SHA256 signature
    const isValid = verifyRazorpayPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      // Mark as payment failed in DB if order exists
      if (orderId || razorpayOrderId) {
        updateOrderPayment(orderId || razorpayOrderId, {
          paymentStatus: 'signature_failed',
        });
      }
      return Response.json(
        { error: 'Payment signature verification failed. Please contact support.' },
        { status: 400 }
      );
    }

    // Update order in SQLite database to Confirmed and Paid
    const updatedOrder = updateOrderPayment(orderId || razorpayOrderId, {
      status: 'Confirmed',
      paymentId: razorpayPaymentId,
      paymentStatus: 'paid',
    });

    return Response.json({
      success: true,
      orderId: updatedOrder?.id || orderId,
      paymentId: razorpayPaymentId,
      status: 'Confirmed',
      paymentStatus: 'paid',
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Payment verification error' },
      { status: 500 }
    );
  }
}
