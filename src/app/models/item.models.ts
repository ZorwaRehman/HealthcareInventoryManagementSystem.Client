
export interface Item {
  id: number;
  name: string;
  description: string | null;
  category: string;
  sku: string;
  unit: string;
  reorderLevel: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface ItemRequest {
  name: string;
  description: string | null;
  category: string;
  sku: string;
  unit: string;
  reorderLevel: number;
  imageUrl: string | null;
}
