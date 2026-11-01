import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductById, getProducts, type Product } from '../../lib/server/db';
import { ProductDetails } from '../../components/shop-pages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const product = getProductById(id);
    return {
      title: product ? `${product.name} | Kiaan Nursery` : 'Plant not found | Kiaan Nursery',
      description: product?.description,
    };
  } catch (err) {
    console.error('Failed to generate product metadata:', err);
    return {
      title: 'Plant | Kiaan Nursery',
      description: 'Explore premium plants from Kiaan Agro Care & Nursery.',
    };
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  let id = '';
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
  } catch (err) {
    console.error('Failed to resolve route params:', err);
    notFound();
  }

  let product: Product | null = null;
  try {
    product = getProductById(id);
  } catch (err) {
    console.error(`Failed to fetch product with id "${id}":`, err);
  }

  if (!product) notFound();

  let related: Product[] = [];
  try {
    related = getProducts({ categoryId: product.categoryId })
      .filter(p => p.id !== product!.id)
      .slice(0, 2);
  } catch (err) {
    console.error('Failed to fetch related products:', err);
  }

  return <ProductDetails key={id} product={product} relatedProducts={related} />;
}
