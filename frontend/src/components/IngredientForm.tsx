import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ingredientFormSchema,
  type IngredientFormValues,
  UNITS,
  CATEGORIES,
  STATUSES,
  type Ingredient,
} from "../types/ingredient";

type Props = {
  mode: "create" | "edit";
  initial?: Ingredient | null;
  onSubmit: (values: IngredientFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
};

const defaultValues: IngredientFormValues = {
  name: "",
  quantity: 1,
  unit: "g",
  category: "",
  status: "fresh",
  expiry_date: "",
};

function ingredientToFormValues(ing: Ingredient): IngredientFormValues {
  return {
    name: ing.name,
    quantity: ing.quantity,
    unit: ing.unit as IngredientFormValues["unit"],
    category: (ing.category ?? "") as IngredientFormValues["category"],
    status: ing.status as IngredientFormValues["status"],
    expiry_date: ing.expiry_date ?? "",
  };
}

export function IngredientForm({
  mode,
  initial,
  onSubmit,
  onCancel,
  submitting,
}: Props) {
  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (mode === "edit" && initial) {
      form.reset(ingredientToFormValues(initial));
    } else {
      form.reset(defaultValues);
    }
  }, [mode, initial, form]);

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="mt-1 text-xs text-red-600">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-slate-700"
          >
            Quantity
          </label>
          <input
            id="quantity"
            type="number"
            step="any"
            min="0"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            {...form.register("quantity", { valueAsNumber: true })}
          />
          {form.formState.errors.quantity && (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.quantity.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-slate-700">
            Unit
          </label>
          <select
            id="unit"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            {...form.register("unit")}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-slate-700"
          >
            Category
          </label>
          <select
            id="category"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            {...form.register("category")}
          >
            <option value="">—</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-slate-700"
          >
            Status
          </label>
          <select
            id="status"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            {...form.register("status")}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="expiry_date"
          className="block text-sm font-medium text-slate-700"
        >
          Expiry date (optional)
        </label>
        <input
          id="expiry_date"
          type="date"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          {...form.register("expiry_date")}
        />
        <p className="mt-1 text-xs text-slate-500">
          Items expiring within {3} days are highlighted as near expiry.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting
            ? "Saving…"
            : mode === "create"
              ? "Add ingredient"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}
