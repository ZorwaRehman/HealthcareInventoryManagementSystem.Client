
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Item } from '../../models/item.models';
import { Stock, StockBatch } from '../../models/stock.models';
import { Supplier } from '../../models/supplier.models';
import { PurchaseOrder } from '../../models/purchase-order.models';
import {
  GoodsReceived,
  GoodsReceivedStatus
} from '../../models/goods-received.models';

import { ItemService } from '../../services/item.service';
import { StockService } from '../../services/stock.service';
import { SupplierService } from '../../services/supplier.service';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { GoodsReceivedService } from '../../services/goods-received.service';

interface CategoryStock {
  name: string;
  quantity: number;
  color: string;
  percentage: number;
}

interface PurchaseOrderStatusSummary {
  name: string;
  count: number;
}

interface DashboardAlert {
  title: string;
  detail: string;
  type: 'low-stock' | 'expiry';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  // Services
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly itemService = inject(ItemService);
  private readonly stockService = inject(StockService);
  private readonly supplierService = inject(SupplierService);
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly goodsReceivedService = inject(GoodsReceivedService);

  // Dashboard data
  items: Item[] = [];
  stockItems: Stock[] = [];
  stockBatches: StockBatch[] = [];
  suppliers: Supplier[] = [];
  purchaseOrders: PurchaseOrder[] = [];
  goodsReceivedRecords: GoodsReceived[] = [];

  loading = true;
  loadErrors: string[] = [];

  // Colors used by the category doughnut chart.
  private readonly chartColors = [
    '#087f72',
    '#4d8bd8',
    '#e4a443',
    '#8c70c5',
    '#38a6a0',
    '#d47783',
    '#78949b',
    '#a2a85a',
    '#d18b50',
    '#6478a5'
  ];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  // Load dashboard information from existing APIs.
  loadDashboardData(): void {
    this.loading = true;
    this.loadErrors = [];

    // Immediately update the loading state.
    this.cdr.detectChanges();

    forkJoin({
      items: this.itemService.getItems(true).pipe(
        catchError(() => {
          this.loadErrors.push('Inventory items could not be loaded.');
          return of([] as Item[]);
        })
      ),

      stock: this.stockService.getAllStock(true).pipe(
        catchError(() => {
          this.loadErrors.push('Stock information could not be loaded.');
          return of([] as Stock[]);
        })
      ),

      batches: this.stockService.getAllBatches(true).pipe(
        catchError(() => {
          this.loadErrors.push('Stock batches could not be loaded.');
          return of([] as StockBatch[]);
        })
      ),

      suppliers: this.supplierService.getSuppliers(true).pipe(
        catchError(() => {
          this.loadErrors.push('Supplier information could not be loaded.');
          return of([] as Supplier[]);
        })
      ),

      purchaseOrders: this.purchaseOrderService.getAllPurchaseOrders().pipe(
        catchError(() => {
          this.loadErrors.push('Purchase orders could not be loaded.');
          return of([] as PurchaseOrder[]);
        })
      ),

      goodsReceived: this.goodsReceivedService.getAllGoodsReceived().pipe(
        catchError(() => {
          this.loadErrors.push('Goods Received records could not be loaded.');
          return of([] as GoodsReceived[]);
        })
      )
    }).subscribe({
      next: (data) => {
        this.items = data.items;
        this.stockItems = data.stock;
        this.stockBatches = data.batches;
        this.suppliers = data.suppliers;
        this.purchaseOrders = data.purchaseOrders;
        this.goodsReceivedRecords = data.goodsReceived;

        this.loading = false;

        // Refresh dashboard cards, charts and alerts.
        this.cdr.detectChanges();
      },

      error: () => {
        this.loadErrors.push(
          'The Dashboard could not load its information.'
        );

        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Count all inventory items.
  get totalItems(): number {
    return this.items.length;
  }

  // Count items at or below their reorder level.
  get lowStockItems(): number {
    return this.stockItems.filter(
      item => item.totalQuantity <= item.reorderLevel
    ).length;
  }

  // Count active suppliers.
  get activeSuppliers(): number {
    return this.suppliers.filter(
      supplier => supplier.isActive
    ).length;
  }

  // Count pending purchase orders.
  get pendingOrders(): number {
    const pendingStatuses = [
      'draft',
      'submitted',
      'approved',
      'ordered',
      'partiallyreceived'
    ];

    return this.purchaseOrders.filter(order =>
      pendingStatuses.includes(this.normalizeStatus(order.status))
    ).length;
  }

  // Calculate total stock units.
  get totalUnits(): number {
    return this.stockItems.reduce(
      (total, item) =>
        total + (Number(item.totalQuantity) || 0),
      0
    );
  }

  // Calculate inventory value using batch quantities and prices.
  get totalInventoryValue(): number {
    return this.stockBatches.reduce(
      (total, batch) =>
        total +
        (Number(batch.quantityInStock) || 0) *
        (Number(batch.unitPrice) || 0),
      0
    );
  }

  // Format inventory value in Pakistani rupees.
  get formattedInventoryValue(): string {
    return `Rs. ${this.totalInventoryValue.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  // Count batches expiring within the next 30 days.
  get expiringBatches(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);

    return this.stockBatches.filter(batch => {
      if (!batch.expiryDate) {
        return false;
      }

      const expiryDate = new Date(batch.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);

      return expiryDate >= today && expiryDate <= next30Days;
    }).length;
  }

  // Count all Goods Received records.
  get totalReceipts(): number {
    return this.goodsReceivedRecords.length;
  }

  // Count Draft receipts.
  get draftReceipts(): number {
    return this.goodsReceivedRecords.filter(
      receipt => receipt.status === GoodsReceivedStatus.Draft
    ).length;
  }

  // Count Confirmed receipts.
  get confirmedReceipts(): number {
    return this.goodsReceivedRecords.filter(
      receipt => receipt.status === GoodsReceivedStatus.Confirmed
    ).length;
  }

  // Group stock quantities by actual item category.
  get categoryBreakdown(): CategoryStock[] {
    const categoryTotals = new Map<string, number>();

    this.items.forEach(item => {
      const categoryName = item.category?.trim() || 'Uncategorized';

      const stockRecord = this.stockItems.find(
        stock => stock.itemId === item.id
      );

      const quantity = Number(stockRecord?.totalQuantity) || 0;

      categoryTotals.set(
        categoryName,
        (categoryTotals.get(categoryName) || 0) + quantity
      );
    });

    const totalCategoryUnits = Array.from(categoryTotals.values())
      .reduce((total, quantity) => total + quantity, 0);

    return Array.from(categoryTotals.entries())
      .map(([name, quantity], index) => ({
        name,
        quantity,
        color: this.chartColors[index % this.chartColors.length],
        percentage: totalCategoryUnits > 0
          ? (quantity / totalCategoryUnits) * 100
          : 0
      }))
      .sort((a, b) => b.quantity - a.quantity);
  }

  // Generate the doughnut chart background.
  get categoryChartBackground(): string {
    const categories = this.categoryBreakdown.filter(
      category => category.quantity > 0
    );

    if (categories.length === 0) {
      return 'conic-gradient(#e8eeee 0% 100%)';
    }

    let currentPercentage = 0;

    const gradientParts = categories.map(category => {
      const start = currentPercentage;
      currentPercentage += category.percentage;

      return `${category.color} ${start}% ${currentPercentage}%`;
    });

    return `conic-gradient(${gradientParts.join(', ')})`;
  }

  // Purchase Order status chart data.
  get purchaseOrderStatusBreakdown(): PurchaseOrderStatusSummary[] {
    const statuses = [
      { name: 'Draft', key: 'draft' },
      { name: 'Submitted', key: 'submitted' },
      { name: 'Approved', key: 'approved' },
      { name: 'Ordered', key: 'ordered' },
      { name: 'Partially Received', key: 'partiallyreceived' },
      { name: 'Received', key: 'received' },
      { name: 'Cancelled', key: 'cancelled' }
    ];

    return statuses.map(status => ({
      name: status.name,
      count: this.purchaseOrders.filter(
        order => this.normalizeStatus(order.status) === status.key
      ).length
    }));
  }

  // Get the highest Purchase Order status count.
  get maximumStatusCount(): number {
    return Math.max(
      1,
      ...this.purchaseOrderStatusBreakdown.map(status => status.count)
    );
  }

  // Calculate bar width for the Purchase Order chart.
  getStatusBarWidth(count: number): number {
    return (count / this.maximumStatusCount) * 100;
  }

  // Generate genuine inventory alerts.
  get dashboardAlerts(): DashboardAlert[] {
    const alerts: DashboardAlert[] = [];

    // Low-stock alerts.
    this.stockItems
      .filter(item => item.totalQuantity <= item.reorderLevel)
      .forEach(item => {
        alerts.push({
          title: `Low stock: ${item.itemName}`,
          detail: `Current quantity: ${item.totalQuantity} | Reorder level: ${item.reorderLevel}`,
          type: 'low-stock'
        });
      });

    // Expiring batch alerts.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);

    this.stockBatches
      .filter(batch => {
        if (!batch.expiryDate) {
          return false;
        }

        const expiryDate = new Date(batch.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);

        return expiryDate >= today && expiryDate <= next30Days;
      })
      .forEach(batch => {
        const itemName = this.items.find(
          item => item.id === batch.itemId
        )?.name || `Item #${batch.itemId}`;

        alerts.push({
          title: `Expiring batch: ${itemName}`,
          detail: `${batch.batchNumber} | Expires: ${new Date(batch.expiryDate!).toLocaleDateString()}`,
          type: 'expiry'
        });
      });

    return alerts;
  }

  // Normalize status strings for reliable comparisons.
  private normalizeStatus(status: string | number): string {
    return String(status)
      .toLowerCase()
      .replace(/[\s_-]/g, '');
  }

  // Navigate to login page.
  logout(): void {
    // Demo only. Authentication is not connected yet.
    window.location.href = '/login';
  }
}
