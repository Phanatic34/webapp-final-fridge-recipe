import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Layout } from "../components/Layout";
import { useCreateRecipe } from "../hooks/useRecipes";
import { CUISINE_LABELS, DIFFICULTY_LABELS } from "../utils/labels";

type IngredientRow = { id: number; name: string; quantity: string; unit: string };

const CUISINES = ["taiwanese", "chinese", "japanese", "korean", "italian", "american", "thai", "other"] as const;
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

let nextId = 1;

export default function RecipeCreatePage() {
  const navigate = useNavigate();
  const createRecipe = useCreateRecipe();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [servings, setServings] = useState("2");
  const [difficulty, setDifficulty] = useState("medium");
  const [instructions, setInstructions] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { id: nextId++, name: "", quantity: "", unit: "" },
  ]);

  function addIngredientRow() {
    setIngredients((prev) => [...prev, { id: nextId++, name: "", quantity: "", unit: "" }]);
  }

  function removeIngredientRow(id: number) {
    setIngredients((prev) => prev.filter((r) => r.id !== id));
  }

  function updateIngredientRow(id: number, field: keyof Omit<IngredientRow, "id">, value: string) {
    setIngredients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
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
      }));

    createRecipe.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        cuisine: cuisine || undefined,
        cooking_time: cookingTime ? parseInt(cookingTime) || null : null,
        servings: servings ? parseInt(servings) || 2 : 2,
        difficulty,
        instructions: instructions.trim() || undefined,
        ingredients: validIngredients,
      },
      {
        onSuccess: (recipe) => {
          toast.success("食譜已建立");
          navigate(`/recipes/${recipe.id}`);
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "建立失敗"),
      }
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
            onClick={() => navigate(-1)}
            className="rounded-lg p-1.5 text-app-muted hover:bg-app-surface hover:text-app-text transition"
            aria-label="返回"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="font-['Noto_Serif_TC'] text-xl font-semibold text-app-text">建立食譜</h2>
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
                placeholder="例：番茄炒蛋"
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
                placeholder="簡短描述這道菜…"
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
                  placeholder="30"
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
                  placeholder="2"
                  className="rounded-lg border border-app-border px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
                />
              </div>
            </div>
          </section>

          {/* 食材 */}
          <section className="space-y-3 rounded-2xl border border-app-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-app-muted">食材清單</h3>

            <div className="space-y-2">
              {ingredients.map((row, i) => (
                <div key={row.id} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-center text-xs text-app-muted">{i + 1}</span>
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateIngredientRow(row.id, "name", e.target.value)}
                    placeholder="食材名稱"
                    className="min-w-0 flex-1 rounded-lg border border-app-border px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
                  />
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={row.quantity}
                    onChange={(e) => updateIngredientRow(row.id, "quantity", e.target.value)}
                    placeholder="數量"
                    className="w-20 rounded-lg border border-app-border px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
                  />
                  <input
                    type="text"
                    value={row.unit}
                    onChange={(e) => updateIngredientRow(row.id, "unit", e.target.value)}
                    placeholder="單位"
                    className="w-16 rounded-lg border border-app-border px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
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
          </section>

          {/* 步驟 */}
          <section className="space-y-3 rounded-2xl border border-app-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-app-muted">烹飪步驟</h3>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={6}
              placeholder={"1. 將番茄切丁。\n2. 打散雞蛋加少許鹽。\n3. 熱鍋下油，炒熟雞蛋後盛起。\n4. 下番茄炒至出汁，加糖調味。\n5. 放回雞蛋拌勻即可。"}
              className="w-full resize-none rounded-lg border border-app-border px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
            />
          </section>

          {/* 送出 */}
          <div className="flex gap-3 pb-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 rounded-xl border border-app-border py-2.5 text-sm text-app-muted hover:bg-app-surface transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!title.trim() || createRecipe.isPending}
              className="flex-1 rounded-xl bg-app-primary py-2.5 text-sm font-medium text-white hover:bg-app-primary-hover transition disabled:opacity-50"
            >
              {createRecipe.isPending ? "建立中…" : "建立食譜"}
            </button>
          </div>
        </form>
      </motion.div>
    </Layout>
  );
}
