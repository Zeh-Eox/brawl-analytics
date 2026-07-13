import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../utils/cn";

/**
 * Panneau overlay : bottom-sheet sur mobile, modale centrée sur desktop.
 */
const SIZE = {
  md: "sm:max-w-md",
  lg: "sm:max-w-2xl",
} as const;

export function Sheet({
  open,
  onClose,
  children,
  className,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  size?: keyof typeof SIZE;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-ink/75 backdrop-blur-sm p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className={cn(
              "w-full max-h-[88vh] overflow-y-auto no-scrollbar bg-sheet border border-line-strong",
              "rounded-t-[26px] sm:rounded-[22px]",
              SIZE[size],
              "p-5 pb-8 sm:pb-5",
              className,
            )}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
