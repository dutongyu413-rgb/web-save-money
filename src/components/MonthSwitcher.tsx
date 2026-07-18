import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { currentMonth, monthLabel, shiftMonth } from "../domain/date";

export function MonthSwitcher({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  const latest = currentMonth();
  const isCurrent = month === latest;
  return (
    <div className="month-switcher" aria-label="月份切换">
      <button type="button" onClick={() => onChange(shiftMonth(month, -1))} aria-label="上个月">
        <CaretLeft weight="bold" />
      </button>
      <strong>{monthLabel(month)}</strong>
      <div className="month-right">
        <button
          type="button"
          onClick={() => onChange(shiftMonth(month, 1))}
          disabled={isCurrent}
          aria-label="下个月"
        >
          <CaretRight weight="bold" />
        </button>
        <button
          type="button"
          className={`back-current ${isCurrent ? "hidden" : ""}`}
          onClick={() => onChange(latest)}
          tabIndex={isCurrent ? -1 : 0}
        >
          回到本月
        </button>
      </div>
    </div>
  );
}
