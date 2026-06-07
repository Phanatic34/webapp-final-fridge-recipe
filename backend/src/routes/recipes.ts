import { Router } from "express";
import type { Request, Response } from "express";
import { pool } from "../db/pool.js";
import { computeExpiryMeta } from "../utils/expiry.js";
import { generateAiExplanation } from "../utils/llmExplanation.js";
import { autoDetectAllergens } from "../utils/allergenMap.js";
import { generateAiPick } from "../utils/aiPick.js";
import type {
  RecipeRow,
  RecipeIngredientRow,
  RecipeResponse,
  RecipeDetailResponse,
  RecipeIngredient,
  RecommendationResponse,
} from "../types/recipe.js";

const router = Router();


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

function ingredientRowToResponse(row: RecipeIngredientRow): RecipeIngredient {
  const qty = row.quantity !== null ? Number.parseFloat(row.quantity) : null;
  return {
    id: row.id,
    name: row.name,
    quantity: qty !== null && Number.isFinite(qty) ? qty : null,
    unit: row.unit,
    allergens: row.allergens ?? [],
  };
}

// ─── Recommendation helpers ────────────────────────────────────

type FridgeQuantity = {
  is_near_expiry: boolean;
  count_qty: number | null;
  count_unit: string | null;
  measure_qty: number | null;
  measure_unit: string | null;
};

async function loadFridge(userId: string) {
  const { rows } = await pool.query<{
    name: string;
    expiry_date: string | Date | null;
    count_quantity: string | null;
    count_unit: string | null;
    measure_quantity: string | null;
    measure_unit: string | null;
  }>(
    `SELECT name, expiry_date, count_quantity, count_unit, measure_quantity, measure_unit
     FROM ingredients WHERE user_id = $1`,
    [userId]
  );

  const itemMap = new Map<string, FridgeQuantity>();
  for (const r of rows) {
    const meta = computeExpiryMeta(r.expiry_date);
    itemMap.set(r.name.toLowerCase(), {
      is_near_expiry: meta.is_near_expiry,
      count_qty: r.count_quantity !== null ? Number.parseFloat(r.count_quantity) : null,
      count_unit: r.count_unit,
      measure_qty: r.measure_quantity !== null ? Number.parseFloat(r.measure_quantity) : null,
      measure_unit: r.measure_unit,
    });
  }

  return { itemMap };
}

function toGrams(qty: number, unit: string): number | null {
  switch (unit.toLowerCase().trim()) {
    case "g":  return qty;
    case "kg": return qty * 1000;
    default:   return null;
  }
}

function toMl(qty: number, unit: string): number | null {
  switch (unit.toLowerCase().trim()) {
    case "ml": return qty;
    case "l":  return qty * 1000;
    default:   return null;
  }
}

const COUNT_CANONICAL: Record<string, string> = {
  pieces: "pieces", "個": "pieces", pcs: "pieces", pc: "pieces",
  packs: "packs",   "包": "packs",  pack: "packs",
};

function isSufficientQty(
  fridge: FridgeQuantity,
  recipeQty: number | null,
  recipeUnit: string | null
): boolean {
  if (recipeQty === null || recipeUnit === null) return true;

  const rUnit = recipeUnit.toLowerCase().trim();

  // Weight comparison (g / kg)
  const rGrams = toGrams(recipeQty, rUnit);
  if (rGrams !== null && fridge.measure_qty !== null && fridge.measure_unit !== null) {
    const fGrams = toGrams(fridge.measure_qty, fridge.measure_unit);
    if (fGrams !== null) return fGrams >= rGrams;
  }

  // Volume comparison (ml / L)
  const rMl = toMl(recipeQty, rUnit);
  if (rMl !== null && fridge.measure_qty !== null && fridge.measure_unit !== null) {
    const fMl = toMl(fridge.measure_qty, fridge.measure_unit);
    if (fMl !== null) return fMl >= rMl;
  }

  // Count comparison (pieces / 個 / packs / 包)
  const rCanon = COUNT_CANONICAL[rUnit];
  if (rCanon !== undefined && fridge.count_qty !== null && fridge.count_unit !== null) {
    const fCanon = COUNT_CANONICAL[fridge.count_unit.toLowerCase().trim()];
    if (fCanon === rCanon) return fridge.count_qty >= recipeQty;
  }

  // Incompatible or unknown units (tbsp, tsp, …) → name match is enough
  return true;
}

type RecipeWithIngredients = RecipeRow & {
  ingredientRows: RecipeIngredientRow[];
};

async function loadAllRecipesWithIngredients(userId: string): Promise<
  RecipeWithIngredients[]
> {
  const recipesResult = await pool.query<RecipeRow>(
    `SELECT * FROM recipes WHERE user_id = $1 ORDER BY title`,
    [userId]
  );

  const riResult = await pool.query<RecipeIngredientRow>(
    `SELECT * FROM recipe_ingredients ORDER BY recipe_id, id`
  );

  const riMap = new Map<number, RecipeIngredientRow[]>();
  for (const ri of riResult.rows) {
    let arr = riMap.get(ri.recipe_id);
    if (!arr) {
      arr = [];
      riMap.set(ri.recipe_id, arr);
    }
    arr.push(ri);
  }

  return recipesResult.rows.map((r) => ({
    ...r,
    ingredientRows: riMap.get(r.id) ?? [],
  }));
}

const ALLERGEN_ALIASES: Record<string, string[]> = {
  "花生": ["花生醬", "花生油", "peanut", "peanuts", "groundnut", "groundnuts"],
  "蛋":   ["雞蛋", "鴨蛋", "蛋白", "蛋黃", "皮蛋", "鹹蛋", "egg", "eggs"],
  "乳製品": ["牛奶", "鮮奶", "奶油", "奶粉", "鮮奶油", "起司", "起士", "乳酪", "優格", "煉乳", "milk", "butter", "cream", "cheese", "yogurt", "yoghurt", "dairy", "whey", "lactose"],
  "麩質": ["麵粉", "小麥", "麵條", "麵包", "烏龍麵", "義大利麵", "麥片", "燕麥", "wheat", "flour", "gluten", "barley", "rye", "oat", "oats", "spelt", "pasta", "noodles"],
  "海鮮": ["蝦", "蝦仁", "草蝦", "龍蝦", "蟹", "螃蟹", "魚", "鮭魚", "鮪魚", "鯖魚", "鱈魚", "花枝", "魷魚", "章魚", "蛤蜊", "蚵仔", "牡蠣", "干貝", "shrimp", "shrimps", "prawn", "prawns", "crab", "lobster", "fish", "salmon", "tuna", "squid", "oyster", "clam", "scallop", "seafood"],
};

async function loadExclusions(userId: string): Promise<Set<string>> {
  const { rows } = await pool.query<{ name: string }>(
    "SELECT LOWER(name) AS name FROM user_exclusions WHERE user_id = $1",
    [userId]
  );
  const set = new Set<string>();
  for (const row of rows) {
    set.add(row.name);
    for (const alias of ALLERGEN_ALIASES[row.name] ?? []) {
      set.add(alias.toLowerCase());
    }
  }
  return set;
}

async function loadUserEquipment(userId: string): Promise<Set<string>> {
  const { rows } = await pool.query<{ equipment_name: string }>(
    "SELECT equipment_name FROM user_equipment WHERE user_id = $1",
    [userId]
  );
  return new Set(rows.map((r) => r.equipment_name.toLowerCase()));
}

async function loadRecipeEquipmentMap(): Promise<Map<number, string[]>> {
  const { rows } = await pool.query<{ recipe_id: number; equipment_name: string }>(
    "SELECT recipe_id, equipment_name FROM recipe_equipment"
  );
  const map = new Map<number, string[]>();
  for (const row of rows) {
    const arr = map.get(row.recipe_id) ?? [];
    arr.push(row.equipment_name.toLowerCase());
    map.set(row.recipe_id, arr);
  }
  return map;
}

/**
 * Score one recipe against the fridge.
 *
 * Ranking formula (higher = better):
 *   score = match_ratio                        (0.0 – 1.0, sufficient matches only)
 *         + 0.15  if any sufficient-matched ingredient is near-expiry
 *         - 0.05 * (missing_count + insufficient_count)
 *
 * "insufficient" = ingredient exists in fridge but quantity is below what the recipe needs.
 * Insufficient items are excluded from match_ratio but keep the recipe visible in results.
 */
function scoreRecipe(
  recipe: RecipeWithIngredients,
  itemMap: Map<string, FridgeQuantity>
): RecommendationResponse {
  const matched: string[] = [];
  const insufficient: string[] = [];
  const missing: string[] = [];
  const nearExpiryUsed: string[] = [];

  for (const ri of recipe.ingredientRows) {
    const lower = ri.name.toLowerCase();
    const fridgeItem = itemMap.get(lower);

    if (fridgeItem) {
      const recipeQty = ri.quantity !== null ? Number.parseFloat(String(ri.quantity)) : null;
      if (isSufficientQty(fridgeItem, recipeQty, ri.unit)) {
        matched.push(ri.name);
        if (fridgeItem.is_near_expiry) nearExpiryUsed.push(ri.name);
      } else {
        insufficient.push(ri.name);
      }
    } else {
      missing.push(ri.name);
    }
  }

  const total = recipe.ingredientRows.length;
  const matchRatio = total > 0 ? matched.length / total : 0;
  const usesNearExpiry = nearExpiryUsed.length > 0;
  const effectiveMissingCount = missing.length + insufficient.length;

  const explanation: string[] = [];

  if (total === 0) {
    explanation.push("此食譜尚無食材清單。");
  } else if (matched.length === total) {
    explanation.push("你已擁有所有所需食材！");
  } else {
    explanation.push(`你已擁有 ${matched.length} / ${total} 項所需食材。`);
  }

  if (usesNearExpiry) {
    explanation.push(`可消耗即將到期食材：${nearExpiryUsed.join("、")}。`);
  }

  if (insufficient.length > 0) {
    explanation.push(`以下食材數量不足：${insufficient.join("、")}。`);
  }

  if (missing.length > 0 && missing.length <= 3) {
    explanation.push(`僅缺：${missing.join("、")}。`);
  } else if (missing.length > 3) {
    explanation.push(`尚缺 ${missing.length} 項食材。`);
  }

  return {
    recipe: rowToResponse(recipe),
    ingredients: recipe.ingredientRows.map(ingredientRowToResponse),
    match_count: matched.length,
    total_ingredients: total,
    missing_count: effectiveMissingCount,
    match_ratio: Math.round(matchRatio * 1000) / 1000,
    matched_ingredients: matched,
    missing_ingredients: missing,
    insufficient_ingredients: insufficient,
    uses_near_expiry: usesNearExpiry,
    near_expiry_ingredient_count: nearExpiryUsed.length,
    near_expiry_ingredients: nearExpiryUsed,
    explanation,
    ai_explanation: "",
  };
}

// ─── Routes ────────────────────────────────────────────────────

/**
 * GET /api/recipes/recommended
 *
 * Returns recipes ranked by how well they match the user's current fridge.
 * Only includes recipes with at least one matched ingredient (match_ratio > 0).
 */
router.get("/recommended", async (req: Request, res: Response) => {
  let maxTime: number | null = null;
  if (req.query.max_time != null) {
    maxTime = Number.parseInt(req.query.max_time as string, 10);
    if (Number.isNaN(maxTime) || maxTime <= 0) {
      res.status(400).json({ error: "max_time 必須為正整數" });
      return;
    }
  }

  try {
    const [fridge, recipes, exclusions, userEquipment, recipeEquipmentMap] =
      await Promise.all([
        loadFridge(req.userId),
        loadAllRecipesWithIngredients(req.userId),
        loadExclusions(req.userId),
        loadUserEquipment(req.userId),
        loadRecipeEquipmentMap(),
      ]);

    const scored = recipes
      .filter((recipe) => {
        // 1. Exclusion filter — skip recipes containing excluded ingredients or their allergen tags
        if (exclusions.size > 0) {
          const hasExcluded = recipe.ingredientRows.some((ri) =>
            exclusions.has(ri.name.toLowerCase()) ||
            ri.allergens.some((a) => exclusions.has(a.toLowerCase()))
          );
          if (hasExcluded) return false;
        }

        // 2. Equipment filter — only active when user has configured equipment
        if (userEquipment.size > 0) {
          const required = recipeEquipmentMap.get(recipe.id) ?? [];
          const missingEquipment = required.filter((eq) => !userEquipment.has(eq));
          if (missingEquipment.length > 0) return false;
        }

        // 3. Max cooking time filter
        if (maxTime !== null) {
          if (recipe.cooking_time == null || recipe.cooking_time > maxTime) return false;
        }

        return true;
      })
      .map((r) => scoreRecipe(r, fridge.itemMap))
      .filter((r) => r.match_count + r.insufficient_ingredients.length > 0);

    scored.sort((a, b) => {
      if (a.uses_near_expiry !== b.uses_near_expiry) {
        return a.uses_near_expiry ? -1 : 1;
      }
      if (a.match_ratio !== b.match_ratio) {
        return b.match_ratio - a.match_ratio;
      }
      if (a.missing_count !== b.missing_count) {
        return a.missing_count - b.missing_count;
      }
      return a.recipe.id - b.recipe.id;
    });

    const withAiExplanations = await Promise.all(
      scored.map(async (item) => {
        try {
          const ai_explanation = await generateAiExplanation({
            recipeName: item.recipe.title,
            matchRatio: item.match_ratio,
            matchCount: item.match_count,
            totalIngredients: item.total_ingredients,
            matchedIngredients: item.matched_ingredients,
            missingIngredients: item.missing_ingredients,
            nearExpiryIngredients: item.near_expiry_ingredients,
          });
          return { ...item, ai_explanation };
        } catch (err) {
          console.error("[AI explanation error]", err);
          return { ...item, ai_explanation: "" };
        }
      })
    );

    res.json({ recommendations: withAiExplanations });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "無法計算推薦食譜" });
  }
});

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

/** POST /api/recipes/auto-allergens */
router.post("/auto-allergens", async (req: Request, res: Response) => {
  const { name } = req.body as { name?: unknown };
  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const result = await autoDetectAllergens(name.trim());
  res.json(result);
});

/** POST /api/recipes */
router.post("/", async (req: Request, res: Response) => {
  const {
    title,
    description,
    cuisine,
    cooking_time,
    servings,
    difficulty,
    instructions,
    ingredients,
  } = req.body as {
    title?: unknown;
    description?: unknown;
    cuisine?: unknown;
    cooking_time?: unknown;
    servings?: unknown;
    difficulty?: unknown;
    instructions?: unknown;
    ingredients?: unknown;
  };

  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  const cookingTime =
    cooking_time !== undefined && cooking_time !== "" && cooking_time !== null
      ? Number(cooking_time)
      : null;
  const servingsNum =
    servings !== undefined && servings !== "" && servings !== null
      ? Number(servings)
      : 2;

  try {
    const recipeResult = await pool.query<RecipeRow>(
      `INSERT INTO recipes (user_id, title, description, cuisine, cooking_time, servings, difficulty, instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.userId,
        title.trim(),
        typeof description === "string" && description.trim() ? description.trim() : null,
        typeof cuisine === "string" && cuisine.trim() ? cuisine.trim() : null,
        cookingTime && !Number.isNaN(cookingTime) ? cookingTime : null,
        servingsNum && !Number.isNaN(servingsNum) ? servingsNum : 2,
        typeof difficulty === "string" && difficulty.trim() ? difficulty.trim() : "medium",
        typeof instructions === "string" && instructions.trim() ? instructions.trim() : null,
      ]
    );

    const recipe = recipeResult.rows[0];

    if (Array.isArray(ingredients)) {
      for (const ing of ingredients) {
        if (
          ing &&
          typeof ing === "object" &&
          typeof ing.name === "string" &&
          ing.name.trim()
        ) {
          const ingQty =
            ing.quantity !== undefined && ing.quantity !== "" && ing.quantity !== null
              ? Number(ing.quantity)
              : null;
          const allergens =
            Array.isArray(ing.allergens)
              ? ing.allergens.filter((a: unknown) => typeof a === "string")
              : [];
          await pool.query(
            `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, allergens) VALUES ($1, $2, $3, $4, $5)`,
            [
              recipe.id,
              ing.name.trim(),
              ingQty && !Number.isNaN(ingQty) ? ingQty : null,
              typeof ing.unit === "string" && ing.unit.trim() ? ing.unit.trim() : null,
              allergens,
            ]
          );
        }
      }
    }

    res.status(201).json({ recipe: rowToResponse(recipe) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create recipe" });
  }
});

/** PUT /api/recipes/:id */
router.put("/:id", async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { title, description, cuisine, cooking_time, servings, difficulty, instructions, ingredients } = req.body as {
    title?: unknown; description?: unknown; cuisine?: unknown;
    cooking_time?: unknown; servings?: unknown; difficulty?: unknown;
    instructions?: unknown; ingredients?: unknown;
  };

  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title is required" }); return;
  }

  const cookingTime = cooking_time !== undefined && cooking_time !== "" && cooking_time !== null ? Number(cooking_time) : null;
  const servingsNum = servings !== undefined && servings !== "" && servings !== null ? Number(servings) : 2;

  try {
    const result = await pool.query<RecipeRow>(
      `UPDATE recipes SET title=$1, description=$2, cuisine=$3, cooking_time=$4, servings=$5,
       difficulty=$6, instructions=$7, updated_at=NOW() WHERE id=$8 AND user_id=$9 RETURNING *`,
      [
        title.trim(),
        typeof description === "string" && description.trim() ? description.trim() : null,
        typeof cuisine === "string" && cuisine.trim() ? cuisine.trim() : null,
        cookingTime && !Number.isNaN(cookingTime) ? cookingTime : null,
        servingsNum && !Number.isNaN(servingsNum) ? servingsNum : 2,
        typeof difficulty === "string" && difficulty.trim() ? difficulty.trim() : "medium",
        typeof instructions === "string" && instructions.trim() ? instructions.trim() : null,
        id,
        req.userId,
      ]
    );

    if (result.rowCount === 0) { res.status(404).json({ error: "Recipe not found" }); return; }

    await pool.query("DELETE FROM recipe_ingredients WHERE recipe_id = $1", [id]);

    if (Array.isArray(ingredients)) {
      for (const ing of ingredients) {
        if (ing && typeof ing === "object" && typeof ing.name === "string" && ing.name.trim()) {
          const ingQty = ing.quantity !== undefined && ing.quantity !== "" && ing.quantity !== null ? Number(ing.quantity) : null;
          const allergens = Array.isArray(ing.allergens) ? ing.allergens.filter((a: unknown) => typeof a === "string") : [];
          await pool.query(
            `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, allergens) VALUES ($1, $2, $3, $4, $5)`,
            [
              id,
              ing.name.trim(),
              ingQty && !Number.isNaN(ingQty) ? ingQty : null,
              typeof ing.unit === "string" && ing.unit.trim() ? ing.unit.trim() : null,
              allergens,
            ]
          );
        }
      }
    }

    res.json({ recipe: rowToResponse(result.rows[0]) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update recipe" });
  }
});

/** DELETE /api/recipes/:id */
router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const result = await pool.query("DELETE FROM recipes WHERE id = $1 AND user_id = $2 RETURNING id", [id, req.userId]);
    if (result.rowCount === 0) { res.status(404).json({ error: "Recipe not found" }); return; }
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete recipe" });
  }
});

/** GET /api/recipes?cuisine= */
router.get("/", async (req: Request, res: Response) => {
  try {
    const cuisine = req.query.cuisine as string | undefined;

    const params: unknown[] = [req.userId];
    let where = "WHERE r.user_id = $1";
    if (cuisine && cuisine !== "all") {
      params.push(cuisine);
      where += ` AND LOWER(r.cuisine) = LOWER($${params.length})`;
    }

    const result = await pool.query<RecipeRow>(
      `SELECT r.* FROM recipes r ${where} ORDER BY r.title ASC`,
      params
    );

    res.json({ recipes: result.rows.map(rowToResponse) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "無法取得食譜清單" });
  }
});

/** GET /api/recipes/:id */
router.get("/:id", async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "無效的 ID" });
    return;
  }

  try {
    const recipeResult = await pool.query<RecipeRow>(
      `SELECT * FROM recipes WHERE id = $1 AND user_id = $2`,
      [id, req.userId]
    );

    if (recipeResult.rows.length === 0) {
      res.status(404).json({ error: "找不到該食譜" });
      return;
    }

    const row = recipeResult.rows[0];

    const ingResult = await pool.query<RecipeIngredientRow>(
      `SELECT * FROM recipe_ingredients WHERE recipe_id = $1 ORDER BY id`,
      [id]
    );

    const detail: RecipeDetailResponse = {
      ...rowToResponse(row),
      instructions: row.instructions,
      ingredients: ingResult.rows.map(ingredientRowToResponse),
    };

    res.json({ recipe: detail });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "無法取得食譜" });
  }
});

export default router;
