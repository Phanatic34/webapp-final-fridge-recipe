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

export function SettingsPage() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const updateEquipment = useUpdateEquipment();
  const addExclusion = useAddExclusion();
  const removeExclusion = useRemoveExclusion();
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

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-8">

        {/* Equipment Section */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0 }}>
          <h2 className="text-lg font-semibold text-app-text mb-1">我的廚房器具</h2>
          <p className="text-sm text-app-muted mb-4">
            勾選你擁有的器具，系統只推薦你能製作的食譜。未勾選任何器具時不進行器具篩選。
          </p>
          {settingsLoading ? (
            <div className="text-sm text-app-muted">載入中…</div>
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
                        ? "border-app-border bg-app-surface text-app-primary"
                        : "border-app-border bg-white text-app-muted hover:border-app-primary hover:text-app-primary"
                    }`}
                  >
                    {owned ? "✓ " : ""}{eq}
                  </button>
                );
              })}
            </div>
          )}
        </motion.section>

        <hr className="border-app-border" />

        {/* Exclusions Section */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0.2 }}>
          <h2 className="text-lg font-semibold text-app-text mb-1">不吃的食材</h2>
          <p className="text-sm text-app-muted mb-4">
            含有以下食材的食譜將從推薦中排除。
          </p>

          {/* Allergen chips */}
          <div className="mb-3">
            <p className="text-xs uppercase tracking-wide text-app-muted mb-2">常見過敏原</p>
            {settingsLoading ? (
              <div className="text-sm text-app-muted">載入中…</div>
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
                          ? "border-red-200 bg-red-50 text-app-danger"
                          : "border-app-border bg-white text-app-muted hover:border-app-primary hover:text-app-primary"
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
            <p className="text-xs uppercase tracking-wide text-app-muted mb-2">自訂排除食材</p>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                placeholder="輸入食材名稱後按 Enter 或點新增"
                className="flex-1 rounded-lg border border-app-border px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none"
              />
              <button
                onClick={handleAddCustom}
                disabled={!customInput.trim()}
                className="rounded-lg bg-app-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-app-primary-hover"
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
                    className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm text-app-danger"
                  >
                    {ex.name}
                    <button
                      onClick={() => removeExclusion.mutate(ex.name)}
                      className="ml-1 text-app-danger hover:text-red-700"
                      aria-label={`移除 ${ex.name}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
            </div>
          )}
        </motion.section>

      </div>
    </Layout>
  );
}
