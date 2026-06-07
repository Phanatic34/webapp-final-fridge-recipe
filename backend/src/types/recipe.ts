export const CUISINES = [
  "taiwanese",
  "chinese",
  "japanese",
  "korean",
  "italian",
  "american",
  "thai",
  "other",
] as const;

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export type Cuisine = (typeof CUISINES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];

export type RecipeRow = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  cuisine: string | null;
  cooking_time: number | null;
  servings: number | null;
  difficulty: string | null;
  instructions: string | null;
  created_at: Date;
  updated_at: Date;
};

export type RecipeIngredientRow = {
  id: number;
  recipe_id: number;
  name: string;
  quantity: string | null;
  unit: string | null;
  allergens: string[];
};

export type RecipeIngredient = {
  id: number;
  name: string;
  quantity: number | null;
  unit: string | null;
  allergens: string[];
};

export type RecipeResponse = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  cuisine: string | null;
  cooking_time: number | null;
  servings: number | null;
  difficulty: string | null;
  created_at: string;
  updated_at: string;
  allergen_summary: string[];
};

export type RecipeDetailResponse = RecipeResponse & {
  instructions: string | null;
  ingredients: RecipeIngredient[];
};

export type RecommendationResponse = {
  recipe: RecipeResponse;
  ingredients: RecipeIngredient[];
  // Counts (match + missing are used for ranking/explanations)
  match_count: number;
  total_ingredients: number;
  missing_count: number;
  match_ratio: number;
  matched_ingredients: string[];
  missing_ingredients: string[];
  insufficient_ingredients: string[];
  uses_near_expiry: boolean;
  near_expiry_ingredient_count: number;
  near_expiry_ingredients: string[];
  explanation: string[];
  ai_explanation: string;
};
