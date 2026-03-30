import { z } from "zod";

/** Mirrors backend — keep enums in sync with `backend/src/types/ingredient.ts` */
export const NEAR_EXPIRY_DAYS = 3;

export const UNITS = [
  "g",
  "kg",
  "ml",
  "L",
  "pieces",
  "packs",
  "cups",
  "tbsp",
  "tsp",
] as const;

export const CATEGORIES = [
  "dairy",
  "meat",
  "seafood",
  "vegetable",
  "fruit",
  "grain",
  "condiment",
  "beverage",
  "other",
] as const;

export const STATUSES = ["fresh", "opened", "frozen"] as const;

export type Unit = (typeof UNITS)[number];
export type Category = (typeof CATEGORIES)[number];

export const ingredientFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit: z.enum(UNITS),
  category: z.union([z.enum(CATEGORIES), z.literal("")]).optional(),
  status: z.enum(STATUSES),
  expiry_date: z.string().optional(),
});

export type IngredientFormValues = z.infer<typeof ingredientFormSchema>;

export type Ingredient = {
  id: number;
  user_id: number;
  name: string;
  quantity: number;
  unit: string;
  category: string | null;
  status: string;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
  is_near_expiry: boolean;
  is_expired: boolean;
  days_until_expiry: number | null;
};

export type SortOption = "created_at" | "name" | "expiry_date";
