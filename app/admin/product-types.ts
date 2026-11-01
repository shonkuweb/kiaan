export type InventoryProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  images: string[];
  description: string;
  categoryId: string;
  isFeatured: boolean;
  color?: string;
  rating?: number;
  reviews?: number;
};

export type ProductCategory = {
  id: string;
  name: string;
  isVisible: boolean;
  image?: string;
};
