
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { Item } from '../../models/item.models';
import { ItemService } from '../../services/item.service';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive, DecimalPipe],
  templateUrl: './items.html',
  styleUrl: './items.css',
})
export class Items implements OnInit {
  private readonly itemService = inject(ItemService);
  private readonly router = inject(Router);

  // Used to notify Angular when the view needs updating.
  private readonly cdr = inject(ChangeDetectorRef);

  searchText = '';
  selectedCategory = 'All';

  message = '';
  isLoading = false;

  items: Item[] = [];

  // Stores the ID of the item selected for deletion.
  // null means that the confirmation dialog is closed.
  selectedItemId: number | null = null;

  categories: string[] = [
    'Protective Equipment',
    'Medical Devices',
    'First Aid',
    'Medical Supplies',
  ];

  ngOnInit(): void {
    // Display the success message received from the Add/Edit page.
    const navigationState =
      this.router.getCurrentNavigation()?.extras.state ?? window.history.state;

    if (navigationState?.['successMessage']) {
      this.message = navigationState['successMessage'];

      // Prevent the same message from appearing again after refresh.
      window.history.replaceState(
        { ...window.history.state, successMessage: null },
        ''
      );
    }

    this.loadItems();
  }

  // Load items from the backend.
  loadItems(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.itemService.getItems().subscribe({
      next: (items) => {
        this.items = items;
        this.isLoading = false;

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading items:', error);

        this.message =
          'Unable to load items. Please check that the backend is running.';

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

  // Placeholder until Stock Management is connected.
  get lowStockCount(): number {
    return this.items.filter((item) => item.reorderLevel > 0).length;
  }

  get totalUnits(): number {
    return 0;
  }

  get totalValue(): number {
    return 0;
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

        // Notify Angular after successful deletion.
        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Error deleting item:', error);

        this.message =
          error.error?.message ||
          'Unable to delete item. Please try again.';

        this.isLoading = false;
        this.selectedItemId = null;

        // Notify Angular to display the error.
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
