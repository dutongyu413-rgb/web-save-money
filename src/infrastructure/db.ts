import Dexie, { type EntityTable } from "dexie";
import { createId } from "../domain/id";
import {
  createDefaultSettings,
  type AppSettings,
  type AppSnapshot,
  type IncomeRecord,
  type RecordDraft,
  type SavingsRecord,
} from "../domain/models";

const LEGACY_STORAGE_KEY = "reverse-accounting-prototype-v1";
const MIGRATION_KEY = "reverse-accounting-legacy-migrated";

class ReverseAccountingDatabase extends Dexie {
  settings!: EntityTable<AppSettings, "id">;
  incomes!: EntityTable<IncomeRecord, "id">;
  savings!: EntityTable<SavingsRecord, "id">;

  constructor() {
    super("reverse-accounting");
    this.version(1).stores({
      settings: "&id",
      incomes: "&id, occurredOn, createdAt",
      savings: "&id, occurredOn, createdAt",
    });
  }
}

export const db = new ReverseAccountingDatabase();

function makeRecord(draft: RecordDraft, existing?: IncomeRecord | SavingsRecord) {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? createId(),
    amountCents: draft.amountCents,
    occurredOn: draft.occurredOn,
    note: draft.note.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

async function migrateLegacyIfNeeded() {
  if (localStorage.getItem(MIGRATION_KEY)) return;
  const legacyValue = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacyValue) {
    localStorage.setItem(MIGRATION_KEY, "1");
    return;
  }

  const [incomeCount, savingsCount] = await Promise.all([db.incomes.count(), db.savings.count()]);
  if (incomeCount || savingsCount) {
    localStorage.setItem(MIGRATION_KEY, "1");
    return;
  }

  try {
    const legacy = JSON.parse(legacyValue) as {
      settings?: { targetRate?: number };
      incomes?: Array<{ id?: string; amount?: number; date?: string; note?: string }>;
      savings?: Array<{ id?: string; amount?: number; date?: string; note?: string }>;
    };
    const now = new Date().toISOString();
    const incomes: IncomeRecord[] = (legacy.incomes ?? [])
      .filter(item => Number.isInteger(item.amount) && (item.amount ?? 0) > 0 && item.date)
      .map(item => ({
        id: item.id ?? createId(),
        amountCents: item.amount!,
        occurredOn: item.date!,
        note: String(item.note ?? "").slice(0, 200),
        createdAt: now,
        updatedAt: now,
      }));
    const savings: SavingsRecord[] = (legacy.savings ?? [])
      .filter(item => Number.isInteger(item.amount) && item.amount !== 0 && item.date)
      .map(item => ({
        id: item.id ?? createId(),
        amountCents: item.amount!,
        occurredOn: item.date!,
        note: String(item.note ?? "").slice(0, 200),
        createdAt: now,
        updatedAt: now,
      }));
    const settings = createDefaultSettings(now);
    settings.targetSavingsRate = Math.max(1, Math.min(100, Number(legacy.settings?.targetRate ?? 20)));

    await db.transaction("rw", db.settings, db.incomes, db.savings, async () => {
      await db.settings.put(settings);
      if (incomes.length) await db.incomes.bulkPut(incomes);
      if (savings.length) await db.savings.bulkPut(savings);
    });
  } catch {
    // Invalid legacy prototype data is ignored without touching IndexedDB.
  } finally {
    localStorage.setItem(MIGRATION_KEY, "1");
  }
}

export async function initializeDatabase() {
  await db.open();
  await migrateLegacyIfNeeded();
  const settings = await db.settings.get("app");
  if (!settings) await db.settings.put(createDefaultSettings());
}

export async function getSnapshot(): Promise<AppSnapshot> {
  await initializeDatabase();
  const [settings, incomes, savings] = await Promise.all([
    db.settings.get("app"),
    db.incomes.toArray(),
    db.savings.toArray(),
  ]);
  return { settings: settings ?? createDefaultSettings(), incomes, savings };
}

export async function putIncome(draft: RecordDraft, id?: string) {
  const existing = id ? await db.incomes.get(id) : undefined;
  await db.incomes.put(makeRecord(draft, existing) as IncomeRecord);
}

export async function putSavings(draft: RecordDraft, id?: string) {
  const existing = id ? await db.savings.get(id) : undefined;
  await db.savings.put(makeRecord(draft, existing) as SavingsRecord);
}

export async function deleteIncome(id: string) {
  await db.incomes.delete(id);
}

export async function deleteSavings(id: string) {
  await db.savings.delete(id);
}

export async function updateTargetRate(targetSavingsRate: number) {
  const settings = await db.settings.get("app") ?? createDefaultSettings();
  await db.settings.put({ ...settings, targetSavingsRate, updatedAt: new Date().toISOString() });
}

export async function replaceSnapshot(snapshot: AppSnapshot) {
  await db.transaction("rw", db.settings, db.incomes, db.savings, async () => {
    await Promise.all([db.settings.clear(), db.incomes.clear(), db.savings.clear()]);
    await db.settings.put(snapshot.settings);
    if (snapshot.incomes.length) await db.incomes.bulkPut(snapshot.incomes);
    if (snapshot.savings.length) await db.savings.bulkPut(snapshot.savings);
  });
}

export async function clearDatabase() {
  await db.transaction("rw", db.settings, db.incomes, db.savings, async () => {
    await Promise.all([db.settings.clear(), db.incomes.clear(), db.savings.clear()]);
    await db.settings.put(createDefaultSettings());
  });
}
