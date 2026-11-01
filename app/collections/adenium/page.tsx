import type { Metadata } from 'next';
import { getProducts } from '../../lib/server/db';
import { CollectionPage } from '../../components/shop-pages';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Adenium Collection | Kiaan Nursery',
  description: 'Explore beautiful Adenium varieties from Kiaan Agro Care & Nursery.',
};

export default async function Page() {
  const products = getProducts({ categoryId: 'adenium' });
  return <CollectionPage initialProducts={products} />;
}
