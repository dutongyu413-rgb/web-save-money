import { z } from "zod";
import { SCHEMA_VERSION } from "./models";

const isoDateTime = z.string().datetime();
const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const settingsSchema = z.object({
  id: z.literal("app"),
  schemaVersion: z.literal(SCHEMA_VERSION),
  targetSavingsRate: z.number().min(0).max(100),
  currency: z.literal("CNY"),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

export const incomeSchema = z.object({
  id: z.string().min(1),
  amountCents: z.number().int().positive(),
  occurredOn: localDateSchema,
  note: z.string().max(200),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

export const savingsSchema = z.object({
  id: z.string().min(1),
  amountCents: z.number().int().refine(value => value !== 0),
  occurredOn: localDateSchema,
  note: z.string().max(200),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

export const snapshotSchema = z.object({
  settings: settingsSchema,
  incomes: z.array(incomeSchema),
  savings: z.array(savingsSchema),
});

export const backupEnvelopeSchema = z.object({
  format: z.literal("reverse-accounting-backup"),
  version: z.literal(1),
  exportedAt: isoDateTime,
  kdf: z.object({
    name: z.literal("PBKDF2"),
    hash: z.literal("SHA-256"),
    iterations: z.literal(210000),
    salt: z.string().min(1),
  }),
  cipher: z.object({
    name: z.literal("AES-GCM"),
    iv: z.string().min(1),
    ciphertext: z.string().min(1),
  }),
});

export function validateRecordDate(value: string): string | null {
  if (!localDateSchema.safeParse(value).success) return "请选择有效日期";
  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return value > localToday ? "日期不能晚于今天" : null;
}
