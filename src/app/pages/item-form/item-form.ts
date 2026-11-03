
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Item, ItemRequest } from '../../models/item.models';
import { ItemService } from '../../services/item.service';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './item-form.html',
  styleUrl: './item-form.css',
})
export class ItemForm implements OnInit {
  private readonly itemService = inject(ItemService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Determines whether the form is adding or editing an item.
  editingId: number | null = null;

  isSaving = false;
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' = 'error';

  categories: string[] = [
    'Protective Equipment',
    'Medical Devices',
    'First Aid',
    'Medical Supplies',
  ];

  formItem: ItemRequest = this.emptyItem();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id !== null) {
      const parsedId = Number(id);

      if (!Number.isInteger(parsedId) || parsedId <= 0) {
        this.router.navigate(['/items']);
        return;
      }

      this.editingId = parsedId;
      this.loadItem(parsedId);
    }
  }

  // Create an empty item for the Add page.
  emptyItem(): ItemRequest {
    return {
      name: '',
      description: null,
      category: 'Protective Equipment',
      sku: '',
      unit: 'Piece',
      reorderLevel: 0,
      imageUrl: null,
    };
  }

  // Retrieve the selected item for the Edit page.
  loadItem(id: number): void {
    this.isLoading = true;
    this.message = '';

    this.itemService.getItemById(id).subscribe({
      next: (item: Item) => {
        this.formItem = {
          name: item.name,
          description: item.description,
          category: item.category,
          sku: item.sku,
          unit: item.unit,
          reorderLevel: item.reorderLevel,
          imageUrl: item.imageUrl,
        };

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading item:', error);

        this.message =
          error.error?.message || 'Unable to load item details.';

        this.messageType = 'error';
        this.isLoading = false;
      },
    });
  }

  // Validate and prepare the item request.
  private prepareRequest(): ItemRequest | null {
    const request: ItemRequest = {
      name: this.formItem.name.trim(),
      description: this.formItem.description?.trim() || null,
      category: this.formItem.category.trim(),
      sku: this.formItem.sku.trim(),
      unit: this.formItem.unit.trim(),
      reorderLevel: Number(this.formItem.reorderLevel),
      imageUrl: this.formItem.imageUrl?.trim() || null,
    };

    if (
      !request.name ||
      !request.category ||
      !request.sku ||
      !request.unit ||
      !Number.isInteger(request.reorderLevel) ||
      request.reorderLevel < 0
    ) {
      this.message = 'Please enter valid item details.';
      this.messageType = 'error';
      return null;
    }

    // Check the image URL only when one is provided.
    if (request.imageUrl) {
      try {
        const url = new URL(request.imageUrl);

        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          throw new Error('Invalid URL protocol');
        }
      } catch {
        this.message = 'Please enter a valid image URL.';
        this.messageType = 'error';
        return null;
      }
    }

    return request;
  }

  // Save a new item or update an existing item.
  saveItem(): void {
    if (this.isSaving || this.isLoading) {
      return;
    }

    this.message = '';

    const request = this.prepareRequest();

    if (request === null) {
      return;
    }

    this.isSaving = true;

    const isEditing = this.editingId !== null;

    const saveRequest = isEditing
      ? this.itemService.updateItem(this.editingId!, request)
      : this.itemService.createItem(request);

    saveRequest.subscribe({
      next: () => {
        // Clear the cached list so the Items page loads fresh data.
        this.itemService.clearItemsCache();

        // Return to the inventory list with a success message.
        this.router.navigate(['/items'], {
          state: {
            successMessage: isEditing
              ? 'Item updated successfully!'
              : 'Item added successfully!',
          },
        });
      },
      error: (error) => {
        console.error('Error saving item:', error);

        this.message =
          error.error?.message ||
          error.error?.title ||
          (isEditing
            ? 'Unable to update item. Please try again.'
            : 'Unable to add item. Please try again.');

        this.messageType = 'error';
        this.isSaving = false;
      },
    });
  }

  // Return to the inventory list without saving.
  cancel(): void {
    if (!this.isSaving) {
      this.router.navigate(['/items']);
    }
  }
}
