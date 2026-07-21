import { describe, expect, it } from "vitest";
import { fitSheetViewport } from "./Sheet";

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
