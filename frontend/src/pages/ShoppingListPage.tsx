import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import {
  useShoppingList,
  useToggleShoppingItem,
  useUpdateShoppingItemQuantity,
  useDeleteShoppingItem,
  useClearCheckedItems,
} from "../hooks/useShoppingList";
import { useCreateIngredient } from "../hooks/useIngredients";

export default function ShoppingListPage() {
  const { data: shoppingList = [] } = useShoppingList();
  const toggleItem = useToggleShoppingItem();
  const updateQuantity = useUpdateShoppingItemQuantity();
  const deleteItem = useDeleteShoppingItem();
  const clearChecked = useClearCheckedItems();
  const createIngredient = useCreateIngredient();
  const [editingQty, setEditingQty] = useState<Record<number, string>>({});
  const [addingAll, setAddingAll] = useState(false);

  const checkedItems = shoppingList.filter((i) => i.is_checked);
  const uncheckedCount = shoppingList.filter((i) => !i.is_checked).length;
  const hasChecked = checkedItems.length > 0;

  function handleClearChecked() {
    clearChecked.mutate(undefined, {
      onSuccess: () => toast.success("已清除已購項目"),
      onError: () => toast.error("清除失敗"),
    });
  }

  async function handleAddAllCheckedToFridge() {
    setAddingAll(true);
    let successCount = 0;
    await Promise.all(
      checkedItems.map(async (item) => {
        const qty = item.quantity != null ? parseFloat(item.quantity) : NaN;
        try {
          await createIngredient.mutateAsync({
            name: item.ingredient_name,
            quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
            unit: item.unit ?? "pieces",
            category: null,
            status: "fresh",
            expiry_date: null,
          });
          deleteItem.mutate(item.id);
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
          <h2 className="font-['Noto_Serif_TC'] text-xl font-bold text-[#1B2E22]">
            購物清單
            {uncheckedCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">
                {uncheckedCount}
              </span>
            )}
          </h2>
          {hasChecked && (
            <button
              onClick={handleClearChecked}
              className="text-sm text-gray-400 hover:text-gray-600 transition"
            >
              清空已購
            </button>
          )}
        </div>

        <p className="text-sm text-gray-500">
          勾選表示已購買，回家後點「加入冰箱」補充庫存。
        </p>

        {hasChecked && (
          <button
            onClick={() => void handleAddAllCheckedToFridge()}
            disabled={addingAll}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {addingAll
              ? "加入中…"
              : `將 ${checkedItems.length} 項已購食材加入冰箱`}
          </button>
        )}

        {shoppingList.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#E5E7EB] py-12 text-center">
            <p className="text-[#6B7280]">購物清單是空的。</p>
            <p className="text-sm text-[#6B7280]">去食譜頁選一道食譜，點「加入購物清單」。</p>
          </div>
        ) : (
          <ul
            className="divide-y divide-white/30 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.52)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.72)",
            }}
          >
            {shoppingList.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={item.is_checked}
                  onChange={() =>
                    toggleItem.mutate({ id: item.id, is_checked: !item.is_checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#C4622D]"
                />
                <span
                  className={`flex-1 text-sm ${
                    item.is_checked ? "line-through text-gray-400" : "text-gray-800"
                  }`}
                >
                  {item.ingredient_name}
                  {item.quantity != null && (
                    <span className="ml-1 inline-flex items-center gap-1 text-gray-400">
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
                        className="w-16 rounded border border-gray-200 bg-white px-1 py-0.5 text-center text-sm text-gray-700 focus:border-[#C4622D] focus:outline-none"
                      />
                      {item.unit ?? ""}
                    </span>
                  )}
                  {item.source_recipe_title && (
                    <span className="ml-2 text-xs text-gray-400">
                      （來自《{item.source_recipe_title}》）
                    </span>
                  )}
                </span>
                <button
                  onClick={() => {
                    const qty = item.quantity != null ? parseFloat(item.quantity) : NaN;
                    createIngredient.mutate(
                      {
                        name: item.ingredient_name,
                        quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
                        unit: item.unit ?? "pieces",
                        category: null,
                        status: "fresh",
                        expiry_date: null,
                      },
                      {
                        onSuccess: () => {
                          deleteItem.mutate(item.id);
                          toast.success(`「${item.ingredient_name}」已加入冰箱`);
                        },
                        onError: () => toast.error("加入冰箱失敗"),
                      }
                    );
                  }}
                  disabled={createIngredient.isPending}
                  className={`shrink-0 rounded border px-2 py-0.5 text-xs transition disabled:opacity-40 ${
                    item.is_checked
                      ? "border-emerald-200 bg-emerald-50 text-emerald-500 hover:bg-emerald-100"
                      : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  }`}
                  aria-label={`將 ${item.ingredient_name} 加入冰箱`}
                >
                  {item.is_checked ? "✓ 加入冰箱" : "加入冰箱"}
                </button>
                <button
                  onClick={() => deleteItem.mutate(item.id)}
                  className="text-gray-300 hover:text-red-400 transition"
                  aria-label="刪除"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </Layout>
  );
}
