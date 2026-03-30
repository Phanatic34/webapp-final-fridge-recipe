import { useParams, Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useRecipeDetail } from "../hooks/useRecipes";

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const recipeId = Number(id);

  const { data: recipe, isLoading, isError, error } = useRecipeDetail(
    Number.isNaN(recipeId) ? 0 : recipeId
  );

  return (
    <Layout>
      <div className="space-y-6">
        <Link
          to="/recipes"
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          <span aria-hidden="true">&larr;</span> Back to recipes
        </Link>

        {isLoading && (
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
          </div>
        )}

        {isError && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-4"
            role="alert"
          >
            <p className="text-sm text-red-800">
              {error instanceof Error
                ? error.message
                : "Could not load recipe."}
            </p>
          </div>
        )}

        {recipe && (
          <>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {recipe.title}
              </h2>
              {recipe.description && (
                <p className="mt-1 text-slate-600">{recipe.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                {recipe.cuisine && (
                  <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium capitalize text-indigo-800">
                    {recipe.cuisine}
                  </span>
                )}
                {recipe.difficulty && (
                  <span className="capitalize">{recipe.difficulty}</span>
                )}
                {recipe.cooking_time !== null && (
                  <span>{recipe.cooking_time} min</span>
                )}
                {recipe.servings !== null && (
                  <span>{recipe.servings} servings</span>
                )}
              </div>
            </div>

            <section>
              <h3 className="mb-3 text-lg font-semibold text-slate-900">
                Ingredients
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {recipe.ingredients.map((ing) => (
                  <li
                    key={ing.id}
                    className="flex items-center gap-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                    <span className="text-sm text-slate-800">
                      {ing.name}
                      {ing.quantity !== null && ing.unit && (
                        <span className="ml-1 text-slate-500">
                          — {ing.quantity} {ing.unit}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {recipe.instructions && (
              <section>
                <h3 className="mb-3 text-lg font-semibold text-slate-900">
                  Instructions
                </h3>
                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  {recipe.instructions.split("\n").map((line, i) => (
                    <p key={i} className="py-1 text-sm text-slate-700">
                      {line}
                    </p>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
