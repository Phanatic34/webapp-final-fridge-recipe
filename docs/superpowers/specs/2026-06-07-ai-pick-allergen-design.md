---
name: ai-pick-allergen-design
description: 今日 AI 精選食譜按鈕 + 過敏原功能強化的設計規格
metadata:
  type: project
---

# AI 精選食譜 & 過敏原強化設計

## 背景

現有系統已有兩個初步 AI 功能：
1. `generateAiExplanation()` — 對每道推薦食譜生成一句推薦理由，顯示在卡片上
2. `autoDetectAllergens()` — 建立/編輯食譜時，逐一偵測各食材的過敏原

本次擴充目標：
- **Feature 1**：在推薦頁加入「今日 AI 精選」，讓 AI 從推薦列表中主動選出最適合今天的一道食譜，並寫出更完整的理由
- **Feature 2**：強化過敏原功能的覆蓋面（批次偵測、詳情頁彙總、卡片 badge）

---

## Feature 1：今日 AI 精選

### 使用者體驗

1. 使用者進入「推薦食譜」頁面，推薦列表照常顯示（現有行為不變）
2. 頁面頂部（推薦列表上方）顯示 `AiPickBanner`：
   - 預設狀態：「✨ 今日 AI 精選」按鈕 + 選填輸入框（placeholder：「有什麼特別需求嗎？」）
   - 推薦列表為空時隱藏此區塊
3. 點擊按鈕後：按鈕進入 loading 狀態，呼叫 `POST /api/recipes/ai-pick`
4. 完成後展開精選卡片（橫向寬卡），包含：
   - 食譜圖片（若有）
   - 食譜標題
   - AI 說明 2~3 句（繁體中文，說明為何選這道、不選其他）
   - 匹配率（ProgressRing）
   - 烹飪時間
   - 點擊進入食譜詳情頁
   - ✕ 按鈕可關閉，關閉後回到預設按鈕狀態
5. AI pick 失敗 → 按鈕恢復可點擊，toast 顯示「AI 精選暫時無法使用，請稍後再試」

### 後端：`POST /api/recipes/ai-pick`

**路徑**：`backend/src/routes/recipes.ts`（新增 route，掛在現有 router 上）

**Request body**：
```ts
{
  recommendations: RecommendationResponse[],  // 最多 8 道（前端截斷）
  userPrompt?: string                          // 使用者選填需求，最長 100 字
}
```

**邏輯**：
1. 驗證 `recommendations` 為非空陣列
2. 把每道食譜的關鍵資訊（名稱、匹配率、即將過期食材、缺少食材、烹飪時間）格式化成 prompt
3. 若有 `userPrompt`，附加至 prompt
4. 呼叫 GPT，要求以 JSON 格式回傳 `{ "picked_id": number, "explanation": string }`
5. 驗證 `picked_id` 存在於傳入的 recommendations 中
6. 回傳 `{ picked_id, explanation }`

**Response**：
```ts
{ picked_id: number; explanation: string }
```

**錯誤情況**：
- body 驗證失敗 → 400
- GPT 回傳格式錯誤或 picked_id 不在列表中 → 500（前端顯示 toast，不中斷頁面）
- OpenAI key 未設定 → 500

**新增工具函式**：`backend/src/utils/aiPick.ts`
- `generateAiPick(recommendations, userPrompt?)` — 封裝 GPT 呼叫邏輯，與 `llmExplanation.ts` 同層

### 前端

**新增元件**：`frontend/src/components/AiPickBanner.tsx`
- Props: `recommendations: RecipeRecommendation[]`
- 內部 state: `status: 'idle' | 'loading' | 'done' | 'error'`、`pickedRec`、`aiExplanation`、`userPrompt`
- 呼叫 `POST /api/recipes/ai-pick` 使用 axios（不走 TanStack Query，因為是一次性觸發）

**新增 API 函式**：`frontend/src/api/recipes.ts` 加入 `fetchAiPick(recommendations, userPrompt?)`

**RecipesPage 改動**：
- 在推薦模式、列表非空時，推薦 grid 上方插入 `<AiPickBanner recommendations={visible} />`

---

## Feature 2：過敏原強化

### 2A：建立/編輯食譜 — 一鍵批次偵測

**位置**：`RecipeCreatePage.tsx`、`RecipeEditPage.tsx`

**改動**：在「新增食材」按鈕旁加「🔍 一鍵偵測所有過敏原」按鈕。

**行為**：
- 篩選出所有有名稱但 `allergens` 為空陣列的食材
- 用 `Promise.all` 並行呼叫現有 `autoAllergens(name)` API（各食材獨立，不需序列等待）
- 全部完成後，toast 顯示「已偵測 N 項食材的過敏原」
- 部分失敗時跳過，toast 顯示「部分食材偵測失敗」
- 偵測中按鈕 disabled，顯示「偵測中…」

### 2B：食譜詳情頁 — 過敏原彙總

**位置**：`RecipeDetailPage.tsx`

**改動**：在食材清單上方加過敏原彙總列。

**邏輯**：把 `recipe.ingredients[].allergens` 全部合併去重，若有資料則顯示：
```
⚠️ 含有：麩質、蛋
```
若所有食材 allergens 皆為空陣列，則不顯示此列。

**樣式**：橙色/紅色警示 badge，符合現有 Warm Glass 設計。

### 2C：食譜卡片 — 過敏原 badge

**位置**：`RecipesPage.tsx` 的 `RecommendationCard` 和 `AllRecipeCard`

**資料來源**：
- `RecommendationCard`：`rec.ingredients[].allergens`（ingredients 已在 recommended API 回傳中）
- `AllRecipeCard`：目前 `GET /api/recipes` 不回傳 ingredients，需要在列表 endpoint 加入 allergen 彙總欄位

**後端改動**：`GET /api/recipes` 回傳的每筆食譜加入 `allergen_summary: string[]`（JOIN recipe_ingredients，彙總 unnest(allergens) 去重）

**前端改動**：
- `RecipeResponse` type 加 `allergen_summary?: string[]`
- 兩種卡片底部加過敏原 badge 列（若 allergen_summary 為空則不顯示）

---

## 不改動的部分

- 現有評分公式與排序邏輯完全不變
- 現有的逐卡 `ai_explanation`（"🤖 AI 推薦理由"）繼續存在
- 所有現有路由和 API endpoint 的 response 結構維持向下相容
- 模型名稱 `gpt-5.4-mini`（用於 `llmExplanation.ts`）不更動

---

## 實作順序建議

1. 後端：新增 `aiPick.ts` + `POST /api/recipes/ai-pick` route
2. 後端：`GET /api/recipes` 加入 `allergen_summary`
3. 前端：`AiPickBanner` 元件 + RecipesPage 整合
4. 前端：RecipeDetailPage 過敏原彙總
5. 前端：兩種食譜卡片加 allergen badge
6. 前端：建立/編輯食譜加批次偵測按鈕
