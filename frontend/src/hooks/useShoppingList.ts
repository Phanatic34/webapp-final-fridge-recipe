import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchShoppingList,
  addFromRecipe,
  addManualItem,
  toggleShoppingItem,
  updateShoppingItemQuantity,
  deleteShoppingItem,
  clearCheckedItems,
  type ManualAddPayload,
} from "../api/shoppingList";

export function useShoppingList() {
  return useQuery({ queryKey: ["shopping-list"], queryFn: fetchShoppingList });
}

export function useAddFromRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recipeId: number) => addFromRecipe(recipeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping-list"] }),
  });
}

export function useAddManualShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ManualAddPayload) => addManualItem(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping-list"] }),
  });
}

export function useToggleShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_checked }: { id: number; is_checked: boolean }) =>
      toggleShoppingItem(id, is_checked),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping-list"] }),
  });
}

export function useUpdateShoppingItemQuantity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      updateShoppingItemQuantity(id, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping-list"] }),
  });
}

export function useDeleteShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteShoppingItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping-list"] }),
  });
}

export function useClearCheckedItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearCheckedItems,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping-list"] }),
  });
}
