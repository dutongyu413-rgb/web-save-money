import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SavingsFormPage } from "./SavingsFormPage";

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
  return {
    data: {
      settings: { id: "app", schemaVersion: 1, targetSavingsRate: 20, currency: "CNY" as const, createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z" },
      incomes: [],
      savings: [{ id: "saving-1", amountCents: 300_000, occurredOn: "2026-07-05", note: "工资到账后转入", createdAt: "2026-07-05T00:00:00.000Z", updatedAt: "2026-07-05T00:00:00.000Z" }],
    },
    selectedMonth: "2026-07",
    setSelectedMonth: vi.fn(),
    saveSavings: vi.fn().mockResolvedValue(undefined),
    removeSavings: vi.fn().mockResolvedValue(undefined),
  };
}

function renderForm(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/savings/new" element={<SavingsFormPage />} />
        <Route path="/savings/:recordId" element={<SavingsFormPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SavingsFormPage", () => {
  beforeEach(() => {
    appData.current = createAppData();
  });

  it("uses increase savings as the primary new-record flow without an equal mode switch", () => {
    renderForm("/savings/new");

    expect(screen.getByRole("heading", { name: "增加储蓄" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "取用储蓄" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存储蓄记录" })).toHaveClass("savings-primary");
  });

  it("opens a dedicated take-savings form from an explicit URL intent", () => {
    renderForm("/savings/new?mode=take");

    expect(screen.getByRole("heading", { name: "取用储蓄" })).toBeInTheDocument();
    expect(screen.getByText("这笔金额会减少本月净储蓄，储蓄率可能为负数。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存储蓄记录" })).toHaveClass("primary");
  });

  it("requires confirmation before changing an existing record type", async () => {
    renderForm("/savings/saving-1");

    fireEvent.click(screen.getByRole("button", { name: "将这笔记录改为取用储蓄" }));
    expect(screen.getByText("这会把原来的“增加储蓄”改为“取用储蓄”，不会新增一笔记录。")).toBeInTheDocument();
    expect(appData.current.saveSavings).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "确认修改" }));
    expect(screen.getByRole("button", { name: "将这笔记录改为增加储蓄" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));
    await waitFor(() => expect(appData.current.saveSavings).toHaveBeenCalledWith({
      amountCents: -300_000,
      occurredOn: "2026-07-05",
      note: "工资到账后转入",
    }, "saving-1"));
  });
});
