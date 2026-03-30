export type RecipeIngredient = {
  id: number;
  name: string;
  quantity: number | null;
  unit: string | null;
};

export type Recipe = {
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

export type RecipeDetail = Recipe & {
  instructions: string | null;
  ingredients: RecipeIngredient[];
};
