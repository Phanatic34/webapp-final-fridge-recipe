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
      <span className="rounded bg-white/60 px-2 py-0.5 text-xs text-slate-500">
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
    fresh:  "bg-emerald-50/80 text-emerald-800 ring-emerald-200",
    opened: "bg-blue-50/80 text-blue-800 ring-blue-200",
    frozen: "bg-cyan-50/80 text-cyan-800 ring-cyan-200",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${styles[status] ?? "bg-white/60 text-slate-700 ring-slate-200"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

const glassBase =
  "backdrop-blur-xl border border-white/70 shadow-glass";

export function IngredientCard({ ingredient, onEdit, onDelete }: Props) {
  const highlight =
    ingredient.is_expired
      ? "ring-2 ring-red-300/60"
      : ingredient.is_near_expiry
        ? "ring-2 ring-amber-300/60"
        : "";

  const bg =
    ingredient.is_expired
      ? "rgba(255,245,245,0.60)"
      : ingredient.is_near_expiry
        ? "rgba(255,251,235,0.60)"
        : "rgba(255,255,255,0.52)";

  const expiryLabel = ingredient.expiry_date
    ? new Date(ingredient.expiry_date + "T12:00:00Z").toLocaleDateString("zh-TW", {
        year: "numeric", month: "short", day: "numeric",
      })
    : null;

  return (
    <motion.article
      className={`flex flex-col rounded-2xl p-4 ${glassBase} ${highlight}`}
      style={{ background: bg, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      whileHover={{ y: -4, boxShadow: "0 8px 32px rgba(0,0,0,0.11), inset 0 1px 0 rgba(255,255,255,0.9)" }}
      transition={{ type: "spring", stiffness: 180, damping: 18 }}
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
      <div className="mt-4 flex gap-2 border-t border-white/40 pt-3">
        <button
          type="button"
          onClick={() => onEdit(ingredient)}
          className="flex-1 rounded-lg border border-white/60 bg-white/40 py-2 text-sm font-medium text-[#1B2E22] hover:bg-white/70 transition"
        >
          編輯
        </button>
        <button
          type="button"
          onClick={() => onDelete(ingredient)}
          className="flex-1 rounded-lg border border-red-200/60 bg-red-50/40 py-2 text-sm font-medium text-red-700 hover:bg-red-50/70 transition"
        >
          刪除
        </button>
      </div>
    </motion.article>
  );
}
