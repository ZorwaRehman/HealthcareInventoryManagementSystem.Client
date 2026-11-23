
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, of, tap } from 'rxjs';

export type CurrencyCode = 'PKR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SAR';

export interface CurrencyOption {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
}

interface ExchangeRateResponse {
  date?: string;
  pkr?: Record<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private readonly storageKey = 'hims_selected_currency';

  // Fetch exchange rates through our own .NET backend.
  private readonly apiUrl = '/api/ExchangeRates/PKR';

  readonly currencies: CurrencyOption[] = [
    { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs.', flag: '🇵🇰' },
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' }
  ];

  private readonly selectedCurrencySubject =
    new BehaviorSubject<CurrencyCode>(this.getSavedCurrency());

  readonly selectedCurrency$ =
    this.selectedCurrencySubject.asObservable();

  private exchangeRates: Record<string, number> = { PKR: 1 };
  private lastUpdated: string | null = null;
  private isLoadingRates = false;
  private ratesLoadFailed = false;

  constructor(private http: HttpClient) {
    this.loadExchangeRates();
  }

  get selectedCurrency(): CurrencyCode {
    return this.selectedCurrencySubject.value;
  }

  get currentCurrency(): CurrencyOption {
    return this.currencies.find(
      currency => currency.code === this.selectedCurrency
    ) ?? this.currencies[0];
  }

  get ratesLastUpdated(): string | null {
    return this.lastUpdated;
  }

  get isRatesLoading(): boolean {
    return this.isLoadingRates;
  }

  get hasRatesLoadFailed(): boolean {
    return this.ratesLoadFailed;
  }

  setCurrency(currency: CurrencyCode): void {
    const isSupported = this.currencies.some(
      option => option.code === currency
    );

    if (!isSupported) {
      return;
    }

    localStorage.setItem(this.storageKey, currency);
    this.selectedCurrencySubject.next(currency);
  }

  loadExchangeRates(): void {
    if (this.isLoadingRates) {
      return;
    }

    this.isLoadingRates = true;
    this.ratesLoadFailed = false;

    this.http.get<ExchangeRateResponse>(this.apiUrl).pipe(

      tap(response => {
        const rates = response['pkr'];

        if (
          !rates ||
          typeof rates['usd'] !== 'number' ||
          typeof rates['eur'] !== 'number' ||
          typeof rates['gbp'] !== 'number' ||
          typeof rates['aed'] !== 'number' ||
          typeof rates['sar'] !== 'number'
        ) {
          throw new Error('Invalid currency exchange rate response.');
        }

        // Convert lowercase API currency codes to uppercase.
        this.exchangeRates = {
          ...Object.fromEntries(
            Object.entries(rates).map(([code, rate]) => [
              code.toUpperCase(),
              rate
            ])
          ),
          PKR: 1
        };

        this.lastUpdated = response['date'] ?? null;
        this.ratesLoadFailed = false;

        // Notify components that exchange rates are available.
        this.selectedCurrencySubject.next(this.selectedCurrency);
      }),

      catchError(error => {
        console.error(
          'Unable to load exchange rates from the backend:',
          error
        );

        this.ratesLoadFailed = true;
        return of(null);
      })

    ).subscribe(() => {
      this.isLoadingRates = false;
    });
  }

  convertFromPKR(amount: number): number {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return 0;
    }

    if (this.selectedCurrency === 'PKR') {
      return value;
    }

    const rate = this.exchangeRates[this.selectedCurrency];

    if (
      typeof rate !== 'number' ||
      !Number.isFinite(rate) ||
      rate <= 0
    ) {
      return value;
    }

    return value * rate;
  }

  formatPrice(amount: number): string {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return this.formatCurrency(0, 'PKR');
    }

    if (this.selectedCurrency === 'PKR') {
      return this.formatCurrency(value, 'PKR');
    }

    const rate = this.exchangeRates[this.selectedCurrency];

    // Never display an unconverted amount with a foreign currency symbol.
    if (
      typeof rate !== 'number' ||
      !Number.isFinite(rate) ||
      rate <= 0
    ) {
      return `${this.formatCurrency(value, 'PKR')} (rate unavailable)`;
    }

    return this.formatCurrency(
      value * rate,
      this.selectedCurrency
    );
  }

  getExchangeRate(currency: CurrencyCode): number | null {
    return this.exchangeRates[currency] ?? null;
  }

  private formatCurrency(
    amount: number,
    currency: CurrencyCode
  ): string {
    const locale = currency === 'PKR' ? 'en-PK' : 'en-US';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  private getSavedCurrency(): CurrencyCode {
    const savedCurrency = localStorage.getItem(this.storageKey);

    const supportedCurrencies: CurrencyCode[] = [
      'PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'
    ];

    return supportedCurrencies.includes(savedCurrency as CurrencyCode)
      ? savedCurrency as CurrencyCode
      : 'PKR';
  }
}
