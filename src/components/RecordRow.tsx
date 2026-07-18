import { ArrowDownLeft, Minus, Plus } from "@phosphor-icons/react";
import { formatRecordDate } from "../domain/date";
import { formatMoney } from "../domain/money";

export function RecordRow({ type, amountCents, occurredOn, note, onClick }: {
  type: "income" | "savings";
  amountCents: number;
  occurredOn: string;
  note: string;
  onClick: () => void;
}) {
  const isIncome = type === "income";
  const isAdd = amountCents >= 0;
  const label = isIncome ? "收入" : isAdd ? "增加储蓄" : "取用储蓄";
  const Icon = isIncome ? ArrowDownLeft : isAdd ? Plus : Minus;
  return (
    <button type="button" className="record-row" onClick={onClick}>
      <span className={`record-icon ${isIncome ? "blue" : isAdd ? "orange" : "neutral"}`}>
        <Icon weight="bold" />
      </span>
      <span className="record-copy">
        <strong>{label}</strong>
        <small>{formatRecordDate(occurredOn)}{note ? ` · ${note}` : ""}</small>
      </span>
      <strong className={`record-value ${isIncome ? "blue-text" : isAdd ? "orange-text" : ""}`}>
        {formatMoney(amountCents, !isIncome)}
      </strong>
    </button>
  );
}
