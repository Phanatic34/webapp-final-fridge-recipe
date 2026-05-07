import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

type Props = {
  children: ReactNode;
  totalCount?: number;
  nearExpiryCount?: number;
  expiredCount?: number;
  onAddClick?: () => void;
  headerRight?: ReactNode;
};

const navItems = [
  { to: "/", label: "我的冰箱" },
  { to: "/recipes", label: "食譜" },
  { to: "/favorites", label: "收藏" },
] as const;

export function Layout({
  children,
  totalCount,
  nearExpiryCount,
  expiredCount,
  onAddClick,
  headerRight,
}: Props) {
  const showStats =
    totalCount !== undefined &&
    nearExpiryCount !== undefined &&
    expiredCount !== undefined;

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <header className="bg-[#1B2E22] shadow-md">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-['Noto_Serif_TC'] text-xl font-bold tracking-tight text-white">
              冰箱食譜推薦
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {showStats && (
              <span className="text-sm text-white/80">
                <strong className="text-white">{totalCount}</strong> 件食材
              </span>
            )}
            {headerRight}
            {onAddClick && (
              <button
                type="button"
                onClick={onAddClick}
                className="rounded-lg bg-[#C4622D] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#b3561f] focus:outline-none focus:ring-2 focus:ring-[#C4622D] focus:ring-offset-2 focus:ring-offset-[#1B2E22]"
              >
                新增食材
              </button>
            )}
          </div>
        </div>

        <nav className="mx-auto max-w-5xl px-4">
          <ul className="flex gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `inline-block rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "border-[#C4622D] text-[#C4622D]"
                        : "border-transparent text-white/70 hover:border-white/30 hover:text-white"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {showStats && (
        <section className="border-b border-[#E5E7EB] bg-[#FAFAF7]">
          <div className="mx-auto grid max-w-5xl gap-4 px-4 py-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-[#E5E7EB]">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                總計
              </p>
              <p className="text-2xl font-semibold text-[#1B2E22]">
                {totalCount}
              </p>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-amber-100">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
                即將到期
              </p>
              <p className="text-2xl font-semibold text-amber-900">
                {nearExpiryCount}
              </p>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-red-100">
              <p className="text-xs font-medium uppercase tracking-wide text-red-800">
                已過期
              </p>
              <p className="text-2xl font-semibold text-red-900">
                {expiredCount}
              </p>
            </div>
          </div>
        </section>
      )}

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

      <footer className="border-t border-[#E5E7EB] bg-[#FAFAF7] py-6 text-center text-xs text-[#6B7280]">
        冰箱食譜推薦
      </footer>
    </div>
  );
}
