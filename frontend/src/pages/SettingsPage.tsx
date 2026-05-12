import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import {
  useSettings,
  useUpdateEquipment,
  useAddExclusion,
  useRemoveExclusion,
} from "../hooks/useSettings";
import {
  useShoppingList,
  useToggleShoppingItem,
  useDeleteShoppingItem,
  useClearCheckedItems,
} from "../hooks/useShoppingList";
import { useCreateIngredient } from "../hooks/useIngredients";

export function SettingsPage() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: shoppingList = [] } = useShoppingList();
  const updateEquipment = useUpdateEquipment();
  const addExclusion = useAddExclusion();
  const removeExclusion = useRemoveExclusion();
  const toggleItem = useToggleShoppingItem();
  const deleteItem = useDeleteShoppingItem();
  const clearChecked = useClearCheckedItems();
  const createIngredient = useCreateIngredient();
  const [customInput, setCustomInput] = useState("");

  function handleEquipmentToggle(name: string) {
    if (!settings) return;
    const current = new Set(settings.equipment);
    if (current.has(name)) {
      current.delete(name);
    } else {
      current.add(name);
    }
    updateEquipment.mutate([...current], {
      onError: () => toast.error("更新器具失敗"),
    });
  }

  function handleAllergenToggle(name: string) {
    if (!settings) return;
    const isExcluded = settings.exclusions.some((e) => e.name === name);
    if (isExcluded) {
      removeExclusion.mutate(name, {
        onError: () => toast.error("移除失敗"),
      });
    } else {
      addExclusion.mutate(
        { name, type: "allergen" },
        { onError: () => toast.error("新增失敗") }
      );
    }
  }

  function handleAddCustom() {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (trimmed.includes("/")) {
      toast.error("食材名稱不可包含斜線（/）");
      return;
    }
    addExclusion.mutate(
      { name: trimmed, type: "custom" },
      {
        onSuccess: () => {
          setCustomInput("");
          toast.success(`已排除「${trimmed}」`);
        },
        onError: () => toast.error("新增失敗"),
      }
    );
  }

  function handleClearChecked() {
    clearChecked.mutate(undefined, {
      onSuccess: () => toast.success("已清除已購項目"),
      onError: () => toast.error("清除失敗"),
    });
  }

  const uncheckedCount = shoppingList.filter((i) => !i.is_checked).length;
  const hasChecked = shoppingList.some((i) => i.is_checked);

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-8">

        {/* Equipment Section */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0 }}>
          <h2 className="text-lg font-semibold text-[#1B2E22] mb-1">我的廚房器具</h2>
          <p className="text-sm text-gray-500 mb-4">
            勾選你擁有的器具，系統只推薦你能製作的食譜。未勾選任何器具時不進行器具篩選。
          </p>
          {settingsLoading ? (
            <div className="text-sm text-gray-400">載入中…</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(settings?.predefinedEquipment ?? []).map((eq) => {
                const owned = settings?.equipment.includes(eq) ?? false;
                return (
                  <button
                    key={eq}
                    onClick={() => handleEquipmentToggle(eq)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                      owned
                        ? "border-green-400 bg-green-50 text-green-700"
                        : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {owned ? "✓ " : ""}{eq}
                  </button>
                );
              })}
            </div>
          )}
        </motion.section>

        <hr className="border-gray-200" />

        {/* Exclusions Section */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0.2 }}>
          <h2 className="text-lg font-semibold text-[#1B2E22] mb-1">不吃的食材</h2>
          <p className="text-sm text-gray-500 mb-4">
            含有以下食材的食譜將從推薦中排除。
          </p>

          {/* Allergen chips */}
          <div className="mb-3">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">常見過敏原</p>
            {settingsLoading ? (
              <div className="text-sm text-gray-400">載入中…</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(settings?.predefinedAllergens ?? []).map((allergen) => {
                  const excluded = settings?.exclusions.some((e) => e.name === allergen) ?? false;
                  return (
                    <button
                      key={allergen}
                      onClick={() => handleAllergenToggle(allergen)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                        excluded
                          ? "border-red-400 bg-red-50 text-red-700"
                          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {excluded ? "✕ " : ""}{allergen}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom exclusion input */}
          <div className="mb-3">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">自訂排除食材</p>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                placeholder="輸入食材名稱後按 Enter 或點新增"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C4622D] focus:outline-none"
              />
              <button
                onClick={handleAddCustom}
                disabled={!customInput.trim()}
                className="rounded-lg bg-[#C4622D] px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-[#b3561f]"
              >
                新增
              </button>
            </div>
          </div>

          {/* Custom exclusion tags */}
          {settings && settings.exclusions.filter((e) => e.type === "custom").length > 0 && (
            <div className="flex flex-wrap gap-2">
              {settings.exclusions
                .filter((e) => e.type === "custom")
                .map((ex) => (
                  <span
                    key={ex.name}
                    className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-700"
                  >
                    {ex.name}
                    <button
                      onClick={() => removeExclusion.mutate(ex.name)}
                      className="ml-1 text-red-400 hover:text-red-600"
                      aria-label={`移除 ${ex.name}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
            </div>
          )}
        </motion.section>

        <hr className="border-gray-200" />

        {/* Shopping List Section */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0.4 }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-[#1B2E22]">
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
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                清空已購
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            從食譜詳情頁加入的缺少食材。
          </p>

          {shoppingList.length === 0 ? (
            <p className="text-sm text-gray-400">購物清單是空的。去食譜頁選一道食譜，點「加入購物清單」。</p>
          ) : (
            <ul
              className="divide-y divide-white/30 rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.52)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.72)" }}
            >
              {shoppingList.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={item.is_checked}
                    onChange={() =>
                      toggleItem.mutate({ id: item.id, is_checked: !item.is_checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-[#C4622D]"
                  />
                  <span className={`flex-1 text-sm ${item.is_checked ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {item.ingredient_name}
                    {item.quantity != null && (
                      <span className="ml-1 text-gray-400">
                        × {item.quantity}{item.unit ? ` ${item.unit}` : ""}
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
                    className="shrink-0 rounded border border-emerald-300 px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-50 transition disabled:opacity-40"
                    aria-label={`將 ${item.ingredient_name} 加入冰箱`}
                  >
                    加入冰箱
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
        </motion.section>

      </div>
    </Layout>
  );
}
