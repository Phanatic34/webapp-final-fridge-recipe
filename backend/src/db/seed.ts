import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
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
  equipment: string[];
};

type IngredientSeed = {
  name: string;
  count_quantity: number | null;
  count_unit: string | null;
  measure_quantity: number | null;
  measure_unit: string | null;
  category: string;
  status: string;
  expiry_offset: number | null; // days from today, null = no expiry
};

// ─── Demo User ───────────────────────────────────────────────────────────────

const demoRecipes: RecipeSeed[] = [
  {
    title: "Tomato Egg Stir-Fry",
    description: "A classic home-style dish — silky scrambled eggs in a savory tomato sauce.",
    cuisine: "chinese", cooking_time: 15, servings: 2, difficulty: "easy",
    instructions: "1. Beat eggs with a pinch of salt.\n2. Dice tomatoes.\n3. Scramble eggs in oil, set aside.\n4. Sauté tomatoes until soft, add sugar and salt.\n5. Return eggs, toss and serve.",
    ingredients: [
      { name: "Eggs", quantity: 3, unit: "pieces" },
      { name: "Tomatoes", quantity: 2, unit: "pieces" },
      { name: "Salt", quantity: 0.5, unit: "tsp" },
      { name: "Sugar", quantity: 1, unit: "tsp" },
      { name: "Cooking Oil", quantity: 2, unit: "tbsp" },
    ],
    equipment: ["炒鍋"],
  },
  {
    title: "Spinach Omelette",
    description: "A quick and nutritious omelette loaded with fresh spinach.",
    cuisine: "american", cooking_time: 10, servings: 1, difficulty: "easy",
    instructions: "1. Wilt spinach in a hot pan.\n2. Beat eggs with salt and pepper.\n3. Pour eggs over spinach.\n4. Cook until set, fold and serve.",
    ingredients: [
      { name: "Eggs", quantity: 2, unit: "pieces" },
      { name: "Spinach", quantity: 100, unit: "g" },
      { name: "Salt", quantity: 0.25, unit: "tsp" },
      { name: "Butter", quantity: 1, unit: "tbsp" },
    ],
    equipment: ["平底鍋"],
  },
  {
    title: "Fried Rice",
    description: "Simple egg fried rice using leftover rice.",
    cuisine: "chinese", cooking_time: 15, servings: 2, difficulty: "easy",
    instructions: "1. Beat eggs.\n2. Heat oil, scramble eggs.\n3. Add rice, stir-fry on high heat.\n4. Season with soy sauce and salt.\n5. Add scallions and serve.",
    ingredients: [
      { name: "Rice", quantity: 300, unit: "g" },
      { name: "Eggs", quantity: 2, unit: "pieces" },
      { name: "Soy Sauce", quantity: 1, unit: "tbsp" },
      { name: "Cooking Oil", quantity: 2, unit: "tbsp" },
      { name: "Scallions", quantity: 2, unit: "pieces" },
      { name: "Salt", quantity: 0.25, unit: "tsp" },
    ],
    equipment: ["炒鍋"],
  },
  {
    title: "Pasta Aglio e Olio",
    description: "Classic Italian garlic-and-oil pasta with chili flakes and parsley.",
    cuisine: "italian", cooking_time: 20, servings: 2, difficulty: "easy",
    instructions: "1. Cook spaghetti in salted water until al dente.\n2. Sauté sliced garlic and chili in olive oil.\n3. Toss pasta into the pan with pasta water.\n4. Finish with parsley.",
    ingredients: [
      { name: "Spaghetti", quantity: 200, unit: "g" },
      { name: "Garlic", quantity: 4, unit: "pieces" },
      { name: "Olive Oil", quantity: 3, unit: "tbsp" },
      { name: "Chili Flakes", quantity: 0.5, unit: "tsp" },
      { name: "Parsley", quantity: 10, unit: "g" },
      { name: "Salt", quantity: 1, unit: "tsp" },
    ],
    equipment: ["湯鍋", "平底鍋"],
  },
  {
    title: "Miso Soup",
    description: "Light Japanese soup with tofu, wakame seaweed, and miso paste.",
    cuisine: "japanese", cooking_time: 10, servings: 2, difficulty: "easy",
    instructions: "1. Bring dashi stock to a simmer.\n2. Add cubed tofu and wakame.\n3. Remove from heat, dissolve miso paste.\n4. Serve with sliced scallions.",
    ingredients: [
      { name: "Tofu", quantity: 150, unit: "g" },
      { name: "Miso Paste", quantity: 2, unit: "tbsp" },
      { name: "Wakame", quantity: 5, unit: "g" },
      { name: "Scallions", quantity: 1, unit: "pieces" },
      { name: "Dashi Stock", quantity: 500, unit: "ml" },
    ],
    equipment: ["湯鍋"],
  },
  {
    title: "Kimchi Fried Rice",
    description: "Spicy and savory fried rice with kimchi and a fried egg.",
    cuisine: "korean", cooking_time: 15, servings: 1, difficulty: "easy",
    instructions: "1. Stir-fry chopped kimchi in sesame oil.\n2. Add rice and kimchi juice, fry on high.\n3. Season with soy sauce.\n4. Top with a fried egg and sesame seeds.",
    ingredients: [
      { name: "Rice", quantity: 200, unit: "g" },
      { name: "Kimchi", quantity: 100, unit: "g" },
      { name: "Eggs", quantity: 1, unit: "pieces" },
      { name: "Soy Sauce", quantity: 1, unit: "tbsp" },
      { name: "Sesame Oil", quantity: 1, unit: "tbsp" },
      { name: "Sesame Seeds", quantity: 1, unit: "tsp" },
    ],
    equipment: ["炒鍋"],
  },
  {
    title: "Chicken Stir-Fry with Vegetables",
    description: "Quick weeknight stir-fry with chicken breast and veggies.",
    cuisine: "chinese", cooking_time: 20, servings: 2, difficulty: "medium",
    instructions: "1. Slice chicken breast, marinate with soy sauce and cornstarch.\n2. Stir-fry chicken until cooked, set aside.\n3. Stir-fry bell peppers, carrots, and broccoli.\n4. Return chicken, season and serve.",
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
    equipment: ["炒鍋"],
  },
  {
    title: "Thai Basil Pork",
    description: "Aromatic and spicy stir-fried pork with Thai basil over rice.",
    cuisine: "thai", cooking_time: 15, servings: 2, difficulty: "medium",
    instructions: "1. Mince pork or slice thinly.\n2. Fry garlic and chili in oil.\n3. Add pork, stir-fry until browned.\n4. Season with soy sauce, oyster sauce, and sugar.\n5. Toss in Thai basil leaves, serve over rice.",
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
    equipment: ["炒鍋"],
  },
  {
    title: "Creamy Mushroom Pasta",
    description: "Rich and comforting pasta with sautéed mushrooms in cream.",
    cuisine: "italian", cooking_time: 25, servings: 2, difficulty: "medium",
    instructions: "1. Cook penne in salted water.\n2. Sauté sliced mushrooms with garlic in butter.\n3. Add cream and parmesan, simmer.\n4. Toss with pasta and season.",
    ingredients: [
      { name: "Penne", quantity: 200, unit: "g" },
      { name: "Mushrooms", quantity: 200, unit: "g" },
      { name: "Garlic", quantity: 2, unit: "pieces" },
      { name: "Butter", quantity: 2, unit: "tbsp" },
      { name: "Heavy Cream", quantity: 100, unit: "ml" },
      { name: "Parmesan", quantity: 30, unit: "g" },
      { name: "Salt", quantity: 0.5, unit: "tsp" },
    ],
    equipment: ["湯鍋", "平底鍋"],
  },
  {
    title: "Japanese Curry Rice",
    description: "Hearty Japanese-style curry with potatoes, carrots, and onions.",
    cuisine: "japanese", cooking_time: 45, servings: 4, difficulty: "medium",
    instructions: "1. Cut chicken, potatoes, carrots, and onions into chunks.\n2. Brown chicken in oil, add onions.\n3. Add water, potatoes, and carrots. Simmer 20 min.\n4. Add curry roux blocks, stir until thickened.\n5. Serve over steamed rice.",
    ingredients: [
      { name: "Chicken Thigh", quantity: 300, unit: "g" },
      { name: "Potatoes", quantity: 2, unit: "pieces" },
      { name: "Carrots", quantity: 1, unit: "pieces" },
      { name: "Onion", quantity: 1, unit: "pieces" },
      { name: "Curry Roux", quantity: 100, unit: "g" },
      { name: "Rice", quantity: 400, unit: "g" },
      { name: "Cooking Oil", quantity: 1, unit: "tbsp" },
    ],
    equipment: ["湯鍋", "電鍋"],
  },
  {
    title: "Taiwanese Three-Cup Chicken",
    description: "Fragrant braised chicken with sesame oil, soy sauce, and rice wine.",
    cuisine: "taiwanese", cooking_time: 30, servings: 3, difficulty: "medium",
    instructions: "1. Cut chicken into pieces.\n2. Sear chicken in sesame oil.\n3. Add sliced ginger and garlic, fry until fragrant.\n4. Add soy sauce, rice wine, and sugar.\n5. Braise until sauce reduces.\n6. Add Thai basil, toss and serve.",
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
    equipment: ["炒鍋"],
  },
  {
    title: "Milk French Toast",
    description: "Golden pan-fried bread soaked in an egg-milk mixture.",
    cuisine: "american", cooking_time: 15, servings: 2, difficulty: "easy",
    instructions: "1. Whisk eggs, milk, sugar, and vanilla.\n2. Dip bread slices in the mixture.\n3. Pan-fry in butter until golden on both sides.\n4. Serve with maple syrup or honey.",
    ingredients: [
      { name: "Bread", quantity: 4, unit: "pieces" },
      { name: "Eggs", quantity: 2, unit: "pieces" },
      { name: "Milk", quantity: 100, unit: "ml" },
      { name: "Sugar", quantity: 1, unit: "tbsp" },
      { name: "Butter", quantity: 2, unit: "tbsp" },
    ],
    equipment: ["平底鍋"],
  },
];

const demoIngredients: IngredientSeed[] = [
  { name: "Milk",      count_quantity: null, count_unit: null, measure_quantity: 1,   measure_unit: "L",  category: "dairy",     status: "opened", expiry_offset: 2   },
  { name: "Eggs",      count_quantity: 12,   count_unit: "顆", measure_quantity: null, measure_unit: null, category: "dairy",     status: "fresh",  expiry_offset: 10  },
  { name: "Spinach",   count_quantity: null, count_unit: null, measure_quantity: 200, measure_unit: "g",  category: "vegetable", status: "fresh",  expiry_offset: -1  },
  { name: "Rice",      count_quantity: null, count_unit: null, measure_quantity: 500, measure_unit: "g",  category: "grain",     status: "fresh",  expiry_offset: null },
  { name: "Soy Sauce", count_quantity: 1,    count_unit: "包", measure_quantity: null, measure_unit: null, category: "condiment", status: "opened", expiry_offset: 90  },
  { name: "Garlic",    count_quantity: 5,    count_unit: "顆", measure_quantity: null, measure_unit: null, category: "vegetable", status: "fresh",  expiry_offset: 14  },
  { name: "Butter",    count_quantity: null, count_unit: null, measure_quantity: 100, measure_unit: "g",  category: "dairy",     status: "fresh",  expiry_offset: 30  },
  { name: "Tomatoes",  count_quantity: 3,    count_unit: "顆", measure_quantity: null, measure_unit: null, category: "vegetable", status: "fresh",  expiry_offset: 3   },
];

// ─── Alice — 台日料理愛好者 ──────────────────────────────────────────────────

const aliceRecipes: RecipeSeed[] = [
  {
    title: "三杯雞",
    description: "台式經典，麻油、醬油、米酒各一杯，香氣四溢。",
    cuisine: "taiwanese", cooking_time: 30, servings: 3, difficulty: "medium",
    instructions: "1. 雞腿切塊備用。\n2. 熱鍋下麻油，爆香薑片和蒜頭。\n3. 放入雞塊煎至表面金黃。\n4. 加入醬油、米酒、糖，大火燒開後轉小火燜煮。\n5. 收汁後加入九層塔翻炒即可。",
    ingredients: [
      { name: "雞腿", quantity: 400, unit: "g" },
      { name: "麻油", quantity: 3, unit: "tbsp" },
      { name: "醬油", quantity: 3, unit: "tbsp" },
      { name: "米酒", quantity: 3, unit: "tbsp" },
      { name: "薑", quantity: 30, unit: "g" },
      { name: "蒜頭", quantity: 6, unit: "顆" },
      { name: "九層塔", quantity: 15, unit: "g" },
      { name: "糖", quantity: 1, unit: "tbsp" },
    ],
    equipment: ["炒鍋"],
  },
  {
    title: "味噌豆腐湯",
    description: "清淡暖胃的日式湯品，豆腐嫩滑、味噌香濃。",
    cuisine: "japanese", cooking_time: 10, servings: 2, difficulty: "easy",
    instructions: "1. 昆布高湯煮滾。\n2. 放入切丁豆腐和裙帶菜。\n3. 關火後溶入味噌。\n4. 撒上蔥花即可上桌。",
    ingredients: [
      { name: "豆腐", quantity: 200, unit: "g" },
      { name: "味噌", quantity: 2, unit: "tbsp" },
      { name: "裙帶菜", quantity: 5, unit: "g" },
      { name: "蔥", quantity: 1, unit: "根" },
      { name: "昆布高湯", quantity: 500, unit: "ml" },
    ],
    equipment: ["湯鍋"],
  },
  {
    title: "滷肉飯",
    description: "肥瘦相間的豬五花慢滷入味，拌飯一流。",
    cuisine: "taiwanese", cooking_time: 60, servings: 4, difficulty: "medium",
    instructions: "1. 五花肉切小丁，油蔥酥炒香。\n2. 加入醬油、冰糖、米酒和水。\n3. 滷包放入，小火燉煮 40 分鐘。\n4. 盛飯，淋上滷肉即可。",
    ingredients: [
      { name: "豬五花", quantity: 400, unit: "g" },
      { name: "醬油", quantity: 4, unit: "tbsp" },
      { name: "米酒", quantity: 2, unit: "tbsp" },
      { name: "冰糖", quantity: 1, unit: "tbsp" },
      { name: "油蔥酥", quantity: 2, unit: "tbsp" },
      { name: "白飯", quantity: 600, unit: "g" },
      { name: "水", quantity: 200, unit: "ml" },
    ],
    equipment: ["湯鍋", "電鍋"],
  },
  {
    title: "玉子燒",
    description: "日式甜味煎蛋捲，早餐便當必備。",
    cuisine: "japanese", cooking_time: 15, servings: 2, difficulty: "easy",
    instructions: "1. 雞蛋打散，加入味醂、醬油、砂糖拌勻。\n2. 玉子燒鍋塗油熱鍋。\n3. 倒入少量蛋液，半凝固時捲起推至一端。\n4. 重複加蛋液捲疊，共三至四層即完成。",
    ingredients: [
      { name: "雞蛋", quantity: 3, unit: "顆" },
      { name: "味醂", quantity: 1, unit: "tbsp" },
      { name: "醬油", quantity: 0.5, unit: "tsp" },
      { name: "砂糖", quantity: 1, unit: "tsp" },
      { name: "食用油", quantity: 1, unit: "tsp" },
    ],
    equipment: ["平底鍋"],
  },
  {
    title: "蔥爆豬肉",
    description: "大蔥與豬肉的完美組合，下飯首選。",
    cuisine: "taiwanese", cooking_time: 15, servings: 2, difficulty: "easy",
    instructions: "1. 豬肉片用醬油、米酒醃 10 分鐘。\n2. 熱鍋大火快炒豬肉至變色盛起。\n3. 原鍋炒香蒜末，放入大蔥段翻炒。\n4. 豬肉回鍋，加蠔油調味炒勻即可。",
    ingredients: [
      { name: "豬肉片", quantity: 250, unit: "g" },
      { name: "大蔥", quantity: 2, unit: "根" },
      { name: "蒜頭", quantity: 3, unit: "顆" },
      { name: "醬油", quantity: 2, unit: "tbsp" },
      { name: "米酒", quantity: 1, unit: "tbsp" },
      { name: "蠔油", quantity: 1, unit: "tbsp" },
    ],
    equipment: ["炒鍋"],
  },
];

const aliceIngredients: IngredientSeed[] = [
  { name: "雞腿",   count_quantity: 2,    count_unit: "塊", measure_quantity: null, measure_unit: null, category: "meat",      status: "fresh",  expiry_offset: 2   },
  { name: "豆腐",   count_quantity: null, count_unit: null, measure_quantity: 300, measure_unit: "g",  category: "other",     status: "fresh",  expiry_offset: 3   },
  { name: "味噌",   count_quantity: null, count_unit: null, measure_quantity: 200, measure_unit: "g",  category: "condiment", status: "opened", expiry_offset: 60  },
  { name: "白飯",   count_quantity: null, count_unit: null, measure_quantity: 600, measure_unit: "g",  category: "grain",     status: "fresh",  expiry_offset: 1   },
  { name: "蔥",     count_quantity: 3,    count_unit: "根", measure_quantity: null, measure_unit: null, category: "vegetable", status: "fresh",  expiry_offset: 4   },
  { name: "薑",     count_quantity: null, count_unit: null, measure_quantity: 50,  measure_unit: "g",  category: "vegetable", status: "fresh",  expiry_offset: 14  },
  { name: "醬油",   count_quantity: 1,    count_unit: "瓶", measure_quantity: null, measure_unit: null, category: "condiment", status: "opened", expiry_offset: 180 },
  { name: "麻油",   count_quantity: null, count_unit: null, measure_quantity: 100, measure_unit: "ml", category: "condiment", status: "opened", expiry_offset: 180 },
  { name: "雞蛋",   count_quantity: 6,    count_unit: "顆", measure_quantity: null, measure_unit: null, category: "dairy",     status: "fresh",  expiry_offset: 14  },
  { name: "豬五花", count_quantity: null, count_unit: null, measure_quantity: 400, measure_unit: "g",  category: "meat",      status: "fresh",  expiry_offset: 2   },
];

// ─── Bob — 西式料理愛好者 ────────────────────────────────────────────────────

const bobRecipes: RecipeSeed[] = [
  {
    title: "Spaghetti Carbonara",
    description: "Classic Roman pasta with crispy bacon, egg yolks, and parmesan.",
    cuisine: "italian", cooking_time: 20, servings: 2, difficulty: "medium",
    instructions: "1. Cook spaghetti in salted water until al dente.\n2. Fry bacon until crispy, set aside.\n3. Mix egg yolks with parmesan and black pepper.\n4. Toss hot pasta with egg mixture off heat.\n5. Add bacon and a splash of pasta water. Serve immediately.",
    ingredients: [
      { name: "Spaghetti", quantity: 200, unit: "g" },
      { name: "Bacon", quantity: 100, unit: "g" },
      { name: "Egg Yolks", quantity: 3, unit: "pieces" },
      { name: "Parmesan", quantity: 50, unit: "g" },
      { name: "Black Pepper", quantity: 1, unit: "tsp" },
      { name: "Salt", quantity: 1, unit: "tsp" },
    ],
    equipment: ["湯鍋", "平底鍋"],
  },
  {
    title: "BLT Sandwich",
    description: "Crispy bacon, fresh lettuce, and juicy tomato on toasted bread.",
    cuisine: "american", cooking_time: 10, servings: 1, difficulty: "easy",
    instructions: "1. Toast bread until golden.\n2. Fry bacon until crispy.\n3. Spread mayo on both slices of toast.\n4. Layer lettuce, tomato, and bacon.\n5. Press together and serve.",
    ingredients: [
      { name: "Bread", quantity: 2, unit: "pieces" },
      { name: "Bacon", quantity: 60, unit: "g" },
      { name: "Lettuce", quantity: 30, unit: "g" },
      { name: "Tomato", quantity: 1, unit: "pieces" },
      { name: "Mayonnaise", quantity: 1, unit: "tbsp" },
    ],
    equipment: ["平底鍋"],
  },
  {
    title: "Classic Beef Burger",
    description: "Juicy homemade beef patty with all the classic toppings.",
    cuisine: "american", cooking_time: 20, servings: 2, difficulty: "medium",
    instructions: "1. Mix ground beef with salt and pepper, form into patties.\n2. Grill or pan-fry patties 3-4 min each side.\n3. Toast burger buns.\n4. Assemble with lettuce, tomato, cheese, and condiments.",
    ingredients: [
      { name: "Ground Beef", quantity: 300, unit: "g" },
      { name: "Burger Buns", quantity: 2, unit: "pieces" },
      { name: "Cheddar Cheese", quantity: 2, unit: "pieces" },
      { name: "Lettuce", quantity: 40, unit: "g" },
      { name: "Tomato", quantity: 1, unit: "pieces" },
      { name: "Onion", quantity: 0.5, unit: "pieces" },
      { name: "Salt", quantity: 0.5, unit: "tsp" },
      { name: "Black Pepper", quantity: 0.5, unit: "tsp" },
    ],
    equipment: ["平底鍋"],
  },
  {
    title: "Scrambled Eggs & Bacon",
    description: "Buttery soft scrambled eggs with crispy bacon strips.",
    cuisine: "american", cooking_time: 10, servings: 1, difficulty: "easy",
    instructions: "1. Whisk eggs with a splash of milk and seasoning.\n2. Fry bacon until crispy, set aside.\n3. Melt butter in a pan over low heat.\n4. Add eggs and gently fold until just set.\n5. Serve with bacon on the side.",
    ingredients: [
      { name: "Eggs", quantity: 3, unit: "pieces" },
      { name: "Bacon", quantity: 80, unit: "g" },
      { name: "Butter", quantity: 1, unit: "tbsp" },
      { name: "Milk", quantity: 2, unit: "tbsp" },
      { name: "Salt", quantity: 0.25, unit: "tsp" },
      { name: "Black Pepper", quantity: 0.25, unit: "tsp" },
    ],
    equipment: ["平底鍋"],
  },
  {
    title: "Tomato Basil Pasta",
    description: "Fresh tomato sauce with basil and garlic over al dente pasta.",
    cuisine: "italian", cooking_time: 25, servings: 2, difficulty: "easy",
    instructions: "1. Sauté garlic in olive oil until fragrant.\n2. Add diced tomatoes and simmer 15 minutes.\n3. Season with salt and torn basil.\n4. Toss with cooked pasta and parmesan.",
    ingredients: [
      { name: "Spaghetti", quantity: 200, unit: "g" },
      { name: "Tomato", quantity: 3, unit: "pieces" },
      { name: "Garlic", quantity: 3, unit: "pieces" },
      { name: "Olive Oil", quantity: 3, unit: "tbsp" },
      { name: "Basil", quantity: 10, unit: "g" },
      { name: "Parmesan", quantity: 30, unit: "g" },
      { name: "Salt", quantity: 1, unit: "tsp" },
    ],
    equipment: ["湯鍋", "平底鍋"],
  },
];

const bobIngredients: IngredientSeed[] = [
  { name: "Bacon",       count_quantity: null, count_unit: null, measure_quantity: 200, measure_unit: "g",      category: "meat",      status: "fresh",  expiry_offset: 5   },
  { name: "Eggs",        count_quantity: 6,    count_unit: "pieces", measure_quantity: null, measure_unit: null, category: "dairy",     status: "fresh",  expiry_offset: 14  },
  { name: "Spaghetti",   count_quantity: null, count_unit: null, measure_quantity: 500, measure_unit: "g",      category: "grain",     status: "fresh",  expiry_offset: null },
  { name: "Parmesan",    count_quantity: null, count_unit: null, measure_quantity: 100, measure_unit: "g",      category: "dairy",     status: "opened", expiry_offset: 30  },
  { name: "Butter",      count_quantity: null, count_unit: null, measure_quantity: 200, measure_unit: "g",      category: "dairy",     status: "fresh",  expiry_offset: 30  },
  { name: "Milk",        count_quantity: null, count_unit: null, measure_quantity: 1,   measure_unit: "L",      category: "dairy",     status: "opened", expiry_offset: 4   },
  { name: "Tomato",      count_quantity: 4,    count_unit: "pieces", measure_quantity: null, measure_unit: null, category: "vegetable", status: "fresh",  expiry_offset: 3   },
  { name: "Lettuce",     count_quantity: null, count_unit: null, measure_quantity: 150, measure_unit: "g",      category: "vegetable", status: "fresh",  expiry_offset: 2   },
  { name: "Garlic",      count_quantity: 4,    count_unit: "pieces", measure_quantity: null, measure_unit: null, category: "vegetable", status: "fresh",  expiry_offset: 14  },
  { name: "Olive Oil",   count_quantity: null, count_unit: null, measure_quantity: 300, measure_unit: "ml",     category: "condiment", status: "opened", expiry_offset: 365 },
  { name: "Bread",       count_quantity: 6,    count_unit: "pieces", measure_quantity: null, measure_unit: null, category: "grain",     status: "fresh",  expiry_offset: 3   },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function upsertUser(email: string, displayName: string, password: string): Promise<string> {
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query<{ id: string }>(
    `INSERT INTO users (email, display_name, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, display_name = EXCLUDED.display_name
     RETURNING id`,
    [email, displayName, hash]
  );
  return result.rows[0].id;
}

async function seedIngredients(userId: string, items: IngredientSeed[]) {
  await pool.query(`DELETE FROM ingredients WHERE user_id = $1`, [userId]);
  for (const item of items) {
    const expiry = item.expiry_offset !== null
      ? `CURRENT_DATE + ${item.expiry_offset}`
      : "NULL";
    await pool.query(
      `INSERT INTO ingredients (user_id, name, count_quantity, count_unit, measure_quantity, measure_unit, category, status, expiry_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ${expiry})`,
      [userId, item.name, item.count_quantity, item.count_unit, item.measure_quantity, item.measure_unit, item.category, item.status]
    );
  }
}

async function seedRecipes(userId: string, recipeList: RecipeSeed[]) {
  await pool.query(`DELETE FROM recipe_ingredients WHERE recipe_id IN (SELECT id FROM recipes WHERE user_id = $1)`, [userId]);
  await pool.query(`DELETE FROM recipe_equipment   WHERE recipe_id IN (SELECT id FROM recipes WHERE user_id = $1)`, [userId]);
  await pool.query(`DELETE FROM recipes WHERE user_id = $1`, [userId]);

  for (const r of recipeList) {
    const result = await pool.query<{ id: number }>(
      `INSERT INTO recipes (user_id, title, description, cuisine, cooking_time, servings, difficulty, instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [userId, r.title, r.description, r.cuisine, r.cooking_time, r.servings, r.difficulty, r.instructions]
    );
    const recipeId = result.rows[0].id;
    for (const ing of r.ingredients) {
      await pool.query(
        `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit) VALUES ($1, $2, $3, $4)`,
        [recipeId, ing.name, ing.quantity, ing.unit]
      );
    }
    for (const eq of r.equipment) {
      await pool.query(
        `INSERT INTO recipe_equipment (recipe_id, equipment_name) VALUES ($1, $2)`,
        [recipeId, eq]
      );
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  await pool.query(schema);

  const users = [
    { email: "demo@example.com",  display_name: "Demo User",        password: "demo1234",  recipes: demoRecipes,  ingredients: demoIngredients  },
    { email: "alice@example.com", display_name: "Alice（台日料理）", password: "alice1234", recipes: aliceRecipes, ingredients: aliceIngredients },
    { email: "bob@example.com",   display_name: "Bob（西式料理）",   password: "bob12345",  recipes: bobRecipes,   ingredients: bobIngredients   },
  ];

  for (const u of users) {
    const userId = await upsertUser(u.email, u.display_name, u.password);
    await seedIngredients(userId, u.ingredients);
    await seedRecipes(userId, u.recipes);
    await pool.query(`DELETE FROM favorites WHERE user_id = $1`, [userId]);
    console.log(`  ✓ ${u.email} (${u.display_name}) — ${u.ingredients.length} 食材, ${u.recipes.length} 食譜`);
  }

  console.log("\nSeed complete! 範例帳號：");
  for (const u of users) {
    console.log(`  ${u.email} / ${u.password}`);
  }

  await pool.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
