import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle,
  Server, 
  Database, 
  RefreshCw,
  Compass,
  MapPin,
  Users
} from 'lucide-react';
import { getSites } from '../services/api';

export default function LandingPage({ systemStatus, onRefreshStatus }) {
  const [refreshing, setRefreshing] = useState(false);
  const [sitesState, setSitesState] = useState({
    loading: true,
    success: false,
    count: 0,
    data: [],
    message: '',
  });

  const loadSites = async () => {
    setSitesState((prev) => ({ ...prev, loading: true }));
    const result = await getSites();
    setSitesState({
      loading: false,
      success: result.success,
      count: result.count || 0,
      data: result.data || [],
      message: result.message || '',
    });
  };

  useEffect(() => {
    loadSites();
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    if (onRefreshStatus) {
      await onRefreshStatus();
    }
    await loadSites();
    setTimeout(() => setRefreshing(false), 500);
  };

  const isServerOnline = systemStatus?.server === 'online';
  const isDbConnected = systemStatus?.database === 'connected';

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-50/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            Hackathon Prototype • Phase 1 Foundation
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            ESG Reporting Portal
          </h1>
          <p className="text-lg text-teal-700 font-medium mt-1">
            Centralized BRSR & Sustainability Data Management
          </p>

          <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
            A centralized ESG data platform demonstrating streamlined data collection, multi-tier validation, automated emission calculations, subsidiary review, group roll-up aggregation, compliance checking, and BRSR report generation for enterprise groups.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="#diagnostics"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors shadow-sm"
            >
              <span>View System Health</span>
              <Server className="w-4 h-4" />
            </a>
            <a
              href="#db-test"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors border border-slate-200"
            >
              <span>Database Verification</span>
              <Database className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Live System Diagnostics / Verification Card */}
      <div id="diagnostics" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-teal-600" />
              Full-Stack Health & Connectivity Diagnostics
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status verification across React Client, Express REST API, and MongoDB Database.
            </p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Diagnostics</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Frontend Card */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Frontend Client
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Vite Active
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-2">
              React 19 + Tailwind CSS
            </p>
            <div className="mt-3 space-y-1 text-xs text-slate-500 font-mono">
              <div>Port: 5173</div>
              <div>Router: React Router DOM</div>
            </div>
          </div>

          {/* Backend API Card */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Backend REST API
              </span>
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
                    API Online
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 text-rose-600" />
                    API Offline
                  </>
                )}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-2">
              Node.js + Express
            </p>
            <div className="mt-3 space-y-1 text-xs text-slate-500 font-mono">
              <div>Uptime: {systemStatus?.details?.uptimeSeconds ?? 0}s</div>
              <div>Endpoint: /api/health</div>
            </div>
          </div>

          {/* Database Card */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Database Engine
              </span>
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
                    MongoDB Connected
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 text-rose-600" />
                    MongoDB Disconnected
                  </>
                )}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-2">
              MongoDB + Mongoose
            </p>
            <div className="mt-3 space-y-1 text-xs text-slate-500 font-mono">
              <div>Host: {systemStatus?.details?.databaseHost || 'N/A'}:{systemStatus?.details?.databasePort || ''}</div>
              <div>DB: {systemStatus?.details?.databaseName || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Development Frontend Database Test Section (Step 11) */}
      <div id="db-test" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200 mb-2">
              Phase 1 Verification
            </div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-600" />
              Live Database Integration Test (GET /api/sites)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified end-to-end data pipeline: React Frontend → Express Controller → Mongoose Model → MongoDB Collection.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Query Target: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-[11px]">ProjectSite.find()</code>
            </span>
          </div>
        </div>

        {/* Live metric summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Database
            </span>
            <div className="mt-2 flex items-center gap-2">
              {isDbConnected ? (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-rose-700">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Disconnected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Verified via Mongoose connection state</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sites API
            </span>
            <div className="mt-2 flex items-center gap-2">
              {sitesState.success ? (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ✓ Working (HTTP 200)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-rose-700">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  ✕ Failed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Endpoint: GET /api/sites</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Number of Sites
            </span>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {sitesState.loading ? '...' : sitesState.count}
            </div>
            <p className="text-xs text-slate-500 mt-1">Queried live from MongoDB collection</p>
          </div>
        </div>

        {/* Real sites table */}
        <div className="mt-6">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Active Project Sites in MongoDB
          </h3>

          {sitesState.loading ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
              Querying MongoDB records...
            </div>
          ) : sitesState.count === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
              No project site records found in database. Run <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">npm run seed</code> in backend to populate demo sites.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left font-semibold text-slate-700">Site Name</th>
                    <th scope="col" className="px-4 py-2.5 text-left font-semibold text-slate-700">Code</th>
                    <th scope="col" className="px-4 py-2.5 text-left font-semibold text-slate-700">Location</th>
                    <th scope="col" className="px-4 py-2.5 text-left font-semibold text-slate-700">Subsidiary</th>
                    <th scope="col" className="px-4 py-2.5 text-left font-semibold text-slate-700">MongoDB ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {sitesState.data.map((site) => (
                    <tr key={site._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-slate-900">{site.name}</td>
                      <td className="px-4 py-2.5 font-mono text-teal-700 font-semibold">{site.code}</td>
                      <td className="px-4 py-2.5 text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{site.location}</span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">
                        {site.subsidiaryId?.name || 'N/A'}
                        <span className="text-[10px] text-slate-400 ml-1">({site.subsidiaryId?.code})</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">
                        {site._id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Role-Based Architecture Overview */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            3-Tier Enterprise Role Hierarchy
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-Based Access Control (RBAC) designed specifically for enterprise group reporting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Site Manager */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:border-teal-300 transition-colors shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold mb-4">
                01
              </div>
              <h3 className="text-base font-semibold text-slate-900">Site Manager</h3>
              <p className="text-xs text-teal-700 font-medium mt-0.5">Project / Site Level Entry</p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Enter monthly Energy, Water, Waste, & Safety metrics</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Save drafts and resolve validation warnings</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Submit data for subsidiary-level review</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400">site@demo.com</span>
              <span className="text-teal-600 font-medium">Phase 2 Target</span>
            </div>
          </div>

          {/* Subsidiary ESG Manager */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:border-teal-300 transition-colors shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold mb-4">
                02
              </div>
              <h3 className="text-base font-semibold text-slate-900">Subsidiary ESG Manager</h3>
              <p className="text-xs text-teal-700 font-medium mt-0.5">Subsidiary Review & Audit</p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Review submissions across all sites in subsidiary</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Inspect rule-based anomaly detection alerts</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Approve submissions or reject with required feedback</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400">subsidiary@demo.com</span>
              <span className="text-teal-600 font-medium">Phase 2 Target</span>
            </div>
          </div>

          {/* Group ESG Executive */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:border-teal-300 transition-colors shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold mb-4">
                03
              </div>
              <h3 className="text-base font-semibold text-slate-900">Group ESG Executive</h3>
              <p className="text-xs text-teal-700 font-medium mt-0.5">Conglomerate Consolidation</p>
              <ul className="mt-4 space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Consolidated group rollup & analytics dashboards</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Run BRSR compliance & missing-field checks</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Export verified BRSR PDF reports with SDG mappings</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400">executive@demo.com</span>
              <span className="text-teal-600 font-medium">Phase 2 Target</span>
            </div>
          </div>
        </div>
      </div>

      {/* End-to-End Workflow Pipeline */}
      <div id="architecture" className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-teal-600" />
            End-to-End Core Workflow Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sequential stages from on-site activity log to final SEBI BRSR-aligned report compilation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase">
              Step 1
            </span>
            <h4 className="text-sm font-semibold text-slate-900 mt-2">Data Collection & Inputs</h4>
            <p className="text-xs text-slate-500 mt-1">
              Multi-section forms for Energy, Water, Waste, Social demographics, and Governance.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase">
              Step 2
            </span>
            <h4 className="text-sm font-semibold text-slate-900 mt-2">Calculations & Anomaly</h4>
            <p className="text-xs text-slate-500 mt-1">
              Backend Scope 1 tCO2e, intensities, recycling %, and historical threshold alerts.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase">
              Step 3
            </span>
            <h4 className="text-sm font-semibold text-slate-900 mt-2">Subsidiary Roll-Up</h4>
            <p className="text-xs text-slate-500 mt-1">
              Strict approval lifecycle: only approved site submissions roll up to group totals.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase">
              Step 4
            </span>
            <h4 className="text-sm font-semibold text-slate-900 mt-2">BRSR Audit & PDF Filing</h4>
            <p className="text-xs text-slate-500 mt-1">
              Automated completion audit across Sections A/B/C and PDF report generation.
            </p>
          </div>
        </div>
      </div>

      {/* BRSR 3-Section Framework Card */}
      <div className="bg-slate-900 text-white rounded-xl p-8 shadow-sm">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
            Regulatory Standard
          </span>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
            SEBI BRSR Representative Framework
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
            The platform models representative disclosures across all 3 key BRSR sections to ensure realistic enterprise compliance workflows:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-xs font-semibold text-teal-400">Section A</span>
            <h4 className="text-sm font-medium text-white mt-1">General Disclosures</h4>
            <p className="text-xs text-slate-400 mt-2 leading-snug">
              Corporate entity details, CIN, turnover, workforce gender ratios, and CSR spend.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-xs font-semibold text-teal-400">Section B</span>
            <h4 className="text-sm font-medium text-white mt-1">Management & Governance</h4>
            <p className="text-xs text-slate-400 mt-2 leading-snug">
              Coverage across 9 NGRBC principles, board oversight, policy coverage, and stakeholder engagement.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-xs font-semibold text-teal-400">Section C</span>
            <h4 className="text-sm font-medium text-white mt-1">Principle-wise Performance</h4>
            <p className="text-xs text-slate-400 mt-2 leading-snug">
              Measurable Scope 1 emissions, water consumption, waste circularity, and POSH safety records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
