
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import {
  StockReport,
  LowStockReport,
  ExpiryReport,
  StockTransactionReport,
  PurchaseReport,
  GoodsReceivedReport,
  SupplierReport,
  InventoryValuationReport
} from '../models/report.models';

import { PaginationResponse } from '../models/pagination.models';
import { CurrencyCode } from './currency.service';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly http = inject(HttpClient);

  // Report API base URL.
  private readonly apiUrl = `${environment.apiUrl}/Report`;

  // ==========================================
  // GET COMPLETE REPORT DATA
  // ==========================================

  getStockSummary(): Observable<StockReport[]> {
    return this.http.get<StockReport[]>(`${this.apiUrl}/stock-summary`);
  }

  getLowStockReport(): Observable<LowStockReport[]> {
    return this.http.get<LowStockReport[]>(`${this.apiUrl}/low-stock`);
  }

  getExpiryReport(): Observable<ExpiryReport[]> {
    return this.http.get<ExpiryReport[]>(`${this.apiUrl}/expiry`);
  }

  getStockTransactionsReport(): Observable<StockTransactionReport[]> {
    return this.http.get<StockTransactionReport[]>(
      `${this.apiUrl}/stock-transactions`
    );
  }

  getPurchaseOrdersReport(): Observable<PurchaseReport[]> {
    return this.http.get<PurchaseReport[]>(
      `${this.apiUrl}/purchase-orders`
    );
  }

  getGoodsReceivedReport(): Observable<GoodsReceivedReport[]> {
    return this.http.get<GoodsReceivedReport[]>(
      `${this.apiUrl}/goods-received`
    );
  }

  getSupplierReport(): Observable<SupplierReport[]> {
    return this.http.get<SupplierReport[]>(
      `${this.apiUrl}/suppliers`
    );
  }

  getInventoryValuationReport(): Observable<InventoryValuationReport[]> {
    return this.http.get<InventoryValuationReport[]>(
      `${this.apiUrl}/inventory-valuation`
    );
  }

  // ==========================================
  // PAGINATED REPORT DATA
  // ==========================================

  private getPagedReport<T>(
    reportType: string,
    pageNumber: number,
    pageSize: number,
    search: string = '',
    status: string = 'All'
  ): Observable<PaginationResponse<T>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (status !== 'All') {
      params = params.set('status', status);
    }

    return this.http.get<PaginationResponse<T>>(
      `${this.apiUrl}/${reportType}/paged`,
      { params }
    );
  }

  getPagedStockSummary(
    pageNumber = 1,
    pageSize = 10,
    search = '',
    status = 'All'
  ): Observable<PaginationResponse<StockReport>> {
    return this.getPagedReport(
      'stock-summary', pageNumber, pageSize, search, status
    );
  }

  getPagedLowStockReport(
    pageNumber = 1,
    pageSize = 10,
    search = '',
    status = 'All'
  ): Observable<PaginationResponse<LowStockReport>> {
    return this.getPagedReport(
      'low-stock', pageNumber, pageSize, search, status
    );
  }

  getPagedExpiryReport(
    pageNumber = 1,
    pageSize = 10,
    search = '',
    status = 'All'
  ): Observable<PaginationResponse<ExpiryReport>> {
    return this.getPagedReport(
      'expiry', pageNumber, pageSize, search, status
    );
  }

  getPagedStockTransactionsReport(
    pageNumber = 1,
    pageSize = 10,
    search = '',
    status = 'All'
  ): Observable<PaginationResponse<StockTransactionReport>> {
    return this.getPagedReport(
      'stock-transactions', pageNumber, pageSize, search, status
    );
  }

  getPagedPurchaseOrdersReport(
    pageNumber = 1,
    pageSize = 10,
    search = '',
    status = 'All'
  ): Observable<PaginationResponse<PurchaseReport>> {
    return this.getPagedReport(
      'purchase-orders', pageNumber, pageSize, search, status
    );
  }

  getPagedGoodsReceivedReport(
    pageNumber = 1,
    pageSize = 10,
    search = '',
    status = 'All'
  ): Observable<PaginationResponse<GoodsReceivedReport>> {
    return this.getPagedReport(
      'goods-received', pageNumber, pageSize, search, status
    );
  }

  getPagedSupplierReport(
    pageNumber = 1,
    pageSize = 10,
    search = '',
    status = 'All'
  ): Observable<PaginationResponse<SupplierReport>> {
    return this.getPagedReport(
      'suppliers', pageNumber, pageSize, search, status
    );
  }

  getPagedInventoryValuationReport(
    pageNumber = 1,
    pageSize = 10,
    search = '',
    status = 'All'
  ): Observable<PaginationResponse<InventoryValuationReport>> {
    return this.getPagedReport(
      'inventory-valuation', pageNumber, pageSize, search, status
    );
  }

  // ==========================================
  // EXCEL EXPORTS
  // ==========================================

  exportStockSummaryExcel(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/stock-summary/excel`,
      { responseType: 'blob' }
    );
  }

  exportLowStockExcel(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/low-stock/excel`,
      { responseType: 'blob' }
    );
  }

  exportExpiryExcel(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/expiry/excel`,
      { responseType: 'blob' }
    );
  }

  exportStockTransactionsExcel(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/stock-transactions/excel`,
      { responseType: 'blob' }
    );
  }

  exportPurchaseOrdersExcel(
    currencyCode: CurrencyCode,
    exchangeRate: number
  ): Observable<Blob> {
    const params = this.getCurrencyParams(currencyCode, exchangeRate);

    return this.http.get(
      `${this.apiUrl}/purchase-orders/excel`,
      { params, responseType: 'blob' }
    );
  }

  exportGoodsReceivedExcel(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/goods-received/excel`,
      { responseType: 'blob' }
    );
  }

  exportSupplierExcel(
    currencyCode: CurrencyCode,
    exchangeRate: number
  ): Observable<Blob> {
    const params = this.getCurrencyParams(currencyCode, exchangeRate);

    return this.http.get(
      `${this.apiUrl}/suppliers/excel`,
      { params, responseType: 'blob' }
    );
  }

  exportInventoryValuationExcel(
    currencyCode: CurrencyCode,
    exchangeRate: number
  ): Observable<Blob> {
    const params = this.getCurrencyParams(currencyCode, exchangeRate);

    return this.http.get(
      `${this.apiUrl}/inventory-valuation/excel`,
      { params, responseType: 'blob' }
    );
  }

  // ==========================================
  // PDF EXPORTS
  // ==========================================

  exportStockSummaryPdf(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/stock-summary/pdf`,
      { responseType: 'blob' }
    );
  }

  exportLowStockPdf(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/low-stock/pdf`,
      { responseType: 'blob' }
    );
  }

  exportExpiryPdf(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/expiry/pdf`,
      { responseType: 'blob' }
    );
  }

  exportStockTransactionsPdf(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/stock-transactions/pdf`,
      { responseType: 'blob' }
    );
  }

  exportPurchaseOrdersPdf(
    currencyCode: CurrencyCode,
    exchangeRate: number
  ): Observable<Blob> {
    const params = this.getCurrencyParams(currencyCode, exchangeRate);

    return this.http.get(
      `${this.apiUrl}/purchase-orders/pdf`,
      { params, responseType: 'blob' }
    );
  }

  exportGoodsReceivedPdf(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/goods-received/pdf`,
      { responseType: 'blob' }
    );
  }

  exportSupplierPdf(
    currencyCode: CurrencyCode,
    exchangeRate: number
  ): Observable<Blob> {
    const params = this.getCurrencyParams(currencyCode, exchangeRate);

    return this.http.get(
      `${this.apiUrl}/suppliers/pdf`,
      { params, responseType: 'blob' }
    );
  }

  exportInventoryValuationPdf(
    currencyCode: CurrencyCode,
    exchangeRate: number
  ): Observable<Blob> {
    const params = this.getCurrencyParams(currencyCode, exchangeRate);

    return this.http.get(
      `${this.apiUrl}/inventory-valuation/pdf`,
      { params, responseType: 'blob' }
    );
  }

  // ==========================================
  // PRIVATE HELPERS
  // ==========================================

  private getCurrencyParams(
    currencyCode: CurrencyCode,
    exchangeRate: number
  ): HttpParams {
    return new HttpParams()
      .set('currencyCode', currencyCode)
      .set('exchangeRate', exchangeRate.toString());
  }
}
