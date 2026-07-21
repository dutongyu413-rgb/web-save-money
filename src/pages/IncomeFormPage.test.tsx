import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IncomeFormPage } from "./IncomeFormPage";

const appData = vi.hoisted(() => ({
  current: {} as ReturnType<typeof createAppData>,
}));

vi.mock("../application/AppDataContext", () => ({
  useAppData: () => appData.current,
}));

vi.mock("../analytics/umami", () => ({
  trackEvent: vi.fn(),
}));

function createAppData() {
  const data = {
    settings: { id: "app" as const, schemaVersion: 1, targetSavingsRate: 20, currency: "CNY" as const, createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z" },
    incomes: [] as Array<{ id: string; amountCents: number; occurredOn: string; note: string; createdAt: string; updatedAt: string }>,
    savings: [],
  };

  return {
    data,
    selectedMonth: "2026-07",
    setSelectedMonth: vi.fn(),
    saveIncome: vi.fn(async (draft: { amountCents: number; occurredOn: string; note: string }) => {
      data.incomes.push({ id: "income-test", ...draft, createdAt: "2026-07-21T00:00:00.000Z", updatedAt: "2026-07-21T00:00:00.000Z" });
    }),
    removeIncome: vi.fn().mockResolvedValue(undefined),
  };
}

function renderForm() {
  return render(
    <MemoryRouter initialEntries={["/income/new"]}>
      <Routes>
        <Route path="/income/new" element={<IncomeFormPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("IncomeFormPage mobile success sheet", () => {
  beforeEach(() => {
    appData.current = createAppData();
  });

  it("releases input focus before opening the full post-save actions", async () => {
    renderForm();
    const amountInput = screen.getByLabelText("金额");

    fireEvent.change(amountInput, { target: { value: "1000" } });
    amountInput.focus();
    expect(amountInput).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "保存收入" }));

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    expect(amountInput).not.toHaveFocus();
    expect(screen.getByRole("button", { name: "记下这笔储蓄" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "稍后再说" })).toBeInTheDocument();
  });
});
