import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchRecipes,
  fetchRecipe,
  fetchRecommendedRecipes,
  type RecipeListParams,
  type RecommendedParams,
} from "../api/recipes";

export function useRecipesList(params: RecipeListParams = {}) {
  return useQuery({
    queryKey: ["recipes", params.cuisine ?? "all"] as const,
    queryFn: () => fetchRecipes(params),
    placeholderData: keepPreviousData,
  });
}

export function useRecipeDetail(id: number) {
  return useQuery({
    queryKey: ["recipes", id] as const,
    queryFn: () => fetchRecipe(id),
    enabled: id > 0,
  });
}

export function useRecommendedRecipesList(params: RecommendedParams = {}) {
  return useQuery({
    queryKey: ["recipes", "recommended", params.maxTime ?? "all"] as const,
    queryFn: () => fetchRecommendedRecipes(params),
    placeholderData: keepPreviousData,
  });
}
