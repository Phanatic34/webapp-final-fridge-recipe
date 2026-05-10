import { Router } from "express";
import type { Request, Response } from "express";
import { pool } from "../db/pool.js";
import { computeExpiryMeta } from "../utils/expiry.js";
import type {
  RecipeRow,
  RecipeIngredientRow,
  RecipeResponse,
  RecipeDetailResponse,
  RecipeIngredient,
  RecommendationResponse,
} from "../types/recipe.js";

const router = Router();

const DEFAULT_USER_ID = 1;

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
  };
}

// ─── Recommendation helpers ────────────────────────────────────

type FridgeItem = {
  name: string;
  is_near_expiry: boolean;
};

/**
 * Build a Set of lowercase ingredient names currently in the fridge,
 * plus a Set of those that are near-expiry.
 */
async function loadFridge(userId: number) {
  const { rows } = await pool.query<{
    name: string;
    expiry_date: string | Date | null;
  }>(
    `SELECT name, expiry_date FROM ingredients WHERE user_id = $1`,
    [userId]
  );

  const items: FridgeItem[] = rows.map((r) => {
    const meta = computeExpiryMeta(r.expiry_date);
    return { name: r.name, is_near_expiry: meta.is_near_expiry };
  });

  const nameSet = new Set(items.map((i) => i.name.toLowerCase()));
  const nearExpirySet = new Set(
    items.filter((i) => i.is_near_expiry).map((i) => i.name.toLowerCase())
  );

  return { nameSet, nearExpirySet };
}

type RecipeWithIngredients = RecipeRow & {
  ingredientRows: RecipeIngredientRow[];
};

async function loadAllRecipesWithIngredients(): Promise<
  RecipeWithIngredients[]
> {
  const recipesResult = await pool.query<RecipeRow>(
    `SELECT * FROM recipes ORDER BY title`
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

async function loadExclusions(userId: number): Promise<Set<string>> {
  const { rows } = await pool.query<{ name: string }>(
    "SELECT LOWER(name) AS name FROM user_exclusions WHERE user_id = $1",
    [userId]
  );
  return new Set(rows.map((r) => r.name));
}

async function loadUserEquipment(userId: number): Promise<Set<string>> {
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
 *   score = match_ratio                        (0.0 – 1.0)
 *         + 0.15  if any matched ingredient is near-expiry
 *         - 0.05 * missing_count               (penalty per missing item)
 *
 * match_ratio alone is the primary factor (what % of ingredients you have).
 * The near-expiry bonus nudges recipes that help use up expiring food.
 * The missing-count penalty breaks ties between equal-ratio recipes.
 */
function scoreRecipe(
  recipe: RecipeWithIngredients,
  fridgeNames: Set<string>,
  nearExpiryNames: Set<string>
): RecommendationResponse {
  const matched: string[] = [];
  const missing: string[] = [];
  const nearExpiryUsed: string[] = [];

  for (const ri of recipe.ingredientRows) {
    const lower = ri.name.toLowerCase();
    if (fridgeNames.has(lower)) {
      matched.push(ri.name);
      if (nearExpiryNames.has(lower)) {
        nearExpiryUsed.push(ri.name);
      }
    } else {
      missing.push(ri.name);
    }
  }

  const total = recipe.ingredientRows.length;
  const matchRatio = total > 0 ? matched.length / total : 0;
  const usesNearExpiry = nearExpiryUsed.length > 0;

  const explanation: string[] = [];

  if (total === 0) {
    explanation.push("此食譜尚無食材清單。");
  } else if (matched.length === total) {
    explanation.push("你已擁有所有所需食材！");
  } else {
    explanation.push(
      `你已擁有 ${matched.length} / ${total} 項所需食材。`
    );
  }

  if (usesNearExpiry) {
    explanation.push(
      `可消耗即將到期食材：${nearExpiryUsed.join("、")}。`
    );
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
    missing_count: missing.length,
    match_ratio: Math.round(matchRatio * 1000) / 1000,
    matched_ingredients: matched,
    missing_ingredients: missing,
    uses_near_expiry: usesNearExpiry,
    near_expiry_ingredient_count: nearExpiryUsed.length,
    near_expiry_ingredients: nearExpiryUsed,
    explanation,
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
      res.status(400).json({ error: "max_time must be a positive integer" });
      return;
    }
  }

  try {
    const [fridge, recipes, exclusions, userEquipment, recipeEquipmentMap] =
      await Promise.all([
        loadFridge(DEFAULT_USER_ID),
        loadAllRecipesWithIngredients(),
        loadExclusions(DEFAULT_USER_ID),
        loadUserEquipment(DEFAULT_USER_ID),
        loadRecipeEquipmentMap(),
      ]);

    const scored = recipes
      .filter((recipe) => {
        // 1. Exclusion filter — skip recipes containing excluded ingredients
        if (exclusions.size > 0) {
          const hasExcluded = recipe.ingredientRows.some((ri) =>
            exclusions.has(ri.name.toLowerCase())
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
      .map((r) => scoreRecipe(r, fridge.nameSet, fridge.nearExpirySet))
      .filter((r) => r.match_count > 0);

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

    res.json({ recommendations: scored });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to compute recommendations" });
  }
});

/** GET /api/recipes?cuisine= */
router.get("/", async (req: Request, res: Response) => {
  try {
    const cuisine = req.query.cuisine as string | undefined;

    const params: unknown[] = [];
    let where = "";
    if (cuisine && cuisine !== "all") {
      params.push(cuisine);
      where = `WHERE LOWER(r.cuisine) = LOWER($${params.length})`;
    }

    const result = await pool.query<RecipeRow>(
      `SELECT r.* FROM recipes r ${where} ORDER BY r.title ASC`,
      params
    );

    res.json({ recipes: result.rows.map(rowToResponse) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list recipes" });
  }
});

/** GET /api/recipes/:id */
router.get("/:id", async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const recipeResult = await pool.query<RecipeRow>(
      `SELECT * FROM recipes WHERE id = $1`,
      [id]
    );

    if (recipeResult.rows.length === 0) {
      res.status(404).json({ error: "Recipe not found" });
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
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
});

export default router;
