import { NEAR_EXPIRY_DAYS } from "../types/ingredient.js";

export type ExpiryMeta = {
  is_near_expiry: boolean;
  is_expired: boolean;
  days_until_expiry: number | null;
};

/**
 * Calendar day at UTC midnight from a pg `Date` or a YYYY-MM-DD string.
 * Does not use String(date) coercion — only structured UTC parts or parsed YYYY-MM-DD.
 */
function toDateOnly(value: string | Date): Date | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(
      Date.UTC(
        value.getUTCFullYear(),
        value.getUTCMonth(),
        value.getUTCDate()
      )
    );
  }

  if (typeof value === "string") {
    const ymd = value.trim().slice(0, 10);
    const [year, month, day] = ymd.split("-").map(Number);

    if (!year || !month || !day) {
      return null;
    }

    return new Date(Date.UTC(year, month - 1, day));
  }

  return null;
}

/**
 * Date-only comparison: UTC "today" vs expiry (same basis as normalizeExpiryDate for Date → string).
 */
export function computeExpiryMeta(
  expiryDate: string | Date | null | undefined
): ExpiryMeta {
  if (!expiryDate) {
    return {
      is_near_expiry: false,
      is_expired: false,
      days_until_expiry: null,
    };
  }

  const expiry = toDateOnly(expiryDate);

  if (!expiry || Number.isNaN(expiry.getTime())) {
    return {
      is_near_expiry: false,
      is_expired: false,
      days_until_expiry: null,
    };
  }

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const diffMs = expiry.getTime() - today.getTime();
  const daysUntilExpiry = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return {
    is_expired: daysUntilExpiry < 0,
    is_near_expiry:
      daysUntilExpiry >= 0 && daysUntilExpiry <= NEAR_EXPIRY_DAYS,
    days_until_expiry: daysUntilExpiry,
  };
}
