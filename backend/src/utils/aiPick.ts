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
  if (!text) {
    throw new Error("AI returned empty response");
  }
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
