# AI 精選食譜 & 過敏原強化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在推薦頁加入「今日 AI 精選」功能（讓 AI 從已評分的推薦列表中主動選出最佳一道），並強化過敏原覆蓋面（批次偵測、詳情頁彙總、卡片 badge）。

**Architecture:** 新增 `POST /api/recipes/ai-pick` 端點接收已評分推薦資料，呼叫 GPT 選出最佳食譜並回傳完整理由；前端新增 `AiPickBanner` 元件整合於 RecipesPage 頂部。過敏原則透過 `GET /api/recipes` 的 `allergen_summary` 欄位、食譜詳情頁彙總列、以及食譜卡片 badge 三個面向補完。

**Tech Stack:** Express + TypeScript (backend), React 18 + Vite + TanStack Query + framer-motion + Tailwind (frontend), OpenAI gpt-5.4-mini, PostgreSQL

---

## File Map

**新建：**
- `backend/src/utils/aiPick.ts` — GPT pick 呼叫邏輯
- `frontend/src/components/AiPickBanner.tsx` — AI 精選 UI 元件

**修改：**
- `backend/src/types/recipe.ts` — `RecipeResponse` 加 `allergen_summary`
- `backend/src/routes/recipes.ts` — 加 `POST /ai-pick` route；`GET /` 加 allergen_summary JOIN
- `frontend/src/types/recipe.ts` — `Recipe` 加 `allergen_summary`；加 `AiPickResponse` type
- `frontend/src/api/recipes.ts` — 加 `fetchAiPick()`
- `frontend/src/pages/RecipesPage.tsx` — 插入 AiPickBanner；兩種卡片加 allergen badge
- `frontend/src/pages/RecipeDetailPage.tsx` — 加過敏原彙總列
- `frontend/src/pages/RecipeCreatePage.tsx` — 加批次偵測按鈕
- `frontend/src/pages/RecipeEditPage.tsx` — 加批次偵測按鈕

---

## Task 1：建立 `aiPick.ts` utility

**Files:**
- Create: `backend/src/utils/aiPick.ts`

- [ ] **Step 1：建立 `backend/src/utils/aiPick.ts`**

```typescript
import OpenAI from "openai";
import type { RecommendationResponse } from "../types/recipe.js";

let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export async function generateAiPick(
  recommendations: RecommendationResponse[],
  userPrompt?: string
): Promise<{ picked_id: number; explanation: string }> {
  const openai = getClient();
  if (!openai) throw new Error("OPENAI_API_KEY not set");

  const recipeList = recommendations
    .slice(0, 8)
    .map((r, i) => {
      const lines = [
        `${i + 1}. ID=${r.recipe.id}，名稱：${r.recipe.title}`,
        `   匹配率：${Math.round(r.match_ratio * 100)}%（${r.match_count}/${r.total_ingredients} 項食材）`,
      ];
      if (r.uses_near_expiry && r.near_expiry_ingredients.length > 0) {
        lines.push(`   即將過期可消耗：${r.near_expiry_ingredients.join("、")}`);
      }
      if (r.missing_ingredients.length > 0) {
        lines.push(`   缺少食材：${r.missing_ingredients.join("、")}`);
      }
      if (r.recipe.cooking_time != null) {
        lines.push(`   烹飪時間：${r.recipe.cooking_time} 分鐘`);
      }
      return lines.join("\n");
    })
    .join("\n\n");

  const userNeed = userPrompt?.trim()
    ? `\n\n使用者補充需求：${userPrompt.trim()}`
    : "";

  const prompt = `你是廚房助理，根據以下推薦食譜資訊，選出今天最適合這位使用者烹飪的一道食譜，並用 2 到 3 句繁體中文說明選擇理由（要說明為何選這道、為何優於其他）。請直接以 JSON 格式回答，格式為 {"picked_id": <食譜ID數字>, "explanation": "<理由>"}，不要有其他文字。

推薦食譜列表：
${recipeList}${userNeed}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4-mini",
    max_completion_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.choices[0]?.message?.content?.trim() ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`AI returned non-JSON: ${text}`);
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).picked_id !== "number" ||
    typeof (parsed as Record<string, unknown>).explanation !== "string"
  ) {
    throw new Error(`AI returned unexpected shape: ${text}`);
  }

  const result = parsed as { picked_id: number; explanation: string };
  const valid = recommendations.some((r) => r.recipe.id === result.picked_id);
  if (!valid) {
    throw new Error(`AI picked unknown id: ${result.picked_id}`);
  }

  return result;
}
```

- [ ] **Step 2：確認後端可編譯**

```bash
cd /Users/yukuan/Desktop/web-app-final/backend
npm run build 2>&1 | tail -20
```

Expected: 無 TypeScript 錯誤（可能有其他既有警告，忽略）

- [ ] **Step 3：Commit**

```bash
git add backend/src/utils/aiPick.ts
git commit -m "feat: add generateAiPick utility for AI recipe selection"
```

---

## Task 2：後端加 `POST /api/recipes/ai-pick` route

**Files:**
- Modify: `backend/src/routes/recipes.ts`

- [ ] **Step 1：在 `backend/src/routes/recipes.ts` 引入 `generateAiPick`**

在檔案頂部已有的 import 區塊中加入：

```typescript
import { generateAiPick } from "../utils/aiPick.js";
```

- [ ] **Step 2：在 `POST /api/recipes/auto-allergens` route 之前（約 line 396），加入新 route**

找到這段：
```typescript
/** POST /api/recipes/auto-allergens */
router.post("/auto-allergens", async (req: Request, res: Response) => {
```

在它之前插入：

```typescript
/** POST /api/recipes/ai-pick */
router.post("/ai-pick", async (req: Request, res: Response) => {
  const { recommendations, userPrompt } = req.body as {
    recommendations?: unknown;
    userPrompt?: unknown;
  };

  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    res.status(400).json({ error: "recommendations 必須為非空陣列" });
    return;
  }

  const prompt =
    typeof userPrompt === "string" && userPrompt.trim().length > 0
      ? userPrompt.trim().slice(0, 100)
      : undefined;

  try {
    const result = await generateAiPick(
      recommendations as import("../types/recipe.js").RecommendationResponse[],
      prompt
    );
    res.json(result);
  } catch (e) {
    console.error("[AI pick error]", e);
    res.status(500).json({ error: "AI 精選暫時無法使用" });
  }
});

```

- [ ] **Step 3：確認後端可編譯**

```bash
cd /Users/yukuan/Desktop/web-app-final/backend
npm run build 2>&1 | tail -20
```

Expected: 無 TypeScript 錯誤

- [ ] **Step 4：啟動後端，用 curl 手動驗證**

確保後端在跑（`npm run dev` in backend），然後先登入取得 token，再測試：

```bash
# 先在瀏覽器或 curl 取得 token（以你的測試帳號為準）
TOKEN="your_jwt_token_here"

curl -s -X POST http://localhost:3001/api/recipes/ai-pick \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"recommendations": [], "userPrompt": ""}' | python3 -m json.tool
```

Expected: `{"error": "recommendations 必須為非空陣列"}`

- [ ] **Step 5：Commit**

```bash
git add backend/src/routes/recipes.ts
git commit -m "feat: add POST /api/recipes/ai-pick route"
```

---

## Task 3：後端 `GET /api/recipes` 加 `allergen_summary`

**Files:**
- Modify: `backend/src/types/recipe.ts`
- Modify: `backend/src/routes/recipes.ts`

- [ ] **Step 1：在 `backend/src/types/recipe.ts` 的 `RecipeResponse` 加 `allergen_summary`**

找到：
```typescript
export type RecipeResponse = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  cuisine: string | null;
  cooking_time: number | null;
  servings: number | null;
  difficulty: string | null;
  created_at: string;
  updated_at: string;
};
```

改為：
```typescript
export type RecipeResponse = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  cuisine: string | null;
  cooking_time: number | null;
  servings: number | null;
  difficulty: string | null;
  created_at: string;
  updated_at: string;
  allergen_summary: string[];
};
```

- [ ] **Step 2：在 `backend/src/routes/recipes.ts` 的 `rowToResponse` 函式加入 `allergen_summary`**

找到：
```typescript
function rowToResponse(row: RecipeRow): RecipeResponse {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    image_url: row.image_url,
    cuisine: row.cuisine,
    cooking_time: row.cooking_time,
    servings: row.servings,
    difficulty: row.difficulty,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}
```

改為：
```typescript
function rowToResponse(row: RecipeRow & { allergen_summary?: string[] }): RecipeResponse {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    image_url: row.image_url,
    cuisine: row.cuisine,
    cooking_time: row.cooking_time,
    servings: row.servings,
    difficulty: row.difficulty,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    allergen_summary: row.allergen_summary ?? [],
  };
}
```

- [ ] **Step 3：修改 `GET /api/recipes` 的 SQL 查詢（約 line 578）**

找到：
```typescript
    const result = await pool.query<RecipeRow>(
      `SELECT r.* FROM recipes r ${where} ORDER BY r.title ASC`,
      params
    );
```

改為：
```typescript
    const result = await pool.query<RecipeRow & { allergen_summary: string[] }>(
      `SELECT r.*,
        ARRAY(
          SELECT DISTINCT val
          FROM recipe_ingredients ri,
               unnest(ri.allergens) AS val
          WHERE ri.recipe_id = r.id
            AND val <> ''
        ) AS allergen_summary
       FROM recipes r ${where} ORDER BY r.title ASC`,
      params
    );
```

- [ ] **Step 4：確認編譯通過**

```bash
cd /Users/yukuan/Desktop/web-app-final/backend
npm run build 2>&1 | tail -20
```

- [ ] **Step 5：手動驗證 API 回傳有 allergen_summary**

```bash
TOKEN="your_jwt_token_here"
curl -s http://localhost:3001/api/recipes \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | grep -A3 allergen_summary
```

Expected: 每道食譜有 `"allergen_summary": [...]`（對於有過敏原食材的食譜會有內容）

- [ ] **Step 6：Commit**

```bash
git add backend/src/types/recipe.ts backend/src/routes/recipes.ts
git commit -m "feat: add allergen_summary to recipe list API response"
```

---

## Task 4：前端 types + API 函式

**Files:**
- Modify: `frontend/src/types/recipe.ts`
- Modify: `frontend/src/api/recipes.ts`

- [ ] **Step 1：在 `frontend/src/types/recipe.ts` 的 `Recipe` type 加 `allergen_summary`，並加 `AiPickResponse`**

找到：
```typescript
export type Recipe = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  cuisine: string | null;
  cooking_time: number | null;
  servings: number | null;
  difficulty: string | null;
  created_at: string;
  updated_at: string;
};
```

改為：
```typescript
export type Recipe = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  cuisine: string | null;
  cooking_time: number | null;
  servings: number | null;
  difficulty: string | null;
  created_at: string;
  updated_at: string;
  allergen_summary: string[];
};

export type AiPickResponse = {
  picked_id: number;
  explanation: string;
};
```

- [ ] **Step 2：在 `frontend/src/api/recipes.ts` 加入 `fetchAiPick`**

在檔案末尾加入：

```typescript
import type { AiPickResponse } from "../types/recipe";

export async function fetchAiPick(
  recommendations: RecipeRecommendation[],
  userPrompt?: string
): Promise<AiPickResponse> {
  const { data } = await api.post<AiPickResponse>("/api/recipes/ai-pick", {
    recommendations: recommendations.slice(0, 8),
    userPrompt: userPrompt ?? "",
  });
  return data;
}
```

注意：`import type { AiPickResponse }` 要加在檔案頂部的 import 行，合併到現有的 type import：
```typescript
import type { Recipe, RecipeDetail, RecipeRecommendation, AiPickResponse } from "../types/recipe";
```

- [ ] **Step 3：確認前端 TypeScript 無錯**

```bash
cd /Users/yukuan/Desktop/web-app-final/frontend
npx tsc --noEmit 2>&1 | head -30
```

Expected: 無錯誤（或只有既有的不相關警告）

- [ ] **Step 4：Commit**

```bash
git add frontend/src/types/recipe.ts frontend/src/api/recipes.ts
git commit -m "feat: add allergen_summary type and fetchAiPick API function"
```

---

## Task 5：建立 `AiPickBanner` 元件

**Files:**
- Create: `frontend/src/components/AiPickBanner.tsx`

- [ ] **Step 1：建立 `frontend/src/components/AiPickBanner.tsx`**

```typescript
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
```

- [ ] **Step 2：確認 TypeScript 無錯**

```bash
cd /Users/yukuan/Desktop/web-app-final/frontend
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3：Commit**

```bash
git add frontend/src/components/AiPickBanner.tsx
git commit -m "feat: add AiPickBanner component for AI recipe selection"
```

---

## Task 6：RecipesPage — 整合 AiPickBanner 和過敏原 badge

**Files:**
- Modify: `frontend/src/pages/RecipesPage.tsx`

- [ ] **Step 1：引入 AiPickBanner**

在 `frontend/src/pages/RecipesPage.tsx` 頂部 import 區塊加入：

```typescript
import { AiPickBanner } from "../components/AiPickBanner";
```

- [ ] **Step 2：在 `RecommendationCard` 底部加過敏原 badge**

找到 `RecommendationCard` 裡的這段（在 `mt-auto` div 之前）：

```typescript
        <div className="mt-auto flex flex-nowrap items-center gap-3 overflow-hidden pt-3">
          <ProgressRing ratio={rec.match_ratio} size={44} />
```

在它之前插入：

```typescript
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
```

- [ ] **Step 3：在 `AllRecipeCard` 底部加過敏原 badge**

找到 `AllRecipeCard` 裡的：

```typescript
        <div className="mt-auto flex flex-nowrap items-center gap-2 overflow-hidden pt-2">
          <DifficultyBadge difficulty={recipe.difficulty} />
```

在它之前插入：

```typescript
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
```

- [ ] **Step 4：在推薦模式列表非空時插入 AiPickBanner**

找到：

```typescript
        {!isLoading && !isError && mode === "recommended" && visible.length > 0 && (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
```

在整個 `motion.div` 之前插入：

```typescript
        {!isLoading && !isError && mode === "recommended" && visible.length > 0 && (
          <AiPickBanner recommendations={visible} />
        )}
```

- [ ] **Step 5：確認 TypeScript 無錯**

```bash
cd /Users/yukuan/Desktop/web-app-final/frontend
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6：啟動前端確認畫面**

```bash
# 確認後端已跑：cd backend && npm run dev
cd /Users/yukuan/Desktop/web-app-final/frontend
npm run dev
```

在瀏覽器開 http://localhost:5173/recipes，切換到「推薦食譜」模式，確認：
- 推薦列表頂部出現 AiPickBanner（琥珀色區塊）
- 輸入框與按鈕正常顯示
- 點「讓 AI 幫我選」後出現 loading 狀態，完成後展開精選卡片
- 精選卡片顯示食譜圖片、標題、AI 說明、ProgressRing
- 切到「全部食譜」模式後 AiPickBanner 消失

- [ ] **Step 7：Commit**

```bash
git add frontend/src/pages/RecipesPage.tsx
git commit -m "feat: add AiPickBanner and allergen badges to RecipesPage"
```

---

## Task 7：RecipeDetailPage — 過敏原彙總列

**Files:**
- Modify: `frontend/src/pages/RecipeDetailPage.tsx`

- [ ] **Step 1：在食材清單區塊加過敏原彙總**

在 `frontend/src/pages/RecipeDetailPage.tsx` 找到以下 `<section>` 起頭（約 line 259）：

```typescript
            <section>
              <h3 className="mb-3 font-['Noto_Serif_TC'] text-lg font-semibold text-app-text">
                食材
              </h3>
              {hasMissingIngredients && (
```

在 `<h3>食材</h3>` 之後、`{hasMissingIngredients && ...}` 之前插入：

```typescript
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
```

- [ ] **Step 2：確認 TypeScript 無錯**

```bash
cd /Users/yukuan/Desktop/web-app-final/frontend
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3：在瀏覽器確認**

開啟一道有過敏原食材的食譜詳情頁，確認在食材清單上方出現橙色警示列（例：「⚠️ 含有：麩質、蛋」）。若食譜食材均無過敏原則不顯示。

- [ ] **Step 4：Commit**

```bash
git add frontend/src/pages/RecipeDetailPage.tsx
git commit -m "feat: add allergen summary row to RecipeDetailPage"
```

---

## Task 8：RecipeCreatePage & RecipeEditPage — 一鍵批次偵測

**Files:**
- Modify: `frontend/src/pages/RecipeCreatePage.tsx`
- Modify: `frontend/src/pages/RecipeEditPage.tsx`

- [ ] **Step 1：在 `RecipeCreatePage.tsx` 加批次偵測按鈕和邏輯**

在 `RecipeCreatePage` 中找到已有的 `autoDetecting` state，在它下方加入：

```typescript
  const [batchDetecting, setBatchDetecting] = useState(false);

  async function handleBatchAutoDetect() {
    const targets = ingredients.filter(
      (r) => r.name.trim() && r.allergens.length === 0
    );
    if (targets.length === 0) {
      toast.info("所有有名稱的食材已有過敏原資訊");
      return;
    }
    setBatchDetecting(true);
    let successCount = 0;
    let errorCount = 0;
    await Promise.all(
      targets.map(async (row) => {
        try {
          const { allergens } = await autoAllergens(row.name.trim());
          setIngredients((prev) =>
            prev.map((r) => (r.id === row.id ? { ...r, allergens } : r))
          );
          successCount++;
        } catch {
          errorCount++;
        }
      })
    );
    setBatchDetecting(false);
    if (errorCount === 0) {
      toast.success(`已偵測 ${successCount} 項食材的過敏原`);
    } else {
      toast.warning(`已偵測 ${successCount} 項，${errorCount} 項失敗`);
    }
  }
```

- [ ] **Step 2：在「新增食材」按鈕旁加批次偵測按鈕**

找到：
```typescript
            <button
              type="button"
              onClick={addIngredientRow}
              className="flex items-center gap-1.5 text-sm text-app-primary hover:text-app-primary-hover transition"
            >
```

在它之後（同一層）加入：

```typescript
            <button
              type="button"
              onClick={() => void handleBatchAutoDetect()}
              disabled={batchDetecting}
              className="flex items-center gap-1.5 text-sm text-app-muted hover:text-app-primary transition disabled:opacity-40"
            >
              <span>{batchDetecting ? "偵測中…" : "🔍 一鍵偵測所有過敏原"}</span>
            </button>
```

- [ ] **Step 3：在 `RecipeEditPage.tsx` 做相同修改**

`RecipeEditPage` 的結構與 `RecipeCreatePage` 幾乎相同，同樣：

1. 找到 `autoDetecting` state 宣告處，在其下方加入：

```typescript
  const [batchDetecting, setBatchDetecting] = useState(false);

  async function handleBatchAutoDetect() {
    const targets = ingredients.filter(
      (r) => r.name.trim() && r.allergens.length === 0
    );
    if (targets.length === 0) {
      toast.info("所有有名稱的食材已有過敏原資訊");
      return;
    }
    setBatchDetecting(true);
    let successCount = 0;
    let errorCount = 0;
    await Promise.all(
      targets.map(async (row) => {
        try {
          const { allergens } = await autoAllergens(row.name.trim());
          setIngredients((prev) =>
            prev.map((r) => (r.id === row.id ? { ...r, allergens } : r))
          );
          successCount++;
        } catch {
          errorCount++;
        }
      })
    );
    setBatchDetecting(false);
    if (errorCount === 0) {
      toast.success(`已偵測 ${successCount} 項食材的過敏原`);
    } else {
      toast.warning(`已偵測 ${successCount} 項，${errorCount} 項失敗`);
    }
  }
```

2. 找到「新增食材」按鈕旁加入同樣的批次偵測按鈕（程式碼同 Step 2）。

- [ ] **Step 4：確認 TypeScript 無錯**

```bash
cd /Users/yukuan/Desktop/web-app-final/frontend
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5：在瀏覽器確認**

- 開「建立食譜」頁，加入多個食材（至少有名稱），點「🔍 一鍵偵測所有過敏原」
- 確認 toast 顯示偵測結果，且各食材的過敏原 chip 自動填入
- 對已有過敏原的食材，點按鈕後 toast 提示「所有有名稱的食材已有過敏原資訊」

- [ ] **Step 6：Commit**

```bash
git add frontend/src/pages/RecipeCreatePage.tsx frontend/src/pages/RecipeEditPage.tsx
git commit -m "feat: add batch allergen detection to create/edit recipe pages"
```

---

## 驗收清單

完成所有 task 後，確認：

- [ ] 推薦食譜頁頂部出現 AiPickBanner（有推薦食譜時）
- [ ] 輸入需求後按「讓 AI 幫我選」，精選卡片正確展開，顯示 AI 選的食譜與理由
- [ ] AI pick 失敗時（例如拔掉 OPENAI_API_KEY）顯示 toast 錯誤，不中斷頁面
- [ ] 推薦卡片和全部食譜卡片底部正確顯示過敏原 badge（無過敏原時不顯示）
- [ ] 食譜詳情頁在食材清單上方正確顯示過敏原彙總（無過敏原時不顯示）
- [ ] 建立/編輯食譜頁的「🔍 一鍵偵測所有過敏原」按鈕可用，偵測後 toast 顯示結果
