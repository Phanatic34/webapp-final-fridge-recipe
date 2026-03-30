import type { Ingredient } from "../types/ingredient";

type Props = {
  ingredient: Ingredient;
};

export function ExpiryBadge({ ingredient }: Props) {
  const { expiry_date, is_expired, is_near_expiry, days_until_expiry } =
    ingredient;

  if (!expiry_date) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        No expiry set
      </span>
    );
  }

  if (is_expired) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 ring-1 ring-red-200">
        Expired
        {days_until_expiry !== null && (
          <span className="ml-1 opacity-90">
            ({Math.abs(days_until_expiry)}d ago)
          </span>
        )}
      </span>
    );
  }

  if (is_near_expiry) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 ring-2 ring-amber-300">
        Near expiry
        {days_until_expiry !== null && (
          <span className="ml-1">({days_until_expiry}d left)</span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
      OK
      {days_until_expiry !== null && (
        <span className="ml-1">({days_until_expiry}d left)</span>
      )}
    </span>
  );
}
