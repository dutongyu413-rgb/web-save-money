import { describe, expect, it } from "vitest";
import { calculateStats, calculateYear } from "./calculations";
import type { IncomeRecord, SavingsRecord } from "./models";

const base = { id: "id", note: "", createdAt: "2026-07-17T00:00:00.000Z", updatedAt: "2026-07-17T00:00:00.000Z" };

function income(amountCents: number, occurredOn = "2026-07-05"): IncomeRecord {
  return { ...base, id: crypto.randomUUID(), amountCents, occurredOn };
}

function saving(amountCents: number, occurredOn = "2026-07-05"): SavingsRecord {
  return { ...base, id: crypto.randomUUID(), amountCents, occurredOn };
}

describe("calculateStats", () => {
  it("calculates income, savings, rate, target and inferred expense", () => {
    const result = calculateStats([income(1_000_000)], [saving(300_000)], "2026-07", 30);
    expect(result).toMatchObject({
      incomeCents: 1_000_000,
      savingsCents: 300_000,
      expenseCents: 700_000,
      savingsRate: 30,
      targetCents: 300_000,
      targetGapCents: 0,
      achieved: true,
    });
  });

  it("returns a null rate when income is zero and keeps negative expense", () => {
    const result = calculateStats([], [saving(50_000)], "2026-07", 30);
    expect(result.savingsRate).toBeNull();
    expect(result.expenseCents).toBe(-50_000);
    expect(result.achieved).toBeNull();
  });

  it("allows negative savings and a negative savings rate", () => {
    const result = calculateStats([income(100_000)], [saving(-20_000)], "2026-07", 30);
    expect(result.savingsRate).toBe(-20);
    expect(result.expenseCents).toBe(120_000);
  });
});

describe("calculateYear", () => {
  it("uses annual totals instead of averaging monthly rates", () => {
    const result = calculateYear(
      [income(100_000, "2026-01-05"), income(900_000, "2026-02-05")],
      [saving(50_000, "2026-01-05"), saving(90_000, "2026-02-05")],
      2026,
      30,
    );
    expect(result.savingsRate).toBeCloseTo(14);
  });
});
