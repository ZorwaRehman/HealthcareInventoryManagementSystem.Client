
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

  searchText = '';
  selectedCategory = 'All';

  message = '';
  isLoading = false;

  items: Item[] = [];

  // Actual stock summaries and batches from Stock Management.
  stockItems: StockModel[] = [];
  stockBatches: StockBatch[] = [];

  // Stores the ID of the item selected for deletion.
  selectedItemId: number | null = null;

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

  // Load inventory items and refresh stock information.
  loadItems(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    let itemsFailed = false;
    let stockFailed = false;

    forkJoin({
      // Force refresh so newly added or edited items appear.
      items: this.itemService.getItems(true).pipe(
        catchError((error) => {
          console.error('Error loading items:', error);
          itemsFailed = true;
          return of([] as Item[]);
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
        this.items = result.items;
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

  // Search and filter items.
  get filteredItems(): Item[] {
    const search = this.searchText.trim().toLowerCase();

    return this.items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search);

      const matchesCategory =
        this.selectedCategory === 'All' ||
        item.category === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });
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
    this.router.navigate(['/items/edit', item.id], {
      state: { item },
    });
  }

  // Open the custom delete confirmation dialog.
  confirmDelete(id: number): void {
    if (this.isLoading) {
      return;
    }

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
        this.items = this.items.filter((item) => item.id !== id);

        this.message = 'Item deleted successfully!';
        this.isLoading = false;
        this.selectedItemId = null;

        this.cdr.markForCheck();
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
  }
}
