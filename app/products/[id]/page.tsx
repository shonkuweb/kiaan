import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductById, getProducts } from '../../lib/server/db';
import { ProductDetails } from '../../components/shop-pages';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);
  return {
    title: product ? `${product.name} | Kiaan Nursery` : 'Plant not found | Kiaan Nursery',
    description: product?.description,
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) notFound();

  const related = getProducts({ categoryId: product.categoryId })
    .filter(p => p.id !== product.id)
    .slice(0, 2);

  return <ProductDetails key={id} product={product} relatedProducts={related} />;
}
