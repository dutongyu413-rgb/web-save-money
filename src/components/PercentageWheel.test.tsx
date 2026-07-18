import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { PercentageWheel } from "./PercentageWheel";

function WheelHarness() {
  const [value, setValue] = useState(20);
  return <PercentageWheel value={value} onChange={setValue} />;
}

describe("PercentageWheel", () => {
  it("shows every integer rate from 1% to 100% and defaults to 20%", () => {
    render(<WheelHarness />);

    expect(screen.getAllByRole("option")).toHaveLength(100);
    expect(screen.getByRole("option", { name: "1%" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "100%" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "20%" })).toHaveAttribute("aria-selected", "true");
  });

  it("changes one percentage point with each arrow key press", () => {
    render(<WheelHarness />);

    fireEvent.keyDown(screen.getByRole("listbox", { name: "目标储蓄率" }), { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: "21%" })).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(screen.getByRole("listbox", { name: "目标储蓄率" }), { key: "ArrowUp" });
    expect(screen.getByRole("option", { name: "20%" })).toHaveAttribute("aria-selected", "true");
  });
});
