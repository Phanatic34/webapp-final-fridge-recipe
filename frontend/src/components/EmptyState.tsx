type Props = {
  onAdd: () => void;
};

export function EmptyState({ onAdd }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-slate-100 p-4 text-4xl" aria-hidden>
        🧊
      </div>
      <h2 className="text-lg font-semibold text-slate-800">
        Your fridge is empty
      </h2>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        Add ingredients to track what you have, when they expire, and what to use
        first.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        Add your first ingredient
      </button>
    </div>
  );
}
