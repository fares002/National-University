import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import i18n from "@/lib/i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Locale helpers for number/currency formatting
const resolveLocale = () => {
  const lang = i18n?.language || "ar";
  return lang.startsWith("ar") ? "ar-SD" : "en-US";
};

const toNumber = (value: number | string) =>
  typeof value === "string" ? Number(value) : value;

// Formats plain numbers (no currency unit). Defaults to 0 decimals.
export function formatNumber(
  value: number | string,
  opts?: { decimals?: number; locale?: string }
): string {
  const n = toNumber(value);
  const locale = opts?.locale || resolveLocale();
  const decimals = opts?.decimals ?? 0;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

// Formats currency number. By default returns a number without a unit, to be
// combined with a translated unit like t('sdg') in the UI. Pass withUnit=true
// to append the unit using the provided unitKey (defaults to 'sdg').
export function formatCurrency(
  value: number | string,
  opts?: {
    decimals?: number;
    withUnit?: boolean;
    unitKey?: string; // i18n key for unit, e.g. 'sdg'
    locale?: string;
  }
): string {
  const base = formatNumber(value, {
    decimals: opts?.decimals ?? 0,
    locale: opts?.locale,
  });
  if (opts?.withUnit) {
    // Lazy import of i18next t via direct access to resources is avoided here;
    // let callers append t('sdg') where they already have access to t().
    // This branch is kept for convenience if a simple unit is desired.
    const unit = (opts.unitKey || "sdg").toString();
    // Return with a placeholder unit key; typical usage prefers appending t(unit)
    return `${base} ${unit}`;
  }
  return base;
}

// Flexible formatter: style='currency' will include locale currency symbol via Intl;
// style='number' (default) behaves like formatNumber.
export function formatValue(
  value: number | string,
  options?: {
    style?: "number" | "currency";
    currency?: string; // e.g., 'SDG'
    decimals?: number;
    locale?: string;
  }
): string {
  const n = toNumber(value);
  const locale = options?.locale || resolveLocale();
  const style = options?.style || "number";
  const decimals = options?.decimals ?? (style === "currency" ? 0 : 0);

  const intlOpts: Intl.NumberFormatOptions = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  };

  if (style === "currency") {
    return new Intl.NumberFormat(locale, {
      ...intlOpts,
      style: "currency",
      currency: options?.currency || "SDG",
    }).format(n);
  }

  return new Intl.NumberFormat(locale, intlOpts).format(n);
}
