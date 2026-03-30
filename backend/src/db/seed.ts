import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import { pool } from "./pool.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

type RecipeSeed = {
  title: string;
  description: string;
  cuisine: string;
  cooking_time: number;
  servings: number;
  difficulty: string;
  instructions: string;
  ingredients: { name: string; quantity: number; unit: string }[];
};

const recipes: RecipeSeed[] = [
  {
    title: "Tomato Egg Stir-Fry",
    description:
      "A classic home-style dish — silky scrambled eggs in a savory tomato sauce.",
    cuisine: "chinese",
    cooking_time: 15,
    servings: 2,
    difficulty: "easy",
    instructions:
      "1. Beat eggs with a pinch of salt.\n2. Dice tomatoes.\n3. Scramble eggs in oil, set aside.\n4. Sauté tomatoes until soft, add sugar and salt.\n5. Return eggs, toss and serve.",
    ingredients: [
      { name: "Eggs", quantity: 3, unit: "pieces" },
      { name: "Tomatoes", quantity: 2, unit: "pieces" },
      { name: "Salt", quantity: 0.5, unit: "tsp" },
      { name: "Sugar", quantity: 1, unit: "tsp" },
      { name: "Cooking Oil", quantity: 2, unit: "tbsp" },
    ],
  },
  {
    title: "Spinach Omelette",
    description: "A quick and nutritious omelette loaded with fresh spinach.",
    cuisine: "american",
    cooking_time: 10,
    servings: 1,
    difficulty: "easy",
    instructions:
      "1. Wilt spinach in a hot pan.\n2. Beat eggs with salt and pepper.\n3. Pour eggs over spinach.\n4. Cook until set, fold and serve.",
    ingredients: [
      { name: "Eggs", quantity: 2, unit: "pieces" },
      { name: "Spinach", quantity: 100, unit: "g" },
      { name: "Salt", quantity: 0.25, unit: "tsp" },
      { name: "Butter", quantity: 1, unit: "tbsp" },
    ],
  },
  {
    title: "Fried Rice",
    description: "Simple egg fried rice using leftover rice.",
    cuisine: "chinese",
    cooking_time: 15,
    servings: 2,
    difficulty: "easy",
    instructions:
      "1. Beat eggs.\n2. Heat oil, scramble eggs.\n3. Add rice, stir-fry on high heat.\n4. Season with soy sauce and salt.\n5. Add scallions and serve.",
    ingredients: [
      { name: "Rice", quantity: 300, unit: "g" },
      { name: "Eggs", quantity: 2, unit: "pieces" },
      { name: "Soy Sauce", quantity: 1, unit: "tbsp" },
      { name: "Cooking Oil", quantity: 2, unit: "tbsp" },
      { name: "Scallions", quantity: 2, unit: "pieces" },
      { name: "Salt", quantity: 0.25, unit: "tsp" },
    ],
  },
  {
    title: "Pasta Aglio e Olio",
    description:
      "Classic Italian garlic-and-oil pasta with chili flakes and parsley.",
    cuisine: "italian",
    cooking_time: 20,
    servings: 2,
    difficulty: "easy",
    instructions:
      "1. Cook spaghetti in salted water until al dente.\n2. Sauté sliced garlic and chili in olive oil.\n3. Toss pasta into the pan with pasta water.\n4. Finish with parsley.",
    ingredients: [
      { name: "Spaghetti", quantity: 200, unit: "g" },
      { name: "Garlic", quantity: 4, unit: "pieces" },
      { name: "Olive Oil", quantity: 3, unit: "tbsp" },
      { name: "Chili Flakes", quantity: 0.5, unit: "tsp" },
      { name: "Parsley", quantity: 10, unit: "g" },
      { name: "Salt", quantity: 1, unit: "tsp" },
    ],
  },
  {
    title: "Miso Soup",
    description:
      "Light Japanese soup with tofu, wakame seaweed, and miso paste.",
    cuisine: "japanese",
    cooking_time: 10,
    servings: 2,
    difficulty: "easy",
    instructions:
      "1. Bring dashi stock to a simmer.\n2. Add cubed tofu and wakame.\n3. Remove from heat, dissolve miso paste.\n4. Serve with sliced scallions.",
    ingredients: [
      { name: "Tofu", quantity: 150, unit: "g" },
      { name: "Miso Paste", quantity: 2, unit: "tbsp" },
      { name: "Wakame", quantity: 5, unit: "g" },
      { name: "Scallions", quantity: 1, unit: "pieces" },
      { name: "Dashi Stock", quantity: 500, unit: "ml" },
    ],
  },
  {
    title: "Kimchi Fried Rice",
    description: "Spicy and savory fried rice with kimchi and a fried egg.",
    cuisine: "korean",
    cooking_time: 15,
    servings: 1,
    difficulty: "easy",
    instructions:
      "1. Stir-fry chopped kimchi in sesame oil.\n2. Add rice and kimchi juice, fry on high.\n3. Season with soy sauce.\n4. Top with a fried egg and sesame seeds.",
    ingredients: [
      { name: "Rice", quantity: 200, unit: "g" },
      { name: "Kimchi", quantity: 100, unit: "g" },
      { name: "Eggs", quantity: 1, unit: "pieces" },
      { name: "Soy Sauce", quantity: 1, unit: "tbsp" },
      { name: "Sesame Oil", quantity: 1, unit: "tbsp" },
      { name: "Sesame Seeds", quantity: 1, unit: "tsp" },
    ],
  },
  {
    title: "Chicken Stir-Fry with Vegetables",
    description: "Quick weeknight stir-fry with chicken breast and veggies.",
    cuisine: "chinese",
    cooking_time: 20,
    servings: 2,
    difficulty: "medium",
    instructions:
      "1. Slice chicken breast, marinate with soy sauce and cornstarch.\n2. Stir-fry chicken until cooked, set aside.\n3. Stir-fry bell peppers, carrots, and broccoli.\n4. Return chicken, season and serve.",
    ingredients: [
      { name: "Chicken Breast", quantity: 250, unit: "g" },
      { name: "Bell Pepper", quantity: 1, unit: "pieces" },
      { name: "Carrots", quantity: 1, unit: "pieces" },
      { name: "Broccoli", quantity: 150, unit: "g" },
      { name: "Soy Sauce", quantity: 2, unit: "tbsp" },
      { name: "Cornstarch", quantity: 1, unit: "tsp" },
      { name: "Cooking Oil", quantity: 2, unit: "tbsp" },
      { name: "Garlic", quantity: 2, unit: "pieces" },
    ],
  },
  {
    title: "Thai Basil Pork",
    description:
      "Aromatic and spicy stir-fried pork with Thai basil over rice.",
    cuisine: "thai",
    cooking_time: 15,
    servings: 2,
    difficulty: "medium",
    instructions:
      "1. Mince pork or slice thinly.\n2. Fry garlic and chili in oil.\n3. Add pork, stir-fry until browned.\n4. Season with soy sauce, oyster sauce, and sugar.\n5. Toss in Thai basil leaves, serve over rice.",
    ingredients: [
      { name: "Pork", quantity: 200, unit: "g" },
      { name: "Thai Basil", quantity: 20, unit: "g" },
      { name: "Garlic", quantity: 3, unit: "pieces" },
      { name: "Chili", quantity: 2, unit: "pieces" },
      { name: "Soy Sauce", quantity: 1, unit: "tbsp" },
      { name: "Oyster Sauce", quantity: 1, unit: "tbsp" },
      { name: "Sugar", quantity: 1, unit: "tsp" },
      { name: "Cooking Oil", quantity: 2, unit: "tbsp" },
      { name: "Rice", quantity: 300, unit: "g" },
    ],
  },
  {
    title: "Creamy Mushroom Pasta",
    description: "Rich and comforting pasta with sautéed mushrooms in cream.",
    cuisine: "italian",
    cooking_time: 25,
    servings: 2,
    difficulty: "medium",
    instructions:
      "1. Cook penne in salted water.\n2. Sauté sliced mushrooms with garlic in butter.\n3. Add cream and parmesan, simmer.\n4. Toss with pasta and season.",
    ingredients: [
      { name: "Penne", quantity: 200, unit: "g" },
      { name: "Mushrooms", quantity: 200, unit: "g" },
      { name: "Garlic", quantity: 2, unit: "pieces" },
      { name: "Butter", quantity: 2, unit: "tbsp" },
      { name: "Heavy Cream", quantity: 100, unit: "ml" },
      { name: "Parmesan", quantity: 30, unit: "g" },
      { name: "Salt", quantity: 0.5, unit: "tsp" },
    ],
  },
  {
    title: "Japanese Curry Rice",
    description:
      "Hearty Japanese-style curry with potatoes, carrots, and onions.",
    cuisine: "japanese",
    cooking_time: 45,
    servings: 4,
    difficulty: "medium",
    instructions:
      "1. Cut chicken, potatoes, carrots, and onions into chunks.\n2. Brown chicken in oil, add onions.\n3. Add water, potatoes, and carrots. Simmer 20 min.\n4. Add curry roux blocks, stir until thickened.\n5. Serve over steamed rice.",
    ingredients: [
      { name: "Chicken Thigh", quantity: 300, unit: "g" },
      { name: "Potatoes", quantity: 2, unit: "pieces" },
      { name: "Carrots", quantity: 1, unit: "pieces" },
      { name: "Onion", quantity: 1, unit: "pieces" },
      { name: "Curry Roux", quantity: 100, unit: "g" },
      { name: "Rice", quantity: 400, unit: "g" },
      { name: "Cooking Oil", quantity: 1, unit: "tbsp" },
    ],
  },
  {
    title: "Taiwanese Three-Cup Chicken",
    description:
      "Fragrant braised chicken with sesame oil, soy sauce, and rice wine.",
    cuisine: "taiwanese",
    cooking_time: 30,
    servings: 3,
    difficulty: "medium",
    instructions:
      "1. Cut chicken into pieces.\n2. Sear chicken in sesame oil.\n3. Add sliced ginger and garlic, fry until fragrant.\n4. Add soy sauce, rice wine, and sugar.\n5. Braise until sauce reduces.\n6. Add Thai basil, toss and serve.",
    ingredients: [
      { name: "Chicken Thigh", quantity: 400, unit: "g" },
      { name: "Sesame Oil", quantity: 3, unit: "tbsp" },
      { name: "Soy Sauce", quantity: 3, unit: "tbsp" },
      { name: "Rice Wine", quantity: 3, unit: "tbsp" },
      { name: "Ginger", quantity: 30, unit: "g" },
      { name: "Garlic", quantity: 6, unit: "pieces" },
      { name: "Thai Basil", quantity: 15, unit: "g" },
      { name: "Sugar", quantity: 1, unit: "tbsp" },
    ],
  },
  {
    title: "Milk French Toast",
    description: "Golden pan-fried bread soaked in an egg-milk mixture.",
    cuisine: "american",
    cooking_time: 15,
    servings: 2,
    difficulty: "easy",
    instructions:
      "1. Whisk eggs, milk, sugar, and vanilla.\n2. Dip bread slices in the mixture.\n3. Pan-fry in butter until golden on both sides.\n4. Serve with maple syrup or honey.",
    ingredients: [
      { name: "Bread", quantity: 4, unit: "pieces" },
      { name: "Eggs", quantity: 2, unit: "pieces" },
      { name: "Milk", quantity: 100, unit: "ml" },
      { name: "Sugar", quantity: 1, unit: "tbsp" },
      { name: "Butter", quantity: 2, unit: "tbsp" },
    ],
  },
];

async function seed() {
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  await pool.query(schema);

  /* ---- ingredients (existing MVP seed) ---- */
  await pool.query(`DELETE FROM ingredients WHERE user_id = 1`);

  await pool.query(
    `INSERT INTO ingredients (user_id, name, quantity, unit, category, status, expiry_date)
     VALUES
       (1, 'Milk',    1,   'L',      'dairy',     'opened', CURRENT_DATE + 2),
       (1, 'Eggs',    12,  'pieces', 'dairy',     'fresh',  CURRENT_DATE + 10),
       (1, 'Spinach', 200, 'g',      'vegetable', 'fresh',  CURRENT_DATE - 1),
       (1, 'Rice',    500, 'g',      'grain',     'fresh',  NULL),
       (1, 'Soy Sauce', 1, 'packs',  'condiment', 'opened', CURRENT_DATE + 90),
       (1, 'Garlic',  5,   'pieces', 'vegetable', 'fresh',  CURRENT_DATE + 14),
       (1, 'Butter',  100, 'g',      'dairy',     'fresh',  CURRENT_DATE + 30),
       (1, 'Tomatoes', 3,  'pieces', 'vegetable', 'fresh',  CURRENT_DATE + 3)`
  );

  /* ---- recipes ---- */
  await pool.query(`DELETE FROM recipe_ingredients`);
  await pool.query(`DELETE FROM recipes`);

  for (const r of recipes) {
    const result = await pool.query<{ id: number }>(
      `INSERT INTO recipes (title, description, cuisine, cooking_time, servings, difficulty, instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        r.title,
        r.description,
        r.cuisine,
        r.cooking_time,
        r.servings,
        r.difficulty,
        r.instructions,
      ]
    );

    const recipeId = result.rows[0].id;

    for (const ing of r.ingredients) {
      await pool.query(
        `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit)
         VALUES ($1, $2, $3, $4)`,
        [recipeId, ing.name, ing.quantity, ing.unit]
      );
    }
  }

  console.log(
    `Seed complete: 8 ingredients, ${recipes.length} recipes inserted.`
  );
  await pool.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
