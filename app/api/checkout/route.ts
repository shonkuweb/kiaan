import { NextRequest } from 'next/server';
import { createOrder, getProductById, updateProduct } from '../../lib/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const email = String(body.email || '').trim();
    const address = String(body.address || '').trim();
    const landmark = String(body.landmark || '').trim();
    const city = String(body.city || '').trim();
    const state = String(body.state || 'West Bengal').trim();
    const pincode = String(body.pincode || '').trim();
    const notes = String(body.notes || '').trim();
    const paymentMethod = String(body.paymentMethod || 'cod').trim();
    const items = Array.isArray(body.items) ? body.items : [];
    const clientTotal = Number(body.total);

    if (!name) {
      return Response.json({ error: 'Please enter your full name.' }, { status: 400 });
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return Response.json({ error: 'Please enter a valid 10-digit phone number.' }, { status: 400 });
    }
    if (!address) {
      return Response.json({ error: 'Please enter your delivery street/house address.' }, { status: 400 });
    }
    if (!city) {
      return Response.json({ error: 'Please enter your city/town.' }, { status: 400 });
    }
    if (!pincode || pincode.replace(/\D/g, '').length !== 6) {
      return Response.json({ error: 'Please enter a valid 6-digit PIN code.' }, { status: 400 });
    }
    if (items.length === 0) {
      return Response.json({ error: 'Your cart is empty.' }, { status: 400 });
    }

    // Calculate total from items + shipping
    let calculatedSubtotal = 0;
    const itemSummaries: string[] = [];

    for (const item of items) {
      const qty = Math.max(1, Math.min(99, Number(item.quantity) || 1));
      const price = Number(item.price) || 0;
      calculatedSubtotal += price * qty;
      itemSummaries.push(`${item.name || item.id} (x${qty} @ ₹${price})`);

      // Decrease stock if product exists
      try {
        if (item.id) {
          const product = getProductById(item.id);
          if (product && typeof product.stock === 'number' && product.stock > 0) {
            updateProduct(item.id, {
              stock: Math.max(0, product.stock - qty),
            });
          }
        }
      } catch {
        // Continue even if stock update fails
      }
    }

    const shipping = calculatedSubtotal >= 999 ? 0 : 69;
    const finalTotal = clientTotal > 0 ? clientTotal : (calculatedSubtotal + shipping);

    const paymentLabel =
      paymentMethod === 'upi'
        ? 'UPI / Online'
        : paymentMethod === 'whatsapp'
        ? 'WhatsApp Assisted'
        : 'Cash on Delivery (COD)';

    const customerSummary = `${name} | Ph: ${phone}${email ? ` | ${email}` : ''}`;
    const fullAddress = `${address}${landmark ? `, Near ${landmark}` : ''}, ${city}, ${state} - ${pincode}`;
    const orderDetails = `${itemSummaries.join(', ')} | Delivery: ${fullAddress} | Payment: ${paymentLabel} | Subtotal: ₹${calculatedSubtotal}, Shipping: ${shipping === 0 ? 'FREE' : `₹${shipping}`}, Total: ₹${finalTotal}${notes ? ` | Notes: ${notes}` : ''}`;

    const order = createOrder({
      customer: customerSummary,
      details: orderDetails,
      total: finalTotal,
      status: 'Pending',
    });

    return Response.json({
      success: true,
      orderId: order.id,
      customer: {
        name,
        phone,
        email,
        address: fullAddress,
      },
      items,
      subtotal: calculatedSubtotal,
      shipping,
      total: finalTotal,
      paymentMethod,
      date: order.date,
    }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not process order.' },
      { status: 500 }
    );
  }
}
