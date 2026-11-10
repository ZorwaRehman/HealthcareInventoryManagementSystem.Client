import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { StockService } from '../../services/stock.service';
import { SupplierService } from '../../services/supplier.service';
import { ItemService } from '../../services/item.service';

import { CreateStockBatch } from '../../models/stock.models';
import { Supplier } from '../../models/supplier.models';
import { Item } from '../../models/item.models';

@Component({
  selector: 'app-stock-batch-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './stock-batch-form.html',
  styleUrl: './stock-batch-form.css'
})
export class StockBatchForm implements OnInit {

  private readonly stockService = inject(StockService);
  private readonly supplierService = inject(SupplierService);
  private readonly itemService = inject(ItemService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Stores active inventory items and suppliers.
  items: Item[] = [];
  suppliers: Supplier[] = [];

  // Displays loading and saving status.
  isLoading = false;
  isSaving = false;

  // Displays success or error messages.
  message = '';
  messageType: 'success' | 'error' = 'error';

  // Stock batch form data.
  batch: CreateStockBatch = {
    itemId: 0,
    supplierId: 0,
    batchNumber: '',
    expiryDate: null,
    quantityInStock: 0,
    unitPrice: 0
  };

  ngOnInit(): void {
    this.loadFormData();
  }

  // Load active inventory items and active suppliers.
  loadFormData(): void {
    this.isLoading = true;
    this.message = '';

    this.itemService.getItems(true).subscribe({
      next: (items) => {
        this.items = items.filter(item => item.isActive);

        this.supplierService.getSuppliers(true).subscribe({
          next: (suppliers) => {
            this.suppliers = suppliers.filter(
              supplier => supplier.isActive
            );

            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Error loading suppliers:', error);

            this.message = 'Unable to load suppliers. Please try again.';
            this.messageType = 'error';
            this.isLoading = false;

            this.cdr.markForCheck();
          }
        });
      },
      error: (error) => {
        console.error('Error loading inventory items:', error);

        this.message = 'Unable to load inventory items. Please try again.';
        this.messageType = 'error';
        this.isLoading = false;

        this.cdr.markForCheck();
      }
    });
  }

  // Save a new stock batch.
  saveBatch(): void {
    if (this.isSaving || this.isLoading) {
      return;
    }

    this.message = '';

    const request: CreateStockBatch = {
      itemId: Number(this.batch.itemId),
      supplierId: Number(this.batch.supplierId),
      batchNumber: this.batch.batchNumber.trim(),
      expiryDate: this.batch.expiryDate || null,
      quantityInStock: Number(this.batch.quantityInStock),
      unitPrice: Number(this.batch.unitPrice)
    };

    // Validate required fields.
    if (
      request.itemId <= 0 ||
      request.supplierId <= 0 ||
      !request.batchNumber ||
      request.quantityInStock < 0 ||
      !Number.isInteger(request.quantityInStock) ||
      request.unitPrice < 0.01
    ) {
      this.message = 'Please enter valid information in all required fields.';
      this.messageType = 'error';
      return;
    }

    this.isSaving = true;
    this.cdr.markForCheck();

    this.stockService.createStockBatch(request).subscribe({
      next: () => {
        this.stockService.clearStockCache();

        this.router.navigate(['/stock'], {
          state: {
            successMessage: 'Stock batch created successfully!'
          }
        });
      },
      error: (error) => {
        console.error('Error creating stock batch:', error);

        this.message =
          error.error?.message ||
          'Unable to create stock batch. Please check your information.';

        this.messageType = 'error';
        this.isSaving = false;

        this.cdr.markForCheck();
      }
    });
  }

  // Return to Stock Management.
  cancel(): void {
    this.router.navigate(['/stock']);
  }
}