/**
 * @project AncestorTree
 * @file src/lib/format.ts
 * @description Shared formatting utilities
 * @version 1.1.0
 * @updated 2026-02-26
 */

import { LOCALE } from './constants';

export function formatVND(amount: number): string {
  return new Intl.NumberFormat(LOCALE).format(amount) + 'đ';
}

/**
 * Format a date string or Date object to Vietnamese locale.
 * Uses 'vi-VN' locale by default. Pass custom options for different formats.
 */
export function formatDate(
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString(LOCALE, options);
}
