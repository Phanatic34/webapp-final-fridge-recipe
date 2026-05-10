import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "../components/Layout";
import { ProgressRing } from "../components/ProgressRing";
import { useRecommendedRecipesList, useRecipesList } from "../hooks/useRecipes";
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

function AllRecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-[#E5E7EB] transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {recipe.image_url ? (
        <img src={recipe.image_url} alt={recipe.title} className="h-36 w-full object-cover" />
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-slate-100 text-4xl">🍽️</div>
      )}
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-tight text-[#1B2E22] group-hover:text-[#C4622D]">
            {recipe.title}
          </h3>
          {recipe.cuisine && (
            <span className="shrink-0 rounded bg-[#1B2E22]/10 px-2 py-0.5 text-xs font-medium text-[#1B2E22]">
              {CUISINE_LABELS[recipe.cuisine] ?? recipe.cuisine}
            </span>
          )}
        </div>
        {recipe.description && (
          <p className="line-clamp-2 text-sm text-[#6B7280]">{recipe.description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <DifficultyBadge difficulty={recipe.difficulty} />
          {recipe.cooking_time !== null && (
            <span className="text-xs text-[#6B7280]">{recipe.cooking_time} 分鐘</span>
          )}
          {recipe.servings !== null && (
            <span className="text-xs text-[#6B7280]">{recipe.servings} 人份</span>
          )}
        </div>
      </div>
    </Link>
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
      className={`group flex flex-col rounded-2xl overflow-hidden shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${ring}`}
    >
      {rec.recipe.image_url ? (
        <img
          src={rec.recipe.image_url}
          alt={rec.recipe.title}
          className="h-36 w-full object-cover"
        />
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-slate-100 text-4xl">
          🍽️
        </div>
      )}
      <div className="flex flex-col gap-2 p-4">
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

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
          <ProgressRing ratio={rec.match_ratio} size={44} />
          {rec.recipe.cooking_time !== null && (
            <span className="text-xs text-[#6B7280]">{rec.recipe.cooking_time} 分鐘</span>
          )}
          {rec.recipe.servings !== null && (
            <span className="text-xs text-[#6B7280]">{rec.recipe.servings} 人份</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function RecipesPage() {
  const [cuisine, setCuisine] = useState("all");
  const [maxTime, setMaxTime] = useState<number | null>(null);
  const [mode, setMode] = useState<"recommended" | "all">("recommended");

  const { data: recData, isLoading: recLoading, isError: recError, error: recErr, refetch: recRefetch } =
    useRecommendedRecipesList({ maxTime });
  const { data: allData, isLoading: allLoading, isError: allError, error: allErr, refetch: allRefetch } =
    useRecipesList({ cuisine });

  const recommendations = recData?.recommendations ?? [];
  const visible = useMemo(() => {
    if (cuisine === "all") return recommendations;
    return recommendations.filter((r) => r.recipe.cuisine === cuisine);
  }, [recommendations, cuisine]);

  const isLoading = mode === "recommended" ? recLoading : allLoading;
  const isError = mode === "recommended" ? recError : allError;
  const error = mode === "recommended" ? recErr : allErr;
  const refetch = mode === "recommended" ? recRefetch : allRefetch;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-['Noto_Serif_TC'] text-lg font-semibold text-[#1B2E22]">食譜</h2>
            <div className="mt-2 flex gap-1">
              {(["recommended", "all"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    mode === m
                      ? "bg-[#1B2E22] text-white"
                      : "border border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#1B2E22] hover:text-[#1B2E22]"
                  }`}
                >
                  {m === "recommended" ? "推薦食譜" : "全部食譜"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
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
            {/* Time filter */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase text-[#6B7280]">烹飪時間</span>
              <div className="flex gap-1">
                {([null, 15, 30, 45, 60] as const).map((time) => (
                  <button
                    key={time ?? "all"}
                    type="button"
                    onClick={() => setMaxTime(time)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      maxTime === time
                        ? "bg-[#C4622D] text-white"
                        : "border border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#C4622D] hover:text-[#C4622D]"
                    }`}
                  >
                    {time === null ? "不限" : `${time} 分`}
                  </button>
                ))}
              </div>
            </div>
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

        {!isLoading && !isError && mode === "recommended" && visible.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#E5E7EB] py-16 text-center">
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
            <button
              type="button"
              onClick={() => setMode("all")}
              className="rounded-lg border border-[#1B2E22] px-4 py-2 text-sm font-medium text-[#1B2E22] hover:bg-[#1B2E22] hover:text-white transition"
            >
              瀏覽全部食譜
            </button>
          </div>
        )}

        {!isLoading && !isError && mode === "all" && (allData ?? []).length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#E5E7EB] py-16 text-center">
            <p className="text-[#6B7280]">找不到食譜。</p>
          </div>
        )}

        {!isLoading && !isError && mode === "recommended" && visible.length > 0 && (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          >
            {visible.map((rec) => (
              <motion.div
                key={rec.recipe.id}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } }}
              >
                <RecommendationCard rec={rec} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {!isLoading && !isError && mode === "all" && (allData ?? []).length > 0 && (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          >
            {(allData ?? []).map((recipe) => (
              <motion.div
                key={recipe.id}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } }}
              >
                <AllRecipeCard recipe={recipe} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
