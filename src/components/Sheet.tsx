import { useEffect, type ReactNode } from "react";

export function Sheet({ open, onClose, children, dismissible = true }: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  dismissible?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (dismissible && event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [dismissible, onClose, open]);

  if (!open) return null;
  return (
    <div className="sheet-backdrop" onMouseDown={dismissible ? onClose : undefined} role="presentation">
      <section className="sheet" role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        {children}
      </section>
    </div>
  );
}
