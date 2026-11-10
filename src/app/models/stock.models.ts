// Represents stock information for one inventory item.
export interface Stock {
  itemId: number;
  itemName: string;
  totalQuantity: number;
  reorderLevel: number;
}

// Represents one stock batch returned by the backend.
export interface StockBatch {
  stockBatchId: number;
  itemId: number;
  supplierId: number | null;
  supplierName: string | null;
  batchNumber: string;
  quantityInStock: number;
  unitPrice: number;
  expiryDate: string | null;
}

// Defines the data required to create a stock batch.
export interface CreateStockBatch {
  itemId: number;
  supplierId: number;
  batchNumber: string;
  expiryDate: string | null;
  quantityInStock: number;
  unitPrice: number;
}

// Represents the data required to adjust stock.
export interface StockAdjustment {
  stockBatchId: number;
  transactionType: 'StockIn' | 'StockOut' | 'Adjustment';
  quantity: number;
  reason: string | null;
}

// Represents one recorded stock transaction.
export interface StockTransaction {
  stockTransactionId: number;
  stockBatchId: number;
  transactionType: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string | null;
  transactionDate: string;
}

// Represents an alert returned by the API.
export interface StockAlert {
  alertId: number;
  alertType: string;
  message: string;
  severity: string;
  itemId: number | null;
  itemName: string | null;
  stockBatchId: number | null;
  batchNumber: string | null;
  currentQuantity: number | null;
  reorderLevel: number | null;
  expiryDate: string | null;
  createdAt: string;
  isRead: boolean;
}