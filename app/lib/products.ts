export type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  deliveryCharge?: number | null;
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

export const money = (amount?: number | null | string): string => {
  if (amount === undefined || amount === null || amount === '') return '₹0';
  const num = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
};

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

export function hasCustomDelivery(p?: { deliveryCharge?: number | null } | null): boolean {
  return (
    p?.deliveryCharge !== undefined &&
    p?.deliveryCharge !== null &&
    p?.deliveryCharge !== ('' as unknown) &&
    !isNaN(Number(p.deliveryCharge))
  );
}

export type DeliveryItemInput = {
  id: string;
  price: number;
  quantity?: number;
  deliveryCharge?: number | null;
  name?: string;
};

export type DeliveryStoreSettings = {
  deliveryCharge?: number;
  freeDeliveryThreshold?: number;
};

export type DeliveryCalculationResult = {
  subtotal: number;
  itemCount: number;
  customDeliveryFee: number;
  globalDeliveryFee: number;
  shippingFee: number;
  totalAmount: number;
  hasCustomDeliveryItems: boolean;
  hasGlobalDeliveryItems: boolean;
  isGlobalFreeDelivery: boolean;
  freeShippingThreshold: number;
  standardDeliveryCharge: number;
  amountNeededForFreeDelivery: number;
};

export function calculateDeliveryFee(
  items: DeliveryItemInput[],
  settings?: DeliveryStoreSettings | null
): DeliveryCalculationResult {
  const activeItems = items.filter(it => (it.quantity ?? 1) > 0);
  const itemCount = activeItems.reduce((sum, it) => sum + (it.quantity ?? 1), 0);
  const subtotal = activeItems.reduce((sum, it) => sum + Number(it.price) * (it.quantity ?? 1), 0);

  const freeShippingThreshold = settings?.freeDeliveryThreshold ?? 999;
  const standardDelivery = settings?.deliveryCharge ?? 69;

  if (activeItems.length === 0 || subtotal <= 0) {
    return {
      subtotal: 0,
      itemCount: 0,
      customDeliveryFee: 0,
      globalDeliveryFee: 0,
      shippingFee: 0,
      totalAmount: 0,
      hasCustomDeliveryItems: false,
      hasGlobalDeliveryItems: false,
      isGlobalFreeDelivery: false,
      freeShippingThreshold,
      standardDeliveryCharge: standardDelivery,
      amountNeededForFreeDelivery: 0,
    };
  }

  const customItems: DeliveryItemInput[] = [];
  const globalItems: DeliveryItemInput[] = [];

  for (const it of activeItems) {
    if (hasCustomDelivery(it)) {
      customItems.push(it);
    } else {
      globalItems.push(it);
    }
  }

  // Each product configured with a separate delivery charge adds its defined delivery charge
  const customDeliveryFee = customItems.reduce(
    (sum, it) => sum + Math.max(0, Number(it.deliveryCharge) || 0),
    0
  );

  let globalDeliveryFee = 0;
  let isGlobalFreeDelivery = false;
  let amountNeededForFreeDelivery = 0;

  if (globalItems.length > 0) {
    const globalSubtotal = globalItems.reduce(
      (sum, it) => sum + Number(it.price) * (it.quantity ?? 1),
      0
    );

    if (freeShippingThreshold > 0 && globalSubtotal >= freeShippingThreshold) {
      isGlobalFreeDelivery = true;
      globalDeliveryFee = 0;
    } else {
      isGlobalFreeDelivery = false;
      globalDeliveryFee = standardDelivery;
      if (freeShippingThreshold > 0) {
        amountNeededForFreeDelivery = Math.max(0, freeShippingThreshold - globalSubtotal);
      }
    }
  }

  const shippingFee = customDeliveryFee + globalDeliveryFee;
  const totalAmount = subtotal + shippingFee;

  return {
    subtotal,
    itemCount,
    customDeliveryFee,
    globalDeliveryFee,
    shippingFee,
    totalAmount,
    hasCustomDeliveryItems: customItems.length > 0,
    hasGlobalDeliveryItems: globalItems.length > 0,
    isGlobalFreeDelivery,
    freeShippingThreshold,
    standardDeliveryCharge: standardDelivery,
    amountNeededForFreeDelivery,
  };
}
