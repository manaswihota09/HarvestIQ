import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { FarmDataProvider } from './context/FarmDataContext';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { BatchDetailPage } from './pages/BatchDetailPage';
import { BatchesPage } from './pages/BatchesPage';
import { DashboardPage } from './pages/DashboardPage';
import { EnvironmentPage } from './pages/EnvironmentPage';
import { HarvestPage } from './pages/HarvestPage';
import { LandingPage } from './pages/LandingPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <ToastProvider>
      <FarmDataProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/batches" element={<BatchesPage />} />
            <Route path="/batches/:id" element={<BatchDetailPage />} />
            <Route path="/predictions" element={<PredictionsPage />} />
            <Route path="/environment" element={<EnvironmentPage />} />
            <Route path="/harvest" element={<HarvestPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </FarmDataProvider>
    </ToastProvider>
  );
}
