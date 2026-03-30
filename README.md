````md
# Fridge Recipe Recommender — MVP

A full-stack web application for managing fridge ingredients and finding useful recipes based on what is currently available.

Current MVP features:

- **Inventory management**: add, edit, delete, and view ingredients
- **Expiry tracking**: highlight expired and near-expiry items
- **Recipe system**: browse recipes and view recipe details
- **Recommendation engine**: rank recipes using rule-based matching and explainable scoring
- **Favorites**: save and remove favorite recipes

Built with:

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL

---

## Project overview

This project helps users:

1. manage the ingredients in their fridge,
2. identify items that are close to expiring,
3. discover recipes that best match current ingredients,
4. understand *why* certain recipes are recommended,
5. save favorite recipes for later.

> 中文註解：  
> 系統核心不只是「列出食譜」，而是根據冰箱現有食材做推薦，並提供可解釋的推薦依據。

---

## Prerequisites

Please install these first:

- **Node.js 18+**
- **Docker Desktop** (or Docker Engine + Docker Compose)

Optional:

- `psql` if you want to run SQL manually

---

## Tech stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **Local database setup**: Docker Compose

---

## Project structure

```text
project-root/
├─ frontend/
│  └─ src/
├─ backend/
│  └─ src/
│     ├─ db/
│     │  ├─ schema.sql
│     │  ├─ seed.ts / seed.sql
│     │  └─ pool.ts
│     ├─ routes/
│     └─ types/
├─ docker-compose.yml
└─ README.md
````

---

## Local setup

Follow these steps in order.

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <your-project-folder>
```

---

### 2. Start PostgreSQL with Docker

From the project root, run:

```bash
docker compose up -d
```

This starts the local PostgreSQL database container.

> 中文註解：
> 每個組員都是在自己電腦上跑一份本機資料庫，不是共用別人的資料庫。

---

### 3. Create backend environment variables

Copy the example file:

```bash
cp backend/.env.example backend/.env
```

Example `backend/.env`:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fridge_recipe
```

> 中文註解：
> `DATABASE_URL` 是 backend 連資料庫的位址。如果這個值錯了，後端就無法連線。

---

### 4. Install backend dependencies

```bash
cd backend
npm install
```

---

### 5. Initialize the database

Run:

```bash
npm run db:seed
```

This command will:

* apply the database schema
* create the required tables
* insert seed / demo data

If you only want to apply the schema:

```bash
psql "$DATABASE_URL" -f src/db/schema.sql
```

---

### 6. Start the backend server

In the `backend` folder, run:

```bash
npm run dev
```

Backend API runs at:

```text
http://localhost:3001
```

Health check:

```text
http://localhost:3001/api/health
```

---

### 7. Start the frontend server

Open a new terminal, then run:

```bash
cd frontend
npm install
npm run dev
```

Frontend app runs at:

```text
http://localhost:5173
```

The frontend proxies `/api` requests to the backend.

---

## Quick start summary

If everything is set up correctly, the full local startup flow is:

### Terminal 1 — database setup

```bash
docker compose up -d
cp backend/.env.example backend/.env
cd backend
npm install
npm run db:seed
```

### Terminal 2 — backend

```bash
cd backend
npm run dev
```

### Terminal 3 — frontend

```bash
cd frontend
npm install
npm run dev
```

Then open:

* Frontend: `http://localhost:5173`
* Backend health check: `http://localhost:3001/api/health`

---

## Verify setup

After setup, check the following:

1. `docker compose up -d` runs successfully
2. `http://localhost:3001/api/health` returns a healthy response
3. `http://localhost:3001/api/ingredients` returns ingredient data
4. `http://localhost:5173` opens the frontend normally

If all four work, the local environment is ready.

---

## Reset local database

If you want a fresh local database:

```bash
docker compose down -v
docker compose up -d
cd backend
npm run db:seed
```

> 中文註解：
> `down -v` 會刪掉目前本機資料庫資料，等於重置。

---

## API overview

### Inventory

| Method   | Route                  | Description         |
| -------- | ---------------------- | ------------------- |
| `GET`    | `/api/ingredients`     | Get ingredient list |
| `GET`    | `/api/ingredients/:id` | Get one ingredient  |
| `POST`   | `/api/ingredients`     | Create ingredient   |
| `PUT`    | `/api/ingredients/:id` | Update ingredient   |
| `DELETE` | `/api/ingredients/:id` | Delete ingredient   |

### Recipes

| Method | Route              | Description        |
| ------ | ------------------ | ------------------ |
| `GET`  | `/api/recipes`     | Get recipe list    |
| `GET`  | `/api/recipes/:id` | Get recipe details |

### Recommendations

| Method | Route                      | Description             |
| ------ | -------------------------- | ----------------------- |
| `GET`  | `/api/recipes/recommended` | Get recommended recipes |

### Favorites

| Method   | Route                      | Description            |
| -------- | -------------------------- | ---------------------- |
| `GET`    | `/api/favorites`           | Get favorite recipes   |
| `POST`   | `/api/favorites`           | Add favorite recipe    |
| `DELETE` | `/api/favorites/:recipeId` | Remove favorite recipe |

---

## Notes for teammates

* This repository includes the **database setup code**, not a shared live database.
* Each teammate should run their **own local PostgreSQL** with Docker.
* If something breaks, reset the database and run the seed script again.
* If route names or scripts differ slightly from the current code, follow the actual codebase.

---

## Future work

* user authentication and multi-user support
* cloud database migration
* better ingredient normalization
* improved recommendation ranking
* shopping list / missing ingredient support

```
```
