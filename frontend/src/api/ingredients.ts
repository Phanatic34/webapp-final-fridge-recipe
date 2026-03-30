import type { Ingredient, SortOption } from "../types/ingredient";
import { api } from "./client";

export type ListParams = {
  sort?: SortOption;
  category?: string;
};

export async function fetchIngredients(
  params: ListParams = {}
): Promise<Ingredient[]> {
  const search = new URLSearchParams();
  if (params.sort) search.set("sort", params.sort);
  if (params.category && params.category !== "all") {
    search.set("category", params.category);
  }
  const q = search.toString();
  const { data } = await api.get<{ ingredients: Ingredient[] }>(
    `/api/ingredients${q ? `?${q}` : ""}`
  );
  return data.ingredients;
}

export async function fetchIngredient(id: number): Promise<Ingredient> {
  const { data } = await api.get<{ ingredient: Ingredient }>(
    `/api/ingredients/${id}`
  );
  return data.ingredient;
}

export type CreatePayload = {
  name: string;
  quantity: number;
  unit: string;
  category?: string | null;
  status?: string;
  expiry_date?: string | null;
};

export async function createIngredient(
  payload: CreatePayload
): Promise<Ingredient> {
  const { data } = await api.post<{ ingredient: Ingredient }>(
    "/api/ingredients",
    payload
  );
  return data.ingredient;
}

export async function updateIngredient(
  id: number,
  payload: Partial<CreatePayload>
): Promise<Ingredient> {
  const { data } = await api.put<{ ingredient: Ingredient }>(
    `/api/ingredients/${id}`,
    payload
  );
  return data.ingredient;
}

export async function deleteIngredient(id: number): Promise<void> {
  await api.delete(`/api/ingredients/${id}`);
}
