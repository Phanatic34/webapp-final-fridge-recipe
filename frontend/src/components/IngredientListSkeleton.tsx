export function IngredientListSkeleton() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading">
      {[1, 2, 3, 4].map((i) => (
        <li
          key={i}
          className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="h-5 w-2/3 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-1/3 rounded bg-slate-100" />
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-16 rounded-full bg-slate-100" />
            <div className="h-6 w-24 rounded-full bg-slate-100" />
          </div>
          <div className="mt-4 h-9 w-full rounded-lg bg-slate-100" />
        </li>
      ))}
    </ul>
  );
}
