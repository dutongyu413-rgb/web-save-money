export const SCHEMA_VERSION = 1;
export const DEFAULT_TARGET_RATE = 30;

export interface AppSettings {
  id: "app";
  schemaVersion: number;
  targetSavingsRate: number;
  currency: "CNY";
  createdAt: string;
  updatedAt: string;
}

export interface IncomeRecord {
  id: string;
  amountCents: number;
  occurredOn: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsRecord {
  id: string;
  amountCents: number;
  occurredOn: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSnapshot {
  settings: AppSettings;
  incomes: IncomeRecord[];
  savings: SavingsRecord[];
}

export type RecordDraft = {
  amountCents: number;
  occurredOn: string;
  note: string;
};

export function createDefaultSettings(now = new Date().toISOString()): AppSettings {
  return {
    id: "app",
    schemaVersion: SCHEMA_VERSION,
    targetSavingsRate: DEFAULT_TARGET_RATE,
    currency: "CNY",
    createdAt: now,
    updatedAt: now,
  };
}
