import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useRecipesList } from "../hooks/useRecipes";
import type { Recipe } from "../types/recipe";

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

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group flex flex-col rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-emerald-300"
    >
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight text-slate-900 group-hover:text-emerald-700">
            {recipe.title}
          </h3>
          {recipe.cuisine && (
            <span className="shrink-0 rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium capitalize text-indigo-800">
              {recipe.cuisine}
            </span>
          )}
        </div>

        {recipe.description && (
          <p className="line-clamp-2 text-sm text-slate-600">
            {recipe.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <DifficultyBadge difficulty={recipe.difficulty} />
          {recipe.cooking_time !== null && (
            <span className="text-xs text-slate-500">
              {recipe.cooking_time} min
            </span>
          )}
          {recipe.servings !== null && (
            <span className="text-xs text-slate-500">
              {recipe.servings} servings
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function RecipesPage() {
  const [cuisine, setCuisine] = useState("all");

  const params = useMemo(() => ({ cuisine }), [cuisine]);
  const { data: recipes = [], isLoading, isError, error, refetch } =
    useRecipesList(params);

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

        {!isLoading && !isError && recipes.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-16 text-center">
            <p className="text-slate-500">No recipes found.</p>
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

        {!isLoading && !isError && recipes.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
