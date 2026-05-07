# Feature Expansion Design: Utensils, Exclusions, Shopping List, Time Filter

**Date:** 2026-05-08  
**Scope:** 4 new features for the fridge-to-recipe recommendation platform

---

## Overview

This spec covers four features that complete the original proposal requirements:

1. **廚房器具登記** — filter recipes by equipment the user owns
2. **排除食材 / 過敏原** — exclude recipes containing ingredients the user won't eat
3. **補貨購物清單** — collect missing ingredients from recipe detail pages
4. **烹飪時間篩選** — filter recommended recipes by max cooking time

All four features share a new dedicated **Settings page** (`/settings`) added to the navigation.

---

## Database

Four new tables added to `backend/src/db/schema.sql`:

```sql
-- Equipment required per recipe
CREATE TABLE recipe_equipment (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL
);

-- Equipment the user owns (toggled in Settings)
CREATE TABLE user_equipment (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL DEFAULT 1,
  equipment_name TEXT NOT NULL,
  UNIQUE(user_id, equipment_name)
);

-- Ingredients/allergens the user excludes from recommendations
CREATE TABLE user_exclusions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('allergen', 'custom')),
  UNIQUE(user_id, name)
);

-- Shopping list items (added from recipe detail pages)
CREATE TABLE shopping_list (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL DEFAULT 1,
  ingredient_name TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  is_checked BOOLEAN DEFAULT FALSE,
  source_recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Seed additions:** `backend/src/db/seed.ts` must populate `recipe_equipment` for all 12 existing recipes using this predefined equipment list:

> 炒鍋、平底鍋、湯鍋、電鍋、烤箱、微波爐、氣炸鍋、果汁機、蒸鍋

---

## Backend API

### New: `backend/src/routes/settings.ts`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/settings` | Return user's owned equipment list and exclusion list |
| PUT | `/api/settings/equipment` | Replace equipment list. Body: `{ equipment: string[] }` |
| POST | `/api/settings/exclusions` | Add exclusion. Body: `{ name: string, type: 'allergen' \| 'custom' }` |
| DELETE | `/api/settings/exclusions/:name` | Remove one exclusion by name |

### New: `backend/src/routes/shopping-list.ts`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/shopping-list` | Return all shopping list items for user |
| POST | `/api/shopping-list/from-recipe/:recipeId` | Add missing ingredients from this recipe (skips already-owned ingredients) |
| PATCH | `/api/shopping-list/:id` | Toggle `is_checked`. Body: `{ is_checked: boolean }` |
| DELETE | `/api/shopping-list/:id` | Remove one item |
| DELETE | `/api/shopping-list/clear-checked` | Clear all checked items |

### Modified: `GET /api/recipes/recommended`

New optional query parameter:
- `max_time` (integer, minutes) — exclude recipes with `cooking_time > max_time`

Filtering applied automatically (no query params needed — read from DB):
- Exclusion filter: exclude recipes whose ingredient list contains any name in `user_exclusions` (case-insensitive)
- Equipment filter: exclude recipes requiring equipment not in `user_equipment`

**Filtering order in recommendation engine:**
1. Exclude recipes with excluded ingredients
2. Exclude recipes missing required equipment
3. Apply `max_time` filter
4. Run existing scoring + sort logic on remaining recipes

---

## Frontend

### New Files

**`frontend/src/pages/SettingsPage.tsx`**  
Three sections on one page:

- **我的器具** — 9 toggle chips from predefined list. Clicking a chip immediately calls `PUT /api/settings/equipment` with the full updated list.
- **不吃的食材** — 5 allergen chips (花生, 海鮮, 乳製品, 麩質, 蛋) + text input to add custom names. Each change calls POST/DELETE exclusions endpoint.
- **購物清單** — List of shopping items. Checkbox to mark bought, trash icon to delete, "清空已勾選" button at bottom.

**`frontend/src/api/settings.ts`** — API functions for settings endpoints  
**`frontend/src/api/shoppingList.ts`** — API functions for shopping list endpoints  
**`frontend/src/hooks/useSettings.ts`** — TanStack Query hooks for settings  
**`frontend/src/hooks/useShoppingList.ts`** — TanStack Query hooks for shopping list  

### Modified Files

**`frontend/src/App.tsx`**
- Add route: `<Route path="/settings" element={<SettingsPage />} />`

**`frontend/src/components/Layout.tsx`**
- Add 4th nav item: 「設定」linking to `/settings`
- Show badge on Settings nav item with count of unchecked shopping list items (only when count > 0)

**`frontend/src/pages/RecipesPage.tsx`**
- Add time filter row below cuisine filter: chips for 「全部」/ 「15分鐘內」/ 「30分鐘內」
- Time filter and cuisine filter can be combined simultaneously
- Pass `max_time` param to `GET /api/recipes/recommended` when a time filter is selected

**`frontend/src/pages/RecipeDetailPage.tsx`**
- Add「加入購物清單」button next to the missing ingredients section
- Calls `POST /api/shopping-list/from-recipe/:id`
- Show toast on success: 「已加入 N 項食材到購物清單」
- If all ingredients are already owned, button is disabled with tooltip「冰箱食材已齊全」

---

## Predefined Data Constants

Both backend (seed) and frontend (Settings UI) share the same lists:

**器具（9種）:** 炒鍋、平底鍋、湯鍋、電鍋、烤箱、微波爐、氣炸鍋、果汁機、蒸鍋

**過敏原（5種）:** 花生、海鮮、乳製品、麩質、蛋

---

## Scope Boundaries

- `user_id` remains hardcoded to `1` (no auth in this MVP)
- Shopping list items are not synced back to the fridge (buying something doesn't auto-add it as an ingredient)
- Equipment matching is exact string match against `recipe_equipment.equipment_name`
- Exclusion matching is case-insensitive substring match against `recipe_ingredients.name`
