import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a price number for display.
 * Defaults to XAF with fr-FR locale to match existing usage in the codebase.
 */
export function formatPrice(value?: number | string | null, currency = 'XAF', locale = 'fr-FR') {
  try {
    if (value === null || value === undefined) return 'Contact for price';
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num) || num === 0) return 'Contact for price';
    return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0 }).format(num);
  } catch (e) {
    return String(value ?? 'Contact for price');
  }
}
