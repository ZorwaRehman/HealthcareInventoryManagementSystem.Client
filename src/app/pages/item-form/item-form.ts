
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
export class ItemForm implements OnInit, OnDestroy {
  private readonly itemService = inject(ItemService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // API base URL used to display images saved by the backend.
  private readonly apiBaseUrl = 'https://localhost:44347';

  // Determines whether the form is adding or editing an item.
  editingId: number | null = null;

  isSaving = false;
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' = 'error';

  // Stores the newly selected image file.
  selectedImage: File | null = null;

  // Stores the image URL used for the preview.
  imagePreviewUrl: string | null = null;

  // Stores the existing image when editing.
  existingImageUrl: string | null = null;

  // Stores the temporary preview URL so it can be released.
  private temporaryImageUrl: string | null = null;

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

      // Get the selected item passed from the Items page.
      const selectedItem = window.history.state?.item as Item | undefined;

      // Use the selected item immediately if its ID matches the URL.
      if (selectedItem && selectedItem.id === parsedId) {
        this.populateForm(selectedItem);
      } else {
        // Fetch the item if the page is opened directly or refreshed.
        this.loadItem(parsedId);
      }
    }
  }

  // Release the temporary preview URL when leaving the component.
  ngOnDestroy(): void {
    this.releaseTemporaryImageUrl();
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

  // Fill the form using the selected item's details.
  populateForm(item: Item): void {
    this.formItem = {
      name: item.name,
      description: item.description,
      category: item.category,
      sku: item.sku,
      unit: item.unit,
      reorderLevel: item.reorderLevel,
      imageUrl: null,
    };

    // Keep the existing image available during editing.
    this.existingImageUrl = item.imageUrl
      ? this.getImageUrl(item.imageUrl)
      : null;

    this.imagePreviewUrl = this.existingImageUrl;

    this.selectedImage = null;

    this.isLoading = false;
  }

  // Convert a backend image path into a complete browser URL.
  private getImageUrl(imageUrl: string): string {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    return `${this.apiBaseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  // Handle image selection from the computer.
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    // Validate the selected image type.
    if (!allowedTypes.includes(file.type)) {
      this.message = 'Only JPG, JPEG, PNG, and WEBP images are allowed.';
      this.messageType = 'error';
      input.value = '';
      return;
    }

    // Validate image size (5 MB maximum).
    if (file.size > 5 * 1024 * 1024) {
      this.message = 'Image size cannot exceed 5 MB.';
      this.messageType = 'error';
      input.value = '';
      return;
    }

    this.message = '';

    // Release the previous temporary preview URL.
    this.releaseTemporaryImageUrl();

    this.selectedImage = file;

    // Generate a temporary URL for the selected image preview.
    this.temporaryImageUrl = URL.createObjectURL(file);
    this.imagePreviewUrl = this.temporaryImageUrl;
  }

  // Remove the newly selected image and return to the existing image.
  removeSelectedImage(): void {
    this.selectedImage = null;

    this.releaseTemporaryImageUrl();

    this.imagePreviewUrl = this.existingImageUrl;
  }

  // Release the temporary browser image URL.
  private releaseTemporaryImageUrl(): void {
    if (this.temporaryImageUrl) {
      URL.revokeObjectURL(this.temporaryImageUrl);
      this.temporaryImageUrl = null;
    }
  }

  // Retrieve the selected item from the backend when navigation data is unavailable.
  loadItem(id: number): void {
    this.isLoading = true;
    this.message = '';

    this.itemService.getItemById(id).subscribe({
      next: (item: Item) => {
        this.populateForm(item);
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

      // Image is now uploaded as a file, not as a URL.
      imageUrl: null,
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
      ? this.itemService.updateItem(
          this.editingId!,
          request,
          this.selectedImage
        )
      : this.itemService.createItem(
          request,
          this.selectedImage
        );

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
