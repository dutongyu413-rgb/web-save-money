import { Navigate, Route, Routes } from "react-router-dom";
import { AnalyticsPageTracker } from "../analytics/AnalyticsPageTracker";
import { ErrorScreen, LoadingScreen } from "../components/Feedback";
import { useAppData } from "../application/AppDataContext";
import { BackupExportPage } from "../pages/BackupExportPage";
import { BackupRestorePage } from "../pages/BackupRestorePage";
import { HomePage } from "../pages/HomePage";
import { IncomeFormPage } from "../pages/IncomeFormPage";
import { IncomeListPage } from "../pages/IncomeListPage";
import { SavingsFormPage } from "../pages/SavingsFormPage";
import { SavingsListPage } from "../pages/SavingsListPage";
import { SettingsPage } from "../pages/SettingsPage";
import { TrendsPage } from "../pages/TrendsPage";

export function App() {
  const { loading, error, refresh } = useAppData();
  if (loading) return <main className="app-shell"><LoadingScreen /></main>;
  if (error) return <main className="app-shell"><ErrorScreen message={error} onRetry={() => void refresh()} /></main>;

  return (
    <main className="app-shell">
      <AnalyticsPageTracker />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/income" element={<IncomeListPage />} />
        <Route path="/income/new" element={<IncomeFormPage />} />
        <Route path="/income/:recordId" element={<IncomeFormPage />} />
        <Route path="/savings" element={<SavingsListPage />} />
        <Route path="/savings/new" element={<SavingsFormPage />} />
        <Route path="/savings/:recordId" element={<SavingsFormPage />} />
        <Route path="/trends" element={<TrendsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/export" element={<BackupExportPage />} />
        <Route path="/settings/restore" element={<BackupRestorePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}
