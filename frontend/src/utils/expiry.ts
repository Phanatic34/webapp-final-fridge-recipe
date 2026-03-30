import { NEAR_EXPIRY_DAYS } from "../types/ingredient";

/** Client-side helper for display when API meta is not used */
export function computeExpiryMeta(expiryDate: string | null): {
  days_until_expiry: number | null;
  is_expired: boolean;
  is_near_expiry: boolean;
} {
  if (!expiryDate) {
    return {
      days_until_expiry: null,
      is_expired: false,
      is_near_expiry: false,
    };
  }
  const [y, m, d] = expiryDate.split("-").map(Number);
  const expUTC = Date.UTC(y, m - 1, d);
  const now = new Date();
  const todayUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const diffMs = expUTC - todayUTC;
  const days = Math.round(diffMs / (24 * 60 * 60 * 1000));
  const is_expired = days < 0;
  const is_near_expiry = !is_expired && days <= NEAR_EXPIRY_DAYS;
  return {
    days_until_expiry: days,
    is_expired,
    is_near_expiry,
  };
}
