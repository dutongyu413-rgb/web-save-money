import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fitSheetViewport, Sheet } from "./Sheet";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("fitSheetViewport", () => {
  it("limits a desktop viewport to the phone canvas", () => {
    expect(fitSheetViewport(1000, 0, 756)).toEqual({ height: 756, offsetTop: 0 });
  });

  it("keeps a smaller visual viewport when the mobile keyboard is open", () => {
    expect(fitSheetViewport(360, 0, 756)).toEqual({ height: 360, offsetTop: 0 });
  });

  it("accounts for a shifted visual viewport without crossing the canvas bottom", () => {
    expect(fitSheetViewport(360, 40, 380)).toEqual({ height: 340, offsetTop: 40 });
  });
});

describe("Sheet desktop canvas boundary", () => {
  it("uses the phone canvas height even when Chrome reports a taller page", async () => {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(function getClientHeight(this: HTMLElement) {
      if (this.classList.contains("app-shell")) return 756;
      if (this.classList.contains("screen")) return 1000;
      return 0;
    });

    const { container } = render(
      <div className="app-shell">
        <div className="screen">
          <Sheet open onClose={() => undefined}>测试内容</Sheet>
        </div>
      </div>,
    );

    const backdrop = container.querySelector<HTMLElement>(".sheet-backdrop");
    if (!backdrop) throw new Error("缺少弹层遮罩");
    await waitFor(() => expect(backdrop).toHaveStyle({ height: "756px" }));
  });
});
