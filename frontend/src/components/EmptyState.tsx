type Props = {
  onAdd: () => void;
};

export function EmptyState({ onAdd }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E5E7EB] bg-[#FAFAF7] px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-[#F3EDE4] p-4 text-4xl" aria-hidden>
        🧊
      </div>
      <h2 className="text-lg font-semibold text-[#1B2E22]">
        冰箱是空的
      </h2>
      <p className="mt-2 max-w-sm text-sm text-[#6B7280]">
        新增食材來追蹤庫存、到期日，以及優先使用的食材。
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-6 rounded-lg bg-[#C4622D] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#b3561f] focus:outline-none focus:ring-2 focus:ring-[#C4622D] focus:ring-offset-2"
      >
        新增第一項食材
      </button>
    </div>
  );
}
