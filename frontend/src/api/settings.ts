import { api } from "./client";
import type { Settings } from "../types/settings";

export async function fetchSettings(): Promise<Settings> {
  const { data } = await api.get<Settings>("/api/settings");
  return data;
}

export async function updateEquipment(equipment: string[]): Promise<{ equipment: string[] }> {
  const { data } = await api.put<{ equipment: string[] }>("/api/settings/equipment", { equipment });
  return data;
}

export async function addExclusion(name: string, type: "allergen" | "custom"): Promise<void> {
  await api.post("/api/settings/exclusions", { name, type });
}

export async function removeExclusion(name: string): Promise<void> {
  await api.delete(`/api/settings/exclusions/${encodeURIComponent(name)}`);
}
