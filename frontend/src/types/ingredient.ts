import { z } from "zod";

/** Mirrors backend — keep enums in sync with `backend/src/types/ingredient.ts` */
export const NEAR_EXPIRY_DAYS = 3;

export const COUNT_UNITS = [
  "個",
  "根",
  "顆",
  "包",
  "盒",
  "片",
  "份",
  "瓶",
  "罐",
] as const;

export const MEASURE_UNITS = ["g", "kg", "ml", "L"] as const;

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

export type CountUnit = (typeof COUNT_UNITS)[number];
export type MeasureUnit = (typeof MEASURE_UNITS)[number];
export type Category = (typeof CATEGORIES)[number];

const optionalPositiveQuantity = z.preprocess(
  (value) => (value === "" || value === null || value === undefined || Number.isNaN(value) ? null : value),
  z
    .union([
      z.coerce.number().positive("Quantity must be greater than 0"),
      z.null(),
    ])
    .optional()
);

const optionalCountUnit = z.preprocess(
  (value) => (value === "" ? null : value),
  z.union([z.enum(COUNT_UNITS), z.null()]).optional()
);

const optionalMeasureUnit = z.preprocess(
  (value) => (value === "" ? null : value),
  z.union([z.enum(MEASURE_UNITS), z.null()]).optional()
);

export const ingredientFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  count_quantity: optionalPositiveQuantity,
  count_unit: optionalCountUnit,
  measure_quantity: optionalPositiveQuantity,
  measure_unit: optionalMeasureUnit,
  category: z.union([z.enum(CATEGORIES), z.literal("")]).optional(),
  status: z.enum(STATUSES),
  expiry_date: z.string().optional(),
}).superRefine((data, ctx) => {
  const hasCountQuantity = data.count_quantity != null && data.count_quantity > 0;
  const hasCountUnit = data.count_unit != null;
  const hasMeasureQuantity = data.measure_quantity != null && data.measure_quantity > 0;
  const hasMeasureUnit = data.measure_unit != null;

  if (!hasCountQuantity && !hasMeasureQuantity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["count_quantity"],
      message: "請填寫個數或重量／容量",
    });
  }
  if (hasCountQuantity && !hasCountUnit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["count_unit"],
      message: "請選擇個數單位",
    });
  }
  if (hasMeasureQuantity && !hasMeasureUnit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["measure_unit"],
      message: "請選擇重量／容量單位",
    });
  }
});

export type IngredientFormValues = z.infer<typeof ingredientFormSchema>;

export type Ingredient = {
  id: number;
  user_id: number;
  name: string;
  count_quantity: number | null;
  count_unit: string | null;
  measure_quantity: number | null;
  measure_unit: string | null;
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
