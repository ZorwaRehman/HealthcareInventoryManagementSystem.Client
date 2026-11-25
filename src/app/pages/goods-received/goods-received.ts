
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin } from 'rxjs';

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
    RouterLinkActive,
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

  // Pagination values.
  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  // Summary statistics.
  totalReceipts = 0;
  draftCount = 0;
  confirmedCount = 0;
  cancelledCount = 0;

  // Page messages and loading state.
  message = '';
  messageType: 'success' | 'error' = 'success';
  isLoading = false;

  // Goods Received records returned by the backend.
  goodsReceivedRecords: GoodsReceived[] = [];

  // Currently selected record for the details view.
  selectedGoodsReceived: GoodsReceived | null = null;

  // Currently open action dropdown.
  openActionMenuId: number | null = null;

  // Available statuses for the filter.
  statuses = [
    { value: GoodsReceivedStatus.Draft, label: 'Draft' },
    { value: GoodsReceivedStatus.Confirmed, label: 'Confirmed' },
    { value: GoodsReceivedStatus.Cancelled, label: 'Cancelled' },
  ];

  ngOnInit(): void {
    this.loadGoodsReceived();
  }

  // Load paginated Goods Received records and summary counts.
  loadGoodsReceived(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    forkJoin({
      page: this.goodsReceivedService.getPagedGoodsReceived(
        this.pageNumber,
        this.pageSize,
        this.searchText,
        this.selectedStatus
      ),

      total: this.goodsReceivedService.getPagedGoodsReceived(1, 1),

      drafts: this.goodsReceivedService.getPagedGoodsReceived(
        1, 1, '', 'Draft'
      ),

      confirmed: this.goodsReceivedService.getPagedGoodsReceived(
        1, 1, '', 'Confirmed'
      ),

      cancelled: this.goodsReceivedService.getPagedGoodsReceived(
        1, 1, '', 'Cancelled'
      ),
    }).subscribe({
      next: (result) => {
        this.totalCount = result.page.totalCount;
        this.totalPages = result.page.totalPages;

        // If the current page no longer exists, move to the last available page.
        if (this.totalPages > 0 && this.pageNumber > this.totalPages) {
          this.pageNumber = this.totalPages;
          this.loadGoodsReceived();
          return;
        }

        this.goodsReceivedRecords = result.page.items;

        // Summary counts are independent of the current filters and page.
        this.totalReceipts = result.total.totalCount;
        this.draftCount = result.drafts.totalCount;
        this.confirmedCount = result.confirmed.totalCount;
        this.cancelledCount = result.cancelled.totalCount;

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

  // Current page records are already filtered by the backend.
  get filteredGoodsReceived(): GoodsReceived[] {
    return this.goodsReceivedRecords;
  }

  // Apply search filter.
  applyFilters(): void {
    this.pageNumber = 1;
    this.closeActionMenu();
    this.loadGoodsReceived();
  }

  // Apply status filter.
  onStatusChange(): void {
    this.pageNumber = 1;
    this.closeActionMenu();
    this.loadGoodsReceived();
  }

  // Navigate between pages.
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
    this.loadGoodsReceived();
  }

  // Change the number of records displayed per page.
  changePageSize(size: number): void {
    if (this.isLoading || size === this.pageSize) {
      return;
    }

    this.pageSize = size;
    this.pageNumber = 1;
    this.closeActionMenu();
    this.loadGoodsReceived();
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

  // Open or close the three-dot action dropdown.
  toggleActionMenu(id: number, event: MouseEvent): void {
    event.stopPropagation();

    this.openActionMenuId =
      this.openActionMenuId === id ? null : id;
  }

  // Close the action dropdown.
  closeActionMenu(): void {
    this.openActionMenuId = null;
  }

  // Navigate to the new Goods Received form.
  openAddForm(): void {
    this.closeActionMenu();
    this.router.navigate(['/goods-received/new']);
  }

  // Open the details view.
  viewGoodsReceived(record: GoodsReceived): void {
    this.closeActionMenu();
    this.selectedGoodsReceived = record;
  }

  // Close the details view.
  closeDetails(): void {
    this.selectedGoodsReceived = null;
    this.closeActionMenu();
  }

  // Confirm a Draft Goods Received record.
  confirmGoodsReceived(record: GoodsReceived): void {
    this.closeActionMenu();

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
    this.closeActionMenu();

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

        // Refresh the page and summary data.
        this.loadGoodsReceived();
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
    this.pageNumber = 1;
    this.closeActionMenu();
    this.loadGoodsReceived();
  }
}
