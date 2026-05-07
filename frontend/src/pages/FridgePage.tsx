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
import { CATEGORY_LABELS } from "../utils/labels";

export default function FridgePage() {
  const [sort, setSort] = useState<SortOption>("created_at");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

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

  const filteredIngredients = useMemo(() => {
    if (!search.trim()) return ingredients;
    const q = search.toLowerCase();
    return ingredients.filter((ing) => ing.name.toLowerCase().includes(q));
  }, [ingredients, search]);

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
        toast.success("食材已新增");
      } else if (editing) {
        await updateMut.mutateAsync({ id: editing.id, payload });
        toast.success("食材已更新");
      }
      closeForm();
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as Error).message)
          : "發生錯誤";
      toast.error(msg);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast.success("食材已刪除");
      setDeleteTarget(null);
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as Error).message)
          : "刪除失敗";
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
                className="text-xs font-medium uppercase text-[#6B7280]"
              >
                排序
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm shadow-sm focus:border-[#C4622D] focus:outline-none focus:ring-1 focus:ring-[#C4622D]"
              >
                <option value="created_at">新增日期</option>
                <option value="name">名稱</option>
                <option value="expiry_date">到期日</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="category"
                className="text-xs font-medium uppercase text-[#6B7280]"
              >
                分類
              </label>
              <select
                id="category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm shadow-sm focus:border-[#C4622D] focus:outline-none focus:ring-1 focus:ring-[#C4622D]"
              >
                <option value="all">所有分類</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c] ?? c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 sm:flex-1">
              <label
                htmlFor="search"
                className="text-xs font-medium uppercase text-[#6B7280]"
              >
                搜尋食材
              </label>
              <div className="relative">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m0 0A7 7 0 1 0 6.65 6.65a7 7 0 0 0 9.97 9.97z"
                  />
                </svg>
                <input
                  id="search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜尋食材..."
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white pl-9 pr-3 py-2 text-sm shadow-sm focus:border-[#C4622D] focus:outline-none focus:ring-1 focus:ring-[#C4622D]"
                />
              </div>
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
                  : "無法載入食材，API 是否正在運行？"}
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800"
              >
                重試
              </button>
            </div>
          )}

          {isLoading && !isError && <IngredientListSkeleton />}

          {!isLoading && !isError && ingredients.length === 0 && (
            <EmptyState onAdd={openCreate} />
          )}

          {!isLoading && !isError && ingredients.length > 0 && filteredIngredients.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#E5E7EB] py-12 text-center">
              <p className="text-[#6B7280]">找不到符合「{search}」的食材。</p>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-sm font-medium text-[#C4622D] hover:underline"
              >
                清除搜尋
              </button>
            </div>
          )}

          {!isLoading && !isError && filteredIngredients.length > 0 && (
            <IngredientList
              ingredients={filteredIngredients}
              onEdit={openEdit}
              onDelete={(ing) => setDeleteTarget(ing)}
            />
          )}
        </div>
      </Layout>

      <FormModal
        open={formOpen}
        onClose={closeForm}
        title={formMode === "create" ? "新增食材" : "編輯食材"}
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
        title="移除食材？"
        message={
          deleteTarget
            ? `確定要移除「${deleteTarget.name}」嗎？此操作無法復原。`
            : ""
        }
        loading={deleteMut.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
