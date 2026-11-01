import { NextRequest } from 'next/server';
import { getStoreSettings, updateStoreSettings } from '../../../lib/server/db';
import { checkLocalAdmin } from '../../../lib/server/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = getStoreSettings();
    return Response.json(settings, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const denied = checkLocalAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const updated = updateStoreSettings(body);
    return Response.json(updated);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not update settings' },
      { status: 500 }
    );
  }
}
