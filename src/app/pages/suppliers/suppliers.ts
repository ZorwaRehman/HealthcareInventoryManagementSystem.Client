import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

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

  isLoading = false;
  message = '';

  selectedSupplierId: number | null = null;

  ngOnInit(): void {
    // Display a success message returned from the Supplier form.
    const navigationState =
      this.router.getCurrentNavigation()?.extras.state ?? window.history.state;

    if (navigationState?.['successMessage']) {
      this.message = navigationState['successMessage'];

      window.history.replaceState({ ...window.history.state, successMessage: null }, '');
    }

    this.loadSuppliers();
  }

  // Load suppliers from the backend API.
  loadSuppliers(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.supplierService.getSuppliers(true).subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
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

  // Filter suppliers according to search text and selected status.
  get filteredSuppliers(): Supplier[] {
    const search = this.searchText.trim().toLowerCase();

    return this.suppliers.filter((supplier) => {
      const matchesSearch =
        supplier.name.toLowerCase().includes(search) ||
        supplier.email.toLowerCase().includes(search) ||
        supplier.phone.toLowerCase().includes(search) ||
        (supplier.city ?? '').toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        (this.selectedStatus === 'Active' && supplier.isActive) ||
        (this.selectedStatus === 'Inactive' && !supplier.isActive);

      return matchesSearch && matchesStatus;
    });
  }

  // Count all suppliers.
  get totalSuppliers(): number {
    return this.suppliers.length;
  }

  // Count active suppliers.
  get activeSuppliers(): number {
    return this.suppliers.filter((supplier) => supplier.isActive).length;
  }

  // Count inactive suppliers.
  get inactiveSuppliers(): number {
    return this.suppliers.filter((supplier) => !supplier.isActive).length;
  }

  // Navigate to the Add Supplier page.
  openAddForm(): void {
    this.router.navigate(['/suppliers/new']);
  }

  // Navigate to the Edit Supplier page.
  editSupplier(supplier: Supplier): void {
    if (!supplier.isActive) {
      return;
    }

    this.router.navigate(['/suppliers/edit', supplier.supplierId], {
      state: { supplier },
    });
  }

  // Open the supplier deactivation confirmation.
  confirmDeactivate(id: number): void {
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
        this.suppliers = this.suppliers.map((supplier) =>
          supplier.supplierId === id ? { ...supplier, isActive: false } : supplier,
        );

        this.message = 'Supplier deactivated successfully!';

        this.selectedSupplierId = null;
        this.isLoading = false;

        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Error deactivating supplier:', error);

        this.message = error.error?.message || 'Unable to deactivate supplier. Please try again.';

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
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.message = '';

    this.cdr.markForCheck();

    this.supplierService.reactivateSupplier(id).subscribe({
      next: () => {
        this.suppliers = this.suppliers.map((supplier) =>
          supplier.supplierId === id ? { ...supplier, isActive: true } : supplier,
        );

        this.message = 'Supplier reactivated successfully!';

        this.isLoading = false;
        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Error reactivating supplier:', error);

        this.message = error.error?.message || 'Unable to reactivate supplier. Please try again.';

        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // Clear search and status filters.
  clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'All';
  }
}
