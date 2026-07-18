import { useEffect, useRef, type KeyboardEvent } from "react";

const MIN_RATE = 1;
const MAX_RATE = 100;
const ITEM_HEIGHT = 44;
const rates = Array.from({ length: MAX_RATE }, (_, index) => index + MIN_RATE);

export function PercentageWheel({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const animationFrame = useRef<number | null>(null);
  const currentValue = useRef(value);
  currentValue.current = value;

  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;
    wheel.scrollTop = (value - MIN_RATE) * ITEM_HEIGHT;
    return () => {
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    };
  }, []);

  function selectRate(nextValue: number, smooth = false) {
    const clamped = Math.max(MIN_RATE, Math.min(MAX_RATE, nextValue));
    currentValue.current = clamped;
    onChange(clamped);
    const wheel = wheelRef.current;
    if (!wheel) return;
    const top = (clamped - MIN_RATE) * ITEM_HEIGHT;
    if (smooth && typeof wheel.scrollTo === "function") wheel.scrollTo({ top, behavior: "smooth" });
    else wheel.scrollTop = top;
  }

  function handleScroll() {
    if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    animationFrame.current = requestAnimationFrame(() => {
      const wheel = wheelRef.current;
      if (!wheel) return;
      const nextValue = Math.max(MIN_RATE, Math.min(MAX_RATE, Math.round(wheel.scrollTop / ITEM_HEIGHT) + MIN_RATE));
      if (nextValue !== currentValue.current) {
        currentValue.current = nextValue;
        onChange(nextValue);
      }
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      selectRate(value - 1, true);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      selectRate(value + 1, true);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectRate(MIN_RATE, true);
    } else if (event.key === "End") {
      event.preventDefault();
      selectRate(MAX_RATE, true);
    }
  }

  return (
    <div className="rate-wheel-shell">
      <div className="rate-wheel-selection" aria-hidden="true" />
      <div
        ref={wheelRef}
        className="rate-wheel"
        role="listbox"
        tabIndex={0}
        aria-label="目标储蓄率"
        aria-activedescendant={`target-rate-${value}`}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
      >
        <div className="rate-wheel-spacer" aria-hidden="true" />
        {rates.map(rate => (
          <button
            id={`target-rate-${rate}`}
            className={`rate-wheel-option${rate === value ? " selected" : ""}`}
            type="button"
            role="option"
            aria-selected={rate === value}
            key={rate}
            onClick={() => selectRate(rate, true)}
          >
            <span>{rate}</span><small>%</small>
          </button>
        ))}
        <div className="rate-wheel-spacer" aria-hidden="true" />
      </div>
    </div>
  );
}
