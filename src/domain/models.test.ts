import { describe, expect, it } from "vitest";
import { createDefaultSettings, DEFAULT_TARGET_RATE } from "./models";

describe("default settings", () => {
  it("uses a 20% target savings rate", () => {
    expect(DEFAULT_TARGET_RATE).toBe(20);
    expect(createDefaultSettings("2026-07-18T00:00:00.000Z").targetSavingsRate).toBe(20);
  });
});
