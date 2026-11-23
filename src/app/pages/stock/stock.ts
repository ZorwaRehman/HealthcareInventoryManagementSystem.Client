
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { StockService } from '../../services/stock.service';
import { CurrencyService } from '../../services/currency.service';

import {
  Stock as StockModel,
  StockBatch
} from '../../models/stock.models';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './stock.html',
  styleUrl: './stock.css'
})
export class Stock implements OnInit {

  private readonly stockService = inject(StockService);
  private readonly currencyService = inject(CurrencyService);
  private readonly router = inject(Router);

  // Helps Angular refresh the page after API responses.
  private readonly cdr = inject(ChangeDetectorRef);

  // Stores stock summaries.
  stockItems: StockModel[] = [];

  // Stores all stock batches.
  stockBatches: StockBatch[] = [];

  // Search and filter values.
  searchText = '';
  selectedItem = 'All';

  // Displays loading status and messages.
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' | 'loading' = 'success';

  // Stores the ID of the currently open action dropdown.
  openActionMenuId: number | null = null;

  // Stores the batch selected for editing.
  selectedBatch: StockBatch | null = null;

  // Stores the edited batch number.
  editedBatchNumber = '';

  // Tracks the batch number update request.
  isUpdatingBatchNumber = false;

  // Format stock prices using the currency selected on the Dashboard.
  // The original amount remains in PKR in the database.
  formatPrice(amount: number): string {
    return this.currencyService.formatPrice(amount);
  }

  // Load stock data when the page opens.
  ngOnInit(): void {
    this.loadStockData();
  }

  // Retrieve stock summaries and all stock batches.
  loadStockData(): void {
    this.isLoading = true;
    this.message = '';

    this.cdr.markForCheck();

    this.stockService.getAllStock(true).subscribe({
      next: (stock) => {
        this.stockItems = stock;

        this.stockService.getAllBatches(true).subscribe({
          next: (batches) => {
            this.stockBatches = batches;
            this.isLoading = false;

            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Error loading stock batches:', error);

            this.message = 'Unable to load stock batches. Please try again.';
            this.messageType = 'error';
            this.isLoading = false;

            this.cdr.markForCheck();
          }
        });
      },
      error: (error) => {
        console.error('Error loading stock summary:', error);

        this.message = 'Unable to load stock information. Please try again.';
        this.messageType = 'error';
        this.isLoading = false;

        this.cdr.markForCheck();
      }
    });
  }

  // Return unique item names for the item filter.
  get itemNames(): string[] {
    return [...new Set(this.stockItems.map(item => item.itemName))].sort();
  }

  // Search batches by batch number, item name, or supplier name.
  // Also filter batches by the selected inventory item.
  get filteredBatches(): StockBatch[] {
    const search = this.searchText.trim().toLowerCase();

    return this.stockBatches.filter(batch => {
      const item = this.stockItems.find(
        stockItem => stockItem.itemId === batch.itemId
      );

      const itemName = item?.itemName ?? '';
      const supplierName = batch.supplierName ?? '';

      const matchesSearch =
        batch.batchNumber.toLowerCase().includes(search) ||
        itemName.toLowerCase().includes(search) ||
        supplierName.toLowerCase().includes(search);

      const matchesItem =
        this.selectedItem === 'All' ||
        itemName === this.selectedItem;

      return matchesSearch && matchesItem;
    });
  }

  // Calculate the total number of batches.
  get totalBatches(): number {
    return this.stockBatches.length;
  }

  // Calculate the total available quantity.
  get totalAvailableStock(): number {
    return this.stockItems.reduce(
      (total, item) => total + item.totalQuantity,
      0
    );
  }

  // Count items that have reached or fallen below their reorder level.
  get lowStockItems(): number {
    return this.stockItems.filter(
      item => item.totalQuantity <= item.reorderLevel
    ).length;
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

  // Navigate to the Create Stock Batch page.
  openCreateBatchForm(): void {
    this.router.navigate(['/stock/batches/new']);
  }

  // Open the action dropdown for a specific batch.
  openActionMenu(stockBatchId: number): void {
    this.openActionMenuId = stockBatchId;
  }

  // Close the currently open action dropdown.
  closeActionMenu(): void {
    this.openActionMenuId = null;
  }

  // Open the Edit Batch Number modal.
  openEditBatchNumber(batch: StockBatch): void {
    this.selectedBatch = batch;
    this.editedBatchNumber = batch.batchNumber;
    this.openActionMenuId = null;
    this.message = '';

    this.cdr.markForCheck();
  }

  // Close the Edit Batch Number modal.
  closeEditBatchNumberModal(): void {
    if (this.isUpdatingBatchNumber) {
      return;
    }

    this.selectedBatch = null;
    this.editedBatchNumber = '';
  }

  // Save the updated batch number through the backend API.
  saveBatchNumber(): void {
    if (!this.selectedBatch || this.isUpdatingBatchNumber) {
      return;
    }

    const batchNumber = this.editedBatchNumber.trim();

    // Validate the batch number before sending the request.
    if (!batchNumber) {
      this.message = 'Batch number is required.';
      this.messageType = 'error';
      return;
    }

    if (batchNumber.length > 100) {
      this.message = 'Batch number cannot exceed 100 characters.';
      this.messageType = 'error';
      return;
    }

    const stockBatchId = this.selectedBatch.stockBatchId;

    this.isUpdatingBatchNumber = true;
    this.message = '';

    this.stockService.updateStockBatchNumber(
      stockBatchId,
      batchNumber
    ).subscribe({
      next: (response) => {
        // Update the batch number displayed in the current table.
        const batch = this.stockBatches.find(
          item => item.stockBatchId === stockBatchId
        );

        if (batch) {
          batch.batchNumber = batchNumber;
        }

        this.selectedBatch = null;
        this.editedBatchNumber = '';
        this.isUpdatingBatchNumber = false;

        this.message = response.message ||
          'Stock batch number updated successfully.';
        this.messageType = 'success';

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error updating stock batch number:', error);

        this.message =
          error.error?.message ||
          'Unable to update batch number. Please try again.';

        this.messageType = 'error';
        this.isUpdatingBatchNumber = false;

        this.cdr.markForCheck();
      }
    });
  }

  // Clear the search and item filter.
  clearFilters(): void {
    this.searchText = '';
    this.selectedItem = 'All';
  }
}
