
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  DestroyRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ReportService } from '../../services/report.service';
import {
  CurrencyService,
  CurrencyCode
} from '../../services/currency.service';

import {
  StockReport,
  LowStockReport,
  ExpiryReport,
  StockTransactionReport,
  PurchaseReport,
  GoodsReceivedReport,
  SupplierReport,
  InventoryValuationReport
} from '../../models/report.models';

type ReportType =
  | 'stock-summary'
  | 'low-stock'
  | 'expiry'
  | 'stock-transactions'
  | 'purchase-orders'
  | 'goods-received'
  | 'suppliers'
  | 'inventory-valuation';

interface ReportColumn {
  key: string;
  label: string;
  money?: boolean;
  date?: boolean;
}

interface ReportRow {
  [key: string]: any;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit {

  private readonly reportService = inject(ReportService);
  private readonly currencyService = inject(CurrencyService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  selectedReport: ReportType = 'stock-summary';

  reportData: ReportRow[] = [];
  filteredData: ReportRow[] = [];

  searchText = '';
  selectedStatus = 'All';

  isLoading = false;
  isExporting = false;

  errorMessage = '';
  successMessage = '';

  // Currency is selected on the Dashboard.
  // Reports only reads the selected currency from CurrencyService.
  selectedCurrency: CurrencyCode =
    this.currencyService.selectedCurrency;

  // Stores expanded table rows.
  expandedRows = new Set<number>();

  readonly reports: {
    id: ReportType;
    name: string;
    description: string;
    icon: string;
    columns: ReportColumn[];
    mainKeys: string[];
  }[] = [

    {
      id: 'stock-summary',
      name: 'Stock Summary',
      description: 'Overview of current inventory quantities and stock value.',
      icon: 'bi-box-seam',
      mainKeys: [
        'itemName',
        'sku',
        'category',
        'totalQuantity',
        'reorderLevel',
        'stockValue',
        'status'
      ],
      columns: [
        { key: 'itemName', label: 'Item Name' },
        { key: 'sku', label: 'SKU' },
        { key: 'category', label: 'Category' },
        { key: 'unit', label: 'Unit' },
        { key: 'totalQuantity', label: 'Total Quantity' },
        { key: 'reorderLevel', label: 'Reorder Level' },
        { key: 'stockValue', label: 'Stock Value', money: true },
        { key: 'status', label: 'Status' }
      ]
    },

    {
      id: 'low-stock',
      name: 'Low Stock',
      description: 'Items that have reached or fallen below their reorder levels.',
      icon: 'bi-exclamation-triangle',
      mainKeys: [
        'itemName',
        'sku',
        'currentQuantity',
        'reorderLevel',
        'status'
      ],
      columns: [
        { key: 'itemName', label: 'Item Name' },
        { key: 'sku', label: 'SKU' },
        { key: 'category', label: 'Category' },
        { key: 'unit', label: 'Unit' },
        { key: 'currentQuantity', label: 'Current Quantity' },
        { key: 'reorderLevel', label: 'Reorder Level' },
        { key: 'requiredQuantity', label: 'Required Quantity' },
        { key: 'status', label: 'Status' }
      ]
    },

    {
      id: 'expiry',
      name: 'Expiry Report',
      description: 'Monitor batches approaching or passing their expiry dates.',
      icon: 'bi-calendar-x',
      mainKeys: [
        'itemName',
        'sku',
        'batchNumber',
        'expiryDate',
        'daysRemaining',
        'status'
      ],
      columns: [
        { key: 'itemName', label: 'Item Name' },
        { key: 'sku', label: 'SKU' },
        { key: 'batchNumber', label: 'Batch Number' },
        { key: 'expiryDate', label: 'Expiry Date', date: true },
        { key: 'currentQuantity', label: 'Current Quantity' },
        { key: 'daysRemaining', label: 'Days Remaining' },
        { key: 'status', label: 'Status' }
      ]
    },

    {
      id: 'stock-transactions',
      name: 'Stock Transactions',
      description: 'Review stock-in, stock-out and adjustment transactions.',
      icon: 'bi-arrow-left-right',
      mainKeys: [
        'itemName',
        'sku',
        'transactionType',
        'quantity',
        'transactionDate'
      ],
      columns: [
        { key: 'itemName', label: 'Item Name' },
        { key: 'sku', label: 'SKU' },
        { key: 'batchNumber', label: 'Batch Number' },
        { key: 'transactionType', label: 'Transaction Type' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'previousQuantity', label: 'Previous Quantity' },
        { key: 'newQuantity', label: 'New Quantity' },
        { key: 'reason', label: 'Reason' },
        { key: 'transactionDate', label: 'Transaction Date', date: true }
      ]
    },

    {
      id: 'purchase-orders',
      name: 'Purchase Orders',
      description: 'Review purchase orders, suppliers, quantities and order values.',
      icon: 'bi-cart-check',
      mainKeys: [
        'orderNumber',
        'supplierName',
        'orderDate',
        'status',
        'totalAmount'
      ],
      columns: [
        { key: 'orderNumber', label: 'Order Number' },
        { key: 'supplierName', label: 'Supplier' },
        { key: 'orderDate', label: 'Order Date', date: true },
        { key: 'expectedDeliveryDate', label: 'Expected Delivery', date: true },
        { key: 'status', label: 'Status' },
        { key: 'itemCount', label: 'Items' },
        { key: 'totalOrderedQuantity', label: 'Ordered Quantity' },
        { key: 'totalReceivedQuantity', label: 'Received Quantity' },
        { key: 'totalRemainingQuantity', label: 'Remaining Quantity' },
        { key: 'subtotal', label: 'Subtotal', money: true },
        { key: 'taxAmount', label: 'Tax Amount', money: true },
        { key: 'totalAmount', label: 'Total Amount', money: true }
      ]
    },

    {
      id: 'goods-received',
      name: 'Goods Received',
      description: 'Review deliveries, accepted quantities and rejected goods.',
      icon: 'bi-truck',
      mainKeys: [
        'receiptNumber',
        'orderNumber',
        'supplierName',
        'receivedDate',
        'status'
      ],
      columns: [
        { key: 'receiptNumber', label: 'Receipt Number' },
        { key: 'orderNumber', label: 'Purchase Order' },
        { key: 'supplierName', label: 'Supplier' },
        { key: 'receivedDate', label: 'Received Date', date: true },
        { key: 'deliveryNoteNumber', label: 'Delivery Note' },
        { key: 'status', label: 'Status' },
        { key: 'itemCount', label: 'Items' },
        { key: 'totalDeliveredQuantity', label: 'Delivered' },
        { key: 'totalAcceptedQuantity', label: 'Accepted' },
        { key: 'totalRejectedQuantity', label: 'Rejected' },
        { key: 'totalQuarantinedQuantity', label: 'Quarantined' }
      ]
    },

    {
      id: 'suppliers',
      name: 'Supplier Report',
      description: 'Review supplier details and their current stock contributions.',
      icon: 'bi-people',
      mainKeys: [
        'supplierName',
        'contactPerson',
        'phone',
        'totalStockBatches',
        'isActive'
      ],
      columns: [
        { key: 'supplierName', label: 'Supplier Name' },
        { key: 'contactPerson', label: 'Contact Person' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'city', label: 'City' },
        { key: 'country', label: 'Country' },
        { key: 'totalStockBatches', label: 'Stock Batches' },
        { key: 'totalQuantityInStock', label: 'Total Quantity' },
        { key: 'totalStockValue', label: 'Total Stock Value', money: true },
        { key: 'isActive', label: 'Status' }
      ]
    },

    {
      id: 'inventory-valuation',
      name: 'Inventory Valuation',
      description: 'View inventory value by item and individual stock batch.',
      icon: 'bi-currency-dollar',
      mainKeys: [
        'itemName',
        'sku',
        'batchNumber',
        'quantityInStock',
        'totalValue'
      ],
      columns: [
        { key: 'itemName', label: 'Item Name' },
        { key: 'sku', label: 'SKU' },
        { key: 'category', label: 'Category' },
        { key: 'unit', label: 'Unit' },
        { key: 'batchNumber', label: 'Batch Number' },
        { key: 'expiryDate', label: 'Expiry Date', date: true },
        { key: 'quantityInStock', label: 'Quantity' },
        { key: 'unitPrice', label: 'Unit Price', money: true },
        { key: 'totalValue', label: 'Total Value', money: true }
      ]
    }
  ];

  ngOnInit(): void {

    // Automatically receive currency changes made on the Dashboard.
    this.currencyService.selectedCurrency$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(currency => {
        this.selectedCurrency = currency;
        this.cdr.detectChanges();
      });

    this.loadReport(this.selectedReport);
  }

  get currentReport() {
    return this.reports.find(
      report => report.id === this.selectedReport
    ) ?? this.reports[0];
  }

  get mainColumns(): ReportColumn[] {
    return this.currentReport.columns.filter(
      column => this.currentReport.mainKeys.includes(column.key)
    );
  }

  get additionalColumns(): ReportColumn[] {
    return this.currentReport.columns.filter(
      column => !this.currentReport.mainKeys.includes(column.key)
    );
  }

  selectReport(reportId: ReportType): void {

    this.selectedReport = reportId;
    this.searchText = '';
    this.selectedStatus = 'All';

    this.expandedRows.clear();

    this.errorMessage = '';
    this.successMessage = '';

    this.loadReport(reportId);
  }

  loadReport(reportId: ReportType): void {

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.expandedRows.clear();

    const handleSuccess = (data: object[]) => {
      this.reportData = data as ReportRow[];
      this.applyFilters();
      this.isLoading = false;
      this.cdr.detectChanges();
    };

    const handleError = () => {
      this.reportData = [];
      this.filteredData = [];
      this.errorMessage =
        'Unable to load report data. Please try again.';
      this.isLoading = false;
      this.cdr.detectChanges();
    };

    switch (reportId) {

      case 'stock-summary':
        this.reportService.getStockSummary().subscribe({
          next: handleSuccess,
          error: handleError
        });
        break;

      case 'low-stock':
        this.reportService.getLowStockReport().subscribe({
          next: handleSuccess,
          error: handleError
        });
        break;

      case 'expiry':
        this.reportService.getExpiryReport().subscribe({
          next: handleSuccess,
          error: handleError
        });
        break;

      case 'stock-transactions':
        this.reportService.getStockTransactionsReport().subscribe({
          next: handleSuccess,
          error: handleError
        });
        break;

      case 'purchase-orders':
        this.reportService.getPurchaseOrdersReport().subscribe({
          next: handleSuccess,
          error: handleError
        });
        break;

      case 'goods-received':
        this.reportService.getGoodsReceivedReport().subscribe({
          next: handleSuccess,
          error: handleError
        });
        break;

      case 'suppliers':
        this.reportService.getSupplierReport().subscribe({
          next: handleSuccess,
          error: handleError
        });
        break;

      case 'inventory-valuation':
        this.reportService.getInventoryValuationReport().subscribe({
          next: handleSuccess,
          error: handleError
        });
        break;
    }
  }

  applyFilters(): void {

    let result = [...this.reportData];

    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase().trim();

      result = result.filter(row =>
        Object.values(row).some(value =>
          String(value ?? '').toLowerCase().includes(search)
        )
      );
    }

    if (this.selectedStatus !== 'All') {
      result = result.filter(row =>
        String(row['status'] ?? '').toLowerCase() ===
        this.selectedStatus.toLowerCase()
      );
    }

    this.filteredData = result;
    this.expandedRows.clear();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'All';
    this.applyFilters();
  }

  get availableStatuses(): string[] {
    const statuses = this.reportData
      .map(row => String(row['status'] ?? '').trim())
      .filter(status => status.length > 0);

    return ['All', ...new Set(statuses)];
  }

  get totalRecords(): number {
    return this.reportData.length;
  }

  get filteredRecords(): number {
    return this.filteredData.length;
  }

  get totalStockValue(): number {
    if (this.selectedReport !== 'stock-summary') {
      return 0;
    }

    return this.reportData.reduce(
      (total, row) => total + Number(row['stockValue'] ?? 0),
      0
    );
  }

  get totalPurchaseValue(): number {
    if (this.selectedReport !== 'purchase-orders') {
      return 0;
    }

    return this.reportData.reduce(
      (total, row) => total + Number(row['totalAmount'] ?? 0),
      0
    );
  }

  get totalInventoryValue(): number {
    if (this.selectedReport !== 'inventory-valuation') {
      return 0;
    }

    return this.reportData.reduce(
      (total, row) => total + Number(row['totalValue'] ?? 0),
      0
    );
  }

  formatCell(row: ReportRow, column: ReportColumn): string {

    const value = row[column.key];

    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (column.money) {
      return this.currencyService.formatPrice(Number(value));
    }

    if (column.date) {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return '—';
      }

      return date.toLocaleDateString();
    }

    if (column.key === 'isActive') {
      return value ? 'Active' : 'Inactive';
    }

    return String(value);
  }

  // Supports imageUrl when the Stock Summary API provides it.
  getItemImage(row: ReportRow): string | null {
    const image = row['imageUrl'];

    return typeof image === 'string' && image.trim()
      ? image.trim()
      : null;
  }

  toggleRow(index: number): void {

    const updated = new Set(this.expandedRows);

    if (updated.has(index)) {
      updated.delete(index);
    } else {
      updated.add(index);
    }

    this.expandedRows = updated;
  }

  isRowExpanded(index: number): boolean {
    return this.expandedRows.has(index);
  }

  getStatusClass(row: ReportRow, column: ReportColumn): string {

    const value = String(row[column.key] ?? '').toLowerCase();

    if (column.key === 'isActive') {
      return row[column.key] ? 'status-active' : 'status-danger';
    }

    if (
      value.includes('active') ||
      value.includes('received') ||
      value.includes('confirmed') ||
      value.includes('in stock') ||
      value.includes('completed')
    ) {
      return 'status-active';
    }

    if (
      value.includes('low') ||
      value.includes('partial') ||
      value.includes('pending') ||
      value.includes('draft') ||
      value.includes('warning')
    ) {
      return 'status-warning';
    }

    if (
      value.includes('expired') ||
      value.includes('out of stock') ||
      value.includes('cancelled') ||
      value.includes('inactive') ||
      value.includes('rejected')
    ) {
      return 'status-danger';
    }

    return 'status-neutral';
  }

  get currentExchangeRate(): number | null {
    if (this.selectedCurrency === 'PKR') {
      return 1;
    }

    return this.currencyService.getExchangeRate(
      this.selectedCurrency
    );
  }

  get isExchangeRateAvailable(): boolean {
    return this.currentExchangeRate !== null &&
      this.currentExchangeRate > 0;
  }

  formatAmount(amount: number): string {
    return this.currencyService.formatPrice(amount);
  }

  exportExcel(): void {
    this.exportReport('excel');
  }

  exportPdf(): void {
    this.exportReport('pdf');
  }

  private exportReport(format: 'excel' | 'pdf'): void {

    if (this.isExporting) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (
      this.selectedReport === 'stock-summary' &&
      this.selectedCurrency !== 'PKR'
    ) {
      this.errorMessage =
        'Stock Summary currency export support is being added to the backend. Please export in PKR for now.';
      return;
    }

    const currencyReports: ReportType[] = [
      'purchase-orders',
      'suppliers',
      'inventory-valuation'
    ];

    if (
      currencyReports.includes(this.selectedReport) &&
      !this.isExchangeRateAvailable
    ) {
      this.errorMessage =
        'The selected currency exchange rate is unavailable. Please try again after rates are loaded.';
      return;
    }

    this.isExporting = true;

    const rate = this.currentExchangeRate ?? 1;

    let request;

    switch (this.selectedReport) {

      case 'stock-summary':
        request = format === 'excel'
          ? this.reportService.exportStockSummaryExcel()
          : this.reportService.exportStockSummaryPdf();
        break;

      case 'low-stock':
        request = format === 'excel'
          ? this.reportService.exportLowStockExcel()
          : this.reportService.exportLowStockPdf();
        break;

      case 'expiry':
        request = format === 'excel'
          ? this.reportService.exportExpiryExcel()
          : this.reportService.exportExpiryPdf();
        break;

      case 'stock-transactions':
        request = format === 'excel'
          ? this.reportService.exportStockTransactionsExcel()
          : this.reportService.exportStockTransactionsPdf();
        break;

      case 'purchase-orders':
        request = format === 'excel'
          ? this.reportService.exportPurchaseOrdersExcel(
              this.selectedCurrency,
              rate
            )
          : this.reportService.exportPurchaseOrdersPdf(
              this.selectedCurrency,
              rate
            );
        break;

      case 'goods-received':
        request = format === 'excel'
          ? this.reportService.exportGoodsReceivedExcel()
          : this.reportService.exportGoodsReceivedPdf();
        break;

      case 'suppliers':
        request = format === 'excel'
          ? this.reportService.exportSupplierExcel(
              this.selectedCurrency,
              rate
            )
          : this.reportService.exportSupplierPdf(
              this.selectedCurrency,
              rate
            );
        break;

      case 'inventory-valuation':
        request = format === 'excel'
          ? this.reportService.exportInventoryValuationExcel(
              this.selectedCurrency,
              rate
            )
          : this.reportService.exportInventoryValuationPdf(
              this.selectedCurrency,
              rate
            );
        break;
    }

    if (!request) {
      this.isExporting = false;
      return;
    }

    request.subscribe({

      next: (blob: Blob) => {

        const fileUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = fileUrl;
        link.download =
          `${this.selectedReport}-${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

        link.click();
        window.URL.revokeObjectURL(fileUrl);

        this.isExporting = false;
        this.successMessage =
          `${this.currentReport.name} ${format.toUpperCase()} downloaded successfully.`;

        this.cdr.detectChanges();
      },

      error: () => {

        this.errorMessage =
          `Unable to export ${this.currentReport.name}. Please try again.`;

        this.isExporting = false;
        this.cdr.detectChanges();
      }
    });
  }
}
