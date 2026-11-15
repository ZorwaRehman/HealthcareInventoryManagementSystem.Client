// Purchase Order status values defined by the backend.
export enum PurchaseOrderStatus {
  Draft = 1,
  Submitted = 2,
  Approved = 3,
  Ordered = 4,
  PartiallyReceived = 5,
  Received = 6,
  Cancelled = 7
}

 // Represents one item included in a Purchase Order.
export interface PurchaseOrderItem {
  purchaseOrderItemId: number;
  itemId: number;
  itemName: string;
  sku: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  lineTotal: number;
  remainingQuantity: number;
}

// Data required for one Purchase Order item.
export interface PurchaseOrderItemRequest {
  itemId: number;
  orderedQuantity: number;
  unitPrice: number;
}

// Represents a Purchase Order returned by the backend.
export interface PurchaseOrder {
  purchaseOrderId: number;
  orderNumber: string;
  supplierId: number;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string | null;
  status: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
  approvedAt: string | null;
  items: PurchaseOrderItem[];
}

// Data required to create or update a Purchase Order.
export interface PurchaseOrderRequest {
  supplierId: number;
  orderDate: string;
  expectedDeliveryDate: string | null;
  taxRate: number;
  notes: string | null;
  items: PurchaseOrderItemRequest[];
}
