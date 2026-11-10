
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  Supplier,
  SupplierRequest
} from '../../models/supplier.models';

import { SupplierService } from '../../services/supplier.service';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './supplier-form.html',
  styleUrl: './supplier-form.css'
})
export class SupplierForm implements OnInit {

  private readonly supplierService = inject(SupplierService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Stores the supplier ID when editing.
  supplierId: number | null = null;

  // Identifies whether the form is in Add or Edit mode.
  isEditMode = false;

  isLoading = false;
  isSaving = false;

  message = '';
  messageType: 'success' | 'error' = 'error';

  // Supplier form data.
  supplier: SupplierRequest = {
    name: '',
    phone: '',
    email: '',
    address: '',
    contactPerson: null,
    city: null,
    country: null,
    taxNumber: null,
    notes: null,
    isActive: true
  };

  ngOnInit(): void {

    // Read the supplier ID from the URL.
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (id > 0) {
      this.supplierId = id;
      this.isEditMode = true;
      this.loadSupplier(id);
    }

  }

  // Load an existing supplier for editing.
  loadSupplier(id: number): void {

    this.isLoading = true;
    this.cdr.markForCheck();

    // Use supplier data passed through navigation when available.
    const navigationState = window.history.state;
    const passedSupplier = navigationState?.supplier as Supplier | undefined;

    if (passedSupplier?.supplierId === id) {

      this.setSupplierData(passedSupplier);
      this.isLoading = false;
      this.cdr.markForCheck();

      return;
    }

    // Otherwise, retrieve supplier data from the backend.
    this.supplierService.getSupplierById(id).subscribe({

      next: (supplier) => {
        this.setSupplierData(supplier);
        this.isLoading = false;
        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Error loading supplier:', error);

        this.message =
          error.error?.message ||
          'Unable to load supplier details. Please try again.';

        this.messageType = 'error';
        this.isLoading = false;
        this.cdr.markForCheck();
      }

    });

  }

  // Copy existing supplier information into the form.
  private setSupplierData(supplier: Supplier): void {

    this.supplier = {
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      contactPerson: supplier.contactPerson,
      city: supplier.city,
      country: supplier.country,
      taxNumber: supplier.taxNumber,
      notes: supplier.notes,
      isActive: supplier.isActive
    };

  }

  // Save a new supplier or update an existing supplier.
  saveSupplier(): void {

    if (this.isSaving || this.isLoading) {
      return;
    }

    this.message = '';

    // Remove unnecessary spaces from text fields.
    const request: SupplierRequest = {
      name: this.supplier.name.trim(),
      phone: this.supplier.phone.trim(),
      email: this.supplier.email.trim(),
      address: this.supplier.address.trim(),
      contactPerson: this.supplier.contactPerson?.trim() || null,
      city: this.supplier.city?.trim() || null,
      country: this.supplier.country?.trim() || null,
      taxNumber: this.supplier.taxNumber?.trim() || null,
      notes: this.supplier.notes?.trim() || null,
      isActive: this.supplier.isActive
    };

    // Check required fields before sending the request.
    if (
      !request.name ||
      !request.phone ||
      !request.email ||
      !request.address
    ) {
      this.message = 'Please complete all required fields.';
      this.messageType = 'error';
      return;
    }

    this.isSaving = true;
    this.cdr.markForCheck();

    // Update an existing supplier.
    if (this.isEditMode && this.supplierId !== null) {

      this.supplierService.updateSupplier(
        this.supplierId,
        request
      ).subscribe({

        next: () => {
          this.supplierService.clearSuppliersCache();

          this.router.navigate(['/suppliers'], {
            state: {
              successMessage: 'Supplier updated successfully!'
            }
          });
        },

        error: (error) => {
          this.handleSaveError(error);
        }

      });

      return;
    }

    // Create a new supplier.
    this.supplierService.createSupplier(request).subscribe({

      next: () => {
        this.supplierService.clearSuppliersCache();

        this.router.navigate(['/suppliers'], {
          state: {
            successMessage: 'Supplier added successfully!'
          }
        });
      },

      error: (error) => {
        this.handleSaveError(error);
      }

    });

  }

  // Display an error returned by the backend.
  private handleSaveError(error: any): void {

    console.error('Error saving supplier:', error);

    this.message =
      error.error?.message ||
      'Unable to save supplier. Please check your information and try again.';

    this.messageType = 'error';
    this.isSaving = false;

    this.cdr.markForCheck();
  }

  // Return to the Supplier list.
  cancel(): void {
    this.router.navigate(['/suppliers']);
  }

}

