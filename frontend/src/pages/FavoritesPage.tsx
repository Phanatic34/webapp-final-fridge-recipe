import { Layout } from "../components/Layout";
import { useFavoritesList } from "../hooks/useFavorites";
import type { Recipe } from "../types/recipe";
import { Link } from "react-router-dom";

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group flex flex-col rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-emerald-300"
    >
      <div className="flex flex-col gap-2">
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

export default function FavoritesPage() {
  const { data, isLoading, isError, error, refetch } = useFavoritesList();
  const recipes = data ?? [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-slate-900">Favorites</h2>
          <p className="text-sm text-slate-500">
            Save recipes you want to cook.
          </p>
        </div>

        {isError && (
          <div
            className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <p className="text-sm text-red-800">
              {error instanceof Error
                ? error.message
                : "Could not load favorites. Is the API running?"}
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
                className="h-32 animate-pulse rounded-xl bg-slate-200"
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && recipes.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-16 text-center">
            <p className="text-slate-500">No favorites yet.</p>
            <p className="text-sm text-slate-400">
              Open any recipe and tap “Save”.
            </p>
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

