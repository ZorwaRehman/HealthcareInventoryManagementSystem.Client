import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { Supplier, SupplierRequest } from '../models/supplier.models';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private readonly http = inject(HttpClient);

  // Supplier API base URL.
  private readonly apiUrl = `${environment.apiUrl}/Suppliers`;

  // Stores suppliers in memory while the application is running.
  private cachedSuppliers: Supplier[] | null = null;

  // Get all suppliers, using cached data when available.
  getSuppliers(forceRefresh = false): Observable<Supplier[]> {
    if (this.cachedSuppliers !== null && !forceRefresh) {
      return new Observable((observer) => {
        observer.next(this.cachedSuppliers!);
        observer.complete();
      });
    }

    return this.http.get<Supplier[]>(this.apiUrl).pipe(
      tap((suppliers) => {
        this.cachedSuppliers = suppliers;
      }),
    );
  }

  // Get one supplier by ID.
  getSupplierById(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.apiUrl}/${id}`);
  }

  // Create a new supplier.
  createSupplier(request: SupplierRequest): Observable<Supplier> {
    return this.http.post<Supplier>(this.apiUrl, request).pipe(
      tap(() => {
        this.clearSuppliersCache();
      }),
    );
  }

  // Update an existing supplier.
  updateSupplier(id: number, request: SupplierRequest): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.apiUrl}/${id}`, request).pipe(
      tap(() => {
        this.clearSuppliersCache();
      }),
    );
  }

  // Deactivate a supplier instead of permanently deleting it.
  deactivateSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        if (this.cachedSuppliers !== null) {
          this.cachedSuppliers = this.cachedSuppliers.map((supplier) =>
            supplier.supplierId === id ? { ...supplier, isActive: false } : supplier,
          );
        }
      }),
    );
  }

  // Reactivate an inactive supplier.
  reactivateSupplier(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/reactivate`, {}).pipe(
      tap(() => {
        this.clearSuppliersCache();
      }),
    );
  }

  // Clear cached supplier data when fresh data is needed.
  clearSuppliersCache(): void {
    this.cachedSuppliers = null;
  }
}
