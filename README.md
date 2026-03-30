# Fridge Recipe Recommender — MVP (inventory)

Single-page app to manage fridge ingredients (CRUD, expiry dates, near-expiry highlighting). Built with **React + Vite + TypeScript + Tailwind**, **Express + TypeScript**, and **PostgreSQL**.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local or hosted, e.g. Neon)

## Database setup

1. Create a database, e.g. `fridge_recipe`.
2. Run the schema:

   ```bash
   psql "$DATABASE_URL" -f backend/src/db/schema.sql
   ```

   Or from `psql`: `\i backend/src/db/schema.sql`

3. Copy environment:

   ```bash
   cp backend/.env.example backend/.env
   ```

   Set `DATABASE_URL` to your connection string, e.g.:

   `postgresql://user:password@localhost:5432/fridge_recipe`

4. (Optional) Seed sample rows:

   ```bash
   cd backend && npm run db:seed
   ```

## Run locally

**Terminal 1 — API**

```bash
cd backend
npm install
npm run dev
```

API: `http://localhost:3001` (health: `GET /api/health`)

**Terminal 2 — Web app**

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173` — Vite proxies `/api` to the backend.

### Production build

```bash
cd frontend && npm run build && npm run preview
cd backend && npm run build && npm start
```

## API (REST)

| Method | Route | Description |
|--------|--------|-------------|
| `GET` | `/api/ingredients` | List (query: `sort`, `category`) |
| `GET` | `/api/ingredients/:id` | One item |
| `POST` | `/api/ingredients` | Create |
| `PUT` | `/api/ingredients/:id` | Update |
| `DELETE` | `/api/ingredients/:id` | Delete |

Responses include computed `is_near_expiry` (within 3 days), `is_expired`, and `days_until_expiry`.

## Future work

- User accounts (`user_id` is already on `ingredients`)
- Recipe data and recommendation logic
- Favorites and explainable matches
