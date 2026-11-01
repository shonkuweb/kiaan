import { NextRequest } from 'next/server';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../../lib/server/db';
import { checkLocalAdmin } from '../../../lib/server/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = getCategories();
    return Response.json(categories, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not fetch categories' },
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
    const isVisible = body.isVisible !== undefined ? Boolean(body.isVisible) : true;
    const image = typeof body.image === 'string' ? body.image.trim() : '';

    if (!name || name.length > 50) {
      return Response.json({ error: 'Enter a category name up to 50 characters.' }, { status: 400 });
    }

    const categories = getCategories();
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      return Response.json({ error: 'A category with this name already exists.' }, { status: 400 });
    }

    const created = createCategory(name, isVisible, undefined, image);
    return Response.json(created, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not create category' },
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
      return Response.json({ error: 'Category ID is required.' }, { status: 400 });
    }

    const name = body.name !== undefined ? String(body.name).trim() : undefined;
    if (name !== undefined && (!name || name.length > 50)) {
      return Response.json({ error: 'Enter a category name up to 50 characters.' }, { status: 400 });
    }

    const categories = getCategories();
    if (name && categories.some(c => c.id !== id && c.name.toLowerCase() === name.toLowerCase())) {
      return Response.json({ error: 'A category with this name already exists.' }, { status: 400 });
    }

    const isVisible = body.isVisible !== undefined ? Boolean(body.isVisible) : undefined;
    const image = body.image !== undefined ? String(body.image).trim() : undefined;
    const updated = updateCategory(id, { name, isVisible, image });
    if (!updated) {
      return Response.json({ error: 'Category not found.' }, { status: 404 });
    }

    return Response.json(updated);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not update category' },
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
      return Response.json({ error: 'Category ID is required.' }, { status: 400 });
    }

    const success = deleteCategory(id);
    if (!success) {
      return Response.json(
        { error: 'Cannot remove category. Make sure no products are assigned to this category first.' },
        { status: 400 }
      );
    }

    return Response.json({ success: true, id });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not delete category' },
      { status: 500 }
    );
  }
}
