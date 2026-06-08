import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  fetchRecipes,
  fetchRecipe,
  fetchRecommendedRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  type RecipeListParams,
  type RecommendedParams,
  type RecipeCreatePayload,
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

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecipeCreatePayload) => createRecipe(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RecipeCreatePayload }) =>
      updateRecipe(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["recipes"] });
      qc.invalidateQueries({ queryKey: ["recipes", id] });
    },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteRecipe(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });
}

export function useRecommendedRecipesList(params: RecommendedParams = {}) {
  return useQuery({
    queryKey: ["recipes", "recommended", params.maxTime ?? "all"] as const,
    queryFn: () => fetchRecommendedRecipes(params),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}
