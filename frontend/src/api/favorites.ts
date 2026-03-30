import type { Recipe } from "../types/recipe";
import { api } from "./client";

export async function fetchFavorites(): Promise<Recipe[]> {
  const { data } = await api.get<{ recipes: Recipe[] }>("/api/favorites");
  return data.recipes;
}

export async function addFavorite(recipeId: number): Promise<Recipe> {
  const { data } = await api.post<{ recipe: Recipe }>(
    `/api/favorites/${recipeId}`
  );
  return data.recipe;
}

export async function removeFavorite(recipeId: number): Promise<void> {
  await api.delete(`/api/favorites/${recipeId}`);
}

