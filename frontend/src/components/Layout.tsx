import { useState } from "react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useShoppingList } from "../hooks/useShoppingList";
import logoUrl from "../assets/logo.png";

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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-bg">
      <header
        className="sticky top-0 z-50 border-b border-app-border bg-app-header-bg shadow-sm"
      >
        {/* Title row */}
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:min-h-[64px]">
          <h1 className="flex items-center gap-2 font-['Noto_Serif_TC'] text-xl font-bold tracking-tight text-app-header-text">
            <img
              src={logoUrl}
              alt=""
              aria-hidden="true"
              className="h-8 w-8 rounded-md bg-app-header-cta object-cover ring-1 ring-app-header-accent"
            />
            冰箱食譜推薦
          </h1>

          {/* Desktop: right-side actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {showStats && (
              <span className="hidden text-sm text-app-header-inactive sm:inline">
                <strong className="text-app-header-text">{totalCount}</strong> 件食材
              </span>
            )}
            {headerRight && <div className="hidden sm:contents">{headerRight}</div>}
            {onAddClick && (
              <button
                type="button"
                onClick={onAddClick}
                className="rounded-lg border border-app-header-accent bg-app-header-cta px-3 py-1.5 text-xs font-medium text-app-primary shadow-sm transition hover:bg-app-header-cta-hover hover:text-app-header-cta-text-hover focus:outline-none focus:ring-2 focus:ring-app-header-accent focus:ring-offset-2 focus:ring-offset-app-header-bg sm:px-4 sm:text-sm"
              >
                新增食材
              </button>
            )}
          </div>

          {/* Mobile: hamburger button */}
          <button
            type="button"
            className="relative rounded p-1.5 text-app-header-inactive transition hover:bg-app-header-accent/15 hover:text-app-header-text sm:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "關閉選單" : "開啟選單"}
            aria-expanded={menuOpen}
          >
            {uncheckedCount > 0 && !menuOpen && (
              <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-app-warning" />
            )}
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="block w-5 text-center text-base leading-none"
                >
                  ✕
                </motion.span>
              ) : (
                <motion.span
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="block w-5 text-center text-base leading-none"
                >
                  ☰
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Desktop nav */}
        <nav className="mx-auto hidden max-w-5xl px-4 sm:block">
          <ul className="flex gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `inline-block rounded-t-lg border-b-2 px-2 py-2 text-xs sm:px-4 sm:text-sm font-medium transition ${
                      isActive
                        ? "border-app-header-accent text-app-header-text"
                        : "border-transparent text-app-header-inactive hover:border-app-header-accent/70 hover:text-app-header-text"
                    }`
                  }
                >
                  {item.label}
                  {item.to === "/shopping-list" && uncheckedCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-app-warning px-1.5 py-0.5 text-xs leading-none text-white">
                      {uncheckedCount}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile nav — 和式漢堡選單 */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="overflow-hidden border-t border-app-border bg-app-header-bg sm:hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            >
              <nav>
                <ul>
                  {navItems.map((item, i) => (
                    <motion.li
                      key={item.to}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.18 }}
                      className="border-b border-app-header-accent/25 last:border-none"
                    >
                      <NavLink
                        to={item.to}
                        end={item.to === "/"}
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-6 py-4 text-sm font-medium transition ${
                            isActive
                              ? "text-app-header-text"
                              : "text-app-header-inactive hover:text-app-header-text"
                          }`
                        }
                      >
                        {({ isActive }: { isActive: boolean }) => (
                          <>
                            <span className="flex items-center gap-3">
                              <span
                                className={`h-1.5 w-1.5 rounded-full transition ${
                                  isActive ? "bg-app-header-accent" : "bg-app-header-inactive/40"
                                }`}
                              />
                              {item.label}
                            </span>
                            {item.to === "/shopping-list" && uncheckedCount > 0 && (
                              <span className="inline-flex items-center justify-center rounded-full bg-app-warning px-1.5 py-0.5 text-xs leading-none text-white">
                                {uncheckedCount}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </motion.li>
                  ))}
                </ul>

              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Stats bar */}
      {showStats && (
        <section className="border-b border-app-border bg-app-bg">
          <div className="mx-auto grid max-w-5xl grid-cols-3 gap-2 px-4 py-3 sm:gap-4 sm:py-4">
            {[
              { label: "總計",     value: totalCount,      cls: "text-app-primary", lCls: "text-app-muted",   tint: "bg-app-surface/70" },
              { label: "即將到期", value: nearExpiryCount,  cls: "text-app-warning", lCls: "text-app-warning", tint: "bg-amber-50/80" },
              { label: "已過期",   value: expiredCount,     cls: "text-app-danger",  lCls: "text-app-danger",  tint: "bg-red-50/80" },
            ].map(({ label, value, cls, lCls, tint }) => (
              <div
                key={label}
                className={`flex flex-col rounded-xl border border-app-border p-2 text-center shadow-sm sm:p-3 sm:text-left ${tint}`}
              >
                <p className={`order-2 sm:order-1 mt-1 sm:mt-0 text-xs font-medium sm:uppercase sm:tracking-wide ${lCls}`}>{label}</p>
                <p className={`order-1 sm:order-2 text-2xl font-bold sm:font-semibold leading-none ${cls}`}>{value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

      <footer className="border-t border-app-border py-6 text-center text-xs text-app-muted">
        冰箱食譜推薦
      </footer>
    </div>
  );
}
