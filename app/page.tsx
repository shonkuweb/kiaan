import { getProducts, getCategories } from './lib/server/db';
import { HomeClient } from './home-client';
import { readHero } from './lib/server/r2';
import { defaultHero, type HeroBanner } from './lib/hero';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const products = getProducts();
  const categories = getCategories({ visibleOnly: true });

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
