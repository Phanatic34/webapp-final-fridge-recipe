import type { Recipe, RecipeDetail, RecipeRecommendation } from "../types/recipe";
import { api } from "./client";

export type RecipeListParams = {
  cuisine?: string;
};

export async function fetchRecipes(
  params: RecipeListParams = {}
): Promise<Recipe[]> {
  const search = new URLSearchParams();
  if (params.cuisine && params.cuisine !== "all") {
    search.set("cuisine", params.cuisine);
  }
  const q = search.toString();
  const { data } = await api.get<{ recipes: Recipe[] }>(
    `/api/recipes${q ? `?${q}` : ""}`
  );
  return data.recipes;
}

export async function fetchRecipe(id: number): Promise<RecipeDetail> {
  const { data } = await api.get<{ recipe: RecipeDetail }>(
    `/api/recipes/${id}`
  );
  return data.recipe;
}

export type RecommendedParams = {
  maxTime?: number | null;
};

export type RecipeCreatePayload = {
  title: string;
  description?: string;
  cuisine?: string;
  cooking_time?: number | null;
  servings?: number;
  difficulty?: string;
  instructions?: string;
  ingredients: { name: string; quantity?: number | null; unit?: string }[];
};

export async function createRecipe(payload: RecipeCreatePayload): Promise<Recipe> {
  const { data } = await api.post<{ recipe: Recipe }>("/api/recipes", payload);
  return data.recipe;
}

export async function fetchRecommendedRecipes(
  params: RecommendedParams = {}
): Promise<{ recommendations: RecipeRecommendation[] }> {
  const search = new URLSearchParams();
  if (params.maxTime != null) {
    search.set("max_time", String(params.maxTime));
  }
  const q = search.toString();
  const { data } = await api.get<{ recommendations: RecipeRecommendation[] }>(
    `/api/recipes/recommended${q ? `?${q}` : ""}`
  );
  return data;
}
