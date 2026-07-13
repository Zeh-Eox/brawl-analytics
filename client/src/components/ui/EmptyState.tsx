import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

/**
 * État vide réutilisable : icône, titre, message, action optionnelle.
 * Uniformise les écrans « pas encore de données » de l'app.
 */
export function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  message?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "anim-in flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface/30 px-6 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-line bg-surface-2 text-dim">
          {icon}
        </div>
      )}
      <div className="display text-lg text-white">{title}</div>
      {message && (
        <p className="mx-auto mt-2 max-w-sm text-sm text-text-2">{message}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
