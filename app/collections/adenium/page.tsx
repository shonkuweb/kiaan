import type { Metadata } from 'next';
import { getProducts, type Product } from '../../lib/server/db';
import { CollectionPage } from '../../components/shop-pages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Adenium Collection | Kiaan Nursery',
  description: 'Explore beautiful Adenium varieties from Kiaan Agro Care & Nursery.',
};

export default async function Page() {
  let products: Product[] = [];
  try {
    products = getProducts({ categoryId: 'adenium' });
  } catch (err) {
    console.error('Failed to load adenium collection products:', err);
  }
  return <CollectionPage initialProducts={products} />;
}
