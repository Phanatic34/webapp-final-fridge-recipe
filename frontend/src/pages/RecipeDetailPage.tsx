import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { useRecipeDetail, useRecommendedRecipesList, useDeleteRecipe } from "../hooks/useRecipes";
import { useIngredientsList } from "../hooks/useIngredients";
import { useAddFavorite, useFavoritesList, useRemoveFavorite } from "../hooks/useFavorites";
import { useAddFromRecipe } from "../hooks/useShoppingList";
import { CUISINE_LABELS, DIFFICULTY_LABELS } from "../utils/labels";

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const recipeId = Number(id);
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const deleteRecipe = useDeleteRecipe();

  const { data: recipe, isLoading, isError, error } = useRecipeDetail(
    Number.isNaN(recipeId) ? 0 : recipeId
  );

  const {
    data: fridgeIngredients = [],
  } = useIngredientsList({});

  const { data: recommendedData } = useRecommendedRecipesList();
  const recommendation = useMemo(
    () => recommendedData?.recommendations.find((r) => r.recipe.id === recipeId) ?? null,
    [recommendedData, recipeId]
  );

  const { data: favoritesData } = useFavoritesList();
  const favorites = favoritesData ?? [];
  const isFavorited = recipe ? favorites.some((r) => r.id === recipe.id) : false;

  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();
  const addFromRecipe = useAddFromRecipe();

  const fridgeByName = useMemo(() => {
    const m = new Map<string, (typeof fridgeIngredients)[number]>();
    for (const ing of fridgeIngredients) {
      m.set(ing.name.toLowerCase(), ing);
    }
    return m;
  }, [fridgeIngredients]);

  const hasMissingIngredients = useMemo(
    () => recipe?.ingredients.some((ing) => !fridgeByName.has(ing.name.toLowerCase())) ?? false,
    [recipe, fridgeByName]
  );

  async function handleDelete() {
    try {
      await deleteRecipe.mutateAsync(recipeId);
      toast.success("食譜已刪除");
      navigate("/recipes");
    } catch {
      toast.error("刪除食譜失敗");
    }
  }

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
          className="inline-flex items-center gap-1 text-sm font-medium text-app-primary hover:text-app-primary-hover"
        >
          <span aria-hidden="true">&larr;</span> 返回食譜
        </Link>


        {isLoading && (
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-app-surface" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-app-surface" />
            <div className="h-32 animate-pulse rounded-xl bg-app-surface" />
          </div>
        )}

        {isError && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-4"
            role="alert"
          >
            <p className="text-sm text-app-danger">
              {error instanceof Error
                ? error.message
                : "無法載入食譜。"}
            </p>
          </div>
        )}

        {recipe && (
          <>
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full rounded-2xl object-cover max-h-64"
              />
            ) : (
              <div className="flex w-full items-center justify-center rounded-2xl bg-app-surface text-6xl" style={{ height: "12rem" }}>
                🍽️
              </div>
            )}

            <div>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-['Noto_Serif_TC'] text-2xl font-bold text-app-text flex items-center gap-2">
                  {recipe.title}
                  <button
                    type="button"
                    onClick={() => void toggleFavorite()}
                    disabled={addFav.isPending || removeFav.isPending}
                    aria-label={isFavorited ? "取消收藏" : "加入收藏"}
                    className="shrink-0 rounded-full p-1 transition hover:scale-110 disabled:opacity-50 focus:outline-none"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      stroke={isFavorited ? "#f59e0b" : "currentColor"}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill={isFavorited ? "#f59e0b" : "none"}
                      className={isFavorited ? "" : "text-app-muted"}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                </h2>
                <div className="flex shrink-0 items-center gap-2 pt-1">
                  <Link
                    to={`/recipes/${recipeId}/edit`}
                    className="rounded-lg border border-app-border bg-white px-3 py-1.5 text-sm font-medium text-app-text hover:bg-app-surface transition"
                  >
                    編輯
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-app-danger hover:bg-red-50 transition"
                  >
                    刪除
                  </button>
                </div>
              </div>
              {recipe.description && (
                <p className="mt-1 text-app-muted">{recipe.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-app-muted">
                {recipe.cuisine && (
                  <span className="rounded bg-app-surface px-2 py-0.5 text-xs font-medium text-app-text">
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

            {recommendation && (
              <section className="space-y-3 rounded-2xl border border-app-border bg-white p-4 shadow-sm">
                <h3 className="font-['Noto_Serif_TC'] text-base font-semibold text-app-text">推薦分析</h3>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-app-success ring-1 ring-emerald-100">
                    符合度 {Math.round(recommendation.match_ratio * 100)}%
                  </span>
                  <span className="rounded-full bg-app-surface px-3 py-1 text-sm font-medium text-app-muted ring-1 ring-app-border">
                    {recommendation.match_count} / {recommendation.total_ingredients} 項食材
                  </span>
                  {recommendation.uses_near_expiry && (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-app-warning ring-1 ring-amber-100">
                      可消耗即將到期食材
                    </span>
                  )}
                </div>

                {recommendation.ai_explanation && (
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{ background: "rgba(5,150,105,0.07)", border: "1px solid rgba(5,150,105,0.15)" }}
                  >
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-app-success">🤖 AI 推薦理由</p>
                    <p className="text-sm text-app-text leading-relaxed">{recommendation.ai_explanation}</p>
                  </div>
                )}

                <ul className="space-y-1">
                  {recommendation.explanation.map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-app-muted">
                      <span className="mt-0.5 shrink-0 text-app-success">✓</span>
                      {line}
                    </li>
                  ))}
                </ul>

                {recommendation.insufficient_ingredients.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-app-muted">數量不足</p>
                    <div className="flex flex-wrap gap-1">
                      {recommendation.insufficient_ingredients.map((name) => (
                        <span key={name} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 ring-1 ring-amber-100">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {recommendation.missing_ingredients.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-app-muted">尚缺食材</p>
                    <div className="flex flex-wrap gap-1">
                      {recommendation.missing_ingredients.map((name) => (
                        <span key={name} className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-app-danger ring-1 ring-red-100">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            <section>
              <h3 className="mb-3 font-['Noto_Serif_TC'] text-lg font-semibold text-app-text">
                食材
              </h3>
              {(() => {
                const allAllergens = [
                  ...new Set(
                    recipe.ingredients.flatMap((ing) => ing.allergens ?? [])
                  ),
                ];
                return allAllergens.length > 0 ? (
                  <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2">
                    <span className="text-sm">⚠️</span>
                    <span className="text-xs font-medium text-orange-700">含有：</span>
                    {allAllergens.map((a) => (
                      <span
                        key={a}
                        className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-app-danger ring-1 ring-red-100"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                ) : null;
              })()}
              {hasMissingIngredients && (
                <div className="mb-4">
                  <button
                    type="button"
                    disabled={addFromRecipe.isPending}
                    onClick={() => {
                      addFromRecipe.mutate(recipeId, {
                        onSuccess: (data) => {
                          if (data.added === 0) {
                            toast.info("缺少食材已全部在購物清單中");
                          } else {
                            toast.success(`已加入 ${data.added} 項食材到購物清單`);
                          }
                        },
                        onError: () => toast.error("加入購物清單失敗"),
                      });
                    }}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-app-warning hover:bg-amber-100 disabled:opacity-50 transition"
                  >
                    {addFromRecipe.isPending ? "加入中…" : "＋ 缺少食材加入購物清單"}
                  </button>
                </div>
              )}
              <motion.ul
                className="grid gap-2 sm:grid-cols-2"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.11 } } }}
              >
                {recipe.ingredients.map((ing) => {
                  const key = ing.name.toLowerCase();
                  const fridgeItem = fridgeByName.get(key);

                  const status = !fridgeItem
                    ? { label: "缺少", pill: "bg-red-50 text-app-danger ring-red-100" }
                    : fridgeItem.is_expired
                      ? { label: "已過期", pill: "bg-red-50 text-app-danger ring-red-100" }
                      : fridgeItem.is_near_expiry
                        ? {
                            label: "即將到期",
                            pill: "bg-amber-50 text-app-warning ring-amber-100",
                          }
                        : { label: "冰箱有", pill: "bg-emerald-50 text-app-success ring-emerald-100" };

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
                    <motion.li
                      key={ing.id}
                      variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } }}
                      className="flex flex-col gap-2 rounded-xl border border-app-border bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
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
                              : "h-2 w-2 shrink-0 rounded-full bg-app-muted"
                          }
                        />
                        <span className="text-sm text-app-text">
                          {ing.name}
                          {ing.quantity !== null && ing.unit && (
                            <span className="ml-1 text-app-muted">
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
                          <span className="text-xs text-app-muted">
                            到期：{expiryLabel}
                          </span>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </section>

            {recipe.instructions && (
              <section>
                <h3 className="mb-3 font-['Noto_Serif_TC'] text-lg font-semibold text-app-text">
                  作法
                </h3>
                <ol className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-app-border space-y-3">
                  {recipe.instructions
                    .split("\n")
                    .map((l) => l.trim())
                    .filter((l) => l.length > 0)
                    .map((l) => l.replace(/^\d+[.)]\s*/, ""))
                    .map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-app-primary text-xs font-bold text-white">
                          {i + 1}
                        </span>
                        <p className="text-sm leading-relaxed text-app-muted">{step}</p>
                      </li>
                    ))}
                </ol>
              </section>
            )}
          </>
        )}
      </div>

      <DeleteConfirmModal
        open={showDeleteModal}
        title="刪除食譜"
        message={`確定要刪除「${recipe?.title ?? ""}」嗎？此操作無法復原。`}
        loading={deleteRecipe.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setShowDeleteModal(false)}
      />
    </Layout>
  );
}
