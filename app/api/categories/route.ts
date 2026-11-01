import { NextRequest } from 'next/server';
import { getCategories } from '../../lib/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const all = request.nextUrl.searchParams.get('all') === 'true';
    const categories = getCategories(all ? undefined : { visibleOnly: true });
    return Response.json(categories, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
