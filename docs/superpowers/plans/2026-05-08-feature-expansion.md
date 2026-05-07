# Feature Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add kitchen utensil filtering, allergen/exclusion mechanism, shopping list, and cooking-time filter to the fridge-recipe recommendation platform.

**Architecture:** All user preferences (equipment, exclusions) are persisted in new PostgreSQL tables and read automatically by the recommendation engine on each request. The shopping list is populated from recipe detail pages and displayed on a new Settings page. Time filtering is a query param passed from a new UI chip row on the RecipesPage.

**Tech Stack:** Express + TypeScript (backend), React 18 + TanStack Query + Tailwind (frontend), PostgreSQL

**Spec:** `docs/superpowers/specs/2026-05-08-feature-expansion-design.md`

---

## File Map

**Create:**
- `backend/src/routes/settings.ts` — equipment + exclusion CRUD
- `backend/src/routes/shopping-list.ts` — shopping list CRUD
- `frontend/src/types/settings.ts` — Settings and Exclusion types
- `frontend/src/types/shoppingList.ts` — ShoppingListItem type
- `frontend/src/api/settings.ts` — API calls for settings
- `frontend/src/api/shoppingList.ts` — API calls for shopping list
- `frontend/src/hooks/useSettings.ts` — TanStack Query hooks for settings
- `frontend/src/hooks/useShoppingList.ts` — TanStack Query hooks for shopping list
- `frontend/src/pages/SettingsPage.tsx` — Settings page (equipment + exclusions + shopping list)

**Modify:**
- `backend/src/db/schema.sql` — add 4 new tables
- `backend/src/db/seed.ts` — add `equipment` field to RecipeSeed + seed recipe_equipment
- `backend/src/server.ts` — mount 2 new routers
- `backend/src/routes/recipes.ts` — add exclusion/equipment/max_time filtering
- `frontend/src/api/recipes.ts` — add maxTime param to fetchRecommendedRecipes
- `frontend/src/hooks/useRecipes.ts` — pass maxTime through hook
- `frontend/src/App.tsx` — add /settings route
- `frontend/src/components/Layout.tsx` — add Settings nav item + shopping list badge
- `frontend/src/pages/RecipesPage.tsx` — add time filter chips
- `frontend/src/pages/RecipeDetailPage.tsx` — add "加入購物清單" button

---

## Task 1: Database Schema

**Files:**
- Modify: `backend/src/db/schema.sql`

- [ ] **Step 1: Add 4 new tables to schema.sql**

Append to the end of `backend/src/db/schema.sql`:

```sql
-- Equipment required per recipe
CREATE TABLE IF NOT EXISTS recipe_equipment (
  id           SERIAL PRIMARY KEY,
  recipe_id    INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recipe_equipment_recipe ON recipe_equipment(recipe_id);

-- Equipment the user owns
CREATE TABLE IF NOT EXISTS user_equipment (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL DEFAULT 1,
  equipment_name TEXT NOT NULL,
  UNIQUE(user_id, equipment_name)
);

-- Ingredients/allergens the user excludes from recommendations
CREATE TABLE IF NOT EXISTS user_exclusions (
  id      SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL DEFAULT 1,
  name    TEXT NOT NULL,
  type    TEXT NOT NULL CHECK (type IN ('allergen', 'custom')),
  UNIQUE(user_id, name)
);

-- Shopping list
CREATE TABLE IF NOT EXISTS shopping_list (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL DEFAULT 1,
  ingredient_name  TEXT NOT NULL,
  quantity         DECIMAL(10, 2),
  unit             TEXT,
  is_checked       BOOLEAN NOT NULL DEFAULT FALSE,
  source_recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, ingredient_name)
);
```

- [ ] **Step 2: Apply schema to running database**

```bash
cd /path/to/project
psql "$DATABASE_URL" -f backend/src/db/schema.sql
```

Expected: commands complete without errors (IF NOT EXISTS means safe to re-run).

- [ ] **Step 3: Commit**

```bash
git add backend/src/db/schema.sql
git commit -m "feat: add recipe_equipment, user_equipment, user_exclusions, shopping_list tables"
```

---

## Task 2: Seed Recipe Equipment

**Files:**
- Modify: `backend/src/db/seed.ts`

- [ ] **Step 1: Add `equipment` field to RecipeSeed type**

In `backend/src/db/seed.ts`, change the `RecipeSeed` type:

```typescript
type RecipeSeed = {
  title: string;
  description: string;
  cuisine: string;
  cooking_time: number;
  servings: number;
  difficulty: string;
  instructions: string;
  ingredients: { name: string; quantity: number; unit: string }[];
  equipment: string[];
};
```

- [ ] **Step 2: Add equipment arrays to each recipe**

Add `equipment: [...]` to each recipe object in the `recipes` array. The predefined equipment names must exactly match the Chinese names used in the UI:

```typescript
// 炒鍋, 平底鍋, 湯鍋, 電鍋, 烤箱, 微波爐, 氣炸鍋, 果汁機, 蒸鍋

{ title: "Tomato Egg Stir-Fry", ..., equipment: ["炒鍋"] },
{ title: "Spinach Omelette",    ..., equipment: ["平底鍋"] },
{ title: "Fried Rice",          ..., equipment: ["炒鍋"] },
{ title: "Pasta Aglio e Olio",  ..., equipment: ["湯鍋", "平底鍋"] },
{ title: "Miso Soup",           ..., equipment: ["湯鍋"] },
{ title: "Kimchi Fried Rice",   ..., equipment: ["炒鍋"] },
{ title: "Chicken Stir-Fry with Vegetables", ..., equipment: ["炒鍋"] },
{ title: "Thai Basil Pork",     ..., equipment: ["炒鍋"] },
{ title: "Creamy Mushroom Pasta", ..., equipment: ["湯鍋", "平底鍋"] },
{ title: "Japanese Curry Rice", ..., equipment: ["湯鍋", "電鍋"] },
{ title: "Taiwanese Three-Cup Chicken", ..., equipment: ["炒鍋"] },
{ title: "Milk French Toast",   ..., equipment: ["平底鍋"] },
```

- [ ] **Step 3: Insert equipment after seeding each recipe**

Inside the `for (const r of recipes)` loop in `seed()`, add equipment insertion after the ingredient loop:

```typescript
    for (const ing of r.ingredients) {
      await pool.query(
        `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit)
         VALUES ($1, $2, $3, $4)`,
        [recipeId, ing.name, ing.quantity, ing.unit]
      );
    }

    // NEW: insert equipment
    for (const eq of r.equipment) {
      await pool.query(
        `INSERT INTO recipe_equipment (recipe_id, equipment_name) VALUES ($1, $2)`,
        [recipeId, eq]
      );
    }
```

Also clear recipe_equipment before recipes in the seed cleanup block. Find this line:

```typescript
  await pool.query(`DELETE FROM recipe_ingredients`);
  await pool.query(`DELETE FROM recipes`);
```

Change to:

```typescript
  await pool.query(`DELETE FROM recipe_ingredients`);
  await pool.query(`DELETE FROM recipe_equipment`);
  await pool.query(`DELETE FROM recipes`);
```

- [ ] **Step 4: Run seed and verify**

```bash
cd backend && npm run db:seed
```

Expected output: `Seed complete: 8 ingredients, 12 recipes inserted.`

Then verify equipment was inserted:

```bash
psql "$DATABASE_URL" -c "SELECT r.title, re.equipment_name FROM recipe_equipment re JOIN recipes r ON r.id = re.recipe_id ORDER BY r.title;"
```

Expected: 14 rows (most recipes have 1 equipment, some have 2).

- [ ] **Step 5: Commit**

```bash
git add backend/src/db/seed.ts
git commit -m "feat: add equipment data to recipe seed"
```

---

## Task 3: Backend Settings Route

**Files:**
- Create: `backend/src/routes/settings.ts`
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Create settings.ts**

Create `backend/src/routes/settings.ts`:

```typescript
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
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// PUT /api/settings/equipment — replace full equipment list
router.put("/equipment", async (req: Request, res: Response) => {
  const { equipment } = req.body as { equipment: string[] };
  if (!Array.isArray(equipment)) {
    res.status(400).json({ error: "equipment must be an array" });
    return;
  }
  const valid = equipment.filter((e) => PREDEFINED_EQUIPMENT.includes(e));
  try {
    await pool.query("DELETE FROM user_equipment WHERE user_id = $1", [USER_ID]);
    if (valid.length > 0) {
      const placeholders = valid.map((_, i) => `($1, $${i + 2})`).join(", ");
      await pool.query(
        `INSERT INTO user_equipment (user_id, equipment_name) VALUES ${placeholders}`,
        [USER_ID, ...valid]
      );
    }
    res.json({ equipment: valid });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update equipment" });
  }
});

// POST /api/settings/exclusions
router.post("/exclusions", async (req: Request, res: Response) => {
  const { name, type } = req.body as { name: string; type: string };
  if (!name || !["allergen", "custom"].includes(type)) {
    res.status(400).json({ error: "name and valid type (allergen|custom) required" });
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
    res.status(500).json({ error: "Failed to add exclusion" });
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
    res.status(500).json({ error: "Failed to remove exclusion" });
  }
});

export default router;
```

- [ ] **Step 2: Mount in server.ts**

In `backend/src/server.ts`, add the import and mount:

```typescript
import settingsRouter from "./routes/settings.js";
```

After the existing `app.use("/api/favorites", favoritesRouter);` line, add:

```typescript
app.use("/api/settings", settingsRouter);
```

- [ ] **Step 3: Start backend and verify endpoints**

```bash
cd backend && npm run dev
```

In another terminal:

```bash
# Get settings (should return empty equipment and exclusions)
curl http://localhost:3001/api/settings | jq

# Add equipment
curl -X PUT http://localhost:3001/api/settings/equipment \
  -H "Content-Type: application/json" \
  -d '{"equipment":["炒鍋","電鍋"]}' | jq

# Add exclusion
curl -X POST http://localhost:3001/api/settings/exclusions \
  -H "Content-Type: application/json" \
  -d '{"name":"花生","type":"allergen"}' | jq

# Get settings again — should now show equipment and exclusion
curl http://localhost:3001/api/settings | jq

# Delete exclusion
curl -X DELETE http://localhost:3001/api/settings/exclusions/%E8%8A%B1%E7%94%9F
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/settings.ts backend/src/server.ts
git commit -m "feat: add settings API for equipment and exclusions"
```

---

## Task 4: Backend Shopping List Route

**Files:**
- Create: `backend/src/routes/shopping-list.ts`
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Create shopping-list.ts**

Create `backend/src/routes/shopping-list.ts`:

```typescript
import { Router } from "express";
import type { Request, Response } from "express";
import { pool } from "../db/pool.js";

const router = Router();
const USER_ID = 1;

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
router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<ShoppingListRow>(
      `SELECT sl.*, r.title AS source_recipe_title
       FROM shopping_list sl
       LEFT JOIN recipes r ON sl.source_recipe_id = r.id
       WHERE sl.user_id = $1
       ORDER BY sl.is_checked ASC, sl.created_at ASC`,
      [USER_ID]
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch shopping list" });
  }
});

// POST /api/shopping-list/from-recipe/:recipeId
// IMPORTANT: define this route BEFORE /:id to avoid Express matching "from-recipe" as an id
router.post("/from-recipe/:recipeId", async (req: Request, res: Response) => {
  const recipeId = Number.parseInt(req.params.recipeId, 10);
  if (Number.isNaN(recipeId)) {
    res.status(400).json({ error: "Invalid recipeId" });
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
        [USER_ID]
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
        [USER_ID, item.name, item.quantity ?? null, item.unit ?? null, recipeId]
      );
      if (result.rows.length > 0) inserted.push(result.rows[0]);
    }

    res.status(201).json({ added: inserted.length, items: inserted });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to add items to shopping list" });
  }
});

// DELETE /api/shopping-list/clear-checked
// IMPORTANT: define before /:id
router.delete("/clear-checked", async (_req: Request, res: Response) => {
  try {
    await pool.query(
      "DELETE FROM shopping_list WHERE user_id = $1 AND is_checked = TRUE",
      [USER_ID]
    );
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to clear checked items" });
  }
});

// PATCH /api/shopping-list/:id — toggle is_checked
router.patch("/:id", async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { is_checked } = req.body as { is_checked: boolean };
  try {
    const result = await pool.query<ShoppingListRow>(
      "UPDATE shopping_list SET is_checked = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
      [is_checked, id, USER_ID]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// DELETE /api/shopping-list/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    await pool.query(
      "DELETE FROM shopping_list WHERE id = $1 AND user_id = $2",
      [id, USER_ID]
    );
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

export default router;
```

- [ ] **Step 2: Mount in server.ts**

In `backend/src/server.ts`, add:

```typescript
import shoppingListRouter from "./routes/shopping-list.js";
```

After `app.use("/api/settings", settingsRouter);`, add:

```typescript
app.use("/api/shopping-list", shoppingListRouter);
```

- [ ] **Step 3: Verify endpoints**

```bash
# Get empty list
curl http://localhost:3001/api/shopping-list | jq

# Add from recipe 1 (Tomato Egg Stir-Fry — should find missing items)
curl -X POST http://localhost:3001/api/shopping-list/from-recipe/1 | jq

# List again — should now have items
curl http://localhost:3001/api/shopping-list | jq

# Toggle first item checked (replace 1 with actual id from above)
curl -X PATCH http://localhost:3001/api/shopping-list/1 \
  -H "Content-Type: application/json" \
  -d '{"is_checked":true}' | jq

# Clear checked
curl -X DELETE http://localhost:3001/api/shopping-list/clear-checked
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/shopping-list.ts backend/src/server.ts
git commit -m "feat: add shopping list API"
```

---

## Task 5: Backend Recommendation Engine — Filtering

**Files:**
- Modify: `backend/src/routes/recipes.ts`

- [ ] **Step 1: Add helper functions to load exclusions, equipment, and recipe equipment**

In `backend/src/routes/recipes.ts`, add these three helper functions after `loadAllRecipesWithIngredients()` (around line 105):

```typescript
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
  return new Set(rows.map((r) => r.equipment_name));
}

async function loadRecipeEquipmentMap(): Promise<Map<number, string[]>> {
  const { rows } = await pool.query<{ recipe_id: number; equipment_name: string }>(
    "SELECT recipe_id, equipment_name FROM recipe_equipment"
  );
  const map = new Map<number, string[]>();
  for (const row of rows) {
    const arr = map.get(row.recipe_id) ?? [];
    arr.push(row.equipment_name);
    map.set(row.recipe_id, arr);
  }
  return map;
}
```

- [ ] **Step 2: Update the /recommended route to use the new helpers**

Replace the existing `router.get("/recommended", ...)` handler (lines 192–223) with:

```typescript
router.get("/recommended", async (req: Request, res: Response) => {
  const maxTime = req.query.max_time
    ? Number.parseInt(req.query.max_time as string, 10)
    : null;

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

        // 2. Equipment filter — skip if user has configured equipment
        //    and this recipe needs equipment the user doesn't own
        if (userEquipment.size > 0) {
          const required = recipeEquipmentMap.get(recipe.id) ?? [];
          const missingEquipment = required.filter((eq) => !userEquipment.has(eq));
          if (missingEquipment.length > 0) return false;
        }

        // 3. Max cooking time filter
        if (maxTime !== null && !Number.isNaN(maxTime)) {
          if ((recipe.cooking_time ?? 0) > maxTime) return false;
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
```

- [ ] **Step 3: Test filtering manually**

```bash
# Add an exclusion for "Eggs" to test
curl -X POST http://localhost:3001/api/settings/exclusions \
  -H "Content-Type: application/json" \
  -d '{"name":"Eggs","type":"custom"}' | jq

# Get recommendations — recipes using Eggs (Tomato Egg Stir-Fry, Spinach Omelette, etc.) should be gone
curl "http://localhost:3001/api/recipes/recommended" | jq '.recommendations[].recipe.title'

# Remove the exclusion
curl -X DELETE "http://localhost:3001/api/settings/exclusions/Eggs"

# Test max_time filter
curl "http://localhost:3001/api/recipes/recommended?max_time=15" | jq '.recommendations[].recipe.title'
# Only recipes with cooking_time ≤ 15 should appear

# Set user equipment to only 炒鍋 and verify pasta recipes are excluded
curl -X PUT http://localhost:3001/api/settings/equipment \
  -H "Content-Type: application/json" \
  -d '{"equipment":["炒鍋"]}' | jq

curl "http://localhost:3001/api/recipes/recommended" | jq '.recommendations[].recipe.title'
# Should NOT include Pasta Aglio e Olio or Miso Soup (need 湯鍋)

# Reset equipment to all for development
curl -X PUT http://localhost:3001/api/settings/equipment \
  -H "Content-Type: application/json" \
  -d '{"equipment":["炒鍋","平底鍋","湯鍋","電鍋","烤箱","微波爐","氣炸鍋","果汁機","蒸鍋"]}' | jq
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/recipes.ts
git commit -m "feat: add exclusion, equipment, and max_time filtering to recommendation engine"
```

---

## Task 6: Frontend Types, API, and Hooks

**Files:**
- Create: `frontend/src/types/settings.ts`
- Create: `frontend/src/types/shoppingList.ts`
- Create: `frontend/src/api/settings.ts`
- Create: `frontend/src/api/shoppingList.ts`
- Create: `frontend/src/hooks/useSettings.ts`
- Create: `frontend/src/hooks/useShoppingList.ts`
- Modify: `frontend/src/api/recipes.ts`
- Modify: `frontend/src/hooks/useRecipes.ts`

- [ ] **Step 1: Create frontend/src/types/settings.ts**

```typescript
export interface Settings {
  equipment: string[];
  exclusions: Array<{ name: string; type: "allergen" | "custom" }>;
  predefinedEquipment: string[];
  predefinedAllergens: string[];
}
```

- [ ] **Step 2: Create frontend/src/types/shoppingList.ts**

```typescript
export interface ShoppingListItem {
  id: number;
  user_id: number;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  is_checked: boolean;
  source_recipe_id: number | null;
  source_recipe_title: string | null;
  created_at: string;
}
```

- [ ] **Step 3: Create frontend/src/api/settings.ts**

```typescript
import { api } from "./client";
import type { Settings } from "../types/settings";

export async function fetchSettings(): Promise<Settings> {
  const { data } = await api.get<Settings>("/api/settings");
  return data;
}

export async function updateEquipment(equipment: string[]): Promise<{ equipment: string[] }> {
  const { data } = await api.put<{ equipment: string[] }>("/api/settings/equipment", { equipment });
  return data;
}

export async function addExclusion(name: string, type: "allergen" | "custom"): Promise<void> {
  await api.post("/api/settings/exclusions", { name, type });
}

export async function removeExclusion(name: string): Promise<void> {
  await api.delete(`/api/settings/exclusions/${encodeURIComponent(name)}`);
}
```

- [ ] **Step 4: Create frontend/src/api/shoppingList.ts**

```typescript
import { api } from "./client";
import type { ShoppingListItem } from "../types/shoppingList";

export async function fetchShoppingList(): Promise<ShoppingListItem[]> {
  const { data } = await api.get<ShoppingListItem[]>("/api/shopping-list");
  return data;
}

export async function addFromRecipe(
  recipeId: number
): Promise<{ added: number; items: ShoppingListItem[] }> {
  const { data } = await api.post<{ added: number; items: ShoppingListItem[] }>(
    `/api/shopping-list/from-recipe/${recipeId}`
  );
  return data;
}

export async function toggleShoppingItem(
  id: number,
  is_checked: boolean
): Promise<ShoppingListItem> {
  const { data } = await api.patch<ShoppingListItem>(`/api/shopping-list/${id}`, { is_checked });
  return data;
}

export async function deleteShoppingItem(id: number): Promise<void> {
  await api.delete(`/api/shopping-list/${id}`);
}

export async function clearCheckedItems(): Promise<void> {
  await api.delete("/api/shopping-list/clear-checked");
}
```

- [ ] **Step 5: Create frontend/src/hooks/useSettings.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSettings,
  updateEquipment,
  addExclusion,
  removeExclusion,
} from "../api/settings";

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
}

export function useUpdateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateEquipment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useAddExclusion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, type }: { name: string; type: "allergen" | "custom" }) =>
      addExclusion(name, type),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useRemoveExclusion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => removeExclusion(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}
```

- [ ] **Step 6: Create frontend/src/hooks/useShoppingList.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchShoppingList,
  addFromRecipe,
  toggleShoppingItem,
  deleteShoppingItem,
  clearCheckedItems,
} from "../api/shoppingList";

export function useShoppingList() {
  return useQuery({ queryKey: ["shopping-list"], queryFn: fetchShoppingList });
}

export function useAddFromRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recipeId: number) => addFromRecipe(recipeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping-list"] }),
  });
}

export function useToggleShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_checked }: { id: number; is_checked: boolean }) =>
      toggleShoppingItem(id, is_checked),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping-list"] }),
  });
}

export function useDeleteShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteShoppingItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping-list"] }),
  });
}

export function useClearCheckedItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearCheckedItems,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping-list"] }),
  });
}
```

- [ ] **Step 7: Update frontend/src/api/recipes.ts to accept maxTime**

Change `fetchRecommendedRecipes` to:

```typescript
export type RecommendedParams = {
  maxTime?: number | null;
};

export async function fetchRecommendedRecipes(
  params: RecommendedParams = {}
): Promise<{ recommendations: RecipeRecommendation[] }> {
  const search = new URLSearchParams();
  if (params.maxTime != null) {
    search.set("max_time", String(params.maxTime));
  }
  const q = search.toString();
  const { data } = await api.get<{ recommendations: RecipeRecommendation[] }>(
    `/api/recipes/recommended${q ? `?${q}` : ""}`
  );
  return data;
}
```

- [ ] **Step 8: Update frontend/src/hooks/useRecipes.ts to pass maxTime**

Change `useRecommendedRecipesList` to:

```typescript
import type { RecommendedParams } from "../api/recipes";

export function useRecommendedRecipesList(params: RecommendedParams = {}) {
  return useQuery({
    queryKey: ["recipes", "recommended", params.maxTime ?? "all"] as const,
    queryFn: () => fetchRecommendedRecipes(params),
    placeholderData: keepPreviousData,
  });
}
```

- [ ] **Step 9: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/types/settings.ts frontend/src/types/shoppingList.ts \
  frontend/src/api/settings.ts frontend/src/api/shoppingList.ts \
  frontend/src/hooks/useSettings.ts frontend/src/hooks/useShoppingList.ts \
  frontend/src/api/recipes.ts frontend/src/hooks/useRecipes.ts
git commit -m "feat: add settings and shopping list types, API, and hooks"
```

---

## Task 7: Settings Page

**Files:**
- Create: `frontend/src/pages/SettingsPage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Layout.tsx`

- [ ] **Step 1: Create SettingsPage.tsx**

Create `frontend/src/pages/SettingsPage.tsx`:

```tsx
import { useState } from "react";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import {
  useSettings,
  useUpdateEquipment,
  useAddExclusion,
  useRemoveExclusion,
} from "../hooks/useSettings";
import {
  useShoppingList,
  useToggleShoppingItem,
  useDeleteShoppingItem,
  useClearCheckedItems,
} from "../hooks/useShoppingList";

export function SettingsPage() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: shoppingList = [] } = useShoppingList();
  const updateEquipment = useUpdateEquipment();
  const addExclusion = useAddExclusion();
  const removeExclusion = useRemoveExclusion();
  const toggleItem = useToggleShoppingItem();
  const deleteItem = useDeleteShoppingItem();
  const clearChecked = useClearCheckedItems();
  const [customInput, setCustomInput] = useState("");

  function handleEquipmentToggle(name: string) {
    if (!settings) return;
    const current = new Set(settings.equipment);
    if (current.has(name)) {
      current.delete(name);
    } else {
      current.add(name);
    }
    updateEquipment.mutate([...current], {
      onError: () => toast.error("更新器具失敗"),
    });
  }

  function handleAllergenToggle(name: string) {
    if (!settings) return;
    const isExcluded = settings.exclusions.some((e) => e.name === name);
    if (isExcluded) {
      removeExclusion.mutate(name, {
        onError: () => toast.error("移除失敗"),
      });
    } else {
      addExclusion.mutate(
        { name, type: "allergen" },
        { onError: () => toast.error("新增失敗") }
      );
    }
  }

  function handleAddCustom() {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    addExclusion.mutate(
      { name: trimmed, type: "custom" },
      {
        onSuccess: () => {
          setCustomInput("");
          toast.success(`已排除「${trimmed}」`);
        },
        onError: () => toast.error("新增失敗"),
      }
    );
  }

  function handleClearChecked() {
    clearChecked.mutate(undefined, {
      onSuccess: () => toast.success("已清除已購項目"),
      onError: () => toast.error("清除失敗"),
    });
  }

  const uncheckedCount = shoppingList.filter((i) => !i.is_checked).length;
  const hasChecked = shoppingList.some((i) => i.is_checked);

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-8">

        {/* Equipment Section */}
        <section>
          <h2 className="text-lg font-semibold text-[#1B2E22] mb-1">我的廚房器具</h2>
          <p className="text-sm text-gray-500 mb-4">
            勾選你擁有的器具，系統只推薦你能製作的食譜。未勾選任何器具時不進行器具篩選。
          </p>
          {settingsLoading ? (
            <div className="text-sm text-gray-400">載入中…</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(settings?.predefinedEquipment ?? []).map((eq) => {
                const owned = settings?.equipment.includes(eq) ?? false;
                return (
                  <button
                    key={eq}
                    onClick={() => handleEquipmentToggle(eq)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                      owned
                        ? "border-green-400 bg-green-50 text-green-700"
                        : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {owned ? "✓ " : ""}{eq}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <hr className="border-gray-200" />

        {/* Exclusions Section */}
        <section>
          <h2 className="text-lg font-semibold text-[#1B2E22] mb-1">不吃的食材</h2>
          <p className="text-sm text-gray-500 mb-4">
            含有以下食材的食譜將從推薦中排除。
          </p>

          {/* Allergen chips */}
          <div className="mb-3">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">常見過敏原</p>
            {settingsLoading ? (
              <div className="text-sm text-gray-400">載入中…</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(settings?.predefinedAllergens ?? []).map((allergen) => {
                  const excluded = settings?.exclusions.some((e) => e.name === allergen) ?? false;
                  return (
                    <button
                      key={allergen}
                      onClick={() => handleAllergenToggle(allergen)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                        excluded
                          ? "border-red-400 bg-red-50 text-red-700"
                          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {excluded ? "✕ " : ""}{allergen}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom exclusion input */}
          <div className="mb-3">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">自訂排除食材</p>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                placeholder="輸入食材名稱後按 Enter 或點新增"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C4622D] focus:outline-none"
              />
              <button
                onClick={handleAddCustom}
                disabled={!customInput.trim()}
                className="rounded-lg bg-[#C4622D] px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-[#b3561f]"
              >
                新增
              </button>
            </div>
          </div>

          {/* Custom exclusion tags */}
          {settings && settings.exclusions.filter((e) => e.type === "custom").length > 0 && (
            <div className="flex flex-wrap gap-2">
              {settings.exclusions
                .filter((e) => e.type === "custom")
                .map((ex) => (
                  <span
                    key={ex.name}
                    className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-700"
                  >
                    {ex.name}
                    <button
                      onClick={() => removeExclusion.mutate(ex.name)}
                      className="ml-1 text-red-400 hover:text-red-600"
                      aria-label={`移除 ${ex.name}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
            </div>
          )}
        </section>

        <hr className="border-gray-200" />

        {/* Shopping List Section */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-[#1B2E22]">
              購物清單
              {uncheckedCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">
                  {uncheckedCount}
                </span>
              )}
            </h2>
            {hasChecked && (
              <button
                onClick={handleClearChecked}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                清空已購
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            從食譜詳情頁加入的缺少食材。
          </p>

          {shoppingList.length === 0 ? (
            <p className="text-sm text-gray-400">購物清單是空的。去食譜頁選一道食譜，點「加入購物清單」。</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
              {shoppingList.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={item.is_checked}
                    onChange={() =>
                      toggleItem.mutate({ id: item.id, is_checked: !item.is_checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-[#C4622D]"
                  />
                  <span className={`flex-1 text-sm ${item.is_checked ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {item.ingredient_name}
                    {item.quantity != null && (
                      <span className="ml-1 text-gray-400">
                        × {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                      </span>
                    )}
                    {item.source_recipe_title && (
                      <span className="ml-2 text-xs text-gray-400">
                        （來自《{item.source_recipe_title}》）
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => deleteItem.mutate(item.id)}
                    className="text-gray-300 hover:text-red-400 transition"
                    aria-label="刪除"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </Layout>
  );
}
```

- [ ] **Step 2: Add /settings route in App.tsx**

In `frontend/src/App.tsx`, add the import and route. Find the existing imports and add:

```typescript
import { SettingsPage } from "./pages/SettingsPage";
```

In the `<Routes>` block, add:

```tsx
<Route path="/settings" element={<SettingsPage />} />
```

- [ ] **Step 3: Add Settings nav item and shopping list badge in Layout.tsx**

In `frontend/src/components/Layout.tsx`:

Add import at the top:

```typescript
import { useShoppingList } from "../hooks/useShoppingList";
```

Change the `navItems` const:

```typescript
const navItems = [
  { to: "/", label: "我的冰箱" },
  { to: "/recipes", label: "食譜" },
  { to: "/favorites", label: "收藏" },
  { to: "/settings", label: "設定" },
] as const;
```

Inside the `Layout` function body, before the return statement, add:

```typescript
  const { data: shoppingList } = useShoppingList();
  const uncheckedCount = shoppingList?.filter((i) => !i.is_checked).length ?? 0;
```

In the nav `<li>` render, replace the simple `{item.label}` with a conditional that shows the badge for the settings link:

```tsx
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1 rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border-[#C4622D] text-[#C4622D]"
                      : "border-transparent text-white/70 hover:border-white/30 hover:text-white"
                  }`
                }
              >
                {item.label}
                {item.to === "/settings" && uncheckedCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white leading-none">
                    {uncheckedCount}
                  </span>
                )}
              </NavLink>
```

- [ ] **Step 4: Start dev servers and verify in browser**

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Open http://localhost:5173/settings — verify:
- 「設定」tab appears in nav
- Equipment chips render and toggle correctly (green = owned)
- Allergen chips toggle on/off
- Custom input adds a tag + shows ✕ remove button

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/SettingsPage.tsx frontend/src/App.tsx frontend/src/components/Layout.tsx
git commit -m "feat: add Settings page with equipment, exclusions, and shopping list sections"
```

---

## Task 8: RecipesPage — Time Filter

**Files:**
- Modify: `frontend/src/pages/RecipesPage.tsx`

- [ ] **Step 1: Add maxTime state**

In `frontend/src/pages/RecipesPage.tsx`, line 117, there is already `const [cuisine, setCuisine] = useState("all");`. Add `maxTime` state right after it:

```typescript
  const [cuisine, setCuisine] = useState("all");
  const [maxTime, setMaxTime] = useState<number | null>(null);
```

- [ ] **Step 2: Pass maxTime to the hook**

Change line 119 from:

```typescript
  const { data, isLoading, isError, error, refetch } =
    useRecommendedRecipesList();
```

to:

```typescript
  const { data, isLoading, isError, error, refetch } =
    useRecommendedRecipesList({ maxTime });
```

- [ ] **Step 3: Add time filter chips below the cuisine dropdown**

The cuisine filter `<div className="flex flex-col gap-1">` (lines 137–155) is inside `<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">`. Add a second filter block as a sibling to that `<div>`, changing the outer wrapper to accommodate two filter controls:

Replace the outer filter `<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">` block (lines 130–160) with:

```tsx
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-['Noto_Serif_TC'] text-lg font-semibold text-[#1B2E22]">食譜</h2>
            <p className="text-sm text-[#6B7280]">
              依照冰箱食材推薦最適合的食譜
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            {/* Cuisine filter */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="cuisine"
                className="text-xs font-medium uppercase text-[#6B7280]"
              >
                料理類型
              </label>
              <select
                id="cuisine"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm shadow-sm focus:border-[#C4622D] focus:outline-none focus:ring-1 focus:ring-[#C4622D]"
              >
                {CUISINE_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {CUISINE_LABELS[c] ?? c}
                  </option>
                ))}
              </select>
            </div>
            {/* Time filter */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase text-[#6B7280]">烹飪時間</span>
              <div className="flex gap-1">
                {([null, 15, 30] as const).map((time) => (
                  <button
                    key={time ?? "all"}
                    type="button"
                    onClick={() => setMaxTime(time)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      maxTime === time
                        ? "bg-[#C4622D] text-white"
                        : "border border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#C4622D] hover:text-[#C4622D]"
                    }`}
                  >
                    {time === null ? "不限" : `${time} 分`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
```

- [ ] **Step 4: Verify in browser**

Open http://localhost:5173/recipes — verify:
- 「烹飪時間」filter buttons appear next to cuisine dropdown
- Clicking「15 分」re-fetches and only shows recipes with `cooking_time ≤ 15`
- Clicking「不限」shows all matching recipes again
- Both filters can be combined simultaneously

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/RecipesPage.tsx
git commit -m "feat: add cooking time filter to RecipesPage"
```

---

## Task 9: RecipeDetailPage — Shopping List Button

**Files:**
- Modify: `frontend/src/pages/RecipeDetailPage.tsx`

- [ ] **Step 1: Add import and hook**

In `frontend/src/pages/RecipeDetailPage.tsx`, add to the import block at line 7 (after the favorites imports):

```typescript
import { useAddFromRecipe } from "../hooks/useShoppingList";
```

Inside `RecipeDetailPage()`, after the `removeFav` declaration (line 27), add:

```typescript
  const addFromRecipe = useAddFromRecipe();
```

- [ ] **Step 2: Compute missing ingredients count**

The page already has `fridgeByName` (a Map built from fridge ingredients). Add this derived value after the `fridgeByName` memo (after line 35):

```typescript
  const hasMissingIngredients = useMemo(
    () => recipe?.ingredients.some((ing) => !fridgeByName.has(ing.name.toLowerCase())) ?? false,
    [recipe, fridgeByName]
  );
```

- [ ] **Step 3: Add the button in the ingredients section**

Inside the `{recipe && (...)}` block, find `<section>` for ingredients (line 134). The section starts with `<h3>食材</h3>` and then `<ul className="grid gap-2 sm:grid-cols-2">`. Add the button between the `<h3>` and the `<ul>`:

```tsx
            <section>
              <h3 className="mb-3 font-['Noto_Serif_TC'] text-lg font-semibold text-[#1B2E22]">
                食材
              </h3>

              {/* Shopping list button — show only when there are missing ingredients */}
              {hasMissingIngredients && (
                <div className="mb-4">
                  <button
                    type="button"
                    disabled={addFromRecipe.isPending}
                    onClick={() => {
                      addFromRecipe.mutate(recipeId, {
                        onSuccess: (data) => {
                          if (data.added === 0) {
                            toast.info("缺少食材已全部在購物清單中");
                          } else {
                            toast.success(`已加入 ${data.added} 項食材到購物清單`);
                          }
                        },
                        onError: () => toast.error("加入購物清單失敗"),
                      });
                    }}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition"
                  >
                    {addFromRecipe.isPending ? "加入中…" : "＋ 缺少食材加入購物清單"}
                  </button>
                </div>
              )}

              <ul className="grid gap-2 sm:grid-cols-2">
```

- [ ] **Step 4: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Verify in browser**

Open a recipe that uses ingredients not in your fridge (e.g., Pasta Aglio e Olio if you don't have pasta). Verify:
- Button「＋ 缺少食材加入購物清單」appears below the 「食材」heading
- Clicking shows success toast: 「已加入 N 項食材到購物清單」
- Nav「設定」tab shows amber badge with unchecked count
- Going to /settings shows the items listed with source recipe name
- Clicking same button again shows「缺少食材已全部在購物清單中」(ON CONFLICT DO NOTHING)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/RecipeDetailPage.tsx
git commit -m "feat: add shopping list button to RecipeDetailPage"
```

---

## Final Verification

- [ ] Open http://localhost:5173/settings
  - Toggle some equipment chips → go to /recipes → verify filtered recipes
  - Toggle an allergen → go to /recipes → verify recipes with that ingredient are gone
  - Add a custom exclusion → verify it appears as a deletable tag
- [ ] Open a recipe detail → click「加入購物清單」→ nav badge updates
- [ ] Go to /settings → shopping list shows added items → check items → click「清空已購」
- [ ] On /recipes, test all time filter combinations with cuisine filters
- [ ] Run TypeScript check: `cd frontend && npx tsc --noEmit`
