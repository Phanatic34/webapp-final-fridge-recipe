-- Fridge Recipe Recommender — MVP ingredient inventory
CREATE TABLE IF NOT EXISTS ingredients (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL DEFAULT 1,
  name          VARCHAR(255) NOT NULL,
  count_quantity   DECIMAL(10, 2),
  count_unit       VARCHAR(50),
  measure_quantity DECIMAL(10, 2),
  measure_unit     VARCHAR(50),
  category      VARCHAR(100),
  status        VARCHAR(50) NOT NULL DEFAULT 'fresh',
  expiry_date   DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ingredients_count_positive
    CHECK (count_quantity IS NULL OR count_quantity > 0),
  CONSTRAINT ingredients_measure_positive
    CHECK (measure_quantity IS NULL OR measure_quantity > 0),
  CONSTRAINT ingredients_count_pair
    CHECK ((count_quantity IS NULL AND count_unit IS NULL) OR (count_quantity IS NOT NULL AND count_unit IS NOT NULL)),
  CONSTRAINT ingredients_measure_pair
    CHECK ((measure_quantity IS NULL AND measure_unit IS NULL) OR (measure_quantity IS NOT NULL AND measure_unit IS NOT NULL)),
  CONSTRAINT ingredients_has_quantity
    CHECK (count_quantity IS NOT NULL OR measure_quantity IS NOT NULL)
);

ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS count_quantity DECIMAL(10, 2);
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS count_unit VARCHAR(50);
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS measure_quantity DECIMAL(10, 2);
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS measure_unit VARCHAR(50);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ingredients' AND column_name = 'quantity'
  ) THEN
    EXECUTE $sql$
      UPDATE ingredients
      SET measure_quantity = quantity,
          measure_unit = unit
      WHERE unit IN ('g', 'kg', 'ml', 'L')
        AND measure_quantity IS NULL
        AND quantity IS NOT NULL
    $sql$;

    EXECUTE $sql$
      UPDATE ingredients
      SET count_quantity = quantity,
          count_unit =
            CASE unit
              WHEN 'pieces' THEN '個'
              WHEN 'packs' THEN '包'
              ELSE '個'
            END
      WHERE (unit IS NULL OR unit NOT IN ('g', 'kg', 'ml', 'L'))
        AND count_quantity IS NULL
        AND quantity IS NOT NULL
    $sql$;
  END IF;
END $$;

ALTER TABLE ingredients DROP COLUMN IF EXISTS quantity;
ALTER TABLE ingredients DROP COLUMN IF EXISTS unit;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ingredients_count_positive') THEN
    ALTER TABLE ingredients ADD CONSTRAINT ingredients_count_positive
      CHECK (count_quantity IS NULL OR count_quantity > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ingredients_measure_positive') THEN
    ALTER TABLE ingredients ADD CONSTRAINT ingredients_measure_positive
      CHECK (measure_quantity IS NULL OR measure_quantity > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ingredients_count_pair') THEN
    ALTER TABLE ingredients ADD CONSTRAINT ingredients_count_pair
      CHECK ((count_quantity IS NULL AND count_unit IS NULL) OR (count_quantity IS NOT NULL AND count_unit IS NOT NULL));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ingredients_measure_pair') THEN
    ALTER TABLE ingredients ADD CONSTRAINT ingredients_measure_pair
      CHECK ((measure_quantity IS NULL AND measure_unit IS NULL) OR (measure_quantity IS NOT NULL AND measure_unit IS NOT NULL));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ingredients_has_quantity') THEN
    ALTER TABLE ingredients ADD CONSTRAINT ingredients_has_quantity
      CHECK (count_quantity IS NOT NULL OR measure_quantity IS NOT NULL);
  END IF;
END $$;

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
  equipment_name TEXT NOT NULL,
  UNIQUE(recipe_id, equipment_name)
);

CREATE INDEX IF NOT EXISTS idx_recipe_equipment_recipe ON recipe_equipment(recipe_id);

-- Equipment the user owns
CREATE TABLE IF NOT EXISTS user_equipment (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL DEFAULT 1,
  equipment_name TEXT NOT NULL,
  UNIQUE(user_id, equipment_name)
);

CREATE INDEX IF NOT EXISTS idx_user_equipment_user_id ON user_equipment(user_id);

-- Ingredients/allergens the user excludes from recommendations
CREATE TABLE IF NOT EXISTS user_exclusions (
  id      SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL DEFAULT 1,
  name    TEXT NOT NULL,
  type    TEXT NOT NULL CHECK (type IN ('allergen', 'custom')),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_user_exclusions_user_id ON user_exclusions(user_id);

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
