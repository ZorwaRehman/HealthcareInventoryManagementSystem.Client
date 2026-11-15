
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import {
  PurchaseOrder,
  PurchaseOrderRequest,
  PurchaseOrderItemRequest
} from '../../models/purchase-order.models';

import { Supplier } from '../../models/supplier.models';
import { Item } from '../../models/item.models';

import { PurchaseOrderService } from '../../services/purchase-order.service';
import { SupplierService } from '../../services/supplier.service';
import { ItemService } from '../../services/item.service';

// Represents one editable item row in the form.
interface PurchaseOrderFormItem {
  itemId: number;
  orderedQuantity: number;
  unitPrice: number;
}

@Component({
  selector: 'app-purchase-order-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './purchase-order-form.html',
  styleUrl: './purchase-order-form.css'
})
export class PurchaseOrderForm implements OnInit {

  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly supplierService = inject(SupplierService);
  private readonly itemService = inject(ItemService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Available active suppliers and inventory items.
  suppliers: Supplier[] = [];
  availableItems: Item[] = [];

  // Purchase Order form fields.
  supplierId: number | null = null;
  orderDate = this.getTodayDate();
  expectedDeliveryDate = '';
  taxRate = 0;
  notes = '';

  // Items included in the Purchase Order.
  orderItems: PurchaseOrderFormItem[] = [
    {
      itemId: 0,
      orderedQuantity: 1,
      unitPrice: 0
    }
  ];

  // Page state.
  purchaseOrderId: number | null = null;
  isEditMode = false;
  isLoading = false;
  isSaving = false;

  message = '';
  messageType: 'success' | 'error' = 'success';

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadItems();

    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (id > 0) {
      this.purchaseOrderId = id;
      this.isEditMode = true;

      // Reuse the Purchase Order passed through router navigation
      // when available; otherwise retrieve it from the backend.
      const existingOrder = history.state?.purchaseOrder as
        PurchaseOrder | undefined;

      if (
        existingOrder &&
        existingOrder.purchaseOrderId === id
      ) {
        this.populateForm(existingOrder);
      } else {
        this.loadPurchaseOrder(id);
      }
    }
  }

  // Load active suppliers for the supplier dropdown.
  loadSuppliers(): void {
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers.filter(
          supplier => supplier.isActive
        );
      },
      error: (error: HttpErrorResponse) => {
        this.showError(this.getErrorMessage(
          error,
          'Unable to load suppliers.'
        ));
      }
    });
  }

  // Load active inventory items for the item dropdown.
  loadItems(): void {
    this.itemService.getItems().subscribe({
      next: (items) => {
        this.availableItems = items.filter(
          item => item.isActive
        );
      },
      error: (error: HttpErrorResponse) => {
        this.showError(this.getErrorMessage(
          error,
          'Unable to load inventory items.'
        ));
      }
    });
  }

  // Retrieve an existing Purchase Order when router state is unavailable.
  loadPurchaseOrder(id: number): void {
    this.isLoading = true;

    this.purchaseOrderService.getPurchaseOrderById(id).subscribe({
      next: (order) => {
        this.populateForm(order);
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;

        this.showError(this.getErrorMessage(
          error,
          'Unable to load the Purchase Order.'
        ));
      }
    });
  }

  // Fill the form with existing Purchase Order information.
  populateForm(order: PurchaseOrder): void {
    if (order.status !== 'Draft') {
      this.showError(
        'Only Draft Purchase Orders can be edited.'
      );

      this.router.navigate(['/purchase-orders']);
      return;
    }

    this.supplierId = order.supplierId;
    this.orderDate = this.formatDateForInput(order.orderDate);

    this.expectedDeliveryDate = order.expectedDeliveryDate
      ? this.formatDateForInput(order.expectedDeliveryDate)
      : '';

    this.taxRate = order.taxRate;
    this.notes = order.notes ?? '';

    this.orderItems = order.items.map(item => ({
      itemId: item.itemId,
      orderedQuantity: item.orderedQuantity,
      unitPrice: item.unitPrice
    }));

    if (this.orderItems.length === 0) {
      this.addItem();
    }
  }

  // Add another item row.
  addItem(): void {
    this.orderItems.push({
      itemId: 0,
      orderedQuantity: 1,
      unitPrice: 0
    });
  }

  // Remove an item row, keeping at least one row.
  removeItem(index: number): void {
    if (this.orderItems.length > 1) {
      this.orderItems.splice(index, 1);
    }
  }

  // Prevent selecting the same inventory item more than once.
  isItemAlreadySelected(itemId: number, currentIndex: number): boolean {
    if (!itemId) {
      return false;
    }

    return this.orderItems.some(
      (item, index) =>
        index !== currentIndex && item.itemId === itemId
    );
  }

  // Calculate the subtotal before tax.
  get subtotal(): number {
    return this.orderItems.reduce(
      (total, item) =>
        total + (Number(item.orderedQuantity) || 0) *
        (Number(item.unitPrice) || 0),
      0
    );
  }

  // Calculate tax using the percentage entered by the user.
  get taxAmount(): number {
    return this.subtotal * (Number(this.taxRate) || 0) / 100;
  }

  // Calculate the final Purchase Order amount.
  get totalAmount(): number {
    return this.subtotal + this.taxAmount;
  }

  // Save a new Purchase Order or update an existing Draft.
  savePurchaseOrder(): void {
    this.clearMessage();

    const validationMessage = this.validateForm();

    if (validationMessage) {
      this.showError(validationMessage);
      return;
    }

    const request: PurchaseOrderRequest = {
      supplierId: Number(this.supplierId),
      orderDate: `${this.orderDate}T00:00:00`,
      expectedDeliveryDate: this.expectedDeliveryDate
        ? `${this.expectedDeliveryDate}T00:00:00`
        : null,
      taxRate: Number(this.taxRate),
      notes: this.notes.trim() || null,
      items: this.orderItems.map(
        (item): PurchaseOrderItemRequest => ({
          itemId: Number(item.itemId),
          orderedQuantity: Number(item.orderedQuantity),
          unitPrice: Number(item.unitPrice)
        })
      )
    };

    this.isSaving = true;

    if (this.isEditMode && this.purchaseOrderId !== null) {
      this.purchaseOrderService.updatePurchaseOrder(
        this.purchaseOrderId,
        request
      ).subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/purchase-orders']);
        },
        error: (error: HttpErrorResponse) => {
          this.isSaving = false;
          this.showError(this.getErrorMessage(
            error,
            'Unable to update the Purchase Order.'
          ));
        }
      });
    } else {
      this.purchaseOrderService.createPurchaseOrder(request).subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/purchase-orders']);
        },
        error: (error: HttpErrorResponse) => {
          this.isSaving = false;
          this.showError(this.getErrorMessage(
            error,
            'Unable to create the Purchase Order.'
          ));
        }
      });
    }
  }

  // Validate the form before sending data to the backend.
  validateForm(): string | null {
    if (!this.supplierId || this.supplierId <= 0) {
      return 'Please select a supplier.';
    }

    if (!this.orderDate) {
      return 'Please select an order date.';
    }

    if (
      this.expectedDeliveryDate &&
      this.expectedDeliveryDate < this.orderDate
    ) {
      return 'Expected delivery date cannot be before the order date.';
    }

    if (
      !Number.isFinite(Number(this.taxRate)) ||
      Number(this.taxRate) < 0 ||
      Number(this.taxRate) > 100
    ) {
      return 'Tax rate must be between 0 and 100.';
    }

    if (this.notes.length > 1000) {
      return 'Notes cannot exceed 1000 characters.';
    }

    if (this.orderItems.length === 0) {
      return 'Please add at least one item.';
    }

    const selectedItemIds = this.orderItems.map(item => item.itemId);

    if (selectedItemIds.some(id => !id || id <= 0)) {
      return 'Please select an inventory item for every row.';
    }

    if (new Set(selectedItemIds).size !== selectedItemIds.length) {
      return 'The same inventory item cannot be added more than once.';
    }

    for (const item of this.orderItems) {
      if (
        !Number.isInteger(Number(item.orderedQuantity)) ||
        Number(item.orderedQuantity) <= 0
      ) {
        return 'Item quantities must be positive whole numbers.';
      }

      if (
        !Number.isFinite(Number(item.unitPrice)) ||
        Number(item.unitPrice) < 0
      ) {
        return 'Unit prices cannot be negative.';
      }
    }

    return null;
  }

  // Return to the Purchase Orders list.
  cancel(): void {
    this.router.navigate(['/purchase-orders']);
  }

  // Get today's date in YYYY-MM-DD format.
  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Convert backend date values into HTML date input format.
  private formatDateForInput(date: string): string {
    return date.substring(0, 10);
  }

  // Display an error message.
  private showError(message: string): void {
    this.message = message;
    this.messageType = 'error';
  }

  private clearMessage(): void {
    this.message = '';
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

