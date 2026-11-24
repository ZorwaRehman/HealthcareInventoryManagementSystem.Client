
// Stock Summary Report
export interface StockReport {
  itemId: number;
  itemName: string;
  sku: string;
  category: string;
  unit: string;
  totalQuantity: number;
  reorderLevel: number;
  stockValue: number;
  status: string;
}

// Low Stock Report
export interface LowStockReport {
  itemId: number;
  itemName: string;
  sku: string;
  category: string;
  unit: string;
  currentQuantity: number;
  reorderLevel: number;
  requiredQuantity: number;
  status: string;
}

// Expiry Report
export interface ExpiryReport {
  stockBatchId: number;
  itemId: number;
  itemName: string;
  sku: string;
  batchNumber: string;
  expiryDate: string;
  currentQuantity: number;
  daysRemaining: number;
  status: string;
}

// Stock Transactions Report
export interface StockTransactionReport {
  stockTransactionId: number;
  stockBatchId: number;
  itemId: number;
  itemName: string;
  sku: string;
  batchNumber: string;
  transactionType: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string | null;
  transactionDate: string;
}

// Purchase Orders Report
export interface PurchaseReport {
  purchaseOrderId: number;
  orderNumber: string;
  supplierId: number;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string | null;
  status: string;
  itemCount: number;
  totalOrderedQuantity: number;
  totalReceivedQuantity: number;
  totalRemainingQuantity: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
}

// Goods Received Report
export interface GoodsReceivedReport {
  goodsReceivedId: number;
  receiptNumber: string;
  purchaseOrderId: number;
  orderNumber: string;
  supplierName: string;
  receivedDate: string;
  deliveryNoteNumber: string | null;
  status: string;
  itemCount: number;
  totalDeliveredQuantity: number;
  totalAcceptedQuantity: number;
  totalRejectedQuantity: number;
  totalQuarantinedQuantity: number;
  notes: string | null;
}

// Supplier Report
export interface SupplierReport {
  supplierId: number;
  supplierName: string;
  contactPerson: string | null;
  phone: string;
  email: string;
  city: string | null;
  country: string | null;
  totalStockBatches: number;
  totalQuantityInStock: number;
  totalStockValue: number;
  isActive: boolean;
}

// Inventory Valuation Report
export interface InventoryValuationReport {
  itemId: number;
  itemName: string;
  sku: string;
  category: string;
  unit: string;
  stockBatchId: number;
  batchNumber: string;
  expiryDate: string | null;
  quantityInStock: number;
  unitPrice: number;
  totalValue: number;
}
