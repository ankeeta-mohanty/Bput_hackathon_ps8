import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DiagnosticsPage from './pages/DiagnosticsPage';
import SiteDashboard from './pages/SiteDashboard';
import SubsidiaryDashboard from './pages/SubsidiaryDashboard';
import GroupDashboard from './pages/GroupDashboard';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './auth/ProtectedRoute';
import { AuthProvider } from './auth/AuthContext';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainLayout>
          <Routes>
            {/* Public Landing & Authentication */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Dedicated Diagnostics Route */}
            <Route path="/diagnostics" element={<DiagnosticsPage />} />

            {/* Protected Role-Based Dashboards */}
            <Route
              path="/site-dashboard"
              element={
                <ProtectedRoute allowedRoles={['SITE_MANAGER']}>
                  <SiteDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/subsidiary-dashboard"
              element={
                <ProtectedRoute allowedRoles={['SUBSIDIARY_ESG_MANAGER']}>
                  <SubsidiaryDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/group-dashboard"
              element={
                <ProtectedRoute allowedRoles={['GROUP_ESG_EXECUTIVE']}>
                  <GroupDashboard />
                </ProtectedRoute>
              }
            />

            {/* Role-Specific Direct Navigation Redirects */}
            <Route
              path="/site-data"
              element={
                <ProtectedRoute allowedRoles={['SITE_MANAGER']}>
                  <Navigate to="/site-dashboard?tab=entry" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/site-submissions"
              element={
                <ProtectedRoute allowedRoles={['SITE_MANAGER']}>
                  <Navigate to="/site-dashboard?tab=submissions" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subsidiary/review"
              element={
                <ProtectedRoute allowedRoles={['SUBSIDIARY_ESG_MANAGER']}>
                  <Navigate to="/subsidiary-dashboard?tab=review" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subsidiary/sites"
              element={
                <ProtectedRoute allowedRoles={['SUBSIDIARY_ESG_MANAGER']}>
                  <Navigate to="/subsidiary-dashboard?tab=sites" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/group/analytics"
              element={
                <ProtectedRoute allowedRoles={['GROUP_ESG_EXECUTIVE']}>
                  <Navigate to="/group-dashboard?tab=dashboard" replace />
                </ProtectedRoute>
              }
            />

            {/* Generic /dashboard redirect */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Navigate to="/" replace />
                </ProtectedRoute>
              }
            />

            {/* 404 Catch All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </MainLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}
