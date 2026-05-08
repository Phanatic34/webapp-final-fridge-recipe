import { api } from "./client";
import type { ShoppingListItem } from "../types/shoppingList";

export async function fetchShoppingList(): Promise<ShoppingListItem[]> {
  const { data } = await api.get<ShoppingListItem[]>("/api/shopping-list");
  return data;
}

export async function addFromRecipe(
  recipeId: number
): Promise<{ added: number; items: ShoppingListItem[] }> {
  const { data } = await api.post<{ added: number; items: ShoppingListItem[] }>(
    `/api/shopping-list/from-recipe/${recipeId}`
  );
  return data;
}

export async function toggleShoppingItem(
  id: number,
  is_checked: boolean
): Promise<ShoppingListItem> {
  const { data } = await api.patch<ShoppingListItem>(`/api/shopping-list/${id}`, { is_checked });
  return data;
}

export async function deleteShoppingItem(id: number): Promise<void> {
  await api.delete(`/api/shopping-list/${id}`);
}

export async function clearCheckedItems(): Promise<void> {
  await api.delete("/api/shopping-list/clear-checked");
}
