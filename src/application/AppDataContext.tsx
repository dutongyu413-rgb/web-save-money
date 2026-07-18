import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { currentMonth } from "../domain/date";
import type { AppSnapshot, RecordDraft } from "../domain/models";
import {
  clearDatabase,
  deleteIncome,
  deleteSavings,
  getSnapshot,
  putIncome,
  putSavings,
  replaceSnapshot,
  updateTargetRate,
} from "../infrastructure/db";

type DataContextValue = {
  data: AppSnapshot | null;
  loading: boolean;
  error: string | null;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  refresh: () => Promise<void>;
  saveIncome: (draft: RecordDraft, id?: string) => Promise<void>;
  saveSavings: (draft: RecordDraft, id?: string) => Promise<void>;
  removeIncome: (id: string) => Promise<void>;
  removeSavings: (id: string) => Promise<void>;
  setTargetRate: (value: number) => Promise<void>;
  restore: (snapshot: AppSnapshot) => Promise<void>;
  clearAll: () => Promise<void>;
};

const AppDataContext = createContext<DataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setData(await getSnapshot());
    } catch {
      setError("本机数据暂时无法读取，请刷新页面后重试。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const mutate = useCallback(async (operation: () => Promise<void>) => {
    await operation();
    await refresh();
  }, [refresh]);

  const value = useMemo<DataContextValue>(() => ({
    data,
    loading,
    error,
    selectedMonth,
    setSelectedMonth,
    refresh,
    saveIncome: (draft, id) => mutate(() => putIncome(draft, id)),
    saveSavings: (draft, id) => mutate(() => putSavings(draft, id)),
    removeIncome: id => mutate(() => deleteIncome(id)),
    removeSavings: id => mutate(() => deleteSavings(id)),
    setTargetRate: value => mutate(() => updateTargetRate(value)),
    restore: snapshot => mutate(() => replaceSnapshot(snapshot)),
    clearAll: () => mutate(clearDatabase),
  }), [data, error, loading, mutate, refresh, selectedMonth]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData must be used inside AppDataProvider");
  return context;
}
