import type { Ingredient } from "../types/ingredient";
import { ExpiryBadge } from "./ExpiryBadge";

type Props = {
  ingredient: Ingredient;
  onEdit: (ing: Ingredient) => void;
  onDelete: (ing: Ingredient) => void;
};

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) {
    return (
      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
        uncategorized
      </span>
    );
  }
  return (
    <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium capitalize text-indigo-800">
      {category}
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
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ${styles[status] ?? "bg-slate-50 text-slate-700 ring-slate-200"}`}
    >
      {status}
    </span>
  );
}

export function IngredientCard({ ingredient, onEdit, onDelete }: Props) {
  const highlight =
    ingredient.is_expired || ingredient.is_near_expiry
      ? ingredient.is_expired
        ? "ring-2 ring-red-300 bg-red-50/40"
        : "ring-2 ring-amber-300 bg-amber-50/30"
      : "ring-1 ring-slate-200 bg-white";

  const expiryLabel = ingredient.expiry_date
    ? new Date(ingredient.expiry_date + "T12:00:00Z").toLocaleDateString(
        undefined,
        { year: "numeric", month: "short", day: "numeric" }
      )
    : "—";

  return (
    <article
      className={`flex flex-col rounded-xl p-4 shadow-sm transition ${highlight}`}
    >
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight text-slate-900">
            {ingredient.name}
          </h3>
          <CategoryBadge category={ingredient.category} />
        </div>
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-800">
            {ingredient.quantity} {ingredient.unit}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <StatusTag status={ingredient.status} />
          <ExpiryBadge ingredient={ingredient} />
        </div>
        <p className="text-xs text-slate-500">
          Expires: <span className="text-slate-700">{expiryLabel}</span>
        </p>
      </div>
      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => onEdit(ingredient)}
          className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(ingredient)}
          className="flex-1 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
