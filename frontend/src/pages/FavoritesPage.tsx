import { toast } from "sonner";
import { motion } from "framer-motion";
import { Layout } from "../components/Layout";
import { useFavoritesList, useRemoveFavorite } from "../hooks/useFavorites";
import type { Recipe } from "../types/recipe";
import { Link } from "react-router-dom";
import { CUISINE_LABELS } from "../utils/labels";

type CardProps = {
  recipe: Recipe;
  onRemove: (id: number) => void;
  isRemoving: boolean;
};

function RecipeCard({ recipe, onRemove, isRemoving }: CardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-app-border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <Link to={`/recipes/${recipe.id}`} className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight text-app-text group-hover:text-app-primary">
            {recipe.title}
          </h3>
          {recipe.cuisine && (
            <span className="shrink-0 rounded bg-app-surface px-2 py-0.5 text-xs font-medium text-app-text">
              {CUISINE_LABELS[recipe.cuisine] ?? recipe.cuisine}
            </span>
          )}
        </div>
        {recipe.description && (
          <p className="line-clamp-2 text-sm text-app-muted">
            {recipe.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {recipe.cooking_time !== null && (
            <span className="text-xs text-app-muted">
              {recipe.cooking_time} 分鐘
            </span>
          )}
          {recipe.servings !== null && (
            <span className="text-xs text-app-muted">
              {recipe.servings} 人份
            </span>
          )}
        </div>
      </Link>
      <div className="border-t border-app-border px-4 py-2">
        <button
          type="button"
          disabled={isRemoving}
          onClick={() => onRemove(recipe.id)}
          className="w-full rounded-lg border border-red-200 py-1.5 text-xs font-medium text-app-danger hover:bg-red-50 disabled:opacity-50"
        >
          {isRemoving ? "移除中…" : "移除收藏"}
        </button>
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  const { data, isLoading, isError, error, refetch } = useFavoritesList();
  const recipes = data ?? [];
  const removeFav = useRemoveFavorite();

  function handleRemove(id: number) {
    void removeFav.mutateAsync(id).then(() => toast.success("已移除收藏"));
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-['Noto_Serif_TC'] text-lg font-semibold text-app-text">我的收藏</h2>
          <p className="text-sm text-app-muted">
            儲存想煮的食譜。
          </p>
        </div>

        {isError && (
          <div
            className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <p className="text-sm text-app-danger">
              {error instanceof Error
                ? error.message
                : "無法載入收藏，API 是否正在運行？"}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-lg bg-app-danger px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
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
                className="h-32 animate-pulse rounded-2xl bg-app-surface"
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && recipes.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-app-border py-16 text-center">
            <p className="text-app-muted">目前沒有收藏的食譜。</p>
            <p className="text-sm text-app-muted">
              前往食譜頁面，將喜歡的食譜加入收藏。
            </p>
          </div>
        )}

        {!isLoading && !isError && recipes.length > 0 && (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.14 } } }}
          >
            {recipes.map((recipe) => (
              <motion.div
                key={recipe.id}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 180, damping: 20 } } }}
              >
                <RecipeCard
                  recipe={recipe}
                  onRemove={handleRemove}
                  isRemoving={removeFav.isPending && removeFav.variables === recipe.id}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
