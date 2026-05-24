type Props = {
  onAdd: () => void;
};

export function EmptyState({ onAdd }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-app-border bg-white px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-app-surface p-4 text-4xl" aria-hidden>
        🧊
      </div>
      <h2 className="text-lg font-semibold text-app-text">
        冰箱是空的
      </h2>
      <p className="mt-2 max-w-sm text-sm text-app-muted">
        新增食材來追蹤庫存、到期日，以及優先使用的食材。
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-6 rounded-lg bg-app-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-app-primary-hover focus:outline-none focus:ring-2 focus:ring-app-primary focus:ring-offset-2"
      >
        新增第一項食材
      </button>
    </div>
  );
}
