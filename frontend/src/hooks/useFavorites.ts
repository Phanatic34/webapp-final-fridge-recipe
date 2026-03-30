import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import {
  fetchFavorites,
  addFavorite,
  removeFavorite,
} from "../api/favorites";

export function useFavoritesList() {
  return useQuery({
    queryKey: ["favorites"] as const,
    queryFn: () => fetchFavorites(),
    placeholderData: keepPreviousData,
  });
}

export function useAddFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recipeId: number) => addFavorite(recipeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export function useRemoveFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recipeId: number) => removeFavorite(recipeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

