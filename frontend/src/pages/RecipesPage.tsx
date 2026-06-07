import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { ProgressRing } from "../components/ProgressRing";
import { AiPickBanner } from "../components/AiPickBanner";
import { RecipeImage } from "../components/RecipeImage";
import { useRecommendedRecipesList, useRecipesList } from "../hooks/useRecipes";
import { useAddFavorite, useFavoritesList, useRemoveFavorite } from "../hooks/useFavorites";
import type { Recipe, RecipeRecommendation } from "../types/recipe";
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
    easy: "bg-emerald-50 text-app-success ring-emerald-100",
    medium: "bg-amber-50 text-app-warning ring-amber-100",
    hard: "bg-red-50 text-app-danger ring-red-100",
  };
  const d = difficulty ?? "medium";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${styles[d] ?? "bg-app-surface text-app-muted ring-app-border"}`}
    >
      {DIFFICULTY_LABELS[d] ?? d}
    </span>
  );
}

function StarButton({ favorited, onClick }: { favorited: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={favorited ? "取消收藏" : "加入收藏"}
      className="shrink-0 rounded-full p-0.5 transition hover:scale-110 focus:outline-none"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        stroke={favorited ? "#f59e0b" : "#9ca3af"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={favorited ? "#f59e0b" : "none"}
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  );
}

function AllRecipeCard({ recipe, favorited, onToggleFavorite }: { recipe: Recipe; favorited: boolean; onToggleFavorite: (e: React.MouseEvent) => void }) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group flex h-[440px] flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-app-border transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <RecipeImage
        src={recipe.image_url}
        title={recipe.title}
        imgClassName="h-36 w-full object-cover"
        placeholderClassName="flex h-36 w-full items-center justify-center bg-app-surface text-4xl"
      />
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate text-lg font-semibold leading-tight text-app-text group-hover:text-app-primary">
            {recipe.title}
          </h3>
          <div className="flex shrink-0 items-center gap-1">
            {recipe.cuisine && (
              <span className="rounded bg-app-surface px-2 py-0.5 text-xs font-medium text-app-text">
                {CUISINE_LABELS[recipe.cuisine] ?? recipe.cuisine}
              </span>
            )}
            <StarButton favorited={favorited} onClick={onToggleFavorite} />
          </div>
        </div>
        {recipe.description && (
          <p className="line-clamp-2 text-sm text-app-muted">{recipe.description}</p>
        )}
        {recipe.allergen_summary && recipe.allergen_summary.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {recipe.allergen_summary.map((a) => (
              <span
                key={a}
                className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-app-danger ring-1 ring-red-100"
              >
                {a}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex flex-nowrap items-center gap-2 overflow-hidden pt-2">
          <DifficultyBadge difficulty={recipe.difficulty} />
          {recipe.cooking_time !== null && (
            <span className="text-xs text-app-muted">{recipe.cooking_time} 分鐘</span>
          )}
          {recipe.servings !== null && (
            <span className="text-xs text-app-muted">{recipe.servings} 人份</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function RecommendationCard({ rec, favorited, onToggleFavorite }: { rec: RecipeRecommendation; favorited: boolean; onToggleFavorite: (e: React.MouseEvent) => void }) {
  const ring = rec.uses_near_expiry
    ? "ring-2 ring-amber-300 bg-amber-50/40"
    : "ring-1 ring-app-border bg-white";

  const matchLabel = `${rec.match_count}/${rec.total_ingredients} 項食材`;
  const missingLabel =
    rec.missing_ingredients.length > 0
      ? `缺少：${rec.missing_ingredients.join("、")}`
      : "無缺少食材";

  return (
    <Link
      to={`/recipes/${rec.recipe.id}`}
      className={`group flex h-[440px] flex-col overflow-hidden rounded-2xl shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${ring}`}
    >
      <RecipeImage
        src={rec.recipe.image_url}
        title={rec.recipe.title}
        imgClassName="h-36 w-full object-cover"
        placeholderClassName="flex h-36 w-full items-center justify-center bg-app-surface text-4xl"
      />
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate text-lg font-semibold leading-tight text-app-text group-hover:text-app-primary">
            {rec.recipe.title}
          </h3>
          <div className="flex shrink-0 items-center gap-1">
            {rec.recipe.cuisine && (
              <span className="rounded bg-app-surface px-2 py-0.5 text-xs font-medium text-app-text">
                {CUISINE_LABELS[rec.recipe.cuisine] ?? rec.recipe.cuisine}
              </span>
            )}
            <StarButton favorited={favorited} onClick={onToggleFavorite} />
          </div>
        </div>

        {rec.recipe.description && (
          <p className="line-clamp-2 text-sm text-app-muted">
            {rec.recipe.description}
          </p>
        )}

        <div className="flex flex-nowrap items-center gap-2 overflow-hidden">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-app-success ring-1 ring-emerald-100">
            {matchLabel}
          </span>
          <DifficultyBadge difficulty={rec.recipe.difficulty} />
        </div>

        {rec.uses_near_expiry && rec.near_expiry_ingredients.length > 0 && (
          <p className="line-clamp-1 text-sm text-app-warning">
            即將到期加分：{" "}
            <span className="font-medium">
              {rec.near_expiry_ingredients.join("、")}
            </span>
          </p>
        )}

        <p className="line-clamp-1 text-xs text-app-muted">{missingLabel}</p>

        {rec.ai_explanation ? (
          <div className="min-h-[52px] pt-2">
            <p className="text-xs font-medium text-app-success mb-0.5">🤖 AI 推薦理由</p>
            <p className="line-clamp-2 text-sm text-app-text">{rec.ai_explanation}</p>
          </div>
        ) : (
          <div className="min-h-[52px] pt-2">
            {rec.explanation.slice(0, 2).map((line, i) => (
              <p key={i} className="line-clamp-1 text-sm text-app-muted">
                {line}
              </p>
            ))}
          </div>
        )}

        {rec.recipe.allergen_summary && rec.recipe.allergen_summary.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {rec.recipe.allergen_summary.map((a) => (
              <span
                key={a}
                className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-app-danger ring-1 ring-red-100"
              >
                {a}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex flex-nowrap items-center gap-3 overflow-hidden pt-3">
          <ProgressRing ratio={rec.match_ratio} size={44} />
          {rec.recipe.cooking_time !== null && (
            <span className="text-xs text-app-muted">{rec.recipe.cooking_time} 分鐘</span>
          )}
          {rec.recipe.servings !== null && (
            <span className="text-xs text-app-muted">{rec.recipe.servings} 人份</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function RecipesPage() {
  const navigate = useNavigate();
  const [cuisine, setCuisine] = useState("all");
  const [maxTime, setMaxTime] = useState<number | null>(null);
  const [mode, setMode] = useState<"recommended" | "all">("recommended");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: favoritesData } = useFavoritesList();
  const favoriteIds = useMemo(() => new Set((favoritesData ?? []).map((r) => r.id)), [favoritesData]);
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();

  function makeToggleFavorite(recipeId: number) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const isFav = favoriteIds.has(recipeId);
      if (isFav) {
        removeFav.mutate(recipeId, { onSuccess: () => toast.success("已移除收藏"), onError: () => toast.error("更新收藏失敗") });
      } else {
        addFav.mutate(recipeId, { onSuccess: () => toast.success("已加入收藏"), onError: () => toast.error("更新收藏失敗") });
      }
    };
  }

  const { data: recData, isLoading: recLoading, isError: recError, error: recErr, refetch: recRefetch } =
    useRecommendedRecipesList({ maxTime });
  const { data: allData, isLoading: allLoading, isError: allError, error: allErr, refetch: allRefetch } =
    useRecipesList({ cuisine });

  const recommendations = recData?.recommendations ?? [];
  const visible = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return recommendations.filter(
      (r) =>
        (cuisine === "all" || r.recipe.cuisine === cuisine) &&
        (!q || r.recipe.title.toLowerCase().includes(q))
    );
  }, [recommendations, cuisine, searchQuery]);

  const filteredAll = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return (allData ?? []).filter((r) => !q || r.title.toLowerCase().includes(q));
  }, [allData, searchQuery]);

  const isLoading = mode === "recommended" ? recLoading : allLoading;
  const isError = mode === "recommended" ? recError : allError;
  const error = mode === "recommended" ? recErr : allErr;
  const refetch = mode === "recommended" ? recRefetch : allRefetch;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-['Noto_Serif_TC'] text-lg font-semibold text-app-text">食譜</h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {(["recommended", "all"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    mode === m
                      ? "bg-app-surface text-app-primary ring-1 ring-app-border"
                      : "border border-app-border bg-white text-app-muted hover:border-app-primary hover:text-app-primary"
                  }`}
                >
                  {m === "recommended" ? "推薦食譜" : "全部食譜"}
                </button>
              ))}
              <Link
                to="/recipes/new"
                className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-app-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-app-primary-hover transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="4" x2="12" y2="20" /><line x1="4" y1="12" x2="20" y2="12" />
                </svg>
                建立食譜
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="search" className="text-xs font-medium uppercase text-app-muted">搜尋</label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="輸入食譜名稱…"
                className="rounded-lg border border-app-border bg-white px-3 py-2 text-sm shadow-sm focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="cuisine"
                className="text-xs font-medium uppercase text-app-muted"
              >
                料理類型
              </label>
              <select
                id="cuisine"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="rounded-lg border border-app-border bg-white px-3 py-2 text-sm shadow-sm focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
              >
                {CUISINE_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {CUISINE_LABELS[c] ?? c}
                  </option>
                ))}
              </select>
            </div>
            {/* Time filter */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase text-app-muted">烹飪時間</span>
              <div className="flex gap-1">
                {([null, 15, 30, 45, 60] as const).map((time) => (
                  <button
                    key={time ?? "all"}
                    type="button"
                    onClick={() => setMaxTime(time)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      maxTime === time
                        ? "bg-app-primary text-white"
                        : "border border-app-border bg-white text-app-muted hover:border-app-primary hover:text-app-primary"
                    }`}
                  >
                    {time === null ? "不限" : `${time} 分`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-app-muted text-right -mt-3">＊圖片僅供參考</p>

        {isError && (
          <div
            className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <p className="text-sm text-app-danger">
              {error instanceof Error
                ? error.message
                : "無法載入食譜，API 是否正在運行？"}
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
                className="h-40 animate-pulse rounded-2xl bg-app-surface"
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && mode === "recommended" && visible.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-app-border py-16 text-center">
            <p className="text-app-muted">目前沒有符合推薦的食譜。</p>
            {cuisine !== "all" && (
              <button
                type="button"
                onClick={() => setCuisine("all")}
                className="text-sm font-medium text-app-primary hover:underline"
              >
                清除篩選
              </button>
            )}
            <button
              type="button"
              onClick={() => setMode("all")}
              className="rounded-lg border border-app-primary px-4 py-2 text-sm font-medium text-app-primary hover:bg-app-primary hover:text-white transition"
            >
              瀏覽全部食譜
            </button>
          </div>
        )}

        {!isLoading && !isError && mode === "all" && filteredAll.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-app-border py-16 text-center">
            <p className="text-app-muted">找不到食譜。</p>
          </div>
        )}

        {!isLoading && !isError && mode === "recommended" && visible.length > 0 && (
          <AiPickBanner recommendations={visible} />
        )}
        {!isLoading && !isError && mode === "recommended" && visible.length > 0 && (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.14 } } }}
          >
            {visible.map((rec) => (
              <motion.div
                key={rec.recipe.id}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 180, damping: 20 } } }}
              >
                <RecommendationCard rec={rec} favorited={favoriteIds.has(rec.recipe.id)} onToggleFavorite={makeToggleFavorite(rec.recipe.id)} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {!isLoading && !isError && mode === "all" && (allData ?? []).length > 0 && (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.14 } } }}
          >
            {filteredAll.map((recipe) => (
              <motion.div
                key={recipe.id}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 180, damping: 20 } } }}
              >
                <AllRecipeCard recipe={recipe} favorited={favoriteIds.has(recipe.id)} onToggleFavorite={makeToggleFavorite(recipe.id)} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        <motion.button
          type="button"
          onClick={() => navigate("/recipes/new")}
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-app-primary text-white shadow-lg shadow-green-900/20 hover:bg-app-primary-hover focus:outline-none sm:hidden"
          aria-label="建立食譜"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 20 } }}
          exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="4" x2="12" y2="20" /><line x1="4" y1="12" x2="20" y2="12" />
          </svg>
        </motion.button>
      </AnimatePresence>
    </Layout>
  );
}
