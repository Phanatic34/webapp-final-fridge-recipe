import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { updateMe } from "../api/auth";
import {
  useSettings,
  useUpdateEquipment,
  useAddExclusion,
  useRemoveExclusion,
} from "../hooks/useSettings";

export function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: settings, isLoading: settingsLoading } = useSettings();
  const updateEquipment = useUpdateEquipment();
  const addExclusion = useAddExclusion();
  const removeExclusion = useRemoveExclusion();
  const [customInput, setCustomInput] = useState("");

  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSavingName(true);
    try {
      const updated = await updateMe({ display_name: displayName });
      updateUser(updated);
      toast.success("顯示名稱已更新");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "更新失敗");
    } finally {
      setSavingName(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("新密碼與確認密碼不一致");
      return;
    }
    setSavingPassword(true);
    try {
      await updateMe({ current_password: currentPassword, new_password: newPassword });
      toast.success("密碼已更新");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "更新失敗");
    } finally {
      setSavingPassword(false);
    }
  }

  function handleLogout() {
    logout();
    queryClient.clear();
    navigate("/login");
  }

  function handleEquipmentToggle(name: string) {
    if (!settings) return;
    const current = new Set(settings.equipment);
    if (current.has(name)) current.delete(name);
    else current.add(name);
    updateEquipment.mutate([...current], { onError: () => toast.error("更新器具失敗") });
  }

  function handleAllergenToggle(name: string) {
    if (!settings) return;
    const isExcluded = settings.exclusions.some((e) => e.name === name);
    if (isExcluded) {
      removeExclusion.mutate(name, { onError: () => toast.error("移除失敗") });
    } else {
      addExclusion.mutate({ name, type: "allergen" }, { onError: () => toast.error("新增失敗") });
    }
  }

  function handleAddCustom() {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (trimmed.includes("/")) { toast.error("食材名稱不可包含斜線（/）"); return; }
    addExclusion.mutate(
      { name: trimmed, type: "custom" },
      { onSuccess: () => { setCustomInput(""); toast.success(`已排除「${trimmed}」`); }, onError: () => toast.error("新增失敗") }
    );
  }

  const inputCls =
    "w-full rounded-lg border border-app-border bg-white/60 px-3 py-2 text-sm text-app-primary placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-app-header-accent";

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-8 px-0 py-6">

        {/* Equipment Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0 }}
        >
          <h2 className="mb-1 text-lg font-semibold text-app-text">我的廚房器具</h2>
          <p className="mb-4 text-sm text-app-muted">
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
        <motion.section
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0.1 }}
        >
          <h2 className="mb-1 text-lg font-semibold text-app-text">不吃的食材</h2>
          <p className="mb-4 text-sm text-app-muted">含有以下食材的食譜將從推薦中排除。</p>

          <div className="mb-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-app-muted">常見過敏原</p>
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

          <div className="mb-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-app-muted">自訂排除食材</p>
            <div className="flex max-w-sm gap-2">
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

          {settings && settings.exclusions.filter((e) => e.type === "custom").length > 0 && (
            <div className="flex flex-wrap gap-2">
              {settings.exclusions.filter((e) => e.type === "custom").map((ex) => (
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

        <hr className="border-app-border" />

        {/* Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold text-app-text">帳號設定</h2>

          {/* Display name */}
          <div className="rounded-2xl border border-app-border bg-white/52 p-5 shadow-sm backdrop-blur-md">
            <h3 className="mb-3 text-sm font-semibold text-app-primary">顯示名稱</h3>
            <form onSubmit={handleSaveName} className="flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={user?.display_name}
                className={`${inputCls} flex-1`}
              />
              <button
                type="submit"
                disabled={savingName || !displayName.trim() || displayName.trim() === user?.display_name}
                className="shrink-0 rounded-lg border border-app-header-accent bg-app-header-cta px-4 py-2 text-sm font-medium text-app-primary shadow-sm transition hover:bg-app-header-cta-hover disabled:opacity-40"
              >
                {savingName ? "儲存中…" : "儲存"}
              </button>
            </form>
            <p className="mt-1.5 text-xs text-app-muted">電子信箱：{user?.email}</p>
          </div>

          {/* Change password */}
          <div className="rounded-2xl border border-app-border bg-white/52 p-5 shadow-sm backdrop-blur-md">
            <h3 className="mb-3 text-sm font-semibold text-app-primary">更改密碼</h3>
            <form onSubmit={handleSavePassword} className="space-y-2.5">
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="目前密碼" autoComplete="current-password" className={inputCls} />
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="新密碼（至少 6 個字元）" autoComplete="new-password" className={inputCls} />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="確認新密碼" autoComplete="new-password" className={inputCls} />
              <button
                type="submit"
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="rounded-lg border border-app-header-accent bg-app-header-cta px-4 py-2 text-sm font-medium text-app-primary shadow-sm transition hover:bg-app-header-cta-hover disabled:opacity-40"
              >
                {savingPassword ? "更新中…" : "更改密碼"}
              </button>
            </form>
          </div>
        </motion.div>

        <hr className="border-app-border" />

        {/* Logout */}
        <motion.section
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0.3 }}
        >
          <h2 className="mb-1 text-lg font-semibold text-app-text">登出帳號</h2>
          <p className="mb-4 text-sm text-app-muted">登出後需重新登入才能使用系統。</p>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-red-200 bg-white/80 px-4 py-2 text-sm font-medium text-app-danger transition hover:border-red-300 hover:bg-red-50"
          >
            登出
          </button>
        </motion.section>

      </div>
    </Layout>
  );
}
