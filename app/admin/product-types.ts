export type InventoryProduct = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  stock: number;
  image: string;
  images: string[];
  description: string;
  categoryId: string;
  isFeatured: boolean;
  color?: string;
  rating?: number;
  reviews?: number;
  potSize?: string;
  plantHeight?: string;
  details?: string;
  shippingInfo?: string;
  returnsInfo?: string;
};

export type ProductCategory = {
  id: string;
  name: string;
  isVisible: boolean;
  image?: string;
};
