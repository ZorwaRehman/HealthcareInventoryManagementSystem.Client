
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';

import { StockService } from '../../services/stock.service';

import {
  StockBatch,
  StockAdjustment
} from '../../models/stock.models';

@Component({
  selector: 'app-manage-stock',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './manage-stock.html',
  styleUrl: './manage-stock.css'
})
export class ManageStock implements OnInit {

  private readonly stockService = inject(StockService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Selected stock batch.
  stockBatch: StockBatch | null = null;
  stockBatchId = 0;

  // Stock transaction form fields.
  transactionType: 'StockIn' | 'StockOut' | 'Adjustment' = 'StockIn';
  quantity: number | null = null;
  physicalQuantity: number | null = null;
  reason = '';

  // Loading and saving status.
  isLoading = false;
  isSaving = false;

  // Success and error messages.
  message = '';
  messageType: 'success' | 'error' = 'error';

  ngOnInit(): void {
    this.stockBatchId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!Number.isInteger(this.stockBatchId) || this.stockBatchId <= 0) {
      this.message = 'Invalid stock batch ID.';
      this.messageType = 'error';
      return;
    }

    this.loadBatch();
  }

  // Validate whether a value is a whole number.
  // This method is used by the HTML template.
  isInteger(value: number | null): boolean {
    return value !== null && Number.isInteger(value);
  }

  // Load the selected batch information.
  loadBatch(): void {
    this.isLoading = true;
    this.message = '';

    this.stockService.getAllBatches(true).subscribe({
      next: (batches) => {
        this.stockBatch =
          batches.find(
            batch => batch.stockBatchId === this.stockBatchId
          ) ?? null;

        if (!this.stockBatch) {
          this.message = 'Stock batch not found.';
          this.messageType = 'error';
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      },

      error: (error) => {
        console.error('Error loading stock batch:', error);

        this.message =
          error.error?.message ||
          'Unable to load stock batch information.';

        this.messageType = 'error';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Reset fields when the transaction type changes.
  onTransactionTypeChange(): void {
    this.quantity = null;
    this.physicalQuantity = null;
    this.reason = '';
    this.message = '';
  }

  // Submit Stock In, Stock Out, or Physical Count Adjustment.
  submitAdjustment(): void {

    if (!this.stockBatch || this.isSaving || this.isLoading) {
      return;
    }

    // Validate Stock In and Stock Out quantity.
    if (this.transactionType !== 'Adjustment') {

      if (
        this.quantity === null ||
        !Number.isInteger(this.quantity) ||
        this.quantity <= 0
      ) {
        this.message = 'Please enter a valid quantity greater than zero.';
        this.messageType = 'error';
        return;
      }
    }

    // Validate physical quantity for Adjustment.
    if (this.transactionType === 'Adjustment') {

      if (
        this.physicalQuantity === null ||
        !Number.isInteger(this.physicalQuantity) ||
        this.physicalQuantity < 0
      ) {
        this.message =
          'Please enter a valid physical quantity. Zero is allowed.';

        this.messageType = 'error';
        return;
      }

      if (!this.reason.trim()) {
        this.message =
          'Please provide a reason for the stock adjustment.';

        this.messageType = 'error';
        return;
      }
    }

    // Validate reason length.
    if (this.reason.length > 500) {
      this.message = 'Reason cannot exceed 500 characters.';
      this.messageType = 'error';
      return;
    }

    // Prepare the stock adjustment request.
    const request: StockAdjustment = {
      stockBatchId: this.stockBatchId,

      transactionType: this.transactionType,

      quantity: this.transactionType === 'Adjustment'
        ? 0
        : this.quantity!,

      physicalQuantity: this.transactionType === 'Adjustment'
        ? this.physicalQuantity!
        : undefined,

      reason: this.reason.trim() || null
    };

    this.isSaving = true;
    this.message = '';

    this.cdr.markForCheck();

    // Send the request to the backend.
    this.stockService.adjustStock(request).subscribe({

      next: (response) => {

        this.isSaving = false;

        // Clear cached stock information.
        this.stockService.clearStockCache();

        // Return to the selected batch transaction history.
        this.router.navigate(
          [
            '/stock/batches',
            this.stockBatchId,
            'transactions'
          ],
          {
            state: {
              successMessage: response.message ||
                'Stock transaction completed successfully.'
            }
          }
        );
      },

      error: (error) => {

        console.error('Error managing stock:', error);

        this.message =
          error.error?.message ||
          'Unable to complete the stock transaction.';

        this.messageType = 'error';
        this.isSaving = false;

        this.cdr.markForCheck();
      }
    });
  }

  // Return to the selected batch transaction history.
  cancel(): void {
    this.router.navigate([
      '/stock/batches',
      this.stockBatchId,
      'transactions'
    ]);
  }
}
