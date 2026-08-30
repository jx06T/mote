import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { QuickNotesPage } from '../pages/QuickNotesPage';
import { MaterialsPage } from '../pages/MaterialsPage';
import { MaterialDetailPage } from '../pages/MaterialDetailPage';
import { PromptPage } from '../pages/PromptPage';
import { EssayEditorPage } from '../pages/EssayEditorPage';
import { ExamPage } from '../pages/ExamPage';
import { ExamSessionPage } from '../pages/ExamSessionPage';
import { AnalysisPage } from '../pages/AnalysisPage';
import { VocabularyPage } from '../pages/VocabularyPage';
import { SettingsPage } from '../pages/SettingsPage';
import { LoginPage } from '../pages/LoginPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'quick-notes', element: <QuickNotesPage /> },
      { path: 'materials', element: <MaterialsPage /> },
      { path: 'materials/:id', element: <MaterialDetailPage /> },
      { path: 'prompts', element: <PromptPage /> },
      { path: 'editor', element: <EssayEditorPage /> },
      { path: 'exams', element: <ExamPage /> },
      { path: 'exams/session', element: <ExamSessionPage /> },
      { path: 'analysis', element: <AnalysisPage /> },
      { path: 'vocabulary', element: <VocabularyPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
