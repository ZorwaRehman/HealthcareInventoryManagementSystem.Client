
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Supplier } from '../../models/supplier.models';
import { SupplierService } from '../../services/supplier.service';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.css',
})
export class Suppliers implements OnInit {
  private readonly supplierService = inject(SupplierService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  suppliers: Supplier[] = [];

  searchText = '';
  selectedStatus = 'All';

  // Server-side pagination properties.
  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  // Supplier summary statistics.
  totalSuppliers = 0;
  activeSuppliers = 0;
  inactiveSuppliers = 0;

  isLoading = false;
  message = '';

  selectedSupplierId: number | null = null;

  // Store the supplier selected for the details modal.
  selectedSupplier: Supplier | null = null;

  // Store the supplier whose three-dot dropdown is currently open.
  openActionMenuId: number | null = null;

  ngOnInit(): void {
    // Display a success message returned from the Supplier form.
    const navigationState =
      this.router.getCurrentNavigation()?.extras.state ?? window.history.state;

    if (navigationState?.['successMessage']) {
      this.message = navigationState['successMessage'];

      window.history.replaceState(
        { ...window.history.state, successMessage: null },
        '',
      );
    }

    this.loadSuppliers();
  }

  // Load the current supplier page and global summary statistics.
  loadSuppliers(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const isActive =
      this.selectedStatus === 'Active'
        ? true
        : this.selectedStatus === 'Inactive'
          ? false
          : undefined;

    // Page data uses the current search and status filters.
    // Summary requests use no search filter so the cards remain global.
    forkJoin({
      page: this.supplierService.getPagedSuppliers(
        this.pageNumber,
        this.pageSize,
        this.searchText,
        isActive,
      ),
      total: this.supplierService.getPagedSuppliers(1, 1),
      active: this.supplierService.getPagedSuppliers(1, 1, '', true),
      inactive: this.supplierService.getPagedSuppliers(1, 1, '', false),
    }).subscribe({
      next: (result) => {
        // If the last record on the current page was removed,
        // move back to the last available page.
        if (
          result.page.totalPages > 0 &&
          this.pageNumber > result.page.totalPages
        ) {
          this.pageNumber = result.page.totalPages;
          this.loadSuppliers();
          return;
        }

        this.suppliers = result.page.items;
        this.totalCount = result.page.totalCount;
        this.totalPages = result.page.totalPages;

        // Keep summary cards accurate across all suppliers.
        this.totalSuppliers = result.total.totalCount;
        this.activeSuppliers = result.active.totalCount;
        this.inactiveSuppliers = result.inactive.totalCount;

        this.isLoading = false;
        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Error loading suppliers:', error);

        this.message =
          error.error?.message ||
          'Unable to load suppliers. Please check that the backend is running.';

        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // The API already returns filtered suppliers for the current page.
  get filteredSuppliers(): Supplier[] {
    return this.suppliers;
  }

  // Apply search from the backend.
  onSearchChange(): void {
    this.pageNumber = 1;
    this.closeActionMenu();
    this.loadSuppliers();
  }

  // Apply Active or Inactive status filtering from the backend.
  onStatusChange(): void {
    this.pageNumber = 1;
    this.closeActionMenu();
    this.loadSuppliers();
  }

  // Change the current page.
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
    this.closeActionMenu();
    this.loadSuppliers();
  }

  // Change the number of rows displayed per page.
  changePageSize(size: number): void {
    if (size < 1 || this.isLoading) {
      return;
    }

    this.pageSize = size;
    this.pageNumber = 1;
    this.closeActionMenu();
    this.loadSuppliers();
  }

  // Clear search and status filters.
  clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'All';
    this.pageNumber = 1;
    this.closeActionMenu();
    this.loadSuppliers();
  }

  // Navigate to the Add Supplier page.
  openAddForm(): void {
    this.closeActionMenu();
    this.router.navigate(['/suppliers/new']);
  }

  // Navigate to the Edit Supplier page.
  editSupplier(supplier: Supplier): void {
    this.closeActionMenu();
    this.closeSupplierDetails();

    if (!supplier.isActive) {
      return;
    }

    this.router.navigate(['/suppliers/edit', supplier.supplierId], {
      state: { supplier },
    });
  }

  // Open the details modal for the selected supplier row.
  openSupplierDetails(supplier: Supplier): void {
    this.closeActionMenu();
    this.selectedSupplier = supplier;
    this.cdr.markForCheck();
  }

  // Close the supplier details modal.
  closeSupplierDetails(): void {
    this.selectedSupplier = null;
    this.cdr.markForCheck();
  }

  // Open or close the three-dot action dropdown.
  toggleActionMenu(id: number, event: MouseEvent): void {
    event.stopPropagation();

    if (this.isLoading) {
      return;
    }

    this.openActionMenuId =
      this.openActionMenuId === id ? null : id;

    this.cdr.markForCheck();
  }

  // Close the currently open action dropdown.
  closeActionMenu(): void {
    this.openActionMenuId = null;
  }

  // Open the supplier deactivation confirmation.
  confirmDeactivate(id: number): void {
    this.closeActionMenu();
    this.closeSupplierDetails();

    if (this.isLoading) {
      return;
    }

    this.selectedSupplierId = id;
    this.cdr.markForCheck();
  }

  // Deactivate the selected supplier through the backend.
  deactivateSupplier(): void {
    if (this.selectedSupplierId === null || this.isLoading) {
      return;
    }

    const id = this.selectedSupplierId;

    this.isLoading = true;
    this.message = '';

    this.cdr.markForCheck();

    this.supplierService.deactivateSupplier(id).subscribe({
      next: () => {
        this.message = 'Supplier deactivated successfully!';

        this.selectedSupplierId = null;
        this.pageNumber = 1;

        this.loadSuppliers();
      },

      error: (error) => {
        console.error('Error deactivating supplier:', error);

        this.message =
          error.error?.message ||
          'Unable to deactivate supplier. Please try again.';

        this.selectedSupplierId = null;
        this.isLoading = false;

        this.cdr.markForCheck();
      },
    });
  }

  // Cancel supplier deactivation.
  cancelDeactivate(): void {
    if (this.isLoading) {
      return;
    }

    this.selectedSupplierId = null;
    this.cdr.markForCheck();
  }

  // Reactivate an inactive supplier through the backend.
  reactivateSupplier(id: number): void {
    this.closeActionMenu();

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.message = '';

    this.cdr.markForCheck();

    this.supplierService.reactivateSupplier(id).subscribe({
      next: () => {
        this.message = 'Supplier reactivated successfully!';

        this.pageNumber = 1;
        this.loadSuppliers();
      },

      error: (error) => {
        console.error('Error reactivating supplier:', error);

        this.message =
          error.error?.message ||
          'Unable to reactivate supplier. Please try again.';

        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
