import { NextRequest } from 'next/server';
import { trackOrderByPhoneAndId } from '../../../lib/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseOrderPayload(order: ReturnType<typeof trackOrderByPhoneAndId>) {
  if (!order) return null;

  // Extract customer name
  const custParts = order.customer.split('|').map(s => s.trim());
  const customerName = custParts[0] || 'Valued Customer';

  // Parse lines from order.details
  const lines = order.details.split('\n').map(l => l.trim()).filter(Boolean);
  let itemsText = '';
  let addressText = '';
  let notesText = '';

  for (const line of lines) {
    if (/^items:\s*/i.test(line)) {
      itemsText = line.replace(/^items:\s*/i, '');
    } else if (/^(?:delivery address|delivery):\s*/i.test(line)) {
      addressText = line.replace(/^(?:delivery address|delivery):\s*/i, '');
    } else if (/^notes:\s*/i.test(line)) {
      notesText = line.replace(/^notes:\s*/i, '');
    } else if (!itemsText && !addressText) {
      itemsText = line;
    }
  }

  // Determine active step index (0-based) for visual status tracker:
  // 0: Order Confirmed
  // 1: Plant Selection
  // 2: Botanical Packaging
  // 3: Dispatched
  // 4: Delivered
  const statusLower = (order.status || '').toLowerCase();
  let stepIndex = 0;
  if (statusLower.includes('deliver')) {
    stepIndex = 4;
  } else if (statusLower.includes('dispatch') || statusLower.includes('transit') || statusLower.includes('shipped')) {
    stepIndex = 3;
  } else if (statusLower.includes('pack')) {
    stepIndex = 2;
  } else if (statusLower.includes('select') || statusLower.includes('plant') || statusLower.includes('process') || statusLower.includes('prep')) {
    stepIndex = 1;
  } else {
    stepIndex = 0;
  }

  return {
    id: order.id,
    customerName,
    status: order.status,
    stepIndex,
    paymentStatus: order.paymentStatus || 'paid',
    paymentMethod: order.paymentMethod || 'Razorpay Online',
    total: order.total,
    date: order.date,
    itemsText,
    addressText,
    notesText,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, phone } = body;

    if (!orderId || !String(orderId).trim()) {
      return Response.json({ error: 'Please enter your Order ID.' }, { status: 400 });
    }

    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return Response.json({ error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    const order = trackOrderByPhoneAndId(String(orderId), cleanPhone);

    if (!order) {
      return Response.json(
        {
          error: `No order found for ID "${orderId}" and mobile number "${cleanPhone.slice(-10)}". Please verify your details or contact us on WhatsApp for assistance.`,
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      order: parseOrderPayload(order),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not fetch order status.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const phone = searchParams.get('phone');

    if (!orderId || !phone) {
      return Response.json({ error: 'Order ID and mobile number are required.' }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    const order = trackOrderByPhoneAndId(String(orderId), cleanPhone);

    if (!order) {
      return Response.json(
        {
          error: `No order found for ID "${orderId}" and mobile number "${cleanPhone.slice(-10)}".`,
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      order: parseOrderPayload(order),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not fetch order status.' },
      { status: 500 }
    );
  }
}
