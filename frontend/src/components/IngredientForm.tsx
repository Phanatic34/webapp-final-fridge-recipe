import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ingredientFormSchema,
  type IngredientFormValues,
  COUNT_UNITS,
  MEASURE_UNITS,
  CATEGORIES,
  STATUSES,
  type Ingredient,
} from "../types/ingredient";
import { CATEGORY_LABELS, STATUS_LABELS } from "../utils/labels";

type Props = {
  mode: "create" | "edit";
  initial?: Ingredient | null;
  onSubmit: (values: IngredientFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
};

const defaultValues: IngredientFormValues = {
  name: "",
  count_quantity: null,
  count_unit: null,
  measure_quantity: null,
  measure_unit: null,
  category: "",
  status: "fresh",
  expiry_date: "",
};

function ingredientToFormValues(ing: Ingredient): IngredientFormValues {
  return {
    name: ing.name,
    count_quantity: ing.count_quantity,
    count_unit: ing.count_unit as IngredientFormValues["count_unit"],
    measure_quantity: ing.measure_quantity,
    measure_unit: ing.measure_unit as IngredientFormValues["measure_unit"],
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
        <label htmlFor="name" className="block text-sm font-medium text-app-text">
          名稱
        </label>
        <input
          id="name"
          type="text"
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-app-border px-3 py-2 text-sm shadow-sm focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="mt-1 text-xs text-app-danger">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <p className="text-xs text-app-muted">請至少填寫以下其中一項數量。</p>

      <section className="rounded-xl border border-app-border bg-app-surface/70 p-3">
        <h3 className="text-sm font-semibold text-app-text">
          個數 <span className="ml-1 font-normal text-app-muted">（選填）</span>
        </h3>
        <p className="mt-0.5 text-xs text-app-muted">
          例如：5 根小黃瓜、3 顆番茄、2 包豆腐
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="count_quantity"
              className="block text-sm font-medium text-app-text"
            >
              數量
            </label>
            <input
              id="count_quantity"
              type="number"
              step="any"
              min="0"
              className="mt-1 w-full rounded-lg border border-app-border px-3 py-2 text-sm shadow-sm focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
              {...form.register("count_quantity", {
                setValueAs: (value) => (value === "" || value === null || value === undefined ? null : Number(value)),
              })}
            />
            {form.formState.errors.count_quantity && (
              <p className="mt-1 text-xs text-app-danger">
                {form.formState.errors.count_quantity.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="count_unit"
              className="block text-sm font-medium text-app-text"
            >
              單位
            </label>
            <select
              id="count_unit"
              className="mt-1 w-full rounded-lg border border-app-border px-3 py-2 text-sm shadow-sm focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
              {...form.register("count_unit")}
            >
              <option value="">—</option>
              {COUNT_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            {form.formState.errors.count_unit && (
              <p className="mt-1 text-xs text-app-danger">
                {form.formState.errors.count_unit.message}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-app-border" />
        <span className="text-xs text-app-muted">或</span>
        <div className="h-px flex-1 bg-app-border" />
      </div>

      <section className="rounded-xl border border-app-border bg-app-surface/70 p-3">
        <h3 className="text-sm font-semibold text-app-text">
          重量／容量 <span className="ml-1 font-normal text-app-muted">（選填）</span>
        </h3>
        <p className="mt-0.5 text-xs text-app-muted">
          例如：100 g、1 kg、500 ml、1 L
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="measure_quantity"
              className="block text-sm font-medium text-app-text"
            >
              數值
            </label>
            <input
              id="measure_quantity"
              type="number"
              step="any"
              min="0"
              className="mt-1 w-full rounded-lg border border-app-border px-3 py-2 text-sm shadow-sm focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
              {...form.register("measure_quantity", {
                setValueAs: (value) => (value === "" || value === null || value === undefined ? null : Number(value)),
              })}
            />
            {form.formState.errors.measure_quantity && (
              <p className="mt-1 text-xs text-app-danger">
                {form.formState.errors.measure_quantity.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="measure_unit"
              className="block text-sm font-medium text-app-text"
            >
              單位
            </label>
            <select
              id="measure_unit"
              className="mt-1 w-full rounded-lg border border-app-border px-3 py-2 text-sm shadow-sm focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
              {...form.register("measure_unit")}
            >
              <option value="">—</option>
              {MEASURE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            {form.formState.errors.measure_unit && (
              <p className="mt-1 text-xs text-app-danger">
                {form.formState.errors.measure_unit.message}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-app-text"
          >
            分類
          </label>
          <select
            id="category"
            className="mt-1 w-full rounded-lg border border-app-border px-3 py-2 text-sm shadow-sm focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
            {...form.register("category")}
          >
            <option value="">—</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c] ?? c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-app-text"
          >
            狀態
          </label>
          <select
            id="status"
            className="mt-1 w-full rounded-lg border border-app-border px-3 py-2 text-sm shadow-sm focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
            {...form.register("status")}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="expiry_date"
          className="block text-sm font-medium text-app-text"
        >
          到期日（選填）
        </label>
        <input
          id="expiry_date"
          type="date"
          className="mt-1 w-full rounded-lg border border-app-border px-3 py-2 text-sm shadow-sm focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
          {...form.register("expiry_date")}
        />
        <p className="mt-1 text-xs text-app-muted">
          3 天內到期的食材會標示為即將到期。
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-app-border px-4 py-2 text-sm font-medium text-app-text hover:bg-app-surface"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-app-primary px-4 py-2 text-sm font-medium text-white hover:bg-app-primary-hover disabled:opacity-50"
        >
          {submitting
            ? "儲存中…"
            : mode === "create"
              ? "新增食材"
              : "儲存變更"}
        </button>
      </div>
    </form>
  );
}
