import { Router } from "express";
import type { Request, Response } from "express";
import { pool } from "../db/pool.js";
import type {
  RecipeRow,
  RecipeIngredientRow,
  RecipeResponse,
  RecipeDetailResponse,
  RecipeIngredient,
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
  };
}

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
