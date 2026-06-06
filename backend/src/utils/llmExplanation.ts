import OpenAI from "openai";

let client: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface ExplanationInput {
  recipeName: string;
  matchRatio: number;
  matchCount: number;
  totalIngredients: number;
  matchedIngredients: string[];
  missingIngredients: string[];
  nearExpiryIngredients: string[];
}

export async function generateAiExplanation(
  input: ExplanationInput
): Promise<string> {
  const {
    recipeName,
    matchRatio,
    matchCount,
    totalIngredients,
    matchedIngredients,
    missingIngredients,
    nearExpiryIngredients,
  } = input;

  const prompt = `你是一個廚房助理，根據冰箱食材資訊，用1到2句繁體中文說明為什麼推薦這道食譜。語氣要自然、親切，不要照抄數字，要說出具體理由。請直接輸出推薦理由，不要加任何前綴或標題。

以下是幾個範例：

食譜：番茄炒蛋
冰箱已有食材（2/2）：番茄、雞蛋
缺少食材：無
即將過期的食材：番茄
匹配率：100%
推薦理由：食材全部到位，而且番茄快過期了，現在煮剛好能物盡其用，完全不需要額外採購。

食譜：味噌湯
冰箱已有食材（3/4）：豆腐、蔥、海帶
缺少食材：味噌
即將過期的食材：無
匹配率：75%
推薦理由：大部分食材都有了，只差味噌，隨手買一包就能完成這道暖胃的湯品。

食譜：蒜炒高麗菜
冰箱已有食材（1/3）：高麗菜
缺少食材：蒜頭、醬油
即將過期的食材：高麗菜
匹配率：33%
推薦理由：高麗菜快到期了，趁新鮮趕快用掉，只需要再補個蒜頭和醬油就能完成。

---

現在請根據以下資訊給出推薦理由：

食譜：${recipeName}
冰箱已有食材（${matchCount}/${totalIngredients}）：${matchedIngredients.join("、") || "無"}
缺少食材：${missingIngredients.join("、") || "無"}
即將過期的食材：${nearExpiryIngredients.join("、") || "無"}
匹配率：${Math.round(matchRatio * 100)}%
推薦理由：`;

  if (!client) return "";

  const response = await client.chat.completions.create({
    model: "gpt-5.4-mini",
    max_completion_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}
