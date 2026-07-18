import { describe, expect, it } from "vitest";
import { createId } from "./id";

describe("createId", () => {
  it("uses native randomUUID when available", () => {
    expect(createId({ randomUUID: () => "native-id" })).toBe("native-id");
  });

  it("creates an RFC 4122 version 4 UUID from random bytes", () => {
    const id = createId({
      getRandomValues: array => {
        array.fill(0xab);
        return array;
      },
    });

    expect(id).toBe("abababab-abab-4bab-abab-abababababab");
  });

  it("still creates a local id without Web Crypto", () => {
    expect(createId(null)).toMatch(/^local-/);
  });
});
