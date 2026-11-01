import { NextRequest } from 'next/server';
import { getProducts, createProduct, updateProduct, deleteProduct, getProductById } from '../../../lib/server/db';
import { checkLocalAdmin } from '../../../lib/server/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = getProducts();
    return Response.json(products, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = checkLocalAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const categoryId = String(body.categoryId || '').trim();
    const price = Number(body.price);
    const stock = Number(body.stock);
    const description = String(body.description || '').trim();
    const images = Array.isArray(body.images) ? body.images : [];
    const isFeatured = Boolean(body.isFeatured);
    const color = String(body.color || 'pink').trim();

    if (!name || name.length > 100) {
      return Response.json({ error: 'Enter a product name up to 100 characters.' }, { status: 400 });
    }
    if (!categoryId) {
      return Response.json({ error: 'Please choose a category.' }, { status: 400 });
    }
    if (!Number.isFinite(price) || price <= 0 || price > 10000000) {
      return Response.json({ error: 'Enter a valid price.' }, { status: 400 });
    }
    if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) {
      return Response.json({ error: 'Enter a valid stock quantity (whole number).' }, { status: 400 });
    }
    if (images.length === 0 || images.length > 3) {
      return Response.json({ error: 'Add between 1 and 3 product photos.' }, { status: 400 });
    }

    const created = createProduct({
      id: body.id,
      name,
      categoryId,
      price,
      stock,
      description,
      images,
      image: images[0] || '',
      isFeatured,
      color,
    });

    return Response.json(created, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not create product' },
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
    if (!id) {
      return Response.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const existing = getProductById(id);
    if (!existing) {
      return Response.json({ error: 'Product not found.' }, { status: 404 });
    }

    const name = body.name !== undefined ? String(body.name).trim() : existing.name;
    const categoryId = body.categoryId !== undefined ? String(body.categoryId).trim() : existing.categoryId;
    const price = body.price !== undefined ? Number(body.price) : existing.price;
    const stock = body.stock !== undefined ? Number(body.stock) : existing.stock;
    const description = body.description !== undefined ? String(body.description).trim() : existing.description;
    const images = Array.isArray(body.images) ? body.images : existing.images;
    const isFeatured = body.isFeatured !== undefined ? Boolean(body.isFeatured) : existing.isFeatured;
    const color = body.color !== undefined ? String(body.color).trim() : existing.color;

    if (!name || name.length > 100) {
      return Response.json({ error: 'Enter a product name up to 100 characters.' }, { status: 400 });
    }
    if (!categoryId) {
      return Response.json({ error: 'Please choose a category.' }, { status: 400 });
    }
    if (!Number.isFinite(price) || price <= 0 || price > 10000000) {
      return Response.json({ error: 'Enter a valid price.' }, { status: 400 });
    }
    if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) {
      return Response.json({ error: 'Enter a valid stock quantity (whole number).' }, { status: 400 });
    }
    if (images.length === 0 || images.length > 3) {
      return Response.json({ error: 'Add between 1 and 3 product photos.' }, { status: 400 });
    }

    const updated = updateProduct(id, {
      name,
      categoryId,
      price,
      stock,
      description,
      images,
      image: images[0] || existing.image,
      isFeatured,
      color,
    });

    return Response.json(updated);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const denied = checkLocalAdmin(request);
  if (denied) return denied;

  try {
    let id = request.nextUrl.searchParams.get('id');
    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return Response.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const success = deleteProduct(id);
    if (!success) {
      return Response.json({ error: 'Product not found or already deleted.' }, { status: 404 });
    }

    return Response.json({ success: true, id });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not delete product' },
      { status: 500 }
    );
  }
}
