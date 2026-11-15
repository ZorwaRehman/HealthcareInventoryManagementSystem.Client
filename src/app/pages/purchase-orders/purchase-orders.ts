
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { DecimalPipe, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { PurchaseOrder } from '../../models/purchase-order.models';
import { PurchaseOrderService } from '../../services/purchase-order.service';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [
  FormsModule,
  RouterLink,
  DecimalPipe,
  DatePipe,
  NgClass
],
  templateUrl: './purchase-orders.html',
  styleUrl: './purchase-orders.css',
})
export class PurchaseOrders implements OnInit {
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Search and filter values.
  searchText = '';
  selectedStatus = 'All';

  // Page messages and loading state.
  message = '';
  messageType: 'success' | 'error' = 'success';
  isLoading = false;

  // Purchase Orders returned by the backend.
  purchaseOrders: PurchaseOrder[] = [];

  // Purchase Order currently selected for the details view.
  selectedPurchaseOrder: PurchaseOrder | null = null;

  // Available statuses for the filter.
  statuses: string[] = [
    'Draft',
    'Submitted',
    'Approved',
    'Ordered',
    'PartiallyReceived',
    'Received',
    'Cancelled',
  ];

  ngOnInit(): void {
    this.loadPurchaseOrders();
  }

  // Load Purchase Orders from the backend.
  loadPurchaseOrders(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.purchaseOrderService.getAllPurchaseOrders().subscribe({
      next: (purchaseOrders) => {
        this.purchaseOrders = purchaseOrders;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading Purchase Orders:', error);

        this.showMessage(
          error.error?.message ||
          'Unable to load Purchase Orders. Please check that the backend is running.',
          'error'
        );

        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // Filter Purchase Orders by search text and status.
  get filteredPurchaseOrders(): PurchaseOrder[] {
    const search = this.searchText.trim().toLowerCase();

    return this.purchaseOrders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(search) ||
        order.supplierName.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        order.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  // Purchase Order statistics.
  get totalOrders(): number {
    return this.purchaseOrders.length;
  }

  get draftCount(): number {
    return this.countByStatus('Draft');
  }

  get pendingApprovalCount(): number {
    return this.countByStatus('Submitted');
  }

  get completedCount(): number {
    return this.countByStatus('Received');
  }

  private countByStatus(status: string): number {
    return this.purchaseOrders.filter(
      (order) => order.status === status
    ).length;
  }

  // Navigate to the Add Purchase Order page.
  openAddForm(): void {
    this.router.navigate(['/purchase-orders/new']);
  }

  // Navigate to the Edit Purchase Order page.
  editPurchaseOrder(order: PurchaseOrder): void {
    this.router.navigate(
      ['/purchase-orders/edit', order.purchaseOrderId],
      { state: { purchaseOrder: order } }
    );
  }

  // Open the details view for the selected Purchase Order.
  viewPurchaseOrder(order: PurchaseOrder): void {
    this.selectedPurchaseOrder = order;
  }

  // Close the Purchase Order details view.
  closePurchaseOrderDetails(): void {
    this.selectedPurchaseOrder = null;
  }

  // Submit a Draft Purchase Order.
  submitPurchaseOrder(order: PurchaseOrder): void {
    if (this.isLoading || order.status !== 'Draft') {
      return;
    }

    if (!window.confirm('Submit this Purchase Order for approval?')) {
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.cdr.markForCheck();

    this.purchaseOrderService
      .submitPurchaseOrder(order.purchaseOrderId)
      .subscribe({
        next: (response) => {
          this.showMessage(
            response.message || 'Purchase Order submitted successfully!',
            'success'
          );
          this.loadPurchaseOrders();
        },
        error: (error) => {
          this.handleActionError(error, 'Unable to submit Purchase Order.');
        },
      });
  }

  // Approve a Submitted Purchase Order.
  approvePurchaseOrder(order: PurchaseOrder): void {
    if (this.isLoading || order.status !== 'Submitted') {
      return;
    }

    if (!window.confirm('Approve this Purchase Order?')) {
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.cdr.markForCheck();

    this.purchaseOrderService
      .approvePurchaseOrder(order.purchaseOrderId)
      .subscribe({
        next: (response) => {
          this.showMessage(
            response.message || 'Purchase Order approved successfully!',
            'success'
          );
          this.loadPurchaseOrders();
        },
        error: (error) => {
          this.handleActionError(error, 'Unable to approve Purchase Order.');
        },
      });
  }

  // Mark an Approved Purchase Order as Ordered.
  markAsOrdered(order: PurchaseOrder): void {
    if (this.isLoading || order.status !== 'Approved') {
      return;
    }

    if (!window.confirm('Mark this Purchase Order as ordered?')) {
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.cdr.markForCheck();

    this.purchaseOrderService
      .markPurchaseOrderAsOrdered(order.purchaseOrderId)
      .subscribe({
        next: (response) => {
          this.showMessage(
            response.message || 'Purchase Order marked as ordered!',
            'success'
          );
          this.loadPurchaseOrders();
        },
        error: (error) => {
          this.handleActionError(error, 'Unable to update Purchase Order.');
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

  // Cancel a Purchase Order through the backend.
  cancelPurchaseOrder(order: PurchaseOrder): void {
    const cancellableStatuses = [
      'Draft',
      'Submitted',
      'Approved',
      'Ordered',
    ];

    if (
      this.isLoading ||
      !cancellableStatuses.includes(order.status)
    ) {
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to cancel Purchase Order ${order.orderNumber}?`
      )
    ) {
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.cdr.markForCheck();

    this.purchaseOrderService
      .cancelPurchaseOrder(order.purchaseOrderId)
      .subscribe({
        next: (response) => {
          this.showMessage(
            response.message || 'Purchase Order cancelled successfully!',
            'success'
          );

          this.loadPurchaseOrders();
        },
        error: (error) => {
          this.handleActionError(
            error,
            'Unable to cancel Purchase Order.'
          );
        },
      });
  }

  // Navigate to Goods Received with the selected Purchase Order ID.
  receivePurchaseOrder(order: PurchaseOrder): void {
    if (
      this.isLoading ||
      (order.status !== 'Ordered' &&
        order.status !== 'PartiallyReceived')
    ) {
      return;
    }

    this.router.navigate(['/goods-received/new'], {
      queryParams: {
        purchaseOrderId: order.purchaseOrderId,
      },
    });
  }

  // Handle errors from Purchase Order actions.
  private handleActionError(error: any, fallbackMessage: string): void {
    console.error('Purchase Order action failed:', error);

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
