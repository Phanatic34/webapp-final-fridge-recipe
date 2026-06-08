import { Router } from "express";
import type { Request, Response } from "express";
import { pool } from "../db/pool.js";
import type { RecipeRow, RecipeResponse } from "../types/recipe.js";

const router = Router();



function rowToResponse(
  row: RecipeRow & { allergen_summary?: string[]; owner_name?: string | null },
  requestUserId?: string
): RecipeResponse {
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
    is_public: row.is_public,
    owner_name: row.owner_name ?? null,
    is_owner: requestUserId ? row.user_id === requestUserId : false,
  };
}

/** GET /api/favorites */
router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await pool.query<RecipeRow & { owner_name: string | null }>(
      `SELECT r.*, u.display_name AS owner_name
       FROM favorites f
       JOIN recipes r ON r.id = f.recipe_id
       JOIN users u ON u.id = r.user_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.userId]
    );

    res.json({ recipes: result.rows.map((row) => rowToResponse(row, req.userId)) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "無法取得收藏清單" });
  }
});

/** POST /api/favorites/:recipeId */
router.post("/:recipeId", async (req: Request, res: Response) => {
  const recipeId = Number.parseInt(req.params.recipeId, 10);
  if (Number.isNaN(recipeId)) {
    res.status(400).json({ error: "無效的食譜 ID" });
    return;
  }

  try {
    const recipeResult = await pool.query<RecipeRow & { owner_name: string | null }>(
      `SELECT r.*, u.display_name AS owner_name
       FROM recipes r
       JOIN users u ON u.id = r.user_id
       WHERE r.id = $1 AND (r.is_public = TRUE OR r.user_id = $2)`,
      [recipeId, req.userId]
    );

    if (recipeResult.rows.length === 0) {
      res.status(404).json({ error: "找不到該食譜" });
      return;
    }

    await pool.query(
      `INSERT INTO favorites (user_id, recipe_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, recipe_id) DO NOTHING`,
      [req.userId, recipeId]
    );

    res.status(201).json({ recipe: rowToResponse(recipeResult.rows[0], req.userId) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "無法新增收藏" });
  }
});

/** DELETE /api/favorites/:recipeId */
router.delete("/:recipeId", async (req: Request, res: Response) => {
  const recipeId = Number.parseInt(req.params.recipeId, 10);
  if (Number.isNaN(recipeId)) {
    res.status(400).json({ error: "無效的食譜 ID" });
    return;
  }

  try {
    const result = await pool.query(
      `DELETE FROM favorites
       WHERE user_id = $1 AND recipe_id = $2
       RETURNING recipe_id`,
      [req.userId, recipeId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "找不到該收藏項目" });
      return;
    }

    res.json({ message: "已移除" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "無法移除收藏" });
  }
});

export default router;

