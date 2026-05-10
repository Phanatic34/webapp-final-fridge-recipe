function SkeletonCard() {
  return (
    <li
      className="flex flex-col rounded-2xl p-4 border border-white/70"
      style={{ background: "rgba(255,255,255,0.52)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      aria-hidden="true"
    >
      <div className="shimmer h-5 w-2/3 rounded-lg" />
      <div className="mt-3 shimmer h-4 w-1/3 rounded-lg" />
      <div className="mt-3 flex gap-2">
        <div className="shimmer h-6 w-16 rounded-full" />
        <div className="shimmer h-6 w-24 rounded-full" />
      </div>
      <div className="mt-4 shimmer h-9 w-full rounded-xl" />
    </li>
  );
}

export function IngredientListSkeleton() {
  return (
    <ul
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="載入中"
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </ul>
  );
}
