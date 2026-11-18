
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import {
  GoodsReceived,
  GoodsReceivedItem,
  GoodsReceivedStatus,
} from '../../models/goods-received.models';

import { GoodsReceivedService } from '../../services/goods-received.service';

@Component({
  selector: 'app-goods-received',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    DatePipe,
    NgClass,
    RouterLinkActive
  ],
  templateUrl: './goods-received.html',
  styleUrl: './goods-received.css',
})
export class GoodsReceivedPage implements OnInit {
  private readonly goodsReceivedService = inject(GoodsReceivedService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Search and filter values.
  searchText = '';
  selectedStatus = 'All';

  // Page messages and loading state.
  message = '';
  messageType: 'success' | 'error' = 'success';
  isLoading = false;

  // Goods Received records returned by the backend.
  goodsReceivedRecords: GoodsReceived[] = [];

  // Currently selected record for the details view.
  selectedGoodsReceived: GoodsReceived | null = null;

  // Available statuses for the filter.
  statuses = [
    { value: GoodsReceivedStatus.Draft, label: 'Draft' },
    { value: GoodsReceivedStatus.Confirmed, label: 'Confirmed' },
    { value: GoodsReceivedStatus.Cancelled, label: 'Cancelled' },
  ];

  ngOnInit(): void {
    this.loadGoodsReceived();
  }

  // Load Goods Received records from the backend.
  loadGoodsReceived(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.goodsReceivedService.getAllGoodsReceived().subscribe({
      next: (records) => {
        this.goodsReceivedRecords = records;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading Goods Received records:', error);

        this.showMessage(
          error.error?.message ||
          'Unable to load Goods Received records. Please check that the backend is running.',
          'error'
        );

        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // Filter records by search text and status.
  get filteredGoodsReceived(): GoodsReceived[] {
    const search = this.searchText.trim().toLowerCase();

    return this.goodsReceivedRecords.filter((record) => {
      const matchesSearch =
        record.receiptNumber.toLowerCase().includes(search) ||
        record.purchaseOrderNumber.toLowerCase().includes(search) ||
        record.supplierName.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        record.status.toString() === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  // Statistics.
  get totalReceipts(): number {
    return this.goodsReceivedRecords.length;
  }

  get draftCount(): number {
    return this.countByStatus(GoodsReceivedStatus.Draft);
  }

  get confirmedCount(): number {
    return this.countByStatus(GoodsReceivedStatus.Confirmed);
  }

  get cancelledCount(): number {
    return this.countByStatus(GoodsReceivedStatus.Cancelled);
  }

  private countByStatus(status: GoodsReceivedStatus): number {
    return this.goodsReceivedRecords.filter(
      (record) => record.status === status
    ).length;
  }

  // Convert numeric backend status into a readable label.
  getStatusLabel(status: GoodsReceivedStatus): string {
    switch (status) {
      case GoodsReceivedStatus.Draft:
        return 'Draft';

      case GoodsReceivedStatus.Confirmed:
        return 'Confirmed';

      case GoodsReceivedStatus.Cancelled:
        return 'Cancelled';

      default:
        return 'Unknown';
    }
  }

  // Return the CSS class for a status badge.
  getStatusClass(status: GoodsReceivedStatus): string {
    switch (status) {
      case GoodsReceivedStatus.Draft:
        return 'status-draft';

      case GoodsReceivedStatus.Confirmed:
        return 'status-confirmed';

      case GoodsReceivedStatus.Cancelled:
        return 'status-cancelled';

      default:
        return '';
    }
  }

  // Navigate to the new Goods Received form.
  openAddForm(): void {
    this.router.navigate(['/goods-received/new']);
  }

  // Open the details view.
  viewGoodsReceived(record: GoodsReceived): void {
    this.selectedGoodsReceived = record;
  }

  // Close the details view.
  closeDetails(): void {
    this.selectedGoodsReceived = null;
  }

  // Confirm a Draft Goods Received record.
  confirmGoodsReceived(record: GoodsReceived): void {
    if (
      this.isLoading ||
      record.status !== GoodsReceivedStatus.Draft
    ) {
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to confirm receipt ${record.receiptNumber}? Accepted quantities will be added to stock.`
      )
    ) {
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.cdr.markForCheck();

    this.goodsReceivedService
      .confirmGoodsReceived(record.goodsReceivedId)
      .subscribe({
        next: () => {
          this.showMessage(
            'Goods Received record confirmed successfully!',
            'success'
          );

          this.closeDetails();
          this.loadGoodsReceived();
        },
        error: (error) => {
          this.handleActionError(
            error,
            'Unable to confirm Goods Received record.'
          );
        },
      });
  }

  // Cancel a Draft Goods Received record.
  cancelGoodsReceived(record: GoodsReceived): void {
    if (
      this.isLoading ||
      record.status !== GoodsReceivedStatus.Draft
    ) {
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to cancel receipt ${record.receiptNumber}?`
      )
    ) {
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.cdr.markForCheck();

    this.goodsReceivedService
      .cancelGoodsReceived(record.goodsReceivedId)
      .subscribe({
        next: (response) => {
          this.showMessage(
            response.message || 'Goods Received record cancelled successfully!',
            'success'
          );

          this.closeDetails();
          this.loadGoodsReceived();
        },
        error: (error) => {
          this.handleActionError(
            error,
            'Unable to cancel Goods Received record.'
          );
        },
      });
  }

  // Release part or all of a quarantined quantity.
  releaseQuarantinedQuantity(item: GoodsReceivedItem): void {
    if (
      this.isLoading ||
      !this.selectedGoodsReceived ||
      this.selectedGoodsReceived.status !== GoodsReceivedStatus.Confirmed ||
      item.quarantinedQuantity <= 0
    ) {
      return;
    }

    const enteredQuantity = window.prompt(
      `Enter the quantity to release from quarantine. Available quantity: ${item.quarantinedQuantity}`,
      item.quarantinedQuantity.toString()
    );

    if (enteredQuantity === null) {
      return;
    }

    const quantity = Number(enteredQuantity);

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > item.quarantinedQuantity
    ) {
      this.showMessage(
        `Enter a whole number between 1 and ${item.quarantinedQuantity}.`,
        'error'
      );
      return;
    }

    if (
      !window.confirm(
        `Release ${quantity} unit(s) of ${item.itemName} from quarantine?`
      )
    ) {
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.cdr.markForCheck();

    this.goodsReceivedService
      .releaseQuarantinedQuantity(item.goodsReceivedItemId, quantity)
      .subscribe({
        next: () => {
          this.showMessage(
            'Quarantined quantity released successfully!',
            'success'
          );

          this.refreshSelectedRecord();
        },
        error: (error) => {
          this.handleActionError(
            error,
            'Unable to release quarantined quantity.'
          );
        },
      });
  }

  // Refresh the selected record after releasing quarantine.
  private refreshSelectedRecord(): void {
    if (!this.selectedGoodsReceived) {
      this.loadGoodsReceived();
      return;
    }

    const recordId = this.selectedGoodsReceived.goodsReceivedId;

    this.goodsReceivedService.getGoodsReceivedById(recordId).subscribe({
      next: (record) => {
        this.selectedGoodsReceived = record;

        const index = this.goodsReceivedRecords.findIndex(
          (item) => item.goodsReceivedId === recordId
        );

        if (index !== -1) {
          this.goodsReceivedRecords[index] = record;
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error refreshing Goods Received record:', error);
        this.isLoading = false;
        this.loadGoodsReceived();
      },
    });
  }

  // Display a success or error message.
  private showMessage(
    message: string,
    type: 'success' | 'error'
  ): void {
    this.message = message;
    this.messageType = type;
    this.cdr.markForCheck();
  }

  // Handle errors from Goods Received actions.
  private handleActionError(error: any, fallbackMessage: string): void {
    console.error('Goods Received action failed:', error);

    this.showMessage(
      error.error?.message || fallbackMessage,
      'error'
    );

    this.isLoading = false;
    this.cdr.markForCheck();
  }

  // Reset search and status filters.
  clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'All';
  }
}
