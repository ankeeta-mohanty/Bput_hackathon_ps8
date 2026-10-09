import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';
import { checkHealth } from './services/api';
import { Lock, ArrowLeft } from 'lucide-react';

// Placeholder screen for Phase 2+ routes
function RoutePlaceholder({ title, phase, roleRequired }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm my-8">
      <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-6 h-6" />
      </div>
      <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 uppercase">
        {phase || 'Upcoming Phase'}
      </span>
      <h2 className="text-xl font-bold text-slate-900 mt-3">{title}</h2>
      <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
        This route is reserved for {roleRequired || 'authorized personnel'}. It will be fully functional once authentication and RBAC are enabled in Phase 2.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  const [systemStatus, setSystemStatus] = useState({
    success: false,
    server: 'checking',
    database: 'connecting',
    details: {},
  });

  const fetchStatus = useCallback(async () => {
    const data = await checkHealth();
    setSystemStatus(data);
  }, []);

  useEffect(() => {
    fetchStatus();
    // Periodically poll backend health every 15 seconds
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return (
    <BrowserRouter>
      <MainLayout systemStatus={systemStatus}>
        <Routes>
          {/* Main Landing Page */}
          <Route
            path="/"
            element={
              <LandingPage
                systemStatus={systemStatus}
                onRefreshStatus={fetchStatus}
              />
            }
          />

          {/* Planned Phase 2 Routes (Authentication & Site/Subsidiary/Group Portals) */}
          <Route
            path="/login"
            element={
              <RoutePlaceholder
                title="Portal Authentication & Login"
                phase="Phase 2 Feature"
                roleRequired="Site, Subsidiary, and Executive Users"
              />
            }
          />
          <Route
            path="/site-dashboard"
            element={
              <RoutePlaceholder
                title="Site Manager Dashboard"
                phase="Phase 3 Feature"
                roleRequired="Site Managers"
              />
            }
          />
          <Route
            path="/site-data"
            element={
              <RoutePlaceholder
                title="Site ESG Data Entry"
                phase="Phase 3 Feature"
                roleRequired="Site Managers"
              />
            }
          />
          <Route
            path="/site-submissions"
            element={
              <RoutePlaceholder
                title="Site Submission History"
                phase="Phase 3 Feature"
                roleRequired="Site Managers"
              />
            }
          />

          <Route
            path="/subsidiary-dashboard"
            element={
              <RoutePlaceholder
                title="Subsidiary ESG Manager Dashboard"
                phase="Phase 6 Feature"
                roleRequired="Subsidiary ESG Managers"
              />
            }
          />
          <Route
            path="/subsidiary/review"
            element={
              <RoutePlaceholder
                title="Subsidiary Review & Audit Queue"
                phase="Phase 6 Feature"
                roleRequired="Subsidiary ESG Managers"
              />
            }
          />
          <Route
            path="/subsidiary/sites"
            element={
              <RoutePlaceholder
                title="Subsidiary Sites Directory"
                phase="Phase 6 Feature"
                roleRequired="Subsidiary ESG Managers"
              />
            }
          />

          <Route
            path="/group-dashboard"
            element={
              <RoutePlaceholder
                title="Group ESG Executive Dashboard"
                phase="Phase 8 Feature"
                roleRequired="Group ESG Executives"
              />
            }
          />
          <Route
            path="/group/analytics"
            element={
              <RoutePlaceholder
                title="Group Consolidation Analytics"
                phase="Phase 8 Feature"
                roleRequired="Group ESG Executives"
              />
            }
          />
          <Route
            path="/group/compliance"
            element={
              <RoutePlaceholder
                title="BRSR Compliance Audit"
                phase="Phase 9 Feature"
                roleRequired="Group ESG Executives"
              />
            }
          />
          <Route
            path="/group/reports"
            element={
              <RoutePlaceholder
                title="BRSR PDF Report Generation"
                phase="Phase 10 Feature"
                roleRequired="Group ESG Executives"
              />
            }
          />

          {/* BRSR Section Specific Routes */}
          <Route
            path="/brsr"
            element={
              <RoutePlaceholder
                title="SEBI BRSR Comprehensive Portal"
                phase="Phase 4 Feature"
                roleRequired="All Reporting Units"
              />
            }
          />
          <Route
            path="/brsr/section-a"
            element={
              <RoutePlaceholder
                title="BRSR Section A: General Disclosures"
                phase="Phase 4 Feature"
                roleRequired="Corporate Secretariat"
              />
            }
          />
          <Route
            path="/brsr/section-b"
            element={
              <RoutePlaceholder
                title="BRSR Section B: Management & Governance"
                phase="Phase 4 Feature"
                roleRequired="ESG Governance Committee"
              />
            }
          />
          <Route
            path="/brsr/section-c"
            element={
              <RoutePlaceholder
                title="BRSR Section C: Principle-wise Performance"
                phase="Phase 4 Feature"
                roleRequired="Operations & EHS Teams"
              />
            }
          />

          {/* 404 Catch All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
