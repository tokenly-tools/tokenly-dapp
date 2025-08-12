export type DateLike = Date | number | string | bigint

function toDate(value: DateLike): Date {
  if (value instanceof Date) return value
  // Accept unix seconds or ms. If value looks like seconds, callers should multiply
  // before passing, or use formatHHMM.
  const asNumber = typeof value === 'bigint' ? Number(value) : Number(value)
  return new Date(asNumber)
}

/**
 * Format date to a compact string without seconds or milliseconds.
 * Example: 2025, Jan 07, 14:05 (24h clock by default)
 */
export function formatDateTimeNoSeconds(
  value: DateLike,
  locales?: Intl.LocalesArgument,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = toDate(value)
  const baseOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options
  }
  return new Intl.DateTimeFormat(locales, baseOptions).format(date)
}

/**
 * Convenience for unix timestamps in seconds.
 */
export function formatHHMM(
  unixSeconds: number | string | bigint,
  locales?: Intl.LocalesArgument,
  options?: Intl.DateTimeFormatOptions
): string {
  const asNumber =
    typeof unixSeconds === 'bigint' ? Number(unixSeconds) : Number(unixSeconds)
  return formatDateTimeNoSeconds(asNumber * 1000, locales, options)
}
