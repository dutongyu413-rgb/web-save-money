import { useEffect, useState, type ReactNode } from "react";

export function Sheet({ open, onClose, children, dismissible = true }: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  dismissible?: boolean;
}) {
  const [viewport, setViewport] = useState<{ height: number; offsetTop: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (dismissible && event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [dismissible, onClose, open]);

  useEffect(() => {
    if (!open) {
      setViewport(null);
      return;
    }

    const visualViewport = window.visualViewport;
    const updateViewport = () => {
      setViewport({
        height: visualViewport?.height ?? window.innerHeight,
        offsetTop: visualViewport?.offsetTop ?? 0,
      });
    };

    updateViewport();
    visualViewport?.addEventListener("resize", updateViewport);
    visualViewport?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);

    return () => {
      visualViewport?.removeEventListener("resize", updateViewport);
      visualViewport?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="sheet-backdrop"
      onMouseDown={dismissible ? onClose : undefined}
      role="presentation"
      style={viewport ? { top: viewport.offsetTop, bottom: "auto", height: viewport.height } : undefined}
    >
      <section className="sheet" role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        {children}
      </section>
    </div>
  );
}
