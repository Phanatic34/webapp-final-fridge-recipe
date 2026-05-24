import { z } from "zod";

/** Days from today until expiry considered "near expiry" */
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
export type IngredientStatus = (typeof STATUSES)[number];

const optionalPositiveQuantity = z.preprocess(
  (value) => (value === "" ? null : value),
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

const ingredientFieldsSchema = z.object({
  name: z.string().trim().min(1).max(255),
  count_quantity: optionalPositiveQuantity,
  count_unit: optionalCountUnit,
  measure_quantity: optionalPositiveQuantity,
  measure_unit: optionalMeasureUnit,
  category: z.enum(CATEGORIES).optional().nullable(),
  status: z.enum(STATUSES).optional(),
  expiry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional()
    .nullable()
    .or(z.literal("")),
});

function validateQuantityPairs(
  data: Partial<z.infer<typeof ingredientFieldsSchema>>,
  ctx: z.RefinementCtx,
  requireAtLeastOne: boolean
) {
  const hasCountQuantity = data.count_quantity != null;
  const hasCountUnit = data.count_unit != null;
  const hasMeasureQuantity = data.measure_quantity != null;
  const hasMeasureUnit = data.measure_unit != null;

  if (hasCountQuantity && !hasCountUnit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["count_unit"],
      message: "Count unit is required when count quantity is provided",
    });
  }

  if (!hasCountQuantity && hasCountUnit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["count_quantity"],
      message: "Count quantity is required when count unit is provided",
    });
  }

  if (hasMeasureQuantity && !hasMeasureUnit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["measure_unit"],
      message: "Measurement unit is required when measurement quantity is provided",
    });
  }

  if (!hasMeasureQuantity && hasMeasureUnit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["measure_quantity"],
      message: "Measurement quantity is required when measurement unit is provided",
    });
  }

  if (requireAtLeastOne && !hasCountQuantity && !hasMeasureQuantity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["count_quantity"],
      message: "Provide either count quantity or measurement quantity",
    });
  }
}

export const createIngredientSchema = ingredientFieldsSchema.superRefine(
  (data, ctx) => validateQuantityPairs(data, ctx, true)
);

export const updateIngredientSchema = ingredientFieldsSchema.partial();

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;

export type IngredientRow = {
  id: number;
  user_id: number;
  name: string;
  count_quantity: string | null;
  count_unit: string | null;
  measure_quantity: string | null;
  measure_unit: string | null;
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
