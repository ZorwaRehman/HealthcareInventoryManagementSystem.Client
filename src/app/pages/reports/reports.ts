
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
import { forkJoin, Observable } from 'rxjs';

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

import { PaginationResponse } from '../../models/pagination.models';

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

  // Complete data is retained for accurate summary totals.
  reportData: ReportRow[] = [];

  // Only the current server page is displayed in the table.
  filteredData: ReportRow[] = [];

  searchText = '';
  selectedStatus = 'All';

  // Pagination state.
  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  isLoading = false;
  isExporting = false;

  errorMessage = '';
  successMessage = '';

  // Currency is selected on the Dashboard.
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
    this.pageNumber = 1;

    this.expandedRows.clear();

    this.errorMessage = '';
    this.successMessage = '';

    this.loadReport(reportId);
  }

  // ==========================================
  // LOAD REPORT AND CURRENT PAGE
  // ==========================================

  loadReport(reportId: ReportType): void {

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.expandedRows.clear();

    const search = this.searchText.trim();
    const status = this.selectedStatus;

    switch (reportId) {

      case 'stock-summary':
        this.loadReportData(
          this.reportService.getStockSummary(),
          this.reportService.getPagedStockSummary(
            this.pageNumber, this.pageSize, search, status
          )
        );
        break;

      case 'low-stock':
        this.loadReportData(
          this.reportService.getLowStockReport(),
          this.reportService.getPagedLowStockReport(
            this.pageNumber, this.pageSize, search, status
          )
        );
        break;

      case 'expiry':
        this.loadReportData(
          this.reportService.getExpiryReport(),
          this.reportService.getPagedExpiryReport(
            this.pageNumber, this.pageSize, search, status
          )
        );
        break;

      case 'stock-transactions':
        this.loadReportData(
          this.reportService.getStockTransactionsReport(),
          this.reportService.getPagedStockTransactionsReport(
            this.pageNumber, this.pageSize, search, status
          )
        );
        break;

      case 'purchase-orders':
        this.loadReportData(
          this.reportService.getPurchaseOrdersReport(),
          this.reportService.getPagedPurchaseOrdersReport(
            this.pageNumber, this.pageSize, search, status
          )
        );
        break;

      case 'goods-received':
        this.loadReportData(
          this.reportService.getGoodsReceivedReport(),
          this.reportService.getPagedGoodsReceivedReport(
            this.pageNumber, this.pageSize, search, status
          )
        );
        break;

      case 'suppliers':
        this.loadReportData(
          this.reportService.getSupplierReport(),
          this.reportService.getPagedSupplierReport(
            this.pageNumber, this.pageSize, search, status
          )
        );
        break;

      case 'inventory-valuation':
        this.loadReportData(
          this.reportService.getInventoryValuationReport(),
          this.reportService.getPagedInventoryValuationReport(
            this.pageNumber, this.pageSize, search, status
          )
        );
        break;
    }
  }

  private loadReportData<T extends object>(
    completeRequest: Observable<T[]>,
    pagedRequest: Observable<PaginationResponse<T>>
  ): void {

    forkJoin({
      complete: completeRequest,
      paged: pagedRequest
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({

        next: result => {

          // Full report data is used for summary calculations and statuses.
          this.reportData = result.complete as ReportRow[];

          // Only the selected page is displayed in the table.
          this.filteredData = result.paged.items as ReportRow[];

          this.totalCount = result.paged.totalCount;
          this.totalPages = result.paged.totalPages;

          // Keep the current page valid if the filtered result count changes.
          if (
            this.totalPages > 0 &&
            this.pageNumber > this.totalPages
          ) {
            this.pageNumber = this.totalPages;
            this.loadReport(this.selectedReport);
            return;
          }

          this.isLoading = false;
          this.cdr.detectChanges();
        },

        error: () => {
          this.reportData = [];
          this.filteredData = [];
          this.totalCount = 0;
          this.totalPages = 0;

          this.errorMessage =
            'Unable to load report data. Please try again.';

          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  // ==========================================
  // SEARCH AND STATUS FILTERS
  // ==========================================

  applyFilters(): void {
    this.pageNumber = 1;
    this.expandedRows.clear();
    this.loadReport(this.selectedReport);
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'All';
    this.pageNumber = 1;
    this.expandedRows.clear();

    this.loadReport(this.selectedReport);
  }

  get availableStatuses(): string[] {

    if (this.selectedReport === 'suppliers') {
      return ['All', 'Active', 'Inactive'];
    }

    const statuses = this.reportData
      .map(row => String(row['status'] ?? '').trim())
      .filter(status => status.length > 0);

    return ['All', ...new Set(statuses)];
  }

  // ==========================================
  // PAGINATION
  // ==========================================

  changePage(page: number): void {

    if (
      page < 1 ||
      page > this.totalPages ||
      page === this.pageNumber ||
      this.isLoading
    ) {
      return;
    }

    this.pageNumber = page;
    this.expandedRows.clear();

    this.loadReport(this.selectedReport);
  }

  changePageSize(size: number): void {

    const newSize = Number(size);

    if (![5, 10, 20, 50].includes(newSize)) {
      return;
    }

    this.pageSize = newSize;
    this.pageNumber = 1;
    this.expandedRows.clear();

    this.loadReport(this.selectedReport);
  }

  get totalRecords(): number {
    return this.reportData.length;
  }

  get filteredRecords(): number {
    return this.totalCount;
  }

  get showingFrom(): number {
    if (this.totalCount === 0) {
      return 0;
    }

    return (this.pageNumber - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    if (this.totalCount === 0) {
      return 0;
    }

    return Math.min(
      (this.pageNumber - 1) * this.pageSize + this.filteredData.length,
      this.totalCount
    );
  }

  // ==========================================
  // SUMMARY TOTALS
  // ==========================================

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

  // ==========================================
  // TABLE FORMATTING
  // ==========================================

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

  // ==========================================
  // EXPANDED TABLE ROWS
  // ==========================================

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

  // ==========================================
  // STATUS STYLING
  // ==========================================

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

  // ==========================================
  // CURRENCY
  // ==========================================

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

  // ==========================================
  // EXPORTS
  // ==========================================

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

    let request: Observable<Blob> | undefined;

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
