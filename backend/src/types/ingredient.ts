import { z } from "zod";

/** Days from today until expiry considered "near expiry" */
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
export type IngredientStatus = (typeof STATUSES)[number];

export const ingredientBaseSchema = z.object({
  name: z.string().trim().min(1).max(255),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit: z.enum(UNITS),
  category: z.enum(CATEGORIES).optional().nullable(),
  status: z.enum(STATUSES).optional(),
  expiry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export const createIngredientSchema = ingredientBaseSchema;

export const updateIngredientSchema = ingredientBaseSchema.partial();

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;

export type IngredientRow = {
  id: number;
  user_id: number;
  name: string;
  quantity: string;
  unit: string;
  category: string | null;
  status: string;
  expiry_date: string | Date | null;
  created_at: Date;
  updated_at: Date;
};

export type IngredientResponse = {
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
