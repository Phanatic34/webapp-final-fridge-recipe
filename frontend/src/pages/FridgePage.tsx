import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { IngredientList } from "../components/IngredientList";
import { IngredientListSkeleton } from "../components/IngredientListSkeleton";
import { EmptyState } from "../components/EmptyState";
import { IngredientForm } from "../components/IngredientForm";
import { FormModal } from "../components/FormModal";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import {
  useIngredientsList,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
} from "../hooks/useIngredients";
import type { Ingredient, IngredientFormValues, SortOption } from "../types/ingredient";
import { CATEGORIES } from "../types/ingredient";

export default function FridgePage() {
  const [sort, setSort] = useState<SortOption>("created_at");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const listParams = useMemo(
    () => ({ sort, category: categoryFilter }),
    [sort, categoryFilter]
  );

  const { data: ingredients = [], isLoading, isError, error, refetch } =
    useIngredientsList(listParams);

  const createMut = useCreateIngredient();
  const updateMut = useUpdateIngredient();
  const deleteMut = useDeleteIngredient();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Ingredient | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);

  const stats = useMemo(() => {
    let near = 0;
    let expired = 0;
    for (const ing of ingredients) {
      if (ing.is_expired) expired += 1;
      else if (ing.is_near_expiry) near += 1;
    }
    return {
      total: ingredients.length,
      nearExpiry: near,
      expired,
    };
  }, [ingredients]);

  function openCreate() {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(ing: Ingredient) {
    setFormMode("edit");
    setEditing(ing);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function formValuesToPayload(values: IngredientFormValues) {
    const category =
      values.category === "" || values.category === undefined
        ? null
        : values.category;
    return {
      name: values.name,
      quantity: values.quantity,
      unit: values.unit,
      category,
      status: values.status,
      expiry_date: values.expiry_date?.trim() ? values.expiry_date : null,
    };
  }

  async function handleFormSubmit(values: IngredientFormValues) {
    const payload = formValuesToPayload(values);
    try {
      if (formMode === "create") {
        await createMut.mutateAsync(payload);
        toast.success("Ingredient added");
      } else if (editing) {
        await updateMut.mutateAsync({ id: editing.id, payload });
        toast.success("Ingredient updated");
      }
      closeForm();
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as Error).message)
          : "Something went wrong";
      toast.error(msg);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast.success("Ingredient removed");
      setDeleteTarget(null);
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as Error).message)
          : "Could not delete";
      toast.error(msg);
    }
  }

  const submitting = createMut.isPending || updateMut.isPending;

  return (
    <>
      <Layout
        totalCount={stats.total}
        nearExpiryCount={stats.nearExpiry}
        expiredCount={stats.expired}
        onAddClick={openCreate}
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="sort"
                className="text-xs font-medium uppercase text-slate-500"
              >
                Sort by
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="created_at">Date added</option>
                <option value="name">Name</option>
                <option value="expiry_date">Expiry date</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="category"
                className="text-xs font-medium uppercase text-slate-500"
              >
                Category
              </label>
              <select
                id="category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isError && (
            <div
              className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              role="alert"
            >
              <p className="text-sm text-red-800">
                {error instanceof Error
                  ? error.message
                  : "Could not load ingredients. Is the API running?"}
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading && !isError && <IngredientListSkeleton />}

          {!isLoading && !isError && ingredients.length === 0 && (
            <EmptyState onAdd={openCreate} />
          )}

          {!isLoading && !isError && ingredients.length > 0 && (
            <IngredientList
              ingredients={ingredients}
              onEdit={openEdit}
              onDelete={(ing) => setDeleteTarget(ing)}
            />
          )}
        </div>
      </Layout>

      <FormModal
        open={formOpen}
        onClose={closeForm}
        title={formMode === "create" ? "Add ingredient" : "Edit ingredient"}
      >
        <IngredientForm
          mode={formMode}
          initial={editing}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          submitting={submitting}
        />
      </FormModal>

      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Remove ingredient?"
        message={
          deleteTarget
            ? `Remove "${deleteTarget.name}" from your inventory? This cannot be undone.`
            : ""
        }
        loading={deleteMut.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
