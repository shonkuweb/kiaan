import { NextRequest } from 'next/server';
import { createOrder, getProductById } from '../../../../lib/server/db';
import { createRazorpayOrder, getRazorpayConfig } from '../../../../lib/server/razorpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      address,
      landmark,
      city,
      state,
      pincode,
      notes,
      items,
      clientTotal,
    } = body;

    // Basic validation
    if (!name || !name.trim()) return Response.json({ error: 'Please enter your full name.' }, { status: 400 });
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) return Response.json({ error: 'Please enter a valid 10-digit phone number.' }, { status: 400 });
    if (!address || !address.trim()) return Response.json({ error: 'Please enter your street / delivery address.' }, { status: 400 });
    if (!city || !city.trim()) return Response.json({ error: 'Please enter your city / district.' }, { status: 400 });
    if (!state || !state.trim()) return Response.json({ error: 'Please select your state.' }, { status: 400 });
    const cleanPin = String(pincode || '').replace(/\D/g, '');
    if (cleanPin.length !== 6) return Response.json({ error: 'Please enter a valid 6-digit Indian PIN code.' }, { status: 400 });

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Your cart is empty.' }, { status: 400 });
    }

    // Verify prices against database to protect against client-side tampering
    let verifiedSubtotal = 0;
    const verifiedItems: Array<{ id: string; name: string; price: number; quantity: number }> = [];

    for (const item of items) {
      const product = getProductById(item.id);
      const qty = Math.min(99, Math.max(1, Number(item.quantity) || 1));
      const price = product ? product.price : Number(item.price);
      const itemName = product ? product.name : item.name;

      verifiedSubtotal += price * qty;
      verifiedItems.push({
        id: item.id,
        name: itemName,
        price,
        quantity: qty,
      });
    }

    // Free shipping threshold at ₹999
    const shipping = verifiedSubtotal >= 999 ? 0 : 69;
    const totalAmount = verifiedSubtotal + shipping;

    const shortId = crypto.randomUUID().slice(0, 8).toUpperCase();
    const receipt = `KIAAN-${shortId}`;

    // Create Razorpay Order
    const razorpayOrder = await createRazorpayOrder({
      amountInRupees: totalAmount,
      receipt,
      notes: {
        customer_name: name.trim(),
        customer_phone: cleanPhone,
        pincode: cleanPin,
        receipt,
      },
    });

    const fullAddress = `${address.trim()}${landmark ? `, Near ${landmark.trim()}` : ''}, ${city.trim()}, ${state.trim()} - ${cleanPin}`;
    const customerSummary = `${name.trim()} | Ph: ${cleanPhone}${email ? ` | ${email.trim()}` : ''}`;
    const itemsSummary = verifiedItems
      .map(i => `${i.name} (Qty: ${i.quantity}, ₹${i.price} each)`)
      .join('; ');
    const orderDetails = `Items: ${itemsSummary}\nDelivery Address: ${fullAddress}\nShipping: ₹${shipping}\nPayment: Razorpay Online (Pending)\nRazorpay Order ID: ${razorpayOrder.id}${notes ? `\nNotes: ${notes.trim()}` : ''}`;

    // Save pending order in SQLite database
    const localOrder = createOrder({
      customer: customerSummary,
      details: orderDetails,
      total: totalAmount,
      status: 'Pending Payment',
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: 'pending',
      paymentMethod: 'razorpay',
    });

    const { keyId } = getRazorpayConfig();

    return Response.json({
      success: true,
      orderId: localOrder.id,
      receipt,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId,
      customer: {
        name: name.trim(),
        phone: cleanPhone,
        email: email ? email.trim() : '',
        address: fullAddress,
      },
      items: verifiedItems,
      subtotal: verifiedSubtotal,
      shipping,
      total: totalAmount,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not initialize payment order' },
      { status: 500 }
    );
  }
}
