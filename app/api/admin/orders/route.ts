import { NextRequest } from 'next/server';
import { getOrders, createOrder, updateOrderStatus, deleteOrder } from '../../../lib/server/db';
import { checkLocalAdmin } from '../../../lib/server/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const orders = getOrders();
    return Response.json(orders, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = checkLocalAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const customer = String(body.customer || '').trim();
    const details = String(body.details || '').trim();
    const total = Number(body.total);
    const status = String(body.status || 'Confirmed').trim();

    if (!customer) {
      return Response.json({ error: 'Customer name is required.' }, { status: 400 });
    }
    if (!details) {
      return Response.json({ error: 'Order details are required.' }, { status: 400 });
    }
    if (!Number.isFinite(total) || total <= 0) {
      return Response.json({ error: 'Enter a valid total amount.' }, { status: 400 });
    }

    const created = createOrder({
      customer,
      details,
      total,
      status,
      paymentStatus: 'paid',
      paymentMethod: 'manual',
    });
    return Response.json(created, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not create order' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const denied = checkLocalAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const id = String(body.id || '').trim();
    const status = String(body.status || '').trim();

    if (!id || !status) {
      return Response.json({ error: 'Order ID and status are required.' }, { status: 400 });
    }

    const updated = updateOrderStatus(id, status);
    if (!updated) {
      return Response.json({ error: 'Order not found.' }, { status: 404 });
    }

    return Response.json(updated);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const denied = checkLocalAdmin(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return Response.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    const deleted = deleteOrder(id);
    if (!deleted) {
      return Response.json({ error: 'Order not found.' }, { status: 404 });
    }

    return Response.json({ success: true, id });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not delete order' },
      { status: 500 }
    );
  }
}
