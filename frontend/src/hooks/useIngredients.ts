import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  fetchIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  type CreatePayload,
  type ListParams,
} from "../api/ingredients";

const ingredientsKey = (params: ListParams) =>
  ["ingredients", params.sort ?? "created_at", params.category ?? "all"] as const;

export function useIngredientsList(params: ListParams = {}) {
  return useQuery({
    queryKey: ingredientsKey(params),
    queryFn: () => fetchIngredients(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePayload) => createIngredient(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });
}

export function useUpdateIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<CreatePayload>;
    }) => updateIngredient(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });
}

export function useDeleteIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteIngredient(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });
}
