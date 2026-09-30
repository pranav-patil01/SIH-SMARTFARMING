/**
 * src/lib/utils.ts
 * Common utility functions for styling and formatting.
 */

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatNumber(num: number, decimals: number = 1): string {
  return Number(num).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatLitres(litres: number): string {
  if (litres >= 1000000) {
    return `${(litres / 1000000).toFixed(2)} ML`;
  }
  if (litres >= 1000) {
    return `${(litres / 1000).toFixed(1)} kL`;
  }
  return `${Math.round(litres)} L`;
}
