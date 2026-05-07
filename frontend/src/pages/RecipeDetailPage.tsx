import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { useRecipeDetail } from "../hooks/useRecipes";
import { useIngredientsList } from "../hooks/useIngredients";
import { useAddFavorite, useFavoritesList, useRemoveFavorite } from "../hooks/useFavorites";
import { CUISINE_LABELS, DIFFICULTY_LABELS } from "../utils/labels";

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const recipeId = Number(id);

  const { data: recipe, isLoading, isError, error } = useRecipeDetail(
    Number.isNaN(recipeId) ? 0 : recipeId
  );

  const {
    data: fridgeIngredients = [],
  } = useIngredientsList({});

  const { data: favoritesData } = useFavoritesList();
  const favorites = favoritesData ?? [];
  const isFavorited = recipe ? favorites.some((r) => r.id === recipe.id) : false;

  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();

  const fridgeByName = useMemo(() => {
    const m = new Map<string, (typeof fridgeIngredients)[number]>();
    for (const ing of fridgeIngredients) {
      m.set(ing.name.toLowerCase(), ing);
    }
    return m;
  }, [fridgeIngredients]);

  async function toggleFavorite() {
    if (!recipe) return;
    try {
      if (isFavorited) {
        await removeFav.mutateAsync(recipe.id);
        toast.success("已移除收藏");
      } else {
        await addFav.mutateAsync(recipe.id);
        toast.success("已加入收藏");
      }
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as Error).message)
          : "更新收藏失敗";
      toast.error(msg);
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Link
          to="/recipes"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#C4622D] hover:text-[#b3561f]"
        >
          <span aria-hidden="true">&larr;</span> 返回食譜
        </Link>

        {recipe && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[#6B7280]">
              {isFavorited ? "已收藏" : "尚未收藏"}
            </div>
            <button
              type="button"
              onClick={() => void toggleFavorite()}
              disabled={addFav.isPending || removeFav.isPending}
              className={
                isFavorited
                  ? "rounded-lg bg-[#1B2E22] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4232] focus:outline-none focus:ring-2 focus:ring-[#1B2E22] focus:ring-offset-2 disabled:opacity-50"
                  : "rounded-lg bg-[#C4622D] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#b3561f] focus:outline-none focus:ring-2 focus:ring-[#C4622D] focus:ring-offset-2 disabled:opacity-50"
              }
            >
              {isFavorited ? "取消收藏" : "收藏"}
            </button>
          </div>
        )}

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
                : "無法載入食譜。"}
            </p>
          </div>
        )}

        {recipe && (
          <>
            <div>
              <h2 className="font-['Noto_Serif_TC'] text-2xl font-bold text-[#1B2E22]">
                {recipe.title}
              </h2>
              {recipe.description && (
                <p className="mt-1 text-[#6B7280]">{recipe.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#6B7280]">
                {recipe.cuisine && (
                  <span className="rounded bg-[#1B2E22]/10 px-2 py-0.5 text-xs font-medium text-[#1B2E22]">
                    {CUISINE_LABELS[recipe.cuisine] ?? recipe.cuisine}
                  </span>
                )}
                {recipe.difficulty && (
                  <span>{DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty}</span>
                )}
                {recipe.cooking_time !== null && (
                  <span>{recipe.cooking_time} 分鐘</span>
                )}
                {recipe.servings !== null && (
                  <span>{recipe.servings} 人份</span>
                )}
              </div>
            </div>

            <section>
              <h3 className="mb-3 font-['Noto_Serif_TC'] text-lg font-semibold text-[#1B2E22]">
                食材
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {recipe.ingredients.map((ing) => {
                  const key = ing.name.toLowerCase();
                  const fridgeItem = fridgeByName.get(key);

                  const status = !fridgeItem
                    ? { label: "缺少", pill: "bg-red-50 text-red-800 ring-red-200" }
                    : fridgeItem.is_expired
                      ? { label: "已過期", pill: "bg-red-100 text-red-900 ring-red-200" }
                      : fridgeItem.is_near_expiry
                        ? {
                            label: "即將到期",
                            pill: "bg-amber-100 text-amber-900 ring-amber-200",
                          }
                        : { label: "冰箱有", pill: "bg-emerald-100 text-emerald-900 ring-emerald-200" };

                  const expiryLabel =
                    fridgeItem?.expiry_date
                      ? new Date(
                          fridgeItem.expiry_date + "T12:00:00Z"
                        ).toLocaleDateString("zh-TW", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : null;

                  return (
                    <li
                      key={ing.id}
                      className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-[#E5E7EB] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            fridgeItem
                              ? fridgeItem.is_expired
                                ? "h-2 w-2 shrink-0 rounded-full bg-red-500"
                                : fridgeItem.is_near_expiry
                                  ? "h-2 w-2 shrink-0 rounded-full bg-amber-500"
                                  : "h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                              : "h-2 w-2 shrink-0 rounded-full bg-slate-400"
                          }
                        />
                        <span className="text-sm text-[#1B2E22]">
                          {ing.name}
                          {ing.quantity !== null && ing.unit && (
                            <span className="ml-1 text-[#6B7280]">
                              — {ing.quantity} {ing.unit}
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${status.pill}`}
                        >
                          {status.label}
                        </span>
                        {expiryLabel && (
                          <span className="text-xs text-[#6B7280]">
                            到期：{expiryLabel}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            {recipe.instructions && (
              <section>
                <h3 className="mb-3 font-['Noto_Serif_TC'] text-lg font-semibold text-[#1B2E22]">
                  作法
                </h3>
                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#E5E7EB]">
                  {recipe.instructions.split("\n").map((line, i) => (
                    <p key={i} className="py-1 text-sm text-[#6B7280]">
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
