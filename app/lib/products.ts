export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  images: string[];
  description: string;
  categoryId: string;
  isFeatured: boolean;
  color: string;
  rating: number;
  reviews: number;
  potSize?: string;
  plantHeight?: string;
  details?: string;
  shippingInfo?: string;
  returnsInfo?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Category = {
  id: string;
  name: string;
  isVisible: boolean;
  image?: string;
  createdAt?: string;
};

export const money = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

export function getProductImageUrl(p?: { image?: string; images?: string[] } | null): string {
  if (!p) return '/images/hybrid-red.webp';
  if (p.images && Array.isArray(p.images) && p.images.length > 0 && p.images[0]) {
    const first = p.images[0];
    if (first.startsWith('http://') || first.startsWith('https://') || first.startsWith('/')) {
      return first;
    }
    return `/images/${first}.webp`;
  }
  if (p.image) {
    if (p.image.startsWith('http://') || p.image.startsWith('https://') || p.image.startsWith('/')) {
      return p.image;
    }
    return `/images/${p.image}.webp`;
  }
  return '/images/hybrid-red.webp';
}
