import type { Ingredient } from "../types/ingredient";

type Props = {
  ingredient: Ingredient;
};

export function ExpiryBadge({ ingredient }: Props) {
  const { expiry_date, is_expired, is_near_expiry, days_until_expiry } =
    ingredient;

  if (!expiry_date) {
    return (
      <span className="inline-flex items-center rounded-full bg-app-surface px-2 py-0.5 text-xs font-medium text-app-muted">
        未設定到期日
      </span>
    );
  }

  if (is_expired) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-app-danger ring-1 ring-red-100">
        已過期
        {days_until_expiry !== null && (
          <span className="ml-1 opacity-90">
            （{Math.abs(days_until_expiry)}天前）
          </span>
        )}
      </span>
    );
  }

  if (is_near_expiry) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-app-warning ring-1 ring-amber-100">
        即將到期
        {days_until_expiry !== null && (
          <span className="ml-1">（剩{days_until_expiry}天）</span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-app-success">
      新鮮
      {days_until_expiry !== null && (
        <span className="ml-1">（剩{days_until_expiry}天）</span>
      )}
    </span>
  );
}
