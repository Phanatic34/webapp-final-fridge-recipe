import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useRecommendedRecipesList } from "../hooks/useRecipes";
import type { RecipeRecommendation } from "../types/recipe";
import { CUISINE_LABELS, DIFFICULTY_LABELS } from "../utils/labels";

const CUISINE_OPTIONS = [
  "all",
  "taiwanese",
  "chinese",
  "japanese",
  "korean",
  "italian",
  "american",
  "thai",
  "other",
] as const;

function DifficultyBadge({ difficulty }: { difficulty: string | null }) {
  const styles: Record<string, string> = {
    easy: "bg-green-50 text-green-800 ring-green-200",
    medium: "bg-amber-50 text-amber-800 ring-amber-200",
    hard: "bg-red-50 text-red-800 ring-red-200",
  };
  const d = difficulty ?? "medium";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${styles[d] ?? "bg-slate-50 text-slate-700 ring-slate-200"}`}
    >
      {DIFFICULTY_LABELS[d] ?? d}
    </span>
  );
}

function RecommendationCard({ rec }: { rec: RecipeRecommendation }) {
  const ring = rec.uses_near_expiry
    ? "ring-2 ring-amber-300 bg-amber-50/20"
    : "ring-1 ring-[#E5E7EB] bg-white";

  const matchLabel = `${rec.match_count}/${rec.total_ingredients} 項食材`;
  const missingLabel =
    rec.missing_ingredients.length > 0
      ? `缺少：${rec.missing_ingredients.join("、")}`
      : "無缺少食材";

  return (
    <Link
      to={`/recipes/${rec.recipe.id}`}
      className={`group flex flex-col rounded-2xl p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${ring}`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight text-[#1B2E22] group-hover:text-[#C4622D]">
            {rec.recipe.title}
          </h3>
          {rec.recipe.cuisine && (
            <span className="shrink-0 rounded bg-[#1B2E22]/10 px-2 py-0.5 text-xs font-medium text-[#1B2E22]">
              {CUISINE_LABELS[rec.recipe.cuisine] ?? rec.recipe.cuisine}
            </span>
          )}
        </div>

        {rec.recipe.description && (
          <p className="line-clamp-2 text-sm text-[#6B7280]">
            {rec.recipe.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#059669]/10 px-2 py-0.5 text-xs font-medium text-[#059669] ring-1 ring-[#059669]/20">
            {matchLabel}
          </span>
          <DifficultyBadge difficulty={rec.recipe.difficulty} />
        </div>

        {rec.uses_near_expiry && rec.near_expiry_ingredients.length > 0 && (
          <p className="text-sm text-amber-900">
            即將到期加分：{" "}
            <span className="font-medium">
              {rec.near_expiry_ingredients.join("、")}
            </span>
          </p>
        )}

        <p className="text-xs text-[#6B7280]">{missingLabel}</p>

        <div className="pt-2">
          {rec.explanation.slice(0, 3).map((line, i) => (
            <p key={i} className="text-sm text-[#6B7280]">
              {line}
            </p>
          ))}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          {rec.recipe.cooking_time !== null && (
            <span className="text-xs text-[#6B7280]">
              {rec.recipe.cooking_time} 分鐘
            </span>
          )}
          {rec.recipe.servings !== null && (
            <span className="text-xs text-[#6B7280]">
              {rec.recipe.servings} 人份
            </span>
          )}
          <span className="ml-auto text-xs text-[#6B7280]">
            符合度：{Math.round(rec.match_ratio * 100)}%
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function RecipesPage() {
  const [cuisine, setCuisine] = useState("all");
  const { data, isLoading, isError, error, refetch } =
    useRecommendedRecipesList();

  const recommendations = data?.recommendations ?? [];
  const visible = useMemo(() => {
    if (cuisine === "all") return recommendations;
    return recommendations.filter((r) => r.recipe.cuisine === cuisine);
  }, [recommendations, cuisine]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-['Noto_Serif_TC'] text-lg font-semibold text-[#1B2E22]">食譜</h2>
            <p className="text-sm text-[#6B7280]">
              依照冰箱食材推薦最適合的食譜
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="cuisine"
              className="text-xs font-medium uppercase text-[#6B7280]"
            >
              料理類型
            </label>
            <select
              id="cuisine"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm shadow-sm focus:border-[#C4622D] focus:outline-none focus:ring-1 focus:ring-[#C4622D]"
            >
              {CUISINE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {CUISINE_LABELS[c] ?? c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isError && (
          <div
            className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <p className="text-sm text-red-800">
              {error instanceof Error
                ? error.message
                : "無法載入食譜，API 是否正在運行？"}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800"
            >
              重試
            </button>
          </div>
        )}

        {isLoading && !isError && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && visible.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#E5E7EB] py-16 text-center">
            <p className="text-[#6B7280]">目前沒有符合推薦的食譜。</p>
            {cuisine !== "all" && (
              <button
                type="button"
                onClick={() => setCuisine("all")}
                className="text-sm font-medium text-[#C4622D] hover:underline"
              >
                清除篩選
              </button>
            )}
          </div>
        )}

        {!isLoading && !isError && visible.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((rec) => (
              <RecommendationCard key={rec.recipe.id} rec={rec} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
