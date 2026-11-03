
import { Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

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

  searchText = '';
  selectedCategory = 'All';

  message = '';
  isLoading = false;

  items: Item[] = [];

  categories: string[] = [
    'Protective Equipment',
    'Medical Devices',
    'First Aid',
    'Medical Supplies',
  ];

  ngOnInit(): void {
    // Display the success message received from the Add/Edit page.
    const navigationState =
      this.router.getCurrentNavigation()?.extras.state ??
      window.history.state;

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

    this.itemService.getItems().subscribe({
      next: (items) => {
        this.items = items;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading items:', error);

        this.message =
          'Unable to load items. Please check that the backend is running.';

        this.isLoading = false;
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
    this.router.navigate(['/items/edit', item.id]);
  }

  // Delete an item after confirmation.
  deleteItem(id: number): void {
    const confirmed = window.confirm(
      'Are you sure you want to delete this item?'
    );

    if (!confirmed) {
      return;
    }

    this.isLoading = true;
    this.message = '';

    this.itemService.deleteItem(id).subscribe({
      next: () => {
        this.items = this.items.filter((item) => item.id !== id);
        this.message = 'Item deleted successfully!';
        this.isLoading = false;
      },

      error: (error) => {
        console.error('Error deleting item:', error);

        this.message =
          error.error?.message ||
          'Unable to delete item. Please try again.';

        this.isLoading = false;
      },
    });
  }

  // Reset search and category filters.
  clearFilters(): void {
    this.searchText = '';
    this.selectedCategory = 'All';
  }
}
