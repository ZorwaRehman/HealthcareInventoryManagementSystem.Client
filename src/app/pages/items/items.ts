
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Item } from '../../models/item.models';
import { Stock as StockModel, StockBatch } from '../../models/stock.models';

import { ItemService } from '../../services/item.service';
import { StockService } from '../../services/stock.service';
import { CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive, DecimalPipe],
  templateUrl: './items.html',
  styleUrl: './items.css',
})
export class Items implements OnInit {
  private readonly itemService = inject(ItemService);
  private readonly stockService = inject(StockService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly currencyService = inject(CurrencyService);

  searchText = '';
  selectedCategory = 'All';

  message = '';
  isLoading = false;

  items: Item[] = [];

  // Server-side pagination information.
  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  // Actual stock summaries and batches from Stock Management.
  stockItems: StockModel[] = [];
  stockBatches: StockBatch[] = [];

  // Stores the ID of the item selected for deletion.
  selectedItemId: number | null = null;

  // Stores the ID of the row whose actions dropdown is open.
  openActionMenuId: number | null = null;

  // Stores the item selected for the details modal.
  selectedItem: Item | null = null;

  categories: string[] = [
    'Protective Equipment',
    'Medical Devices',
    'First Aid',
    'Medical Supplies',
  ];

  ngOnInit(): void {
    const navigationState =
      this.router.getCurrentNavigation()?.extras.state ?? window.history.state;

    if (navigationState?.['successMessage']) {
      this.message = navigationState['successMessage'];

      window.history.replaceState(
        { ...window.history.state, successMessage: null },
        ''
      );
    }

    this.loadItems();
  }

  // Format inventory values using the currency selected on Dashboard.
  // Original stock prices remain stored in PKR.
  formatPrice(amount: number): string {
    return this.currencyService.formatPrice(amount);
  }

  // Load the current page of items and refresh stock information.
  loadItems(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    let itemsFailed = false;
    let stockFailed = false;

    forkJoin({
      // Retrieve only the requested page from the backend.
      pagedItems: this.itemService.getPagedItems(
        this.pageNumber,
        this.pageSize,
        this.searchText,
        this.selectedCategory
      ).pipe(
        catchError((error) => {
          console.error('Error loading items:', error);
          itemsFailed = true;

          return of({
            items: [] as Item[],
            totalCount: 0,
            pageNumber: this.pageNumber,
            pageSize: this.pageSize,
            totalPages: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          });
        })
      ),

      // Force refresh stock summaries after stock changes.
      stock: this.stockService.getAllStock(true).pipe(
        catchError((error) => {
          console.error('Error loading stock summary:', error);
          stockFailed = true;
          return of([] as StockModel[]);
        })
      ),

      // Force refresh batches for inventory value calculation.
      batches: this.stockService.getAllBatches(true).pipe(
        catchError((error) => {
          console.error('Error loading stock batches:', error);
          stockFailed = true;
          return of([] as StockBatch[]);
        })
      ),
    }).subscribe({
      next: (result) => {
        // Update the current page of inventory items.
        this.items = result.pagedItems.items;
        this.totalCount = result.pagedItems.totalCount;
        this.totalPages = result.pagedItems.totalPages;
        this.pageNumber = result.pagedItems.pageNumber;

        // Update stock information.
        this.stockItems = result.stock;
        this.stockBatches = result.batches;

        if (itemsFailed) {
          this.message =
            'Unable to load items. Please check that the backend is running.';
        } else if (stockFailed) {
          this.message =
            'Items loaded, but stock statistics could not be refreshed.';
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading inventory:', error);

        this.message = 'Unable to load inventory. Please try again.';
        this.isLoading = false;

        this.cdr.markForCheck();
      },
    });
  }

  // Return the items already filtered by the backend.
  // This getter is retained for compatibility with the existing HTML.
  get filteredItems(): Item[] {
    return this.items;
  }

  // Apply search and category filters from the first page.
  applyFilters(): void {
    this.pageNumber = 1;
    this.loadItems();
  }

  // Navigate to a specific page.
  changePage(page: number): void {
    if (
      this.isLoading ||
      page < 1 ||
      page > this.totalPages ||
      page === this.pageNumber
    ) {
      return;
    }

    this.pageNumber = page;
    this.loadItems();
  }

  // Change the number of items displayed per page.
  changePageSize(size: number): void {
    const newSize = Number(size);

    if (!Number.isFinite(newSize) || newSize < 1) {
      return;
    }

    this.pageSize = Math.min(newSize, 100);
    this.pageNumber = 1;
    this.loadItems();
  }

  // Count items whose actual stock is at or below reorder level.
  get lowStockCount(): number {
    return this.stockItems.filter(
      (item) => item.totalQuantity <= item.reorderLevel
    ).length;
  }

  // Calculate total units across all inventory items.
  get totalUnits(): number {
    return this.stockItems.reduce(
      (total, item) => total + (Number(item.totalQuantity) || 0),
      0
    );
  }

  // Calculate inventory value using current batch quantities and prices.
  // This calculation remains in PKR.
  get totalValue(): number {
    return this.stockBatches.reduce(
      (total, batch) =>
        total +
        (Number(batch.quantityInStock) || 0) *
          (Number(batch.unitPrice) || 0),
      0
    );
  }

  // Navigate to the separate Add Item page.
  openAddForm(): void {
    this.router.navigate(['/items/new']);
  }

  // Navigate to the separate Edit Item page.
  editItem(item: Item): void {
    this.openActionMenuId = null;

    this.router.navigate(['/items/edit', item.id], {
      state: { item },
    });
  }

  // Open the actions dropdown when hovering over a row's three-dot button.
  showActionMenu(id: number): void {
    this.openActionMenuId = id;
  }

  // Close the actions dropdown when the cursor leaves the menu.
  hideActionMenu(): void {
    this.openActionMenuId = null;
  }

  // Open the details modal when an item row is clicked.
  viewItemDetails(item: Item): void {
    this.openActionMenuId = null;
    this.selectedItem = item;
  }

  // Close the item details modal.
  closeItemDetails(): void {
    this.selectedItem = null;
  }

  // Open the custom delete confirmation dialog.
  confirmDelete(id: number): void {
    if (this.isLoading) {
      return;
    }

    this.openActionMenuId = null;
    this.selectedItemId = id;
    this.cdr.markForCheck();
  }

  // Delete the selected item after confirmation.
  deleteItem(): void {
    if (this.selectedItemId === null || this.isLoading) {
      return;
    }

    const id = this.selectedItemId;

    this.isLoading = true;
    this.message = '';
    this.cdr.markForCheck();

    this.itemService.deleteItem(id).subscribe({
      next: () => {
        // Close the details modal if the deleted item was selected.
        if (this.selectedItem?.id === id) {
          this.selectedItem = null;
        }

        // Move back one page if the deleted item was the only row.
        if (this.items.length === 1 && this.pageNumber > 1) {
          this.pageNumber--;
        }

        this.message = 'Item deleted successfully!';
        this.selectedItemId = null;

        // Reload the current page and refresh stock information.
        this.loadItems();
      },

      error: (error) => {
        console.error('Error deleting item:', error);

        this.message =
          error.error?.message ||
          'Unable to delete item. Please try again.';

        this.isLoading = false;
        this.selectedItemId = null;

        this.cdr.markForCheck();
      },
    });
  }

  // Close the confirmation dialog without deleting.
  cancelDelete(): void {
    if (this.isLoading) {
      return;
    }

    this.selectedItemId = null;
    this.cdr.markForCheck();
  }

  // Reset search and category filters.
  clearFilters(): void {
    this.searchText = '';
    this.selectedCategory = 'All';
    this.pageNumber = 1;

    this.loadItems();
  }
}
