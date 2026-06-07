import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { fetchAiPick } from "../api/recipes";
import { ProgressRing } from "./ProgressRing";
import { CUISINE_LABELS } from "../utils/labels";
import type { RecipeRecommendation } from "../types/recipe";

type Status = "idle" | "loading" | "done" | "error";

export function AiPickBanner({ recommendations }: { recommendations: RecipeRecommendation[] }) {
  const [status, setStatus] = useState<Status>("idle");
  const [userPrompt, setUserPrompt] = useState("");
  const [pickedRec, setPickedRec] = useState<RecipeRecommendation | null>(null);
  const [aiExplanation, setAiExplanation] = useState("");

  if (recommendations.length === 0) return null;

  async function handlePick() {
    setStatus("loading");
    try {
      const result = await fetchAiPick(recommendations, userPrompt);
      const found = recommendations.find((r) => r.recipe.id === result.picked_id) ?? null;
      if (!found) throw new Error("AI 回傳的食譜 ID 不在推薦列表中");
      setPickedRec(found);
      setAiExplanation(result.explanation);
      setStatus("done");
    } catch (e) {
      console.error("[AiPickBanner]", e);
      toast.error("AI 精選暫時無法使用，請稍後再試");
      setStatus("error");
    }
  }

  function handleClose() {
    setStatus("idle");
    setPickedRec(null);
    setAiExplanation("");
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm backdrop-blur-sm">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">✨</span>
        <h3 className="font-semibold text-amber-900 text-sm">今日 AI 精選</h3>
        {status === "done" && (
          <button
            type="button"
            onClick={handleClose}
            className="ml-auto text-amber-500 hover:text-amber-700 transition text-xs"
            aria-label="關閉"
          >
            ✕ 關閉
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {status !== "done" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <input
              type="text"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && status !== "loading") void handlePick(); }}
              placeholder="有什麼特別需求嗎？（選填，例如：想吃清淡的）"
              maxLength={100}
              className="flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-app-text placeholder:text-app-muted focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-300"
            />
            <button
              type="button"
              onClick={() => void handlePick()}
              disabled={status === "loading"}
              className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition disabled:opacity-50"
            >
              {status === "loading" ? "AI 選擇中…" : "讓 AI 幫我選"}
            </button>
          </motion.div>
        )}

        {status === "done" && pickedRec && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Link
              to={`/recipes/${pickedRec.recipe.id}`}
              className="flex flex-col gap-3 sm:flex-row sm:items-start hover:opacity-90 transition"
            >
              {pickedRec.recipe.image_url ? (
                <img
                  src={pickedRec.recipe.image_url}
                  alt={pickedRec.recipe.title}
                  className="h-32 w-full rounded-xl object-cover sm:w-40 sm:shrink-0"
                />
              ) : (
                <div className="flex h-32 w-full items-center justify-center rounded-xl bg-amber-100 text-4xl sm:w-40 sm:shrink-0">
                  🍽️
                </div>
              )}

              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-['Noto_Serif_TC'] text-base font-bold text-amber-900 truncate">
                    {pickedRec.recipe.title}
                  </span>
                  {pickedRec.recipe.cuisine && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {CUISINE_LABELS[pickedRec.recipe.cuisine] ?? pickedRec.recipe.cuisine}
                    </span>
                  )}
                </div>

                <p className="text-sm text-amber-800 leading-relaxed">{aiExplanation}</p>

                <div className="flex items-center gap-3 text-xs text-amber-700">
                  <ProgressRing ratio={pickedRec.match_ratio} size={36} />
                  {pickedRec.recipe.cooking_time != null && (
                    <span>{pickedRec.recipe.cooking_time} 分鐘</span>
                  )}
                  {pickedRec.recipe.servings != null && (
                    <span>{pickedRec.recipe.servings} 人份</span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
