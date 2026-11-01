import { NextRequest } from 'next/server';
import { getStoreSettings } from '../../../lib/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = String(body.password || '').trim();

    const settings = getStoreSettings();
    const correctPassword = settings.adminPassword || 'admin';

    if (password === correctPassword) {
      const response = Response.json({ success: true, message: 'Authenticated' });
      response.headers.set(
        'Set-Cookie',
        `kiaan_admin_session=authenticated; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
      );
      return response;
    }

    return Response.json({ error: 'Incorrect admin password. Please try again.' }, { status: 401 });
  } catch (error) {
    return Response.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || '';
  const isAuthenticated = cookieHeader.includes('kiaan_admin_session=authenticated');

  return Response.json({ authenticated: isAuthenticated });
}

export async function DELETE() {
  const response = Response.json({ success: true, message: 'Logged out' });
  response.headers.set(
    'Set-Cookie',
    `kiaan_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return response;
}
