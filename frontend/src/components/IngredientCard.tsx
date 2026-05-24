import { motion } from "framer-motion";
import type { Ingredient } from "../types/ingredient";
import { ExpiryBadge } from "./ExpiryBadge";
import { CATEGORY_LABELS, STATUS_LABELS } from "../utils/labels";

type Props = {
  ingredient: Ingredient;
  onEdit: (ing: Ingredient) => void;
  onDelete: (ing: Ingredient) => void;
};

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) {
    return (
      <span className="rounded bg-app-surface px-2 py-0.5 text-xs text-app-muted">
        未分類
      </span>
    );
  }
  return (
    <span className="rounded bg-app-surface px-2 py-0.5 text-xs font-medium text-app-muted">
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}

function StatusTag({ status }: { status: string }) {
  const styles: Record<string, string> = {
    fresh:  "bg-emerald-50 text-app-success ring-emerald-100",
    opened: "bg-app-surface text-app-muted ring-app-border",
    frozen: "bg-app-surface text-app-muted ring-app-border",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${styles[status] ?? "bg-app-surface text-app-muted ring-app-border"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function formatQuantity(ingredient: Ingredient) {
  const count =
    ingredient.count_quantity != null && ingredient.count_unit
      ? `${ingredient.count_quantity} ${ingredient.count_unit}`
      : null;
  const measure =
    ingredient.measure_quantity != null && ingredient.measure_unit
      ? `${ingredient.measure_quantity} ${ingredient.measure_unit}`
      : null;

  if (count && measure) return `${count}，約 ${measure}`;
  return count ?? measure ?? "未填數量";
}

export function IngredientCard({ ingredient, onEdit, onDelete }: Props) {
  const expiryLabel = ingredient.expiry_date
    ? new Date(ingredient.expiry_date + "T12:00:00Z").toLocaleDateString("zh-TW", {
        year: "numeric", month: "short", day: "numeric",
      })
    : null;

  return (
    <motion.article
      className="flex flex-col rounded-xl border border-app-border bg-app-card p-4 shadow-sm"
      whileHover={{ y: -3, boxShadow: "0 2px 4px rgba(23,42,33,0.06), 0 12px 32px rgba(23,42,33,0.08)" }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
    >
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight text-app-text">
            {ingredient.name}
          </h3>
          <CategoryBadge category={ingredient.category} />
        </div>
        <p className="text-sm text-app-muted">
          <span className="font-medium text-app-text">
            {formatQuantity(ingredient)}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <StatusTag status={ingredient.status} />
          <ExpiryBadge ingredient={ingredient} />
        </div>
        {expiryLabel && (
          <p className="text-xs text-app-muted">
            到期：<span className="text-app-text">{expiryLabel}</span>
          </p>
        )}
      </div>
      <div className="mt-4 flex gap-2 border-t border-app-border pt-3">
        <button
          type="button"
          onClick={() => onEdit(ingredient)}
          className="flex-1 rounded-lg border border-app-border bg-white py-2 text-sm font-medium text-app-text transition hover:bg-app-surface"
        >
          編輯
        </button>
        <button
          type="button"
          onClick={() => onDelete(ingredient)}
          className="flex-1 rounded-lg border border-red-100 bg-white py-2 text-sm font-medium text-app-danger transition hover:bg-red-50"
        >
          刪除
        </button>
      </div>
    </motion.article>
  );
}
