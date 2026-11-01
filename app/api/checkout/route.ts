import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  return Response.json(
    {
      error: 'Cash on delivery is disabled. All orders must be paid online securely via Razorpay.',
    },
    { status: 400 }
  );
}
