import { useEffect, useRef, useState, type ReactNode } from "react";

type SheetViewport = { height: number; offsetTop: number };

export function fitSheetViewport(viewportHeight: number, offsetTop: number, containerHeight: number): SheetViewport {
  const safeContainerHeight = Math.max(0, containerHeight);
  const safeOffsetTop = Math.max(0, Math.min(offsetTop, safeContainerHeight));

  return {
    height: Math.max(0, Math.min(viewportHeight, safeContainerHeight - safeOffsetTop)),
    offsetTop: safeOffsetTop,
  };
}

export function Sheet({ open, onClose, children, dismissible = true, className = "" }: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  dismissible?: boolean;
  className?: string;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<SheetViewport | null>(null);

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
      // 直接以最外层手机画布为准。部分 Chrome 版本会把百分比高度按浏览器视口
      // 计算，如果只读取当前页面高度，弹层底部可能超出手机画布并被裁掉。
      const appShell = backdropRef.current?.closest<HTMLElement>(".app-shell");
      const containerHeight = appShell?.clientHeight
        || backdropRef.current?.parentElement?.clientHeight
        || window.innerHeight;
      setViewport(fitSheetViewport(
        visualViewport?.height ?? window.innerHeight,
        visualViewport?.offsetTop ?? 0,
        containerHeight,
      ));
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
      ref={backdropRef}
      className="sheet-backdrop"
      onMouseDown={dismissible ? onClose : undefined}
      role="presentation"
      style={viewport ? { top: viewport.offsetTop, bottom: "auto", height: viewport.height } : undefined}
    >
      <section className={`sheet ${className}`.trim()} role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        {children}
      </section>
    </div>
  );
}
