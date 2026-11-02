export type HeroBanner = {
  title: string;
  subtitle: string;
  imageUrl: string;
  images?: string[];
};
export const defaultHero: HeroBanner = {
  title: 'Beautiful Adenium Plants for Your Garden',
  subtitle: 'Rare varieties, healthy plants and complete care support.',
  imageUrl: '/images/hero-flower.webp',
  images: ['/images/hero-flower.webp'],
};
