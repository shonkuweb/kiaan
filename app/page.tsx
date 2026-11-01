import { getProducts, getCategories } from './lib/server/db';
import { HomeClient } from './home-client';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const products = getProducts();
  const categories = getCategories({ visibleOnly: true });

  return <HomeClient initialProducts={products} initialCategories={categories} />;
}
