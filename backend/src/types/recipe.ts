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
};

export type RecipeIngredient = {
  id: number;
  name: string;
  quantity: number | null;
  unit: string | null;
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
};

export type RecipeDetailResponse = RecipeResponse & {
  instructions: string | null;
  ingredients: RecipeIngredient[];
};
