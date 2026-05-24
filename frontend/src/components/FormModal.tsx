import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  fabOrigin?: boolean;
};

const overlayVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1 },
  exit:   { opacity: 0 },
};

const panelVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  show:   { opacity: 1, scale: 1,    y: 0,
             transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
  exit:   { opacity: 0, scale: 0.95, y: 16,
             transition: { duration: 0.35 } },
};

const fabPanelVariants = {
  hidden: { opacity: 0, scale: 0 },
  show:   { opacity: 1, scale: 1,
             transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
  exit:   { opacity: 0, scale: 0,
             transition: { duration: 0.25 } },
};

export function FormModal({ open, title, children, onClose, fabOrigin }: Props) {
  const fromFab =
    !!fabOrigin &&
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 639px)").matches;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="form-modal-title"
          variants={overlayVariants}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          <motion.button
            type="button"
            className="absolute inset-0"
            style={{ background: "rgba(15,23,42,0.35)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            onClick={onClose}
            aria-label="關閉"
          />

          {/* Panel */}
          <motion.div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-app-border bg-white p-6 shadow-soft-hover"
            style={{
              ...(fromFab ? { transformOrigin: "bottom right" } : {}),
            }}
            variants={fromFab ? fabPanelVariants : panelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <h2 id="form-modal-title" className="font-['Noto_Serif_TC'] text-lg font-semibold text-app-text">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-app-muted transition hover:bg-app-surface hover:text-app-text"
                aria-label="關閉"
              >
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
