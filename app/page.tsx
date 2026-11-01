import { getProducts, getCategories, type Product, type Category } from './lib/server/db';
import { HomeClient } from './home-client';
import { readHero } from './lib/server/r2';
import { defaultHero, type HeroBanner } from './lib/hero';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function Home() {
  let products: Product[] = [];
  let categories: Category[] = [];

  try {
    products = getProducts();
  } catch (err) {
    console.error('Failed to load initial products for homepage:', err);
  }

  try {
    categories = getCategories({ visibleOnly: true });
  } catch (err) {
    console.error('Failed to load initial categories for homepage:', err);
  }

  let initialHero: HeroBanner = defaultHero;
  try {
    initialHero = await readHero();
  } catch {
    // Fall back to default hero
  }

  return (
    <HomeClient
      initialProducts={products}
      initialCategories={categories}
      initialHero={initialHero}
    />
  );
}
