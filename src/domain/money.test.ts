import { describe, expect, it } from "vitest";
import { formatMoney, parseMoneyInput } from "./money";

describe("money", () => {
  it("converts decimal input to integer cents", () => {
    expect(parseMoneyInput("1,234.56")).toBe(123456);
    expect(parseMoneyInput("0.01")).toBe(1);
  });

  it("rejects zero, negatives and more than two decimal places", () => {
    expect(parseMoneyInput("0")).toBeNull();
    expect(parseMoneyInput("-1")).toBeNull();
    expect(parseMoneyInput("1.001")).toBeNull();
  });

  it("formats positive and negative CNY amounts", () => {
    expect(formatMoney(123456)).toBe("¥1,234.56");
    expect(formatMoney(-100000)).toBe("-¥1,000");
  });
});
