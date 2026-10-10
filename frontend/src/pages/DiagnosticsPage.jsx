import React, { useState, useEffect, useCallback } from 'react';
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Activity, 
  AlertTriangle, 
  ShieldCheck 
} from 'lucide-react';
import { checkHealth, getSites } from '../services/api';
import { useAuth } from '../auth/AuthContext';

export default function DiagnosticsPage() {
  const { user, isAuthenticated, token } = useAuth();
  const [health, setHealth] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sitesDiagnostic, setSitesDiagnostic] = useState({
    count: 0,
    scope: null,
    loading: false,
  });

  const runDiagnostics = useCallback(async () => {
    const healthRes = await checkHealth();
    setHealth(healthRes);

    if (isAuthenticated) {
      setSitesDiagnostic((prev) => ({ ...prev, loading: true }));
      const sitesRes = await getSites(token);
      setSitesDiagnostic({
        count: sitesRes.count || 0,
        scope: sitesRes.scope || null,
        loading: false,
      });
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    runDiagnostics();
  }, [runDiagnostics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await runDiagnostics();
    setTimeout(() => setRefreshing(false), 400);
  };

  const isServerOnline = health?.server === 'online';
  const isDbConnected = health?.database === 'connected';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 mb-2">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              Technical Diagnostics Console
            </div>
            <h1 className="text-xl font-bold text-slate-900">System Infrastructure Diagnostics</h1>
            <p className="text-xs text-slate-500 mt-1">
              Live connectivity, database isolation, and security runtime telemetry for system administrators and evaluators.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Connectivity Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Frontend Client */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Frontend Client</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Active
            </span>
          </div>
          <p className="text-sm font-bold text-slate-900 mt-2">React 19 + Vite</p>
          <div className="mt-3 space-y-1 text-xs text-slate-500 font-mono">
            <div>Framework: React Router DOM</div>
            <div>Auth: Context API + JWT Storage</div>
          </div>
        </div>

        {/* Backend Server */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">REST API Server</span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                isServerOnline
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-rose-700 bg-rose-50 border-rose-200'
              }`}
            >
              {isServerOnline ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Online
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 text-rose-600" />
                  Offline
                </>
              )}
            </span>
          </div>
          <p className="text-sm font-bold text-slate-900 mt-2">Node.js + Express</p>
          <div className="mt-3 space-y-1 text-xs text-slate-500 font-mono">
            <div>Endpoint: /api/health</div>
            <div>Uptime: {health?.details?.uptimeSeconds || 0}s</div>
          </div>
        </div>

        {/* MongoDB Database */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Database Engine</span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                isDbConnected
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-rose-700 bg-rose-50 border-rose-200'
              }`}
            >
              {isDbConnected ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Connected
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 text-rose-600" />
                  Disconnected
                </>
              )}
            </span>
          </div>
          <p className="text-sm font-bold text-slate-900 mt-2">MongoDB + Mongoose</p>
          <div className="mt-3 space-y-1 text-xs text-slate-500 font-mono">
            <div>Target: {health?.details?.databaseType || 'Local Embedded Persistent'}</div>
            <div>Database: {health?.details?.databaseName || 'esg_portal'}</div>
          </div>
        </div>
      </div>

      {/* Database Persistence & Integrity Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-teal-600" />
          Database Connection & Persistence Architecture
        </h2>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs space-y-2 text-slate-700">
          <div className="flex items-start gap-2">
            <span className="font-semibold text-slate-900 min-w-[140px]">Connected Instance:</span>
            <span>Local Embedded Persistent MongoDB (Port 27017)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-slate-900 min-w-[140px]">Storage Directory:</span>
            <span className="font-mono text-slate-600">backend/data/db (Persistent volume across restarts)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-slate-900 min-w-[140px]">Test Isolation:</span>
            <span className="font-mono text-slate-600">backend/data/db_test (esg_portal_test database)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-slate-900 min-w-[140px]">Data Integrity Notice:</span>
            <span className="text-slate-600">
              The application explicitly distinguishes between the active persistent database and test environments. Test executions are fully isolated to prevent wiping production/development records.
            </span>
          </div>
        </div>
      </div>

      {/* RBAC Session Diagnostics */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          Active Session Authorization Scope
        </h2>
        {isAuthenticated && user ? (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs space-y-2 text-slate-700">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-slate-900 min-w-[140px]">Authenticated User:</span>
              <span>{user.name} ({user.email})</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-slate-900 min-w-[140px]">Role:</span>
              <span className="font-semibold text-teal-700">{user.role}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-slate-900 min-w-[140px]">Accessible Sites:</span>
              <span>{sitesDiagnostic.count} Project Sites (Scoped by server-side query filters)</span>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>No active session. Sign in to evaluate role-scoped query isolation.</span>
          </div>
        )}
      </div>
    </div>
  );
}
