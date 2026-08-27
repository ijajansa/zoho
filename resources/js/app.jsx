import React from 'react';
import { createRoot } from 'react-dom/client';
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { GuestRoute, ProtectedRoute } from './auth/RouteGuards';
import { ToastProvider } from './components/ToastProvider';
import AppLayout from './layouts/AppLayout';
import ApplicationBuilderLayout from './layouts/ApplicationBuilderLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ModuleDetailPage from './pages/ModuleDetailPage';
import ModulesPage from './pages/ModulesPage';
import NotFoundPage from './pages/NotFoundPage';
import RegisterPage from './pages/RegisterPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import WorkspaceDetailPage from './pages/WorkspaceDetailPage';
import WorkspacesPage from './pages/WorkspacesPage';

createRoot(document.getElementById('app')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <Routes>
                        <Route element={<GuestRoute />}>
                            <Route element={<AuthLayout />}>
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/register" element={<RegisterPage />} />
                            </Route>
                        </Route>
                        <Route element={<ProtectedRoute />}>
                            <Route element={<AppLayout />}>
                                <Route path="/dashboard" element={<DashboardPage />} />
                                <Route path="/workspaces" element={<WorkspacesPage />} />
                                <Route path="/workspaces/:id" element={<WorkspaceDetailPage />} />
                                <Route path="/workspaces/:workspaceId/applications/:applicationId" element={<ApplicationBuilderLayout />}>
                                    <Route index element={<ApplicationDetailPage />} />
                                    <Route path="modules" element={<ModulesPage />} />
                                </Route>
                                <Route path="/workspaces/:workspaceId/applications/:applicationId/modules/:moduleId" element={<ModuleDetailPage />} />
                            </Route>
                        </Route>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>,
);
