import { Router } from "express";
import type { Request, Response } from "express";
import { pool } from "../db/pool.js";

const router = Router();


type ShoppingListRow = {
  id: number;
  user_id: number;
  ingredient_name: string;
  quantity: string | null;
  unit: string | null;
  is_checked: boolean;
  source_recipe_id: number | null;
  source_recipe_title: string | null;
  created_at: Date;
};

// GET /api/shopping-list
router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await pool.query<ShoppingListRow>(
      `SELECT sl.*, r.title AS source_recipe_title
       FROM shopping_list sl
       LEFT JOIN recipes r ON sl.source_recipe_id = r.id
       WHERE sl.user_id = $1
       ORDER BY sl.is_checked ASC, sl.created_at ASC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "無法取得購物清單" });
  }
});

// POST /api/shopping-list — manual add
router.post("/", async (req: Request, res: Response) => {
  const { ingredient_name, quantity, unit } = req.body as {
    ingredient_name?: unknown;
    quantity?: unknown;
    unit?: unknown;
  };

  if (typeof ingredient_name !== "string" || !ingredient_name.trim()) {
    res.status(400).json({ error: "ingredient_name is required" });
    return;
  }

  const qty =
    quantity !== undefined && quantity !== "" && quantity !== null
      ? Number(quantity)
      : null;
  if (qty !== null && (Number.isNaN(qty) || qty <= 0)) {
    res.status(400).json({ error: "quantity must be a positive number" });
    return;
  }

  const unitStr =
    typeof unit === "string" && unit.trim() ? unit.trim() : null;

  try {
    const result = await pool.query<ShoppingListRow>(
      `INSERT INTO shopping_list (user_id, ingredient_name, quantity, unit)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, ingredient_name) DO NOTHING
       RETURNING *`,
      [req.userId, ingredient_name.trim(), qty, unitStr]
    );
    if (result.rows.length === 0) {
      res
        .status(409)
        .json({ error: `「${ingredient_name.trim()}」已在購物清單中` });
      return;
    }
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to add item" });
  }
});

// POST /api/shopping-list/from-recipe/:recipeId — MUST be before /:id
router.post("/from-recipe/:recipeId", async (req: Request, res: Response) => {
  const recipeId = Number.parseInt(req.params.recipeId, 10);
  if (Number.isNaN(recipeId)) {
    res.status(400).json({ error: "無效的食譜 ID" });
    return;
  }
  try {
    const [recipeIngredientsResult, fridgeResult] = await Promise.all([
      pool.query<{ name: string; quantity: string | null; unit: string | null }>(
        "SELECT name, quantity, unit FROM recipe_ingredients WHERE recipe_id = $1",
        [recipeId]
      ),
      pool.query<{ name: string }>(
        "SELECT LOWER(name) AS name FROM ingredients WHERE user_id = $1",
        [req.userId]
      ),
    ]);

    const fridgeNames = new Set(fridgeResult.rows.map((r) => r.name));
    const missing = recipeIngredientsResult.rows.filter(
      (ri) => !fridgeNames.has(ri.name.toLowerCase())
    );

    if (missing.length === 0) {
      res.json({ added: 0, items: [] });
      return;
    }

    const inserted: ShoppingListRow[] = [];
    for (const item of missing) {
      const result = await pool.query<ShoppingListRow>(
        `INSERT INTO shopping_list (user_id, ingredient_name, quantity, unit, source_recipe_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, ingredient_name) DO NOTHING
         RETURNING *`,
        [req.userId, item.name, item.quantity ?? null, item.unit ?? null, recipeId]
      );
      if (result.rows.length > 0) inserted.push(result.rows[0]);
    }

    res.status(201).json({ added: inserted.length, items: inserted });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "無法新增購物清單項目" });
  }
});

// DELETE /api/shopping-list/clear-checked — MUST be before /:id
router.delete("/clear-checked", async (req: Request, res: Response) => {
  try {
    await pool.query(
      "DELETE FROM shopping_list WHERE user_id = $1 AND is_checked = TRUE",
      [req.userId]
    );
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "無法清除已勾選項目" });
  }
});

// PATCH /api/shopping-list/:id — update is_checked and/or quantity
router.patch("/:id", async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "無效的 ID" });
    return;
  }
  const { is_checked, quantity } = req.body as { is_checked?: unknown; quantity?: unknown };

  if (is_checked !== undefined && typeof is_checked !== "boolean") {
    res.status(400).json({ error: "is_checked 必須為布林值" });
    return;
  }
  if (quantity !== undefined && (typeof quantity !== "number" || quantity <= 0)) {
    res.status(400).json({ error: "quantity 必須為正數" });
    return;
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  if (is_checked !== undefined) { fields.push(`is_checked = $${fields.length + 1}`); values.push(is_checked); }
  if (quantity !== undefined)   { fields.push(`quantity = $${fields.length + 1}`);   values.push(quantity); }

  if (fields.length === 0) {
    res.status(400).json({ error: "無可更新的欄位" });
    return;
  }

  try {
    const result = await pool.query<ShoppingListRow>(
      `UPDATE shopping_list SET ${fields.join(", ")} WHERE id = $${fields.length + 1} AND user_id = $${fields.length + 2} RETURNING *`,
      [...values, id, req.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "找不到該項目" });
      return;
    }
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "無法更新項目" });
  }
});

// DELETE /api/shopping-list/:id — MUST be after /clear-checked
router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "無效的 ID" });
    return;
  }
  try {
    await pool.query(
      "DELETE FROM shopping_list WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "無法刪除項目" });
  }
});

export default router;
