
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
    // Return cached data if it exists and refresh is not requested.
    if (this.cachedItems !== null && !forceRefresh) {
      return of(this.cachedItems);
    }

    // Fetch fresh inventory from the API.
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

  // Add a new item and update the cache.
  createItem(request: ItemRequest): Observable<Item> {
    return this.http.post<Item>(this.apiUrl, request).pipe(
      tap(newItem => {
        if (this.cachedItems !== null) {
          this.cachedItems = [...this.cachedItems, newItem];
        }
      })
    );
  }

  // Update an existing item and update the cache.
  updateItem(id: number, request: ItemRequest): Observable<Item> {
    return this.http.put<Item>(`${this.apiUrl}/${id}`, request).pipe(
      tap(updatedItem => {
        if (this.cachedItems !== null) {
          this.cachedItems = this.cachedItems.map(item =>
            item.id === id ? updatedItem : item
          );
        }
      })
    );
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
