// src/utils/format.ts

/**
 * Formats a number as currency.
 * @param amount The number to format.
 * @param currencyCode The ISO currency code (e.g., "USD", "EUR"). Defaults to "USD".
 * @param locale The locale string (e.g., "en-US", "de-DE"). Defaults to "en-US".
 * @returns A string representing the formatted currency.
 */
export const formatCurrency = (
  amount: number | null | undefined,
  currencyCode = "USD",
  locale = "en-US"
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    // Return a sensible default or placeholder for invalid input
    // For example, if 0 is a valid display, use it. Otherwise, consider "-".
    const zeroAmount = 0;
     return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(zeroAmount);
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formats a number with grouped thousands.
 * @param num The number to format.
 * @param locale The locale string (e.g., "en-US", "de-DE"). Defaults to "en-US".
 * @returns A string representing the formatted number.
 */
export const formatNumber = (
  num: number | null | undefined,
  locale = "en-US"
): string => {
  if (num === null || num === undefined || isNaN(num)) {
    return "0"; // Or some other placeholder like "-"
  }
  return new Intl.NumberFormat(locale).format(num);
};

/**
 * Formats a date object or string into a more readable format.
 * @param date The date to format (Date object, ISO string, or timestamp number).
 * @param options Intl.DateTimeFormatOptions to customize the output.
 * @param locale The locale string. Defaults to "en-US".
 * @returns A string representing the formatted date, or an empty string if date is invalid.
 */
export const formatDate = (
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  locale = "en-US"
): string => {
  if (!date) {
    return "";
  }
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) { // Check if date is valid
        return "Invalid Date";
    }
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...options,
    };
    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    console.error("Error formatting date:", error);
    return String(date); // Fallback to original string if formatting fails
  }
};