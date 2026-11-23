import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CurrencyService } from '../../services/currency.service';
import { PurchaseOrder } from '../../models/purchase-order.models';
import { Supplier } from '../../models/supplier.models';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { SupplierService } from '../../services/supplier.service';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [FormsModule, DatePipe, NgClass, RouterLink, RouterLinkActive],
  templateUrl: './purchase-orders.html',
  styleUrl: './purchase-orders.css',
})
export class PurchaseOrders implements OnInit {
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly supplierService = inject(SupplierService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Shared currency service for displaying converted amounts.
  private readonly currencyService = inject(CurrencyService);

  // Format PKR amounts using the currency selected on Dashboard.
  formatPrice(amount: number): string {
    return this.currencyService.formatPrice(amount);
  }

  searchText = '';
  selectedStatus = 'All';

  message = '';
  messageType: 'success' | 'error' = 'success';
  isLoading = false;

  purchaseOrders: PurchaseOrder[] = [];
  suppliers: Supplier[] = [];

  selectedPurchaseOrder: PurchaseOrder | null = null;
  selectedSupplier: Supplier | null = null;

  // Both detail views use the same modal.
  modalView: 'purchaseOrder' | 'supplier' = 'purchaseOrder';

  openActionMenuId: number | null = null;

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
    this.loadSuppliers();
  }

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
          'error',
        );

        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers(true).subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
      },
    });
  }

  get filteredPurchaseOrders(): PurchaseOrder[] {
    const search = this.searchText.trim().toLowerCase();

    return this.purchaseOrders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(search) ||
        order.supplierName.toLowerCase().includes(search);

      const matchesStatus = this.selectedStatus === 'All' || order.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

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
    return this.purchaseOrders.filter((order) => order.status === status).length;
  }

  getStatusLabel(status: string): string {
    return status === 'PartiallyReceived' ? 'Partially Received' : status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      Draft: 'status-draft',
      Submitted: 'status-submitted',
      Approved: 'status-approved',
      Ordered: 'status-ordered',
      PartiallyReceived: 'status-partial',
      Received: 'status-received',
      Cancelled: 'status-cancelled',
    };

    return classes[status] || '';
  }

  openAddForm(): void {
    this.router.navigate(['/purchase-orders/new']);
  }

  editPurchaseOrder(order: PurchaseOrder): void {
    this.closeActionMenu();

    this.router.navigate(['/purchase-orders/edit', order.purchaseOrderId], {
      state: { purchaseOrder: order },
    });
  }

  // Open the shared modal in Purchase Order details mode.
  viewPurchaseOrder(order: PurchaseOrder): void {
    this.closeActionMenu();

    this.selectedPurchaseOrder = order;
    this.selectedSupplier = null;
    this.modalView = 'purchaseOrder';
  }

  // Switch the same modal to Supplier details.
  openSupplierDetails(supplierId: number, event: MouseEvent): void {
    event.stopPropagation();

    const supplier = this.suppliers.find((item) => item.supplierId === supplierId);

    if (!supplier) {
      this.showMessage('Supplier details could not be found.', 'error');
      return;
    }

    this.selectedSupplier = supplier;
    this.modalView = 'supplier';
  }

  // Return to the Purchase Order details without opening another modal.
  backToPurchaseOrder(): void {
    if (this.selectedPurchaseOrder) {
      this.selectedSupplier = null;
      this.modalView = 'purchaseOrder';
    }
  }

  closeDetailsModal(): void {
    this.selectedPurchaseOrder = null;
    this.selectedSupplier = null;
    this.modalView = 'purchaseOrder';
  }

  toggleActionMenu(purchaseOrderId: number, event: MouseEvent): void {
    event.stopPropagation();

    this.openActionMenuId = this.openActionMenuId === purchaseOrderId ? null : purchaseOrderId;
  }

  closeActionMenu(): void {
    this.openActionMenuId = null;
  }

  submitPurchaseOrder(order: PurchaseOrder): void {
    this.closeActionMenu();

    if (this.isLoading || order.status !== 'Draft') {
      return;
    }

    if (!window.confirm('Submit this Purchase Order for approval?')) {
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.cdr.markForCheck();

    this.purchaseOrderService.submitPurchaseOrder(order.purchaseOrderId).subscribe({
      next: (response) => {
        this.showMessage(response.message || 'Purchase Order submitted successfully!', 'success');
        this.loadPurchaseOrders();
      },
      error: (error) => {
        this.handleActionError(error, 'Unable to submit Purchase Order.');
      },
    });
  }

  approvePurchaseOrder(order: PurchaseOrder): void {
    this.closeActionMenu();

    if (this.isLoading || order.status !== 'Submitted') {
      return;
    }

    if (!window.confirm('Approve this Purchase Order?')) {
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.cdr.markForCheck();

    this.purchaseOrderService.approvePurchaseOrder(order.purchaseOrderId).subscribe({
      next: (response) => {
        this.showMessage(response.message || 'Purchase Order approved successfully!', 'success');
        this.loadPurchaseOrders();
      },
      error: (error) => {
        this.handleActionError(error, 'Unable to approve Purchase Order.');
      },
    });
  }

  markAsOrdered(order: PurchaseOrder): void {
    this.closeActionMenu();

    if (this.isLoading || order.status !== 'Approved') {
      return;
    }

    if (!window.confirm('Mark this Purchase Order as ordered?')) {
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.cdr.markForCheck();

    this.purchaseOrderService.markPurchaseOrderAsOrdered(order.purchaseOrderId).subscribe({
      next: (response) => {
        this.showMessage(response.message || 'Purchase Order marked as ordered!', 'success');
        this.loadPurchaseOrders();
      },
      error: (error) => {
        this.handleActionError(error, 'Unable to update Purchase Order.');
      },
    });
  }

  cancelPurchaseOrder(order: PurchaseOrder): void {
    this.closeActionMenu();

    const cancellableStatuses = ['Draft', 'Submitted', 'Approved', 'Ordered'];

    if (this.isLoading || !cancellableStatuses.includes(order.status)) {
      return;
    }

    if (!window.confirm(`Are you sure you want to cancel Purchase Order ${order.orderNumber}?`)) {
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.cdr.markForCheck();

    this.purchaseOrderService.cancelPurchaseOrder(order.purchaseOrderId).subscribe({
      next: (response) => {
        this.showMessage(response.message || 'Purchase Order cancelled successfully!', 'success');

        this.loadPurchaseOrders();
      },
      error: (error) => {
        this.handleActionError(error, 'Unable to cancel Purchase Order.');
      },
    });
  }

  receivePurchaseOrder(order: PurchaseOrder): void {
    this.closeActionMenu();

    if (this.isLoading || (order.status !== 'Ordered' && order.status !== 'PartiallyReceived')) {
      return;
    }

    this.router.navigate(['/goods-received/new'], {
      queryParams: {
        purchaseOrderId: order.purchaseOrderId,
      },
    });
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
    this.cdr.markForCheck();
  }

  private handleActionError(error: any, fallbackMessage: string): void {
    console.error('Purchase Order action failed:', error);

    this.showMessage(error.error?.message || fallbackMessage, 'error');

    this.isLoading = false;
    this.cdr.markForCheck();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'All';
  }
}
