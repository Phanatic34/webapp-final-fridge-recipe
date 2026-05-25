import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { FormModal } from "../components/FormModal";
import {
  useShoppingList,
  useToggleShoppingItem,
  useUpdateShoppingItemQuantity,
  useDeleteShoppingItem,
  useClearCheckedItems,
  useAddManualShoppingItem,
} from "../hooks/useShoppingList";
import { useCreateIngredient } from "../hooks/useIngredients";

const MEASURE_UNITS = new Set(["g", "kg", "ml", "L"]);
const COUNT_UNIT_MAP: Record<string, string> = {
  pieces: "個",
  packs: "包",
};

export default function ShoppingListPage() {
  const { data: shoppingList = [] } = useShoppingList();
  const toggleItem = useToggleShoppingItem();
  const updateQuantity = useUpdateShoppingItemQuantity();
  const deleteItem = useDeleteShoppingItem();
  const clearChecked = useClearCheckedItems();
  const createIngredient = useCreateIngredient();
  const addManual = useAddManualShoppingItem();
  const [editingQty, setEditingQty] = useState<Record<number, string>>({});
  const [expiryDates, setExpiryDates] = useState<Record<number, string>>({});
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});
  const [addingAll, setAddingAll] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newUnit, setNewUnit] = useState("");

  const checkedItems = shoppingList.filter((i) => i.is_checked);
  const uncheckedCount = shoppingList.filter((i) => !i.is_checked).length;
  const hasChecked = checkedItems.length > 0;

  function handleManualAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const qty = newQty.trim() ? parseFloat(newQty) : null;
    addManual.mutate(
      { ingredient_name: newName.trim(), quantity: qty && qty > 0 ? qty : null, unit: newUnit.trim() || null },
      {
        onSuccess: () => {
          toast.success(`「${newName.trim()}」已加入購物清單`);
          setNewName(""); setNewQty(""); setNewUnit(""); setAddOpen(false);
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "新增失敗"),
      }
    );
  }

  function handleClearChecked() {
    clearChecked.mutate(undefined, {
      onSuccess: () => toast.success("已清除已購項目"),
      onError: () => toast.error("清除失敗"),
    });
  }

  function addToFridge(item: (typeof shoppingList)[number]) {
    const expiry = expiryDates[item.id]?.trim() || null;
    createIngredient.mutate(
      {
        name: item.ingredient_name,
        ...quantityPayloadFromShoppingItem(item),
        category: null,
        status: "fresh",
        expiry_date: expiry,
      },
      {
        onSuccess: () => {
          deleteItem.mutate(item.id);
          setExpiryDates((prev) => { const n = { ...prev }; delete n[item.id]; return n; });
          toast.success(`「${item.ingredient_name}」已加入冰箱`);
        },
        onError: () => toast.error("加入冰箱失敗"),
      }
    );
  }

  async function handleAddAllCheckedToFridge() {
    setAddingAll(true);
    let successCount = 0;
    await Promise.all(
      checkedItems.map(async (item) => {
        const expiry = expiryDates[item.id]?.trim() || null;
        try {
          await createIngredient.mutateAsync({
            name: item.ingredient_name,
            ...quantityPayloadFromShoppingItem(item),
            category: null,
            status: "fresh",
            expiry_date: expiry,
          });
          deleteItem.mutate(item.id);
          setExpiryDates((prev) => { const n = { ...prev }; delete n[item.id]; return n; });
          successCount++;
        } catch {
          toast.error(`「${item.ingredient_name}」加入失敗`);
        }
      })
    );
    setAddingAll(false);
    if (successCount > 0) toast.success(`已將 ${successCount} 項食材加入冰箱`);
  }

  return (
    <Layout>
      <motion.div
        className="mx-auto max-w-2xl space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-['Noto_Serif_TC'] text-lg font-semibold text-app-text">
            購物清單
            {uncheckedCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-app-warning px-2 py-0.5 text-xs text-white">
                {uncheckedCount}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAddOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-app-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-app-primary-hover transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="4" x2="12" y2="20" /><line x1="4" y1="12" x2="20" y2="12" />
              </svg>
              新增項目
            </button>
          {hasChecked && (
            <button
              onClick={handleClearChecked}
              className="text-sm text-app-muted hover:text-app-text transition"
            >
              清空已購
            </button>
          )}
          </div>
        </div>

        <p className="text-sm text-app-muted">
          勾選表示已購買，可在店內填入到期日，回家後點「加入冰箱」補充庫存。
        </p>

        {shoppingList.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-app-border py-12 text-center">
            <p className="text-app-muted">購物清單是空的。</p>
            <p className="text-sm text-app-muted">去食譜頁選一道食譜，點「加入購物清單」。</p>
          </div>
        ) : (
          <ul className="divide-y divide-app-border overflow-hidden rounded-2xl border border-app-border bg-white shadow-sm">
            {shoppingList.map((item) => (
              <li key={item.id} className="px-4 py-3">

                {/* ── 手機版 ─────────────────────────── */}
                <div className="flex flex-col gap-2 sm:hidden">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.is_checked}
                      onChange={() =>
                        toggleItem.mutate({ id: item.id, is_checked: !item.is_checked })
                      }
                      className="h-4 w-4 shrink-0 rounded border-app-border text-app-primary"
                    />
                    <span
                      className={`flex-1 min-w-0 text-sm ${
                        item.is_checked ? "line-through text-app-muted" : "text-app-text"
                      }`}
                    >
                      {item.ingredient_name}
                    </span>
                    {item.source_recipe_title && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSources((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                        }
                        className="shrink-0 text-app-muted hover:text-app-text transition"
                        aria-label="顯示食譜來源"
                      >
                        <motion.span
                          animate={{ rotate: expandedSources[item.id] ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="block text-xs leading-none"
                        >
                          ▾
                        </motion.span>
                      </button>
                    )}
                    <button
                      onClick={() => deleteItem.mutate(item.id)}
                      className="shrink-0 text-app-muted hover:text-app-danger transition"
                      aria-label="刪除"
                    >
                      ✕
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {item.source_recipe_title && expandedSources[item.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-7"
                      >
                        <span className="text-xs text-app-muted">
                          來自《{item.source_recipe_title}》
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {item.quantity != null && (
                    <div className="flex items-center gap-1 pl-7 text-sm text-app-muted">
                      ×
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={editingQty[item.id] ?? item.quantity}
                        onChange={(e) =>
                          setEditingQty((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        onBlur={() => {
                          const val = parseFloat(editingQty[item.id] ?? "");
                          if (!Number.isNaN(val) && val > 0 && String(val) !== item.quantity) {
                            updateQuantity.mutate(
                              { id: item.id, quantity: val },
                              { onError: () => toast.error("更新數量失敗") }
                            );
                          }
                          setEditingQty((prev) => { const n = { ...prev }; delete n[item.id]; return n; });
                        }}
                        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                        className="w-14 rounded border border-app-border bg-white px-1 py-0.5 text-center text-sm text-app-text focus:border-app-primary focus:outline-none"
                      />
                      {item.unit ?? ""}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pl-7">
                    <input
                      type="date"
                      value={expiryDates[item.id] ?? ""}
                      onChange={(e) =>
                        setExpiryDates((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      className="rounded border border-app-border bg-white px-2 py-0.5 text-xs text-app-text focus:border-app-primary focus:outline-none"
                    />
                    <span className="text-xs text-app-muted">到期</span>
                    <button
                      onClick={() => addToFridge(item)}
                      disabled={createIngredient.isPending}
                      className={`ml-auto shrink-0 rounded border px-2 py-0.5 text-xs transition disabled:opacity-40 ${
                        item.is_checked
                          ? "border-emerald-200 bg-emerald-50 text-app-success hover:bg-emerald-100"
                          : "border-emerald-200 text-app-success hover:bg-emerald-50"
                      }`}
                      aria-label={`將 ${item.ingredient_name} 加入冰箱`}
                    >
                      {item.is_checked ? "✓ 加入冰箱" : "加入冰箱"}
                    </button>
                  </div>
                </div>

                {/* ── 桌面版（原排版不動）────────────── */}
                <div className="hidden sm:flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={item.is_checked}
                    onChange={() =>
                      toggleItem.mutate({ id: item.id, is_checked: !item.is_checked })
                    }
                    className="h-4 w-4 shrink-0 rounded border-app-border text-app-primary"
                  />
                  <div className="flex flex-1 flex-col gap-1">
                    <span
                      className={`text-sm ${
                        item.is_checked ? "line-through text-app-muted" : "text-app-text"
                      }`}
                    >
                      {item.ingredient_name}
                      {item.quantity != null && (
                        <span className="ml-1 inline-flex items-center gap-1 text-app-muted">
                          ×
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={editingQty[item.id] ?? item.quantity}
                            onChange={(e) =>
                              setEditingQty((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            onBlur={() => {
                              const val = parseFloat(editingQty[item.id] ?? "");
                              if (!Number.isNaN(val) && val > 0 && String(val) !== item.quantity) {
                                updateQuantity.mutate(
                                  { id: item.id, quantity: val },
                                  { onError: () => toast.error("更新數量失敗") }
                                );
                              }
                              setEditingQty((prev) => { const n = { ...prev }; delete n[item.id]; return n; });
                            }}
                            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                            className="w-16 rounded border border-app-border bg-white px-1 py-0.5 text-center text-sm text-app-text focus:border-app-primary focus:outline-none"
                          />
                          {item.unit ?? ""}
                        </span>
                      )}
                      {item.source_recipe_title && (
                        <span className="ml-2 text-xs text-app-muted">
                          （來自《{item.source_recipe_title}》）
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-app-muted">到期日</span>
                      <input
                        type="date"
                        value={expiryDates[item.id] ?? ""}
                        onChange={(e) =>
                          setExpiryDates((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        className="rounded border border-app-border bg-white px-2 py-0.5 text-xs text-app-text focus:border-app-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => addToFridge(item)}
                    disabled={createIngredient.isPending}
                    className={`shrink-0 rounded border px-2 py-0.5 text-xs transition disabled:opacity-40 ${
                      item.is_checked
                        ? "border-emerald-200 bg-emerald-50 text-app-success hover:bg-emerald-100"
                        : "border-emerald-200 text-app-success hover:bg-emerald-50"
                    }`}
                    aria-label={`將 ${item.ingredient_name} 加入冰箱`}
                  >
                    {item.is_checked ? "✓ 加入冰箱" : "加入冰箱"}
                  </button>
                  <button
                    onClick={() => deleteItem.mutate(item.id)}
                    className="shrink-0 text-app-muted hover:text-app-danger transition"
                    aria-label="刪除"
                  >
                    ✕
                  </button>
                </div>

              </li>
            ))}
          </ul>
        )}

        {hasChecked && (
          <button
            onClick={() => void handleAddAllCheckedToFridge()}
            disabled={addingAll}
            className="hidden sm:block w-full rounded-xl bg-app-primary px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-app-primary-hover transition disabled:opacity-50"
          >
            {addingAll
              ? "加入中…"
              : `將 ${checkedItems.length} 項已購食材加入冰箱`}
          </button>
        )}
      </motion.div>

      {/* 手動新增 FAB — 只在沒有「加入冰箱」FAB 時顯示，避免重疊 */}
      <AnimatePresence>
        {!hasChecked && (
          <motion.button
            type="button"
            onClick={() => setAddOpen(true)}
            className="fixed bottom-6 right-6 z-40 sm:hidden flex h-12 w-12 items-center justify-center rounded-full bg-app-primary text-white shadow-lg shadow-green-900/20 hover:bg-app-primary-hover focus:outline-none"
            aria-label="手動新增購物項目"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 20 } }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="4" x2="12" y2="20" />
              <line x1="4" y1="12" x2="20" y2="12" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 手動新增 modal */}
      <FormModal open={addOpen} title="新增購物項目" onClose={() => setAddOpen(false)}>
        <form onSubmit={handleManualAdd} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-app-muted">品項名稱 *</label>
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例：牛奶"
              className="rounded-lg border border-app-border px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
              required
            />
          </div>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs font-medium text-app-muted">數量（選填）</label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                placeholder="1"
                className="rounded-lg border border-app-border px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs font-medium text-app-muted">單位（選填）</label>
              <input
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="個、罐、g…"
                className="rounded-lg border border-app-border px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="flex-1 rounded-lg border border-app-border py-2 text-sm text-app-muted hover:bg-app-surface transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!newName.trim() || addManual.isPending}
              className="flex-1 rounded-lg bg-app-primary py-2 text-sm font-medium text-white hover:bg-app-primary-hover transition disabled:opacity-50"
            >
              新增
            </button>
          </div>
        </form>
      </FormModal>

      {/* 手機版批次加入冰箱 FAB */}
      <AnimatePresence>
        {hasChecked && (
          <motion.button
            type="button"
            onClick={() => void handleAddAllCheckedToFridge()}
            disabled={addingAll}
            className="fixed bottom-6 right-6 z-40 sm:hidden flex items-center gap-2 rounded-full bg-app-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-green-900/20 hover:bg-app-primary-hover transition-colors disabled:opacity-50 focus:outline-none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 20 } }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
            aria-label="將已購食材加入冰箱"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {addingAll ? "加入中…" : `加入冰箱 (${checkedItems.length})`}
          </motion.button>
        )}
      </AnimatePresence>
    </Layout>
  );
}

function quantityPayloadFromShoppingItem(item: {
  quantity: string | null;
  unit: string | null;
}) {
  const qty = item.quantity != null ? parseFloat(item.quantity) : NaN;
  const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
  const unit = item.unit ?? "pieces";

  if (MEASURE_UNITS.has(unit)) {
    return {
      count_quantity: null,
      count_unit: null,
      measure_quantity: safeQty,
      measure_unit: unit,
    };
  }

  return {
    count_quantity: safeQty,
    count_unit: COUNT_UNIT_MAP[unit] ?? "份",
    measure_quantity: null,
    measure_unit: null,
  };
}
