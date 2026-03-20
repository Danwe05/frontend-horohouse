/**
 * useCurrency — central currency conversion hook for HoroHouse.
 *
 * All prices in the database are stored in XAF (FCFA).
 * This hook reads the user's preferred currency from LanguageContext
 * and provides a `formatMoney` function that converts and formats any
 * XAF amount into the selected currency.
 *
 * Static exchange rates are used (no API calls needed).
 * Rates are approximate and can be updated periodically.
 */

import { useLanguage, CURRENCIES } from '@/contexts/LanguageContext';

/** Exchange rates relative to 1 XAF */
export const EXCHANGE_RATES: Record<string, number> = {
  XAF: 1,
  USD: 0.00165,
  EUR: 0.00152,
  GBP: 0.00130,
  CAD: 0.00224,
  AUD: 0.00253,
  MAD: 0.01655, // Moroccan Dirham
  NGN: 1.35,    // Nigerian Naira
  GHS: 0.02467, // Ghanaian Cedi
};

interface UseCurrencyReturn {
  /** Format a raw XAF amount into the selected currency string */
  formatMoney: (amountXAF: number | undefined | null, opts?: { compact?: boolean }) => string;
  /** The current ISO currency code, e.g. 'USD' */
  currency: string;
  /** The currency symbol, e.g. '$' */
  symbol: string;
  /** Convert a raw XAF number to the selected currency (unformatted) */
  convert: (amountXAF: number) => number;
}

export function useCurrency(): UseCurrencyReturn {
  const { currency } = useLanguage();

  const rate = EXCHANGE_RATES[currency] ?? 1;
  const currencyInfo = CURRENCIES.find((c) => c.value === currency);
  const symbol = currencyInfo?.symbol ?? currency;

  const convert = (amountXAF: number): number => {
    return amountXAF * rate;
  };

  const formatMoney = (
    amountXAF: number | undefined | null,
    opts?: { compact?: boolean }
  ): string => {
    if (amountXAF == null || isNaN(amountXAF)) return '';

    const converted = amountXAF * rate;

    // Compact mode: 1.2M, 500K etc.
    if (opts?.compact) {
      const abs = Math.abs(converted);
      let suffix = '';
      let value = converted;

      if (abs >= 1_000_000) {
        value = converted / 1_000_000;
        suffix = 'M';
      } else if (abs >= 1_000) {
        value = converted / 1_000;
        suffix = 'K';
      }

      const formatted = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
      return `${symbol}${formatted}${suffix}`;
    }

    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: currency === 'XAF' ? 0 : 2,
        minimumFractionDigits: 0,
      }).format(converted);
    } catch {
      return `${symbol}${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
  };

  return { formatMoney, currency, symbol, convert };
}

/**
 * Standalone utility for non-hook contexts (e.g. plain functions).
 * Pass the currency code explicitly.
 */
export function formatMoneyStatic(
  amountXAF: number,
  currency: string,
  compact = false
): string {
  const rate = EXCHANGE_RATES[currency] ?? 1;
  const currencyInfo = CURRENCIES.find((c) => c.value === currency);
  const symbol = currencyInfo?.symbol ?? currency;
  const converted = amountXAF * rate;

  if (compact) {
    const abs = Math.abs(converted);
    let suffix = '';
    let value = converted;
    if (abs >= 1_000_000) { value = converted / 1_000_000; suffix = 'M'; }
    else if (abs >= 1_000) { value = converted / 1_000; suffix = 'K'; }
    const formatted = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
    return `${symbol}${formatted}${suffix}`;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'XAF' ? 0 : 2,
      minimumFractionDigits: 0,
    }).format(converted);
  } catch {
    return `${symbol}${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
}
