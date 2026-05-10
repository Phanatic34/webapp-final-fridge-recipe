# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (`cd backend`)
```bash
npm run dev          # start dev server with hot-reload (tsx watch)
npm run build        # tsc compile to dist/
npm run start        # run compiled dist/server.js
npm run db:seed      # apply schema + seed demo data
```

### Frontend (`cd frontend`)
```bash
npm run dev          # start Vite dev server at http://localhost:5173
npm run build        # type-check + Vite production build
npm run preview      # preview production build
```

### Database
```bash
docker compose up -d           # start local PostgreSQL
docker compose down -v         # reset (wipe all data)
psql "$DATABASE_URL" -f backend/src/db/schema.sql   # apply schema only
```

No test runner is configured; there are no test scripts.

## Local setup notes

- Docker maps PostgreSQL to **port 5433** (not the default 5432) to avoid conflicts with any native PostgreSQL installation on the host machine.
- `backend/.env` must exist before running the backend. Copy from `backend/.env.example` — the values in the example file match the Docker Compose config and work out of the box.
- If `npm run db:seed` errors with `database does not exist`, the Docker volume likely has stale data from a previous setup. Fix: `docker compose down -v && docker compose up -d`, then re-run seed.
- If port 3001 is already in use (`EADDRINUSE`), another project's backend container may be running. Kill it with `lsof -ti:3001 | xargs kill`.

## Architecture

### Stack
- **Backend**: Express + TypeScript, runs on port 3001. Entry: `backend/src/server.ts`
- **Frontend**: React 18 + Vite + TypeScript + Tailwind. Entry: `frontend/src/main.tsx`
- **Database**: PostgreSQL via `pg` pool (`backend/src/db/pool.ts`)
- **Frontend → Backend**: Vite proxies `/api/*` to `http://localhost:3001`; axios client at `frontend/src/api/client.ts` uses empty `baseURL` to leverage the proxy

### Backend layout
```
src/
  server.ts            # Express app, mounts all routers
  routes/
    ingredients.ts     # CRUD for fridge inventory
    recipes.ts         # recipe list, detail, and recommendation engine
    favorites.ts       # add/remove/list saved recipes
    settings.ts        # equipment + exclusion CRUD; exports PREDEFINED_EQUIPMENT, PREDEFINED_ALLERGENS
    shopping-list.ts   # shopping list CRUD (add from recipe, toggle checked, delete, clear checked)
  types/
    ingredient.ts      # Zod schemas + TS types + enums (UNITS, CATEGORIES, STATUSES, NEAR_EXPIRY_DAYS)
    recipe.ts          # TS types for recipes, ingredients, recommendations
  middleware/
    validate.ts        # validateBody<T>(schema) — Zod middleware
  utils/
    expiry.ts          # computeExpiryMeta() — UTC date-only comparison for expiry logic
  db/
    pool.ts            # single pg Pool instance
    schema.sql         # all table definitions
    seed.ts            # seeds tables from inline data
```

### Frontend layout
```
src/
  App.tsx              # React Router routes: /, /recipes, /recipes/:id, /favorites, /settings
  api/
    client.ts          # axios instance; normalizes error messages from backend
    ingredients.ts     # API functions for ingredient CRUD
    recipes.ts         # API functions for recipe list, detail, recommendations (accepts RecommendedParams)
    favorites.ts       # API functions for favorites
    settings.ts        # fetchSettings, updateEquipment, addExclusion, removeExclusion
    shoppingList.ts    # fetchShoppingList, addFromRecipe, toggleShoppingItem, deleteShoppingItem, clearCheckedItems
  hooks/
    useIngredients.ts  # TanStack Query hooks wrapping ingredients API
    useRecipes.ts      # TanStack Query hooks wrapping recipes API
    useFavorites.ts    # TanStack Query hooks wrapping favorites API
    useSettings.ts     # useSettings, useUpdateEquipment, useAddExclusion, useRemoveExclusion
    useShoppingList.ts # useShoppingList, useAddFromRecipe, useToggleShoppingItem, useDeleteShoppingItem, useClearCheckedItems
  types/
    settings.ts        # Settings interface
    shoppingList.ts    # ShoppingListItem interface
  pages/               # FridgePage, RecipesPage, RecipeDetailPage, FavoritesPage, SettingsPage
                       # RecipesPage: toggle between "推薦食譜" (recommended, match>0) and "全部食譜"
                       #   (all recipes via useRecipesList); empty recommended state shows "瀏覽全部食譜" button;
                       #   time filter options: null/15/30/45/60 min; cuisine filter works in both modes
                       # RecipeDetailPage: shows image banner, recommendation analysis panel (match ratio,
                       #   explanation, missing ingredients chips) via useRecommendedRecipesList cache;
                       #   panel is hidden when no recommendation exists (e.g. fridge empty);
                       #   instructions rendered as numbered steps (strips leading "N." from seed data)
                       # SettingsPage: shopping list items have "加入冰箱" button — calls useCreateIngredient
                       #   with quantity parsed from string (defaults to 1) and unit (defaults to "pieces")
  components/          # Shared UI: Layout, IngredientCard, FormModal, ExpiryBadge, etc.
  utils/
    labels.ts          # Traditional Chinese display labels for category/status/cuisine/difficulty enums
                       # (DB enum values stay English; only display strings are translated here)
```

### Recommendation engine (`backend/src/routes/recipes.ts`)
`GET /api/recipes/recommended` scores all recipes against the current user's fridge:
- **match_ratio**: matched / total ingredients (primary rank key)
- **+0.15 bonus** if any matched ingredient is near-expiry (uses up expiring food)
- **-0.05 × missing_count** penalty to break ties
- Sort order: `uses_near_expiry DESC → match_ratio DESC → missing_count ASC → id ASC`
- Recipes with zero matches are excluded from results
- `explanation` array is in Traditional Chinese (hardcoded strings in `scoreRecipe()`)

Filters applied before scoring (in order):
1. **Exclusion filter**: skip recipes containing any ingredient in `user_exclusions` (only active when exclusions exist)
2. **Equipment filter**: skip recipes requiring equipment the user doesn't own (only active when `user_equipment` is non-empty)
3. **Time filter**: `?max_time=N` query param excludes recipes where `cooking_time` is null or `> N`

Near-expiry threshold is `NEAR_EXPIRY_DAYS = 3` (defined in `backend/src/types/ingredient.ts`).

### Data model notes
- `user_id` is hardcoded to `1` throughout (no auth yet — single-user MVP)
- `ingredients.expiry_date` is stored as `DATE`; `computeExpiryMeta` always compares UTC date-only to avoid timezone drift
- `recipe_ingredients.name` matching against `ingredients.name` is **case-insensitive lowercase** (`ri.name.toLowerCase()`)
- `user_exclusions.name` is stored and queried as lowercase; equipment names are also lowercased in memory for comparison
- `shopping_list` has `UNIQUE(user_id, ingredient_name)` — duplicate adds from different recipes are silently ignored (`ON CONFLICT DO NOTHING`)
- `ShoppingListItem.quantity` is `string | null` on the frontend (PostgreSQL returns `DECIMAL` as string)
- Ingredient validation uses Zod schemas from `types/ingredient.ts`; the `validateBody` middleware is applied to all mutating routes

### Frontend data-fetching pattern
All server state is managed via TanStack Query. Hooks in `src/hooks/` wrap API functions and call `queryClient.invalidateQueries(...)` on mutation success:
- `["ingredients"]` — fridge inventory
- `["recipes"]` — all recipe queries (recommended, list, detail); invalidated when equipment/exclusions change
- `["favorites"]` — saved recipes
- `["settings"]` — equipment and exclusion preferences
- `["shopping-list"]` — shopping list items

`useRecommendedRecipesList` accepts `{ maxTime?: number | null }` and includes it in the query key so time filter changes trigger a re-fetch.
