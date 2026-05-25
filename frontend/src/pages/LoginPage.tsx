import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { login } from "../api/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, user } = await login(email, password);
      authLogin(token, user);
      navigate("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "登入失敗");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-bg flex min-h-screen items-center justify-center p-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
      >
        <div className="rounded-2xl border border-app-border bg-white p-8 shadow-soft-hover">
          <h1 className="mb-1 font-['Noto_Serif_TC'] text-2xl font-bold text-app-text">登入</h1>
          <p className="mb-6 text-sm text-app-muted">冰箱食譜推薦</p>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-app-muted">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="rounded-lg border border-app-border px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-app-muted">密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-lg border border-app-border px-3 py-2 text-sm text-app-text focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-app-primary py-2.5 text-sm font-medium text-white hover:bg-app-primary-hover transition disabled:opacity-50"
            >
              {loading ? "登入中…" : "登入"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-app-muted">
            還沒有帳號？{" "}
            <Link to="/register" className="font-medium text-app-primary hover:underline">
              立即註冊
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
