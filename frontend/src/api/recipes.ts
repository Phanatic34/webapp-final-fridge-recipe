import type { Recipe, RecipeDetail } from "../types/recipe";
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
