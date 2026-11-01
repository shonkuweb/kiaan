import { NextRequest } from 'next/server';
import { getProducts, getProductById } from '../../lib/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    if (id) {
      const product = getProductById(id);
      if (!product) {
        return Response.json({ error: 'Product not found' }, { status: 404 });
      }
      return Response.json(product);
    }

    const featuredOnly = searchParams.get('featured') === 'true' || searchParams.get('featured') === '1';
    const categoryId = searchParams.get('category') || undefined;

    const products = getProducts({
      categoryId,
      featuredOnly,
    });

    return Response.json(products, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
