import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';

import { StockService } from '../../services/stock.service';

import {
  StockBatch,
  StockTransaction
} from '../../models/stock.models';

@Component({
  selector: 'app-stock-transactions',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
],
  templateUrl: './stock-transactions.html',
  styleUrl: './stock-transactions.css'
})
export class StockTransactions implements OnInit {

  private readonly stockService = inject(StockService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Selected stock batch and its transaction history.
  stockBatch: StockBatch | null = null;
  transactions: StockTransaction[] = [];

  // Loading and error information.
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' = 'error';

  // Selected batch ID from the route.
  stockBatchId = 0;

  ngOnInit(): void {

    this.stockBatchId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!Number.isInteger(this.stockBatchId) || this.stockBatchId <= 0) {
      this.message = 'Invalid stock batch ID.';
      this.messageType = 'error';
      return;
    }

    // Read the success message after returning from Manage Stock.
    const navigationState = this.router.getCurrentNavigation()?.extras.state as
      { successMessage?: string } | undefined;

    if (navigationState?.successMessage) {
      this.message = navigationState.successMessage;
      this.messageType = 'success';
    }

    this.loadTransactionData(!!navigationState?.successMessage);
  }

  // Load the selected batch and its transaction history.
  loadTransactionData(preserveMessage = false): void {

    this.isLoading = true;

    if (!preserveMessage) {
      this.message = '';
    }

    this.stockService.getAllBatches(true).subscribe({

      next: (batches) => {

        this.stockBatch =
          batches.find(
            batch => batch.stockBatchId === this.stockBatchId
          ) ?? null;

        if (!this.stockBatch) {
          this.message = 'Stock batch not found.';
          this.messageType = 'error';
          this.isLoading = false;
          this.cdr.markForCheck();
          return;
        }

        this.stockService
          .getTransactionsByBatchId(this.stockBatchId)
          .subscribe({

            next: (transactions) => {
              this.transactions = transactions;
              this.isLoading = false;
              this.cdr.markForCheck();
            },

            error: (error) => {
              console.error(
                'Error loading stock transactions:',
                error
              );

              this.message =
                error.error?.message ||
                'Unable to load stock transaction history.';

              this.messageType = 'error';
              this.isLoading = false;
              this.cdr.markForCheck();
            }
          });
      },

      error: (error) => {

        console.error('Error loading stock batches:', error);

        this.message =
          error.error?.message ||
          'Unable to load stock batch information.';

        this.messageType = 'error';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Open the separate Manage Stock page for this batch.
  openManageStockForm(): void {
    this.router.navigate([
      '/stock/batches',
      this.stockBatchId,
      'manage'
    ]);
  }

  // Return to Stock Management.
  goBack(): void {
    this.router.navigate(['/stock']);
  }
}
