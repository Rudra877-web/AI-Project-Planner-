import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/PasswordResetPages';
import DashboardPage from './pages/DashboardPage';
import NewProjectPage from './pages/NewProjectPage';
import SettingsPage from './pages/SettingsPage';
import ProjectLayout from './pages/project/ProjectLayout';
import OverviewTab from './pages/project/OverviewTab';
import StackTab from './pages/project/StackTab';
import PagesTab from './pages/project/PagesTab';
import DatabaseTab from './pages/project/DatabaseTab';
import ApiTab from './pages/project/ApiTab';
import RoadmapTab from './pages/project/RoadmapTab';
import BoardTab from './pages/project/BoardTab';
import TestsTab from './pages/project/TestsTab';
import ChatTab from './pages/project/ChatTab';
import ChangesTab from './pages/project/ChangesTab';
import ReadmeTab from './pages/project/ReadmeTab';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/new" element={<NewProjectPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/projects/:id" element={<ProjectLayout />}>
          <Route index element={<OverviewTab />} />
          <Route path="stack" element={<StackTab />} />
          <Route path="pages" element={<PagesTab />} />
          <Route path="database" element={<DatabaseTab />} />
          <Route path="api" element={<ApiTab />} />
          <Route path="roadmap" element={<RoadmapTab />} />
          <Route path="board" element={<BoardTab />} />
          <Route path="tests" element={<TestsTab />} />
          <Route path="chat" element={<ChatTab />} />
          <Route path="changes" element={<ChangesTab />} />
          <Route path="readme" element={<ReadmeTab />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
