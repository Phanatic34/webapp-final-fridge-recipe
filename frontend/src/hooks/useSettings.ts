import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSettings,
  updateEquipment,
  addExclusion,
  removeExclusion,
} from "../api/settings";

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
}

export function useUpdateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateEquipment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useAddExclusion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, type }: { name: string; type: "allergen" | "custom" }) =>
      addExclusion(name, type),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useRemoveExclusion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => removeExclusion(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}
