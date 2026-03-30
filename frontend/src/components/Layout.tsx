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
  { to: "/", label: "My Fridge" },
  { to: "/recipes", label: "Recipes" },
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
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Fridge Recipe Recommender
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {showStats && (
              <span className="text-sm text-slate-600">
                <strong className="text-slate-900">{totalCount}</strong> items
              </span>
            )}
            {headerRight}
            {onAddClick && (
              <button
                type="button"
                onClick={onAddClick}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Add ingredient
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
                        ? "border-emerald-600 text-emerald-700"
                        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
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
        <section className="border-b border-slate-100 bg-slate-50/80">
          <div className="mx-auto grid max-w-5xl gap-3 px-4 py-4 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total
              </p>
              <p className="text-2xl font-semibold text-slate-900">
                {totalCount}
              </p>
            </div>
            <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-amber-100">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
                Near expiry
              </p>
              <p className="text-2xl font-semibold text-amber-900">
                {nearExpiryCount}
              </p>
            </div>
            <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-red-100">
              <p className="text-xs font-medium uppercase tracking-wide text-red-800">
                Expired
              </p>
              <p className="text-2xl font-semibold text-red-900">
                {expiredCount}
              </p>
            </div>
          </div>
        </section>
      )}

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        Fridge Recipe Recommender
      </footer>
    </div>
  );
}
