import type { IncomeRecord, SavingsRecord } from "./models";

type AmountRecord = Pick<IncomeRecord, "amountCents" | "occurredOn"> | Pick<SavingsRecord, "amountCents" | "occurredOn">;

export interface PeriodStats {
  incomeCents: number;
  savingsCents: number;
  expenseCents: number;
  savingsRate: number | null;
  targetCents: number;
  targetGapCents: number;
  achieved: boolean | null;
}

export function sumForMonth(records: AmountRecord[], month: string): number {
  return records.reduce((sum, record) => record.occurredOn.startsWith(month) ? sum + record.amountCents : sum, 0);
}

export function calculateStats(
  incomes: IncomeRecord[],
  savings: SavingsRecord[],
  month: string,
  targetRate: number,
): PeriodStats {
  const incomeCents = sumForMonth(incomes, month);
  const savingsCents = sumForMonth(savings, month);
  const targetCents = Math.round(incomeCents * targetRate / 100);
  return {
    incomeCents,
    savingsCents,
    expenseCents: incomeCents - savingsCents,
    savingsRate: incomeCents > 0 ? savingsCents / incomeCents * 100 : null,
    targetCents,
    targetGapCents: targetCents - savingsCents,
    achieved: incomeCents > 0 ? savingsCents >= targetCents : null,
  };
}

export function calculateYear(
  incomes: IncomeRecord[],
  savings: SavingsRecord[],
  year: number,
  targetRate: number,
) {
  const months = Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`);
  const monthly = months.map(month => ({ month, ...calculateStats(incomes, savings, month, targetRate) }));
  const incomeCents = monthly.reduce((sum, item) => sum + item.incomeCents, 0);
  const savingsCents = monthly.reduce((sum, item) => sum + item.savingsCents, 0);
  return {
    months: monthly,
    incomeCents,
    savingsCents,
    savingsRate: incomeCents > 0 ? savingsCents / incomeCents * 100 : null,
  };
}
