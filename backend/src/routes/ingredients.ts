import { Router } from "express";
import type { Request, Response } from "express";
import { pool } from "../db/pool.js";
import { validateBody } from "../middleware/validate.js";
import {
  createIngredientSchema,
  updateIngredientSchema,
  type IngredientRow,
  type IngredientResponse,
} from "../types/ingredient.js";
import { computeExpiryMeta } from "../utils/expiry.js";

const router = Router();

const DEFAULT_USER_ID = 1;

/**
 * API + DB: stable YYYY-MM-DD or null (never leak raw Date to JSON).
 * Date → string uses UTC calendar date (toISOString slice) to align with computeExpiryMeta.
 */
function normalizeExpiryDate(value: unknown): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return null;
    return s.slice(0, 10);
  }

  return null;
}

function rowToResponse(row: IngredientRow): IngredientResponse {
  const qty = Number.parseFloat(row.quantity);
  const expiryDate = normalizeExpiryDate(row.expiry_date);
  const meta = computeExpiryMeta(expiryDate);
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    quantity: Number.isFinite(qty) ? qty : 0,
    unit: row.unit,
    category: row.category,
    status: row.status,
    expiry_date: expiryDate,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    is_near_expiry: meta.is_near_expiry,
    is_expired: meta.is_expired,
    days_until_expiry: meta.days_until_expiry,
  };
}

/** GET /api/ingredients?sort=&category= */
router.get("/", async (req: Request, res: Response) => {
  try {
    const sort = (req.query.sort as string) || "created_at";
    const category = req.query.category as string | undefined;

    let orderBy = "i.created_at DESC";
    if (sort === "name") orderBy = "i.name ASC";
    else if (sort === "expiry_date") orderBy = "i.expiry_date NULLS LAST, i.expiry_date ASC";
    else if (sort === "created_at") orderBy = "i.created_at DESC";

    const params: unknown[] = [DEFAULT_USER_ID];
    let where = "WHERE i.user_id = $1";
    if (category && category !== "all") {
      params.push(category);
      where += ` AND i.category = $${params.length}`;
    }

    const result = await pool.query<IngredientRow>(
      `SELECT i.* FROM ingredients i ${where} ORDER BY ${orderBy}`,
      params
    );

    const ingredients = result.rows.map(rowToResponse);
    res.json({ ingredients });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list ingredients" });
  }
});

/** GET /api/ingredients/:id */
router.get("/:id", async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const result = await pool.query<IngredientRow>(
      `SELECT * FROM ingredients WHERE id = $1 AND user_id = $2`,
      [id, DEFAULT_USER_ID]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Ingredient not found" });
      return;
    }
    res.json({ ingredient: rowToResponse(result.rows[0]) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch ingredient" });
  }
});

/** POST /api/ingredients */
router.post(
  "/",
  validateBody(createIngredientSchema),
  async (req: Request, res: Response) => {
    const body = req.body as {
      name: string;
      quantity: number;
      unit: string;
      category?: string | null;
      status?: string;
      expiry_date?: string | null;
    };
    const expiry =
      typeof body.expiry_date === "string" && body.expiry_date.trim() !== ""
        ? body.expiry_date.trim().slice(0, 10)
        : null;
    const status = body.status ?? "fresh";
    const category = body.category ?? null;

    try {
      const result = await pool.query<IngredientRow>(
        `INSERT INTO ingredients (user_id, name, quantity, unit, category, status, expiry_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          DEFAULT_USER_ID,
          body.name,
          body.quantity,
          body.unit,
          category,
          status,
          expiry,
        ]
      );
      res.status(201).json({ ingredient: rowToResponse(result.rows[0]) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to create ingredient" });
    }
  }
);

/** PUT /api/ingredients/:id */
router.put(
  "/:id",
  validateBody(updateIngredientSchema),
  async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const body = req.body as Partial<{
      name: string;
      quantity: number;
      unit: string;
      category: string | null;
      status: string;
      expiry_date: string | null;
    }>;

    try {
      const existing = await pool.query<IngredientRow>(
        `SELECT * FROM ingredients WHERE id = $1 AND user_id = $2`,
        [id, DEFAULT_USER_ID]
      );
      if (existing.rows.length === 0) {
        res.status(404).json({ error: "Ingredient not found" });
        return;
      }
      const cur = existing.rows[0];

      const name = body.name ?? cur.name;
      const quantity =
        body.quantity !== undefined ? body.quantity : Number.parseFloat(cur.quantity);
      const unit = body.unit ?? cur.unit;
      const category =
        body.category !== undefined ? body.category : cur.category;
      const status = body.status ?? cur.status;
      const expiry =
        body.expiry_date !== undefined
          ? typeof body.expiry_date === "string" &&
            body.expiry_date.trim() !== ""
            ? body.expiry_date.trim().slice(0, 10)
            : null
          : normalizeExpiryDate(cur.expiry_date);

      if (quantity <= 0) {
        res.status(400).json({ error: "Quantity must be greater than 0" });
        return;
      }

      const result = await pool.query<IngredientRow>(
        `UPDATE ingredients SET
          name = $1, quantity = $2, unit = $3, category = $4, status = $5, expiry_date = $6,
          updated_at = NOW()
         WHERE id = $7 AND user_id = $8
         RETURNING *`,
        [name, quantity, unit, category, status, expiry, id, DEFAULT_USER_ID]
      );

      res.json({ ingredient: rowToResponse(result.rows[0]) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update ingredient" });
    }
  }
);

/** DELETE /api/ingredients/:id */
router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const result = await pool.query(
      `DELETE FROM ingredients WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, DEFAULT_USER_ID]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Ingredient not found" });
      return;
    }
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete ingredient" });
  }
});

export default router;
