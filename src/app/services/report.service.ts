
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

import { CurrencyCode } from './currency.service';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly http = inject(HttpClient);

  // Report API base URL.
  private readonly apiUrl = `${environment.apiUrl}/Report`;

  // ==========================================
  // GET REPORT DATA
  // ==========================================

  // Get Stock Summary Report.
  getStockSummary(): Observable<StockReport[]> {
    return this.http.get<StockReport[]>(`${this.apiUrl}/stock-summary`);
  }

  // Get Low Stock Report.
  getLowStockReport(): Observable<LowStockReport[]> {
    return this.http.get<LowStockReport[]>(`${this.apiUrl}/low-stock`);
  }

  // Get Expiry Report.
  getExpiryReport(): Observable<ExpiryReport[]> {
    return this.http.get<ExpiryReport[]>(`${this.apiUrl}/expiry`);
  }

  // Get Stock Transactions Report.
  getStockTransactionsReport(): Observable<StockTransactionReport[]> {
    return this.http.get<StockTransactionReport[]>(
      `${this.apiUrl}/stock-transactions`
    );
  }

  // Get Purchase Orders Report.
  getPurchaseOrdersReport(): Observable<PurchaseReport[]> {
    return this.http.get<PurchaseReport[]>(
      `${this.apiUrl}/purchase-orders`
    );
  }

  // Get Goods Received Report.
  getGoodsReceivedReport(): Observable<GoodsReceivedReport[]> {
    return this.http.get<GoodsReceivedReport[]>(
      `${this.apiUrl}/goods-received`
    );
  }

  // Get Supplier Report.
  getSupplierReport(): Observable<SupplierReport[]> {
    return this.http.get<SupplierReport[]>(
      `${this.apiUrl}/suppliers`
    );
  }

  // Get Inventory Valuation Report.
  getInventoryValuationReport(): Observable<InventoryValuationReport[]> {
    return this.http.get<InventoryValuationReport[]>(
      `${this.apiUrl}/inventory-valuation`
    );
  }

  // ==========================================
  // EXCEL EXPORTS
  // ==========================================

  // Download Stock Summary Excel report.
  exportStockSummaryExcel(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/stock-summary/excel`,
      { responseType: 'blob' }
    );
  }

  // Download Low Stock Excel report.
  exportLowStockExcel(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/low-stock/excel`,
      { responseType: 'blob' }
    );
  }

  // Download Expiry Excel report.
  exportExpiryExcel(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/expiry/excel`,
      { responseType: 'blob' }
    );
  }

  // Download Stock Transactions Excel report.
  exportStockTransactionsExcel(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/stock-transactions/excel`,
      { responseType: 'blob' }
    );
  }

  // Download Purchase Orders Excel report.
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

  // Download Goods Received Excel report.
  exportGoodsReceivedExcel(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/goods-received/excel`,
      { responseType: 'blob' }
    );
  }

  // Download Supplier Excel report.
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

  // Download Inventory Valuation Excel report.
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

  // Download Stock Summary PDF report.
  exportStockSummaryPdf(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/stock-summary/pdf`,
      { responseType: 'blob' }
    );
  }

  // Download Low Stock PDF report.
  exportLowStockPdf(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/low-stock/pdf`,
      { responseType: 'blob' }
    );
  }

  // Download Expiry PDF report.
  exportExpiryPdf(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/expiry/pdf`,
      { responseType: 'blob' }
    );
  }

  // Download Stock Transactions PDF report.
  exportStockTransactionsPdf(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/stock-transactions/pdf`,
      { responseType: 'blob' }
    );
  }

  // Download Purchase Orders PDF report.
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

  // Download Goods Received PDF report.
  exportGoodsReceivedPdf(): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/goods-received/pdf`,
      { responseType: 'blob' }
    );
  }

  // Download Supplier PDF report.
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

  // Download Inventory Valuation PDF report.
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

  // Prepare currency parameters for supported monetary exports.
  private getCurrencyParams(
    currencyCode: CurrencyCode,
    exchangeRate: number
  ): HttpParams {
    return new HttpParams()
      .set('currencyCode', currencyCode)
      .set('exchangeRate', exchangeRate.toString());
  }
}
