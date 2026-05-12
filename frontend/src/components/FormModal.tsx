import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
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

export function FormModal({ open, title, children, onClose }: Props) {
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
          {/* 毛玻璃遮罩 */}
          <motion.button
            type="button"
            className="absolute inset-0"
            style={{ background: "rgba(15,25,18,0.45)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            onClick={onClose}
            aria-label="關閉"
          />

          {/* Panel */}
          <motion.div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6 shadow-glass-hover"
            style={{
              background: "rgba(255,255,255,0.82)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.85)",
            }}
            variants={panelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <h2 id="form-modal-title" className="font-['Noto_Serif_TC'] text-lg font-semibold text-[#1B2E22]">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100/70 hover:text-slate-700 transition"
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
