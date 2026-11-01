import crypto from 'node:crypto';

export function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

  if (!keyId || !keySecret) {
    throw new Error('Razorpay API keys are not configured in environment variables.');
  }

  return { keyId, keySecret, webhookSecret };
}

export type RazorpayOrderResponse = {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
};

export async function createRazorpayOrder({
  amountInRupees,
  receipt,
  notes,
}: {
  amountInRupees: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResponse> {
  const { keyId, keySecret } = getRazorpayConfig();

  // Razorpay amounts are strictly in paise (1 INR = 100 paise)
  const amountInPaise = Math.round(amountInRupees * 100);

  const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt.slice(0, 40),
      notes: notes || {},
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.description || data.error?.message || 'Failed to create Razorpay order');
  }

  return data as RazorpayOrderResponse;
}

export function verifyRazorpayPaymentSignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  try {
    const { keySecret } = getRazorpayConfig();
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
    const signatureBuffer = Buffer.from(razorpaySignature, 'utf-8');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch {
    return false;
  }
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signatureHeader: string
): boolean {
  try {
    const { webhookSecret } = getRazorpayConfig();
    if (!webhookSecret) return false;

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
    const signatureBuffer = Buffer.from(signatureHeader, 'utf-8');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch {
    return false;
  }
}
