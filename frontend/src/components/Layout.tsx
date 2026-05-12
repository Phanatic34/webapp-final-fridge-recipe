import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useShoppingList } from "../hooks/useShoppingList";

type Props = {
  children: ReactNode;
  totalCount?: number;
  nearExpiryCount?: number;
  expiredCount?: number;
  onAddClick?: () => void;
  headerRight?: ReactNode;
};

const navItems = [
  { to: "/",              label: "我的冰箱" },
  { to: "/recipes",       label: "食譜" },
  { to: "/favorites",     label: "收藏" },
  { to: "/shopping-list", label: "購物清單" },
  { to: "/settings",      label: "設定" },
] as const;

export function Layout({
  children,
  totalCount,
  nearExpiryCount,
  expiredCount,
  onAddClick,
  headerRight,
}: Props) {
  const { data: shoppingList } = useShoppingList();
  const uncheckedCount = shoppingList?.filter((i) => !i.is_checked).length ?? 0;
  const showStats =
    totalCount !== undefined &&
    nearExpiryCount !== undefined &&
    expiredCount !== undefined;

  return (
    <div className="app-bg">
      {/* 毛玻璃 Header */}
      <header
        className="sticky top-0 z-50 border-b border-white/10 shadow-md"
        style={{
          background: "rgba(27,46,34,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
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
                className="rounded-lg bg-[#C4622D] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#C4622D]/30 hover:bg-[#b3561f] transition focus:outline-none focus:ring-2 focus:ring-[#C4622D] focus:ring-offset-2 focus:ring-offset-[#1B2E22]"
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
                    `inline-block rounded-t-lg border-b-2 px-2 py-2 text-xs sm:px-4 sm:text-sm font-medium transition ${
                      isActive
                        ? "border-[#C4622D] text-[#C4622D]"
                        : "border-transparent text-white/70 hover:border-white/30 hover:text-white"
                    }`
                  }
                >
                  {item.label}
                  {item.to === "/shopping-list" && uncheckedCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white leading-none">
                      {uncheckedCount}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Stats bar */}
      {showStats && (
        <section className="border-b border-white/20">
          <div className="mx-auto grid max-w-5xl gap-4 px-4 py-4 sm:grid-cols-3">
            {[
              { label: "總計",     value: totalCount,      cls: "text-[#1B2E22]",   lCls: "text-[#6B7280]" },
              { label: "即將到期", value: nearExpiryCount,  cls: "text-amber-900",   lCls: "text-amber-800" },
              { label: "已過期",   value: expiredCount,     cls: "text-red-900",     lCls: "text-red-800" },
            ].map(({ label, value, cls, lCls }) => (
              <div
                key={label}
                className="rounded-xl p-3 shadow-glass"
                style={{ background: "rgba(255,255,255,0.52)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.72)" }}
              >
                <p className={`text-xs font-medium uppercase tracking-wide ${lCls}`}>{label}</p>
                <p className={`text-2xl font-semibold ${cls}`}>{value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

      <footer className="border-t border-white/20 py-6 text-center text-xs text-[#6B7280]">
        冰箱食譜推薦
      </footer>
    </div>
  );
}
