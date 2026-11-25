
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { StockService } from '../../services/stock.service';
import { CurrencyService } from '../../services/currency.service';

import { Stock as StockModel, StockBatch } from '../../models/stock.models';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './stock.html',
  styleUrl: './stock.css',
})
export class Stock implements OnInit {
  private readonly stockService = inject(StockService);
  private readonly currencyService = inject(CurrencyService);
  private readonly router = inject(Router);

  // Helps Angular refresh the page after API responses.
  private readonly cdr = inject(ChangeDetectorRef);

  // Stores stock summaries.
  stockItems: StockModel[] = [];

  // Stores batches returned for the current page.
  stockBatches: StockBatch[] = [];

  // Server-side pagination.
  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  // Search and item filter values.
  searchText = '';
  selectedItemId: number | null = null;

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

  // Load stock summaries and then the first page of batches.
  loadStockData(): void {
    this.isLoading = true;

    this.stockService.getAllStock(true).subscribe({
      next: (stock) => {
        this.stockItems = stock;
        this.loadPagedBatches();
      },
      error: () => {
        this.isLoading = false;
        this.message = 'Failed to load stock data.';
        this.messageType = 'error';
        this.cdr.markForCheck();
      },
    });
  }

  // Load the current page of stock batches from the backend.
  // Search and item filtering are performed on the server.
  loadPagedBatches(): void {
    this.isLoading = true;

    this.stockService.getPagedBatches(
      this.pageNumber,
      this.pageSize,
      this.searchText,
      this.selectedItemId ?? undefined
    ).subscribe({
      next: (response) => {
        this.stockBatches = response.items;
        this.totalCount = response.totalCount;
        this.totalPages = response.totalPages;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.message = 'Failed to load stock batches.';
        this.messageType = 'error';
        this.cdr.markForCheck();
      },
    });
  }

  // Apply search and item filters from the first page.
  applyFilters(): void {
    this.pageNumber = 1;
    this.loadPagedBatches();
  }

  // Navigate between pages.
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.pageNumber = page;
    this.loadPagedBatches();
  }

  // Change the number of batches displayed per page.
  changePageSize(size: number): void {
    this.pageSize = size;
    this.pageNumber = 1;
    this.loadPagedBatches();
  }

  // Return unique item names for display where needed.
  get itemNames(): string[] {
    return [...new Set(this.stockItems.map((item) => item.itemName))].sort();
  }

  // Batches are already filtered and paginated by the backend.
  get filteredBatches(): StockBatch[] {
    return this.stockBatches;
  }

  // Calculate the total number of batches across all pages.
  get totalBatches(): number {
    return this.totalCount;
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
      (item) => item.totalQuantity <= item.reorderLevel
    ).length;
  }

  // Count batches expiring within the next 30 days.
  // Currently this count is based on the batches on the current page.
  get expiringBatches(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);

    return this.stockBatches.filter((batch) => {
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
          (item) => item.stockBatchId === stockBatchId
        );

        if (batch) {
          batch.batchNumber = batchNumber;
        }

        this.selectedBatch = null;
        this.editedBatchNumber = '';
        this.isUpdatingBatchNumber = false;

        this.message =
          response.message || 'Stock batch number updated successfully.';
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
      },
    });
  }

  // Clear the search and item filter.
  clearFilters(): void {
    this.searchText = '';
    this.selectedItemId = null;
    this.pageNumber = 1;
    this.loadPagedBatches();
  }
}
