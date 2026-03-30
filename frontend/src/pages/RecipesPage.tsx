import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useRecommendedRecipesList } from "../hooks/useRecipes";
import type { RecipeRecommendation } from "../types/recipe";

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
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ${styles[d] ?? "bg-slate-50 text-slate-700 ring-slate-200"}`}
    >
      {d}
    </span>
  );
}

function RecommendationCard({ rec }: { rec: RecipeRecommendation }) {
  const ring = rec.uses_near_expiry
    ? "ring-2 ring-amber-300 bg-amber-50/20"
    : "ring-1 ring-slate-200 bg-white";

  const matchLabel = `${rec.match_count}/${rec.total_ingredients} ingredients`;
  const missingLabel =
    rec.missing_ingredients.length > 0
      ? `Missing: ${rec.missing_ingredients.join(", ")}`
      : "No missing ingredients";

  return (
    <Link
      to={`/recipes/${rec.recipe.id}`}
      className={`group flex flex-col rounded-xl p-4 shadow-sm transition ${ring} hover:shadow-md`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight text-slate-900 group-hover:text-emerald-700">
            {rec.recipe.title}
          </h3>
          {rec.recipe.cuisine && (
            <span className="shrink-0 rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium capitalize text-indigo-800">
              {rec.recipe.cuisine}
            </span>
          )}
        </div>

        {rec.recipe.description && (
          <p className="line-clamp-2 text-sm text-slate-600">
            {rec.recipe.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
            {matchLabel}
          </span>
          <DifficultyBadge difficulty={rec.recipe.difficulty} />
        </div>

        {rec.uses_near_expiry && rec.near_expiry_ingredients.length > 0 && (
          <p className="text-sm text-amber-900">
            Near-expiry boost:{" "}
            <span className="font-medium">
              {rec.near_expiry_ingredients.join(", ")}
            </span>
          </p>
        )}

        <p className="text-xs text-slate-600">{missingLabel}</p>

        <div className="pt-2">
          {rec.explanation.slice(0, 3).map((line, i) => (
            <p key={i} className="text-sm text-slate-700">
              {line}
            </p>
          ))}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          {rec.recipe.cooking_time !== null && (
            <span className="text-xs text-slate-500">
              {rec.recipe.cooking_time} min
            </span>
          )}
          {rec.recipe.servings !== null && (
            <span className="text-xs text-slate-500">
              {rec.recipe.servings} servings
            </span>
          )}
          <span className="ml-auto text-xs text-slate-500">
            Match: {Math.round(rec.match_ratio * 100)}%
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
            <h2 className="text-lg font-semibold text-slate-900">Recipes</h2>
            <p className="text-sm text-slate-500">
              Browse recipes — recommendation matching coming soon.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="cuisine"
              className="text-xs font-medium uppercase text-slate-500"
            >
              Cuisine
            </label>
            <select
              id="cuisine"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {CUISINE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All cuisines" : c}
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
                : "Could not load recipes. Is the API running?"}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading && !isError && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl bg-slate-200"
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && visible.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-16 text-center">
            <p className="text-slate-500">No recommended recipes found.</p>
            {cuisine !== "all" && (
              <button
                type="button"
                onClick={() => setCuisine("all")}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                Clear filter
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
