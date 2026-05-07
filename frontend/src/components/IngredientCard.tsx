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
      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
        未分類
      </span>
    );
  }
  return (
    <span className="rounded bg-[#1B2E22]/10 px-2 py-0.5 text-xs font-medium text-[#1B2E22]">
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}

function StatusTag({ status }: { status: string }) {
  const styles: Record<string, string> = {
    fresh: "bg-green-50 text-green-800 ring-green-200",
    opened: "bg-blue-50 text-blue-800 ring-blue-200",
    frozen: "bg-cyan-50 text-cyan-800 ring-cyan-200",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${styles[status] ?? "bg-slate-50 text-slate-700 ring-slate-200"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function IngredientCard({ ingredient, onEdit, onDelete }: Props) {
  const highlight =
    ingredient.is_expired || ingredient.is_near_expiry
      ? ingredient.is_expired
        ? "ring-2 ring-red-300 bg-red-50/40"
        : "ring-2 ring-amber-300 bg-amber-50/30"
      : "ring-1 ring-[#E5E7EB] bg-white";

  const expiryLabel = ingredient.expiry_date
    ? new Date(ingredient.expiry_date + "T12:00:00Z").toLocaleDateString(
        "zh-TW",
        { year: "numeric", month: "short", day: "numeric" }
      )
    : null;

  return (
    <article
      className={`flex flex-col rounded-2xl p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${highlight}`}
    >
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight text-[#1B2E22]">
            {ingredient.name}
          </h3>
          <CategoryBadge category={ingredient.category} />
        </div>
        <p className="text-sm text-[#6B7280]">
          <span className="font-medium text-[#1B2E22]">
            {ingredient.quantity} {ingredient.unit}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <StatusTag status={ingredient.status} />
          <ExpiryBadge ingredient={ingredient} />
        </div>
        {expiryLabel && (
          <p className="text-xs text-[#6B7280]">
            到期：<span className="text-[#1B2E22]">{expiryLabel}</span>
          </p>
        )}
      </div>
      <div className="mt-4 flex gap-2 border-t border-[#E5E7EB] pt-3">
        <button
          type="button"
          onClick={() => onEdit(ingredient)}
          className="flex-1 rounded-lg border border-[#E5E7EB] py-2 text-sm font-medium text-[#1B2E22] hover:bg-slate-50"
        >
          編輯
        </button>
        <button
          type="button"
          onClick={() => onDelete(ingredient)}
          className="flex-1 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          刪除
        </button>
      </div>
    </article>
  );
}
