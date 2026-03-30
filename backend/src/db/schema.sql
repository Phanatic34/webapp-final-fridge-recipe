-- Fridge Recipe Recommender — MVP ingredient inventory
CREATE TABLE IF NOT EXISTS ingredients (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL DEFAULT 1,
  name          VARCHAR(255) NOT NULL,
  quantity      DECIMAL(10, 2) NOT NULL,
  unit          VARCHAR(50) NOT NULL,
  category      VARCHAR(100),
  status        VARCHAR(50) NOT NULL DEFAULT 'fresh',
  expiry_date   DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredients_user_id ON ingredients(user_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_expiry ON ingredients(expiry_date);

-- Phase 3: Recipe data model
CREATE TABLE IF NOT EXISTS recipes (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  image_url       TEXT,
  cuisine         VARCHAR(100),
  cooking_time    INTEGER,
  servings        INTEGER DEFAULT 2,
  difficulty      VARCHAR(50) DEFAULT 'medium',
  instructions    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id              SERIAL PRIMARY KEY,
  recipe_id       INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  quantity        DECIMAL(10, 2),
  unit            VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_name ON recipe_ingredients(LOWER(name));
