import { Router } from "express";
import type { Request, Response } from "express";
import { pool } from "../db/pool.js";

const router = Router();
const USER_ID = 1;

export const PREDEFINED_EQUIPMENT = [
  "炒鍋", "平底鍋", "湯鍋", "電鍋", "烤箱", "微波爐", "氣炸鍋", "果汁機", "蒸鍋",
];

export const PREDEFINED_ALLERGENS = ["花生", "海鮮", "乳製品", "麩質", "蛋"];

// GET /api/settings
router.get("/", async (_req: Request, res: Response) => {
  try {
    const [equipmentResult, exclusionsResult] = await Promise.all([
      pool.query<{ equipment_name: string }>(
        "SELECT equipment_name FROM user_equipment WHERE user_id = $1 ORDER BY equipment_name",
        [USER_ID]
      ),
      pool.query<{ name: string; type: string }>(
        "SELECT name, type FROM user_exclusions WHERE user_id = $1 ORDER BY type, name",
        [USER_ID]
      ),
    ]);
    res.json({
      equipment: equipmentResult.rows.map((r) => r.equipment_name),
      exclusions: exclusionsResult.rows,
      predefinedEquipment: PREDEFINED_EQUIPMENT,
      predefinedAllergens: PREDEFINED_ALLERGENS,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "無法取得設定" });
  }
});

// PUT /api/settings/equipment — replace full equipment list
router.put("/equipment", async (req: Request, res: Response) => {
  const { equipment } = req.body as { equipment: string[] };
  if (!Array.isArray(equipment)) {
    res.status(400).json({ error: "equipment 必須為陣列" });
    return;
  }
  if (!equipment.every((e) => typeof e === "string")) {
    res.status(400).json({ error: "equipment 必須為字串陣列" });
    return;
  }
  const valid = equipment.filter((e) => PREDEFINED_EQUIPMENT.includes(e));
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM user_equipment WHERE user_id = $1", [USER_ID]);
    if (valid.length > 0) {
      const placeholders = valid.map((_, i) => `($1, $${i + 2})`).join(", ");
      await client.query(
        `INSERT INTO user_equipment (user_id, equipment_name) VALUES ${placeholders}`,
        [USER_ID, ...valid]
      );
    }
    await client.query("COMMIT");
    res.json({ equipment: valid });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "無法更新廚具設定" });
  } finally {
    client.release();
  }
});

// POST /api/settings/exclusions
router.post("/exclusions", async (req: Request, res: Response) => {
  const { name, type } = req.body as { name: string; type: string };
  if (!name?.trim() || !["allergen", "custom"].includes(type)) {
    res.status(400).json({ error: "name 與有效 type (allergen|custom) 為必填" });
    return;
  }
  try {
    await pool.query(
      `INSERT INTO user_exclusions (user_id, name, type)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, name) DO NOTHING`,
      [USER_ID, name.trim(), type]
    );
    res.status(201).json({ name: name.trim(), type });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "無法新增排除食材" });
  }
});

// DELETE /api/settings/exclusions/:name
router.delete("/exclusions/:name", async (req: Request, res: Response) => {
  try {
    await pool.query(
      "DELETE FROM user_exclusions WHERE user_id = $1 AND name = $2",
      [USER_ID, req.params.name]
    );
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "無法移除排除食材" });
  }
});

export default router;
