import { describe, expect, it } from "vitest";
import { backupFilename, decryptBackup, encryptSnapshot } from "./backupService";
import { createDefaultSettings, type AppSnapshot } from "../domain/models";

const snapshot: AppSnapshot = {
  settings: createDefaultSettings("2026-07-17T00:00:00.000Z"),
  incomes: [{ id: "income-1", amountCents: 100000, occurredOn: "2026-07-05", note: "工资", createdAt: "2026-07-17T00:00:00.000Z", updatedAt: "2026-07-17T00:00:00.000Z" }],
  savings: [{ id: "saving-1", amountCents: 30000, occurredOn: "2026-07-05", note: "存款", createdAt: "2026-07-17T00:00:00.000Z", updatedAt: "2026-07-17T00:00:00.000Z" }],
};

describe("backup encryption", () => {
  it("encrypts and restores a complete snapshot", async () => {
    const envelope = await encryptSnapshot(snapshot, "password-123");
    expect(envelope.format).toBe("reverse-accounting-backup");
    expect(envelope.cipher.ciphertext).not.toContain("工资");
    await expect(decryptBackup(envelope, "password-123")).resolves.toEqual(snapshot);
  });

  it("does not decrypt with a wrong password", async () => {
    const envelope = await encryptSnapshot(snapshot, "password-123");
    await expect(decryptBackup(envelope, "wrong-password")).rejects.toBeDefined();
  });

  it("uses the selectable .backup file extension", () => {
    expect(backupFilename(new Date("2026-07-18T08:00:00+08:00"))).toBe("反向记账-2026-07-18.backup");
  });
});
