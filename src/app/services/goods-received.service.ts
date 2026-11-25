
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  GoodsReceived,
  CreateGoodsReceivedRequest
} from '../models/goods-received.models';

import { PurchaseOrder } from '../models/purchase-order.models';
import { PaginationResponse } from '../models/pagination.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoodsReceivedService {
  private readonly http = inject(HttpClient);

  // Goods Received API base URL.
  private readonly apiUrl = `${environment.apiUrl}/GoodsReceived`;

  // Get all Goods Received records.
  getAllGoodsReceived(): Observable<GoodsReceived[]> {
    return this.http.get<GoodsReceived[]>(this.apiUrl);
  }

  // Get paginated Goods Received records with optional search and status filters.
  getPagedGoodsReceived(
    pageNumber = 1,
    pageSize = 10,
    search = '',
    status = 'All'
  ): Observable<PaginationResponse<GoodsReceived>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (status !== 'All') {
      params = params.set('status', status);
    }

    return this.http.get<PaginationResponse<GoodsReceived>>(
      `${this.apiUrl}/paged`,
      { params }
    );
  }

  // Get one Goods Received record by ID.
  getGoodsReceivedById(id: number): Observable<GoodsReceived> {
    return this.http.get<GoodsReceived>(`${this.apiUrl}/${id}`);
  }

  // Get a Purchase Order that is eligible for receiving.
  getPurchaseOrderForReceiving(
    purchaseOrderId: number
  ): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(
      `${this.apiUrl}/purchase-order/${purchaseOrderId}`
    );
  }

  // Create a new Goods Received record.
  createGoodsReceived(
    request: CreateGoodsReceivedRequest
  ): Observable<GoodsReceived> {
    return this.http.post<GoodsReceived>(this.apiUrl, request);
  }

  // Confirm a Goods Received record.
  confirmGoodsReceived(id: number): Observable<GoodsReceived> {
    return this.http.patch<GoodsReceived>(
      `${this.apiUrl}/${id}/confirm`,
      {}
    );
  }

  // Cancel a Draft Goods Received record.
  cancelGoodsReceived(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/${id}/cancel`,
      {}
    );
  }

  // Release quarantined quantity.
  releaseQuarantinedQuantity(
    goodsReceivedItemId: number,
    quantity: number
  ): Observable<GoodsReceived> {
    return this.http.patch<GoodsReceived>(
      `${this.apiUrl}/items/${goodsReceivedItemId}/release-quarantine`,
      {},
      {
        params: { quantity: quantity.toString() }
      }
    );
  }
}
