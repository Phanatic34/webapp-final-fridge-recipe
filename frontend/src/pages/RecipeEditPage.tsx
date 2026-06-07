import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Layout } from "../components/Layout";
import { useRecipeDetail } from "../hooks/useRecipes";
import { useUpdateRecipe } from "../hooks/useRecipes";
import { autoAllergens } from "../api/recipes";
import { CUISINE_LABELS, DIFFICULTY_LABELS } from "../utils/labels";

const ALLERGEN_OPTIONS = ["花生", "海鮮", "乳製品", "麩質", "蛋"] as const;
const CUISINES = ["taiwanese", "chinese", "japanese", "korean", "italian", "american", "thai", "other"] as const;
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

type IngredientRow = { id: number; name: string; quantity: string; unit: string; allergens: string[] };

let nextId = 1000;

export default function RecipeEditPage() {
  const { id } = useParams<{ id: string }>();
  const recipeId = Number(id);
  const navigate = useNavigate();
  const updateRecipe = useUpdateRecipe();
  const { data: recipe, isLoading, isError } = useRecipeDetail(
    Number.isNaN(recipeId) ? 0 : recipeId
  );

  const [initialized, setInitialized] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [servings, setServings] = useState("2");
  const [difficulty, setDifficulty] = useState("medium");
  const [instructions, setInstructions] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { id: nextId++, name: "", quantity: "", unit: "", allergens: [] },
  ]);
  const [autoDetecting, setAutoDetecting] = useState<Record<number, boolean>>({});
  const [batchDetecting, setBatchDetecting] = useState(false);

  async function handleBatchAutoDetect() {
    const targets = ingredients.filter(
      (r) => r.name.trim() && r.allergens.length === 0
    );
    if (targets.length === 0) {
      toast.info("所有有名稱的食材已有過敏原資訊");
      return;
    }
    setBatchDetecting(true);
    let successCount = 0;
    let errorCount = 0;
    await Promise.all(
      targets.map(async (row) => {
        try {
          const { allergens } = await autoAllergens(row.name.trim());
          setIngredients((prev) =>
            prev.map((r) => (r.id === row.id ? { ...r, allergens } : r))
          );
          successCount++;
        } catch {
          errorCount++;
        }
      })
    );
    setBatchDetecting(false);
    if (errorCount === 0) {
      toast.success(`已偵測 ${successCount} 項食材的過敏原`);
    } else {
      toast.warning(`已偵測 ${successCount} 項，${errorCount} 項失敗`);
    }
  }
  const [customInputs, setCustomInputs] = useState<Record<number, string>>({});
  const [showCustomInput, setShowCustomInput] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (recipe && !initialized) {
      setTitle(recipe.title);
      setDescription(recipe.description ?? "");
      setCuisine(recipe.cuisine ?? "");
      setCookingTime(recipe.cooking_time?.toString() ?? "");
      setServings(recipe.servings?.toString() ?? "2");
      setDifficulty(recipe.difficulty ?? "medium");
      setInstructions(recipe.instructions ?? "");
      setIngredients(
        recipe.ingredients.length > 0
          ? recipe.ingredients.map((ing) => ({
              id: nextId++,
              name: ing.name,
              quantity: ing.quantity?.toString() ?? "",
              unit: ing.unit ?? "",
              allergens: ing.allergens ?? [],
            }))
          : [{ id: nextId++, name: "", quantity: "", unit: "", allergens: [] }]
      );
      setInitialized(true);
    }
  }, [recipe, initialized]);

  function addIngredientRow() {
    setIngredients((prev) => [...prev, { id: nextId++, name: "", quantity: "", unit: "", allergens: [] }]);
  }

  function handleIngredientEnter(row: IngredientRow) {
    if (row.name.trim() && row.allergens.length === 0) {
      void handleAutoDetect(row.id, row.name);
    }
    addIngredientRow();
  }

  function removeIngredientRow(id: number) {
    setIngredients((prev) => prev.filter((r) => r.id !== id));
  }

  function updateIngredientRow(id: number, field: keyof Omit<IngredientRow, "id" | "allergens">, value: string) {
    setIngredients((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function toggleAllergen(id: number, allergen: string) {
    setIngredients((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const has = r.allergens.includes(allergen);
        return { ...r, allergens: has ? r.allergens.filter((a) => a !== allergen) : [...r.allergens, allergen] };
      })
    );
  }

  function addCustomAllergen(id: number) {
    const val = (customInputs[id] ?? "").trim();
    if (!val) return;
    setIngredients((prev) =>
      prev.map((r) => {
        if (r.id !== id || r.allergens.includes(val)) return r;
        return { ...r, allergens: [...r.allergens, val] };
      })
    );
    setCustomInputs((prev) => ({ ...prev, [id]: "" }));
    setShowCustomInput((prev) => ({ ...prev, [id]: false }));
  }

  async function handleAutoDetect(id: number, name: string) {
    if (!name.trim()) { toast.error("請先填寫食材名稱"); return; }
    setAutoDetecting((prev) => ({ ...prev, [id]: true }));
    try {
      const { allergens, source } = await autoAllergens(name.trim());
      setIngredients((prev) => prev.map((r) => (r.id === id ? { ...r, allergens } : r)));
      if (source === "known") toast.success(`已自動偵測「${name}」的過敏原`);
      else if (source === "ai") toast.success(`AI 已偵測「${name}」的過敏原`);
      else toast.info(`未找到「${name}」的過敏原資訊`);
    } catch {
      toast.error("自動偵測失敗");
    } finally {
      setAutoDetecting((prev) => ({ ...prev, [id]: false }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("請填寫食譜名稱"); return; }

    const validIngredients = ingredients
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name.trim(),
        quantity: r.quantity.trim() ? parseFloat(r.quantity) || null : null,
        unit: r.unit.trim() || undefined,
        allergens: r.allergens,
      }));

    updateRecipe.mutate(
      {
        id: recipeId,
        payload: {
          title: title.trim(),
          description: description.trim() || undefined,
          cuisine: cuisine || undefined,
          cooking_time: cookingTime ? parseInt(cookingTime) || null : null,
          servings: servings ? parseInt(servings) || 2 : 2,
          difficulty,
          instructions: instructions.trim() || undefined,
          ingredients: validIngredients,
        },
      },
      {
        onSuccess: () => {
          toast.success("食譜已更新");
          navigate(`/recipes/${recipeId}`);
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "更新失敗"),
      }
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-app-surface" />
          ))}
        </div>
      </Layout>
    );
  }

  if (isError || !recipe) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-app-danger">無法載入食譜。</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        className="mx-auto max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
      >
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/recipes/${recipeId}`)}
            className="rounded-lg p-1.5 text-app-muted hover:bg-app-surface hover:text-app-text transition"
            aria-label="返回"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="font-['Noto_Serif_TC'] text-xl font-semibold text-app-text">編輯食譜</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本資訊 */}
          <section className="space-y-4 rounded-2xl border border-app-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-app-muted">基本資訊</h3>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-app-muted">食譜名稱 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded-lg border border-app-border px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-app-muted">食譜描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="resize-none rounded-lg border border-app-border px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-app-muted">料理類型</label>
                <select
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="rounded-lg border border-app-border px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none"
                >
                  <option value="">未分類</option>
                  {CUISINES.map((c) => (
                    <option key={c} value={c}>{CUISINE_LABELS[c] ?? c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-app-muted">難度</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="rounded-lg border border-app-border px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>{DIFFICULTY_LABELS[d] ?? d}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-app-muted">烹飪時間（分鐘）</label>
                <input
                  type="number"
                  min="1"
                  value={cookingTime}
                  onChange={(e) => setCookingTime(e.target.value)}
                  className="rounded-lg border border-app-border px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-app-muted">份數</label>
                <input
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="rounded-lg border border-app-border px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
                />
              </div>
            </div>
          </section>

          {/* 食材 */}
          <section className="space-y-3 rounded-2xl border border-app-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-app-muted">食材清單</h3>

            <div className="space-y-3">
              {ingredients.map((row, i) => (
                <div key={row.id} className="rounded-xl border border-app-border bg-app-surface/50 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-center text-xs text-app-muted">{i + 1}</span>
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateIngredientRow(row.id, "name", e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleIngredientEnter(row); } }}
                      placeholder="食材名稱"
                      className="min-w-0 flex-1 rounded-lg border border-app-border bg-white px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
                    />
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={row.quantity}
                      onChange={(e) => updateIngredientRow(row.id, "quantity", e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleIngredientEnter(row); } }}
                      placeholder="數量"
                      className="w-20 rounded-lg border border-app-border bg-white px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
                    />
                    <input
                      type="text"
                      value={row.unit}
                      onChange={(e) => updateIngredientRow(row.id, "unit", e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleIngredientEnter(row); } }}
                      placeholder="單位"
                      className="w-16 rounded-lg border border-app-border bg-white px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredientRow(row.id)}
                      disabled={ingredients.length === 1}
                      className="shrink-0 text-app-muted hover:text-app-danger transition disabled:opacity-30"
                      aria-label="移除食材"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pl-7">
                    <span className="text-xs text-app-muted shrink-0">過敏原：</span>
                    {ALLERGEN_OPTIONS.map((a) => {
                      const active = row.allergens.includes(a);
                      return (
                        <button
                          key={a}
                          type="button"
                          onClick={() => toggleAllergen(row.id, a)}
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${
                            active
                              ? "border-red-200 bg-red-50 text-app-danger"
                              : "border-app-border bg-white text-app-muted hover:border-red-200 hover:text-app-danger"
                          }`}
                        >
                          {active ? `✕ ${a}` : a}
                        </button>
                      );
                    })}
                    {row.allergens
                      .filter((a) => !(ALLERGEN_OPTIONS as readonly string[]).includes(a))
                      .map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-app-danger"
                        >
                          {a}
                          <button type="button" onClick={() => toggleAllergen(row.id, a)} className="hover:text-red-700 transition">✕</button>
                        </span>
                      ))}
                    {showCustomInput[row.id] ? (
                      <input
                        autoFocus
                        type="text"
                        value={customInputs[row.id] ?? ""}
                        onChange={(e) => setCustomInputs((prev) => ({ ...prev, [row.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); addCustomAllergen(row.id); }
                          if (e.key === "Escape") setShowCustomInput((prev) => ({ ...prev, [row.id]: false }));
                        }}
                        onBlur={() => addCustomAllergen(row.id)}
                        placeholder="輸入後按 Enter"
                        className="w-28 rounded-full border border-app-border px-2.5 py-0.5 text-xs text-app-text focus:border-app-primary focus:outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowCustomInput((prev) => ({ ...prev, [row.id]: true }))}
                        className="rounded-full border border-dashed border-app-border px-2.5 py-0.5 text-xs text-app-muted hover:border-app-primary hover:text-app-primary transition"
                      >
                        + 新增
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleAutoDetect(row.id, row.name)}
                      disabled={autoDetecting[row.id] || !row.name.trim()}
                      className="ml-1 rounded-full border border-app-primary px-2.5 py-0.5 text-xs font-medium text-app-primary hover:bg-app-primary hover:text-white transition disabled:opacity-40"
                    >
                      {autoDetecting[row.id] ? "偵測中…" : "自動偵測"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addIngredientRow}
              className="flex items-center gap-1.5 text-sm text-app-primary hover:text-app-primary-hover transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="4" x2="12" y2="20" /><line x1="4" y1="12" x2="20" y2="12" />
              </svg>
              新增食材
            </button>
            <button
              type="button"
              onClick={() => void handleBatchAutoDetect()}
              disabled={batchDetecting}
              className="flex items-center gap-1.5 text-sm text-app-muted hover:text-app-primary transition disabled:opacity-40"
            >
              <span>{batchDetecting ? "偵測中…" : "🔍 一鍵偵測所有過敏原"}</span>
            </button>
          </section>

          {/* 步驟 */}
          <section className="space-y-3 rounded-2xl border border-app-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-app-muted">烹飪步驟</h3>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={6}
              className="w-full resize-none rounded-lg border border-app-border px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
            />
          </section>

          <div className="flex gap-3 pb-8">
            <button
              type="button"
              onClick={() => navigate(`/recipes/${recipeId}`)}
              className="flex-1 rounded-xl border border-app-border py-2.5 text-sm text-app-muted hover:bg-app-surface transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!title.trim() || updateRecipe.isPending}
              className="flex-1 rounded-xl bg-app-primary py-2.5 text-sm font-medium text-white hover:bg-app-primary-hover transition disabled:opacity-50"
            >
              {updateRecipe.isPending ? "儲存中…" : "儲存變更"}
            </button>
          </div>
        </form>
      </motion.div>
    </Layout>
  );
}
