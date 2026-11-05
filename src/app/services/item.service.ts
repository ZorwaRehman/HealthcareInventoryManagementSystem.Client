
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';

import { Item, ItemRequest } from '../models/item.models';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private readonly http = inject(HttpClient);

  // ASP.NET Core Items API base URL.
  private readonly apiUrl = 'https://localhost:44347/api/Items';

  // Stores inventory items in memory while the app is running.
  private cachedItems: Item[] | null = null;

  // Get all items, using the cache when available.
  getItems(forceRefresh = false): Observable<Item[]> {
    if (this.cachedItems !== null && !forceRefresh) {
      return of(this.cachedItems);
    }

    return this.http.get<Item[]>(this.apiUrl).pipe(
      tap(items => {
        this.cachedItems = items;
      })
    );
  }

  // Get one item by its ID.
  getItemById(id: number): Observable<Item> {
    return this.http.get<Item>(`${this.apiUrl}/${id}`);
  }

  // Search items by name.
  searchItems(name: string): Observable<Item[]> {
    return this.http.get<Item[]>(
      `${this.apiUrl}/search`,
      { params: { name } }
    );
  }

  // Add a new item with an optional image.
  createItem(
    request: ItemRequest,
    image: File | null = null
  ): Observable<Item> {
    const formData = this.createFormData(request, image);

    return this.http.post<Item>(this.apiUrl, formData).pipe(
      tap(newItem => {
        if (this.cachedItems !== null) {
          this.cachedItems = [...this.cachedItems, newItem];
        }
      })
    );
  }

  // Update an existing item with an optional replacement image.
  updateItem(
    id: number,
    request: ItemRequest,
    image: File | null = null
  ): Observable<Item> {
    const formData = this.createFormData(request, image);

    return this.http.put<Item>(
      `${this.apiUrl}/${id}`,
      formData
    ).pipe(
      tap(updatedItem => {
        if (this.cachedItems !== null) {
          this.cachedItems = this.cachedItems.map(item =>
            item.id === id ? updatedItem : item
          );
        }
      })
    );
  }

  // Convert item details and an optional image into FormData.
  private createFormData(
    request: ItemRequest,
    image: File | null
  ): FormData {
    const formData = new FormData();

    formData.append('name', request.name);
    formData.append('description', request.description ?? '');
    formData.append('category', request.category);
    formData.append('sku', request.sku);
    formData.append('unit', request.unit);
    formData.append('reorderLevel', String(request.reorderLevel));

    // Attach the image only when the user selects one.
    if (image) {
      formData.append('image', image, image.name);
    }

    return formData;
  }

  // Delete an item and update the cache.
  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        if (this.cachedItems !== null) {
          this.cachedItems = this.cachedItems.filter(
            item => item.id !== id
          );
        }
      })
    );
  }

  // Clear the cache when fresh data is required.
  clearItemsCache(): void {
    this.cachedItems = null;
  }
}
