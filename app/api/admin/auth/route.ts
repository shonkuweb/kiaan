import { NextRequest } from 'next/server';
import { getStoreSettings } from '../../../lib/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    let password = '';
    try {
      const body = await request.json();
      password = String(body.password || '').trim();
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    let correctPassword = 'admin';
    try {
      const settings = getStoreSettings();
      correctPassword = settings.adminPassword || 'admin';
    } catch (err) {
      console.error('Error fetching admin password from settings:', err);
      correctPassword = 'admin';
    }

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
    console.error('Admin auth POST error:', error);
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
