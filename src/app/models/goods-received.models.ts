
 // Goods Received status values defined by the backend.
export enum GoodsReceivedStatus {
  Draft = 1,
  Confirmed = 2,
  Cancelled = 3
}

// Represents one item in a Goods Received record.
export interface GoodsReceivedItem {
  goodsReceivedItemId: number;
  purchaseOrderItemId: number;
  itemId: number;
  itemName: string;
  sku: string;
  batchNumber: string;
  deliveredQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  quarantinedQuantity: number;
  manufactureDate: string | null;
  expiryDate: string | null;
  storageLocation: string | null;
  stockBatchId: number | null;
}

// Represents a Goods Received record returned by the backend.
export interface GoodsReceived {
  goodsReceivedId: number;
  receiptNumber: string;
  purchaseOrderId: number;
  purchaseOrderNumber: string;
  supplierName: string;
  receivedDate: string;
  deliveryNoteNumber: string | null;
  notes: string | null;
  status: GoodsReceivedStatus;
  createdAt: string;
  confirmedAt: string | null;
  items: GoodsReceivedItem[];
}

// Data required to create a Goods Received record.
export interface CreateGoodsReceivedRequest {
  purchaseOrderId: number;
  receivedDate: string;
  deliveryNoteNumber: string | null;
  notes: string | null;
  items: CreateGoodsReceivedItemRequest[];
}

// Data required for one received item.
export interface CreateGoodsReceivedItemRequest {
  purchaseOrderItemId: number;
  batchNumber: string;
  deliveredQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  quarantinedQuantity: number;
  manufactureDate: string | null;
  expiryDate: string | null;
  storageLocation: string | null;
}
