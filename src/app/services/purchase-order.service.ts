
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  PurchaseOrder,
  PurchaseOrderRequest
} from '../models/purchase-order.models';

import { PaginationResponse } from '../models/pagination.models';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  private readonly http = inject(HttpClient);

  // Purchase Order API base URL.
  private readonly apiUrl = `${environment.apiUrl}/PurchaseOrder`;

  // Get all Purchase Orders.
  getAllPurchaseOrders(): Observable<PurchaseOrder[]> {
    return this.http.get<PurchaseOrder[]>(this.apiUrl);
  }

  // Get paginated Purchase Orders with optional search and status filtering.
  getPagedPurchaseOrders(
    pageNumber = 1,
    pageSize = 10,
    search = '',
    status = 'All'
  ): Observable<PaginationResponse<PurchaseOrder>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (status !== 'All') {
      params = params.set('status', status);
    }

    return this.http.get<PaginationResponse<PurchaseOrder>>(
      `${this.apiUrl}/paged`,
      { params }
    );
  }

  // Get one Purchase Order by ID.
  getPurchaseOrderById(
    purchaseOrderId: number
  ): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(
      `${this.apiUrl}/${purchaseOrderId}`
    );
  }

  // Create a new Purchase Order.
  createPurchaseOrder(
    request: PurchaseOrderRequest
  ): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(
      this.apiUrl,
      request
    );
  }

  // Update an existing Purchase Order.
  updatePurchaseOrder(
    purchaseOrderId: number,
    request: PurchaseOrderRequest
  ): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(
      `${this.apiUrl}/${purchaseOrderId}`,
      request
    );
  }

  // Submit a Purchase Order for approval.
  submitPurchaseOrder(
    purchaseOrderId: number
  ): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/${purchaseOrderId}/submit`,
      {}
    );
  }

  // Approve a submitted Purchase Order.
  approvePurchaseOrder(
    purchaseOrderId: number
  ): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/${purchaseOrderId}/approve`,
      {}
    );
  }

  // Mark an approved Purchase Order as ordered.
  markPurchaseOrderAsOrdered(
    purchaseOrderId: number
  ): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/${purchaseOrderId}/order`,
      {}
    );
  }

  // Cancel a Purchase Order.
  cancelPurchaseOrder(
    purchaseOrderId: number
  ): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/${purchaseOrderId}/cancel`,
      {}
    );
  }
}
