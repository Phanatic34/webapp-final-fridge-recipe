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

-- Favorites (Phase 5: demo polish / user saved recipes)
CREATE TABLE IF NOT EXISTS favorites (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL DEFAULT 1,
  recipe_id   INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

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
