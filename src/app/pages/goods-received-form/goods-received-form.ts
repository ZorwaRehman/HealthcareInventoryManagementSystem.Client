
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { PurchaseOrder } from '../../models/purchase-order.models';

import {
  CreateGoodsReceivedRequest,
  CreateGoodsReceivedItemRequest
} from '../../models/goods-received.models';

import { GoodsReceivedService } from '../../services/goods-received.service';

// Represents one editable batch row in the Goods Received form.
interface GoodsReceivedFormItem {
  purchaseOrderItemId: number;
  batchNumber: string;
  deliveredQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  quarantinedQuantity: number;
  manufactureDate: string;
  expiryDate: string;
  storageLocation: string;
}

@Component({
  selector: 'app-goods-received-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './goods-received-form.html',
  styleUrl: './goods-received-form.css'
})
export class GoodsReceivedForm implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly goodsReceivedService = inject(GoodsReceivedService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Purchase Order information loaded from the backend.
  purchaseOrder: PurchaseOrder | null = null;

  // Batch rows entered by the user.
  receiptItems: GoodsReceivedFormItem[] = [];

  // Receipt information.
  receivedDate = this.getTodayDate();
  deliveryNoteNumber = '';
  notes = '';

  // Page state.
  isLoading = false;
  isSaving = false;

  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    const purchaseOrderId = Number(
      this.route.snapshot.queryParamMap.get('purchaseOrderId')
    );

    if (!purchaseOrderId || purchaseOrderId <= 0) {
      this.errorMessage =
        'Purchase Order ID is missing or invalid.';

      this.cdr.detectChanges();
      return;
    }

    this.loadPurchaseOrder(purchaseOrderId);
  }

  // Load Purchase Order details for receiving.
  loadPurchaseOrder(purchaseOrderId: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.detectChanges();

    this.goodsReceivedService
      .getPurchaseOrderForReceiving(purchaseOrderId)
      .subscribe({
        next: (response) => {

          console.log('Purchase Order API Response:', response);

          // Stop loading as soon as the API response arrives.
          this.isLoading = false;

          try {
            if (!response || !Array.isArray(response.items)) {
              this.errorMessage =
                'Purchase Order data was received in an unexpected format.';

              this.cdr.detectChanges();
              return;
            }

            this.purchaseOrder = response;

            // Create one initial batch row for each PO item
            // that still has a remaining quantity.
            this.receiptItems = response.items
              .filter(item => Number(item.remainingQuantity) > 0)
              .map(item =>
                this.createEmptyItem(item.purchaseOrderItemId)
              );

            console.log('Loaded Purchase Order:', this.purchaseOrder);
            console.log('Generated Receipt Items:', this.receiptItems);

            if (this.receiptItems.length === 0) {
              this.errorMessage =
                'There are no remaining quantities available for receiving in this Purchase Order.';
            }

          } catch (error) {
            console.error(
              'Error processing Purchase Order:',
              error
            );

            this.errorMessage =
              'Unable to process the Purchase Order details.';
          }

          // Refresh the HTML after updating component properties.
          this.cdr.detectChanges();
        },

        error: (error: HttpErrorResponse) => {
          this.isLoading = false;

          console.error('Purchase Order API Error:', error);

          this.errorMessage = this.getErrorMessage(
            error,
            'Unable to load Purchase Order details.'
          );

          this.cdr.detectChanges();
        }
      });
  }

  // Create a new empty batch row.
  createEmptyItem(
    purchaseOrderItemId: number
  ): GoodsReceivedFormItem {
    return {
      purchaseOrderItemId,
      batchNumber: '',
      deliveredQuantity: 1,
      acceptedQuantity: 1,
      rejectedQuantity: 0,
      quarantinedQuantity: 0,
      manufactureDate: '',
      expiryDate: '',
      storageLocation: ''
    };
  }

  // Add another batch row.
  addBatchRow(): void {
    if (!this.purchaseOrder) {
      return;
    }

    const availableItem = this.purchaseOrder.items.find(
      item => item.remainingQuantity > 0
    );

    if (!availableItem) {
      this.showError(
        'No Purchase Order item has a remaining quantity.'
      );
      return;
    }

    this.receiptItems.push(
      this.createEmptyItem(availableItem.purchaseOrderItemId)
    );

    this.clearMessage();
  }

  // Remove a batch row while keeping at least one row.
  removeBatchRow(index: number): void {
    if (this.receiptItems.length <= 1) {
      return;
    }

    this.receiptItems.splice(index, 1);
    this.clearMessage();
  }

  // Get Purchase Order item information for a batch row.
  getPurchaseOrderItem(purchaseOrderItemId: number) {
    return this.purchaseOrder?.items.find(
      item => item.purchaseOrderItemId === purchaseOrderItemId
    );
  }

  // Calculate allocated accepted quantity for a PO item.
  // Quarantined quantities are excluded until they are released.
  getAllocatedQuantity(purchaseOrderItemId: number): number {
    return this.receiptItems
      .filter(
        item => item.purchaseOrderItemId === purchaseOrderItemId
      )
      .reduce(
        (total, item) =>
          total + (Number(item.acceptedQuantity) || 0),
        0
      );
  }

  // Calculate total delivered quantity.
  get totalDelivered(): number {
    return this.receiptItems.reduce(
      (total, item) =>
        total + (Number(item.deliveredQuantity) || 0),
      0
    );
  }

  // Calculate total accepted quantity.
  get totalAccepted(): number {
    return this.receiptItems.reduce(
      (total, item) =>
        total + (Number(item.acceptedQuantity) || 0),
      0
    );
  }

  // Calculate total rejected quantity.
  get totalRejected(): number {
    return this.receiptItems.reduce(
      (total, item) =>
        total + (Number(item.rejectedQuantity) || 0),
      0
    );
  }

  // Calculate total quarantined quantity.
  get totalQuarantined(): number {
    return this.receiptItems.reduce(
      (total, item) =>
        total + (Number(item.quarantinedQuantity) || 0),
      0
    );
  }

  // Validate the Goods Received form.
  validateForm(): string | null {

    if (!this.purchaseOrder) {
      return 'Purchase Order details are not available.';
    }

    if (!this.receivedDate) {
      return 'Please select a received date.';
    }

    if (this.deliveryNoteNumber.length > 100) {
      return 'Delivery note number cannot exceed 100 characters.';
    }

    if (this.notes.length > 1000) {
      return 'Notes cannot exceed 1000 characters.';
    }

    if (this.receiptItems.length === 0) {
      return 'Please add at least one batch row.';
    }

    for (const item of this.receiptItems) {

      if (
        !item.purchaseOrderItemId ||
        item.purchaseOrderItemId <= 0
      ) {
        return 'Please select a valid Purchase Order item.';
      }

      if (!item.batchNumber.trim()) {
        return 'Please enter a batch number for every row.';
      }

      if (item.batchNumber.trim().length > 50) {
        return 'Batch number cannot exceed 50 characters.';
      }

      if (
        !Number.isInteger(Number(item.deliveredQuantity)) ||
        Number(item.deliveredQuantity) <= 0
      ) {
        return 'Delivered quantities must be positive whole numbers.';
      }

      const accepted = Number(item.acceptedQuantity);
      const rejected = Number(item.rejectedQuantity);
      const quarantined = Number(item.quarantinedQuantity);

      if (
        !Number.isInteger(accepted) || accepted < 0 ||
        !Number.isInteger(rejected) || rejected < 0 ||
        !Number.isInteger(quarantined) || quarantined < 0
      ) {
        return 'Accepted, rejected, and quarantined quantities must be non-negative whole numbers.';
      }

      const totalQuantity =
        accepted + rejected + quarantined;

      if (Number(item.deliveredQuantity) !== totalQuantity) {
        return 'Delivered quantity must equal accepted + rejected + quarantined quantities.';
      }

      if (
        item.manufactureDate &&
        item.expiryDate &&
        item.expiryDate < item.manufactureDate
      ) {
        return 'Expiry date cannot be before manufacture date.';
      }

      if (item.storageLocation.length > 100) {
        return 'Storage location cannot exceed 100 characters.';
      }
    }

    // Only accepted quantities count toward the PO received quantity.
    // Quarantined quantities count later when released.
    for (const poItem of this.purchaseOrder.items) {

      const allocatedQuantity = this.getAllocatedQuantity(
        poItem.purchaseOrderItemId
      );

      if (allocatedQuantity > poItem.remainingQuantity) {
        return `Accepted quantity for ${poItem.itemName} exceeds its remaining Purchase Order quantity.`;
      }
    }

    return null;
  }

  // Save a new Goods Received record.
  saveGoodsReceived(): void {
    this.clearMessage();

    const validationMessage = this.validateForm();

    if (validationMessage) {
      this.showError(validationMessage);
      return;
    }

    if (!this.purchaseOrder) {
      this.showError('Purchase Order details are not available.');
      return;
    }

    const request: CreateGoodsReceivedRequest = {
      purchaseOrderId: this.purchaseOrder.purchaseOrderId,
      receivedDate: `${this.receivedDate}T00:00:00`,
      deliveryNoteNumber:
        this.deliveryNoteNumber.trim() || null,
      notes: this.notes.trim() || null,

      items: this.receiptItems.map(
        (item): CreateGoodsReceivedItemRequest => ({
          purchaseOrderItemId: Number(item.purchaseOrderItemId),
          batchNumber: item.batchNumber.trim(),
          deliveredQuantity: Number(item.deliveredQuantity),
          acceptedQuantity: Number(item.acceptedQuantity),
          rejectedQuantity: Number(item.rejectedQuantity),
          quarantinedQuantity: Number(item.quarantinedQuantity),
          manufactureDate: item.manufactureDate
            ? `${item.manufactureDate}T00:00:00`
            : null,
          expiryDate: item.expiryDate
            ? `${item.expiryDate}T00:00:00`
            : null,
          storageLocation: item.storageLocation.trim() || null
        })
      )
    };

    this.isSaving = true;

    this.goodsReceivedService
      .createGoodsReceived(request)
      .subscribe({
        next: (response) => {
          this.isSaving = false;

          console.log('Goods Received Created:', response);

          this.router.navigate(['/goods-received']);
        },

        error: (error: HttpErrorResponse) => {
          this.isSaving = false;

          console.error('Create Goods Received Error:', error);

          this.showError(this.getErrorMessage(
            error,
            'Unable to create the Goods Received record.'
          ));

          this.cdr.detectChanges();
        }
      });
  }

  // Cancel and return to the Goods Received list.
  cancel(): void {
    this.router.navigate(['/goods-received']);
  }

  // Get today's date in YYYY-MM-DD format.
  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Display an error message.
  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
  }

  // Clear displayed messages.
  private clearMessage(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Extract a useful error message from the API response.
  private getErrorMessage(
    error: HttpErrorResponse,
    fallback: string
  ): string {
    return error.error?.message ||
      error.error?.title ||
      error.error ||
      fallback;
  }
}
