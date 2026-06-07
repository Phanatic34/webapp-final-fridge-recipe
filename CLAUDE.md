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
- `OPENAI_API_KEY` must be set in `backend/.env` for AI explanations to work. Without it, `ai_explanation` returns `""` and the UI falls back silently.
- `JWT_SECRET` should be set in `backend/.env` for production. Falls back to `"dev-secret-change-in-prod"` if unset.
- If `npm run db:seed` (or any backend connection) errors with `password authentication failed`, the Docker volume was initialized with different credentials. Same fix: `docker compose down -v && docker compose up -d`, then re-run seed.
- If `npm run db:seed` errors with `database does not exist`, the Docker volume likely has stale data from a previous setup. Fix: `docker compose down -v && docker compose up -d`, then re-run seed.
- If port 3001 is already in use (`EADDRINUSE`), another project's backend container may be running. Kill it with `lsof -ti:3001 | xargs kill`.

## Architecture

### Stack
- **Backend**: Express + TypeScript, runs on port 3001. Entry: `backend/src/server.ts`
- **AI**: OpenAI `gpt-4o-mini` via `openai` SDK — generates natural language recommendation explanations
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + framer-motion (spring animations, stagger, AnimatePresence). Entry: `frontend/src/main.tsx`
- **Database**: PostgreSQL via `pg` pool (`backend/src/db/pool.ts`)
- **Auth**: JWT-based (`jsonwebtoken` + `bcrypt`). `requireAuth` middleware (`backend/src/middleware/auth.ts`) extracts `userId` (UUID) from `Authorization: Bearer <token>`. All routes except `/api/health` and `/api/auth` require a valid token.
- **Frontend → Backend**: Vite proxies `/api/*` to `http://localhost:3001`; axios client at `frontend/src/api/client.ts` reads `VITE_API_URL` (defaults to `""`) and injects the Bearer token from `localStorage` on every request via an interceptor.

### Backend layout
```
src/
  server.ts            # Express app, mounts all routers
  routes/
    auth.ts            # POST /register, POST /login, GET /me, PATCH /me (display_name + password)
    ingredients.ts     # CRUD for fridge inventory
    recipes.ts         # recipe list, detail, create, edit, and recommendation engine
    favorites.ts       # add/remove/list saved recipes
    settings.ts        # equipment + exclusion CRUD; exports PREDEFINED_EQUIPMENT, PREDEFINED_ALLERGENS
    shopping-list.ts   # shopping list CRUD (add from recipe, toggle checked, delete, clear checked)
  middleware/
    auth.ts            # requireAuth — verifies JWT, sets req.userId (UUID string)
    validate.ts        # validateBody<T>(schema) — Zod request body middleware
  types/
    ingredient.ts      # Zod schemas + TS types + enums (UNITS, CATEGORIES, STATUSES, NEAR_EXPIRY_DAYS)
    recipe.ts          # TS types for recipes, ingredients, recommendations
  utils/
    expiry.ts          # computeExpiryMeta() — UTC date-only comparison for expiry logic
    llmExplanation.ts  # generateAiExplanation() — calls OpenAI gpt-4o-mini with few-shot prompt to produce Traditional Chinese recommendation explanation from scored recipe data
  db/
    pool.ts            # single pg Pool instance
    schema.sql         # all table definitions
    seed.ts            # seeds tables from inline data
```

### Frontend layout
```
src/
  App.tsx              # React Router routes; all routes except /login and /register are wrapped in
                       # ProtectedRoute (redirects to /login if not authenticated)
                       # Routes: /, /recipes, /recipes/new, /recipes/:id/edit, /recipes/:id,
                       #         /favorites, /shopping-list, /settings, /login, /register
  context/
    AuthContext.tsx    # AuthProvider + useAuth hook; persists token/user in localStorage under
                       # keys "fridge_token" and "fridge_user"
  api/
    client.ts          # axios instance; injects Bearer token from localStorage; normalizes errors
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
    useShoppingList.ts # useShoppingList, useAddFromRecipe, useToggleShoppingItem, useUpdateShoppingItemQuantity, useDeleteShoppingItem, useClearCheckedItems
  types/
    auth.ts            # AuthUser { id: string; email: string; display_name: string }, AuthState
    settings.ts        # Settings interface
    shoppingList.ts    # ShoppingListItem interface
  pages/               # LoginPage, RegisterPage, FridgePage, RecipesPage, RecipeDetailPage,
                       #   RecipeCreatePage, RecipeEditPage, FavoritesPage, SettingsPage, ShoppingListPage
                       # RecipesPage: toggle between "推薦食譜" (recommended, match>0) and "全部食譜"
                       #   (all recipes via useRecipesList); empty recommended state shows "瀏覽全部食譜" button;
                       #   time filter options: null/15/30/45/60 min; cuisine filter works in both modes
                       # RecipeDetailPage: shows image banner, recommendation analysis panel (match ratio,
                       #   explanation, missing ingredients chips) via useRecommendedRecipesList cache;
                       #   panel is hidden when no recommendation exists (e.g. fridge empty);
                       #   instructions rendered as numbered steps (strips leading "N." from seed data)
                       # SettingsPage: shopping list items have "加入冰箱" button — calls useCreateIngredient
                       #   with quantity parsed from string (defaults to 1) and unit (defaults to "pieces")
                       # ShoppingListPage: inline quantity editing, expiry date picker per item, expand
                       #   "source recipes" panel; "加入冰箱" converts checked items into ingredients
  components/          # Shared UI: Layout, IngredientCard, FormModal, ExpiryBadge, etc.
                       # ProgressRing.tsx — SVG circular progress ring (props: ratio 0-1, size, strokeWidth)
  hooks/
    useCountUp.ts      # count-up animation hook (target: number, duration?: number) → animated number
  types/
    ingredient.ts      # mirrors backend enums (CATEGORIES, STATUSES, UNITS, NEAR_EXPIRY_DAYS) + Zod form
                       # schema; must be kept in sync with backend/src/types/ingredient.ts manually
  utils/
    expiry.ts          # client-side computeExpiryMeta() — same UTC date-only logic as backend util
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
- `ai_explanation` string is generated by OpenAI (`generateAiExplanation()` in `utils/llmExplanation.ts`) after scoring, via `Promise.all` across all scored recipes; falls back to `""` on error
- AI is a "suggester" (建議者), not a "decider" — the scoring algorithm makes all ranking decisions; LLM only translates the result into natural language

Filters applied before scoring (in order):
1. **Exclusion filter**: skip recipes containing any ingredient in `user_exclusions` (only active when exclusions exist)
2. **Equipment filter**: skip recipes requiring equipment the user doesn't own (only active when `user_equipment` is non-empty)
3. **Time filter**: `?max_time=N` query param excludes recipes where `cooking_time` is null or `> N`

Near-expiry threshold is `NEAR_EXPIRY_DAYS = 3` (defined in `backend/src/types/ingredient.ts`).

### Auth flow
- Register/login return `{ token, user }`. The frontend stores both in `localStorage` via `AuthContext`.
- Every subsequent API request sends `Authorization: Bearer <token>` (injected by the axios interceptor).
- `requireAuth` verifies the JWT and sets `req.userId` (UUID string) on the request — all route handlers use `req.userId` instead of a hardcoded value.
- `users.id` is `UUID` (generated by `gen_random_uuid()`); all foreign-key columns that reference it are also `UUID`.

### Data model notes
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

### UI Style
- Design: "Warm Glass" — warm gradient background + glassmorphism card surfaces
- Background: `.app-bg` class (multi-layer radial + linear gradient, defined in `index.css`)
- Glass cards: `rgba(255,255,255,0.52)` background + `backdrop-filter: blur()` + white border glow
- Animations: framer-motion spring hover (IngredientCard), stagger fade-in (all list pages), AnimatePresence spring modal (FormModal, DeleteConfirmModal), shimmer skeleton (IngredientListSkeleton)
- Animation timing (tuned for visibility): modal spring stiffness 200/damping 20, exit 0.35s; card hover spring stiffness 180/damping 18; list item spring stiffness 180/damping 20; stagger interval 0.11–0.14s; settings section delays 0/0.2/0.4s
- ProgressRing: SVG ring on RecipesPage cards replacing match% text; color: green ≥100%, amber ≥60%, orange <60%; fill transition 1.4s
- useCountUp: rAF-based count-up with easeOutQuart easing, used in FridgePage stats; default duration 1400ms
- Shimmer skeleton animation: 2.4s cycle
