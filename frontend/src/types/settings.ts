export interface Settings {
  equipment: string[];
  exclusions: Array<{ name: string; type: "allergen" | "custom" }>;
  predefinedEquipment: string[];
  predefinedAllergens: string[];
}
