import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import {
  Stock,
  StockBatch,
  CreateStockBatch,
  StockAdjustment,
  StockTransaction
} from '../models/stock.models';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private readonly http = inject(HttpClient);

  // ASP.NET Core Stock API base URL.
  // private readonly apiUrl = 'https://localhost:44347/api/Stock';
  private readonly apiUrl = `${environment.apiUrl}/Stock`;

  // Stores stock summaries in memory.
  private cachedStock: Stock[] | null = null;

  // Stores all stock batches in memory.
  private cachedBatches: StockBatch[] | null = null;

  // Get stock summaries for all inventory items.
  getAllStock(forceRefresh = false): Observable<Stock[]> {
    if (this.cachedStock !== null && !forceRefresh) {
      return new Observable(observer => {
        observer.next(this.cachedStock!);
        observer.complete();
      });
    }

    return this.http.get<Stock[]>(this.apiUrl).pipe(
      tap(stock => {
        this.cachedStock = stock;
      })
    );
  }

  // Get all stock batches across every inventory item.
  getAllBatches(forceRefresh = false): Observable<StockBatch[]> {
    if (this.cachedBatches !== null && !forceRefresh) {
      return new Observable(observer => {
        observer.next(this.cachedBatches!);
        observer.complete();
      });
    }

    return this.http.get<StockBatch[]>(
      `${this.apiUrl}/batches`
    ).pipe(
      tap(batches => {
        this.cachedBatches = batches;
      })
    );
  }

  // Get stock information for one inventory item.
  getStockByItemId(itemId: number): Observable<Stock> {
    return this.http.get<Stock>(
      `${this.apiUrl}/item/${itemId}`
    );
  }

  // Get stock batches belonging to one inventory item.
  getBatchesByItemId(itemId: number): Observable<StockBatch[]> {
    return this.http.get<StockBatch[]>(
      `${this.apiUrl}/item/${itemId}/batches`
    );
  }

  // Create a new stock batch.
  createStockBatch(request: CreateStockBatch): Observable<StockBatch> {
    return this.http.post<StockBatch>(
      `${this.apiUrl}/batches`,
      request
    ).pipe(
      tap(() => this.clearStockCache())
    );
  }

  // Adjust the quantity of an existing stock batch.
  adjustStock(request: StockAdjustment): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/adjust`,
      request
    ).pipe(
      tap(() => this.clearStockCache())
    );
  }

  // Get transaction history for a stock batch.
  getTransactionsByBatchId(
    stockBatchId: number
  ): Observable<StockTransaction[]> {
    return this.http.get<StockTransaction[]>(
      `${this.apiUrl}/batch/${stockBatchId}/transactions`
    );
  }

  // Clear cached stock data when quantities or batches change.
  clearStockCache(): void {
    this.cachedStock = null;
    this.cachedBatches = null;
  }
}