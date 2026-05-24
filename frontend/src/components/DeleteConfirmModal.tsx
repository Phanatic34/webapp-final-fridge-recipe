import { AnimatePresence, motion } from "framer-motion";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const panelVariants = {
  hidden: { opacity: 0, scale: 0.90, y: 20 },
  show:   { opacity: 1, scale: 1,    y: 0,
             transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
  exit:   { opacity: 0, scale: 0.94, y: 12,
             transition: { duration: 0.35 } },
};

export function DeleteConfirmModal({
  open, title, message, confirmLabel = "刪除", loading, onConfirm, onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            className="absolute inset-0"
            style={{ background: "rgba(23, 42, 33, 0.42)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            onClick={onCancel}
            aria-label="關閉"
          />
          <motion.div
            className="relative w-full max-w-md rounded-2xl border border-app-border bg-white p-6 shadow-soft-hover"
            variants={panelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <h2 id="delete-modal-title" className="text-lg font-semibold text-app-text">{title}</h2>
            <p className="mt-2 text-sm text-app-muted">{message}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-app-border bg-white px-4 py-2 text-sm font-medium text-app-text hover:bg-app-surface transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="rounded-lg bg-app-danger px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700 disabled:opacity-50 transition"
              >
                {loading ? "刪除中…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
