import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { 
  getSites, 
  getGroupRollup 
} from '../services/api';
import { 
  Users, 
  Building2, 
  ShieldCheck, 
  AlertCircle, 
  BarChart3, 
  BookOpen, 
  Flame, 
  Zap, 
  Droplets, 
  Recycle 
} from 'lucide-react';

export default function GroupDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [sitesError, setSitesError] = useState('');

  const [rollupPeriod, setRollupPeriod] = useState('FY2025-Q3');
  const [rollupData, setRollupData] = useState(null);
  const [rollupLoading, setRollupLoading] = useState(true);
  const [rollupError, setRollupError] = useState('');

  const fetchGroupSites = useCallback(async () => {
    setSitesLoading(true);
    const res = await getSites();
    if (res.success) {
      setSites(res.data || []);
    } else {
      setSitesError(res.message || 'Unable to retrieve group project sites.');
    }
    setSitesLoading(false);
  }, []);

  const fetchRollup = useCallback(async () => {
    setRollupLoading(true);
    setRollupError('');
    const res = await getGroupRollup(rollupPeriod);
    if (res.success) {
      setRollupData(res.data || res);
    } else {
      setRollupError(res.message || 'Unable to retrieve group rollup.');
    }
    setRollupLoading(false);
  }, [rollupPeriod]);

  useEffect(() => {
    fetchGroupSites();
    fetchRollup();
  }, [fetchGroupSites, fetchRollup]);

  const hasApprovedData = Boolean(rollupData && (rollupData.eligibleApprovedSubmissionsCount > 0 || rollupData.approvedSubmissionsCount > 0));

  return (
    <div className="space-y-6">
      {/* Header Profile Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 uppercase">
                  Group ESG Executive
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Conglomerate Scope: {sites.length} Total Sites</span>
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 mt-6 -mb-6 space-x-6">
          <button
            onClick={() => setSearchParams({ tab: 'dashboard' })}
            className={`pb-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'dashboard'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Executive Rollup & Metrics
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'sites' })}
            className={`pb-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'sites'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Group Sites Directory ({sites.length})
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'audit' })}
            className={`pb-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'audit'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Methodology & Provenance
          </button>
        </div>
      </div>

      {/* Tab 1: Executive Rollup & Metrics */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Period Selector & Audit Notice */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                <span>Live Consolidated ESG Rollup (SEBI BRSR Aligned)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Aggregated solely from verified, subsidiary-approved submissions in MongoDB.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-600">Reporting Period:</label>
              <select
                value={rollupPeriod}
                onChange={(e) => setRollupPeriod(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 py-1.5 px-3 font-semibold focus:ring-teal-500"
              >
                <option value="FY2025-Q3">FY2025-Q3 (Oct-Dec 2024)</option>
                <option value="FY2025-Q2">FY2025-Q2 (Jul-Sep 2024)</option>
                <option value="FY2025-Q1">FY2025-Q1 (Apr-Jun 2024)</option>
                <option value="FY2024-Q4">FY2024-Q4 (Jan-Mar 2024)</option>
              </select>
            </div>
          </div>

          {rollupError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{rollupError}</span>
            </div>
          )}

          {/* Completeness & Provenance Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reporting Completeness</span>
              <p className="text-2xl font-bold text-teal-700 mt-2">
                {rollupLoading ? '—' : `${rollupData?.reportingCompleteness_pct ?? 0}%`}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {rollupData?.eligibleApprovedSubmissionsCount || 0} of {rollupData?.totalSitesEligible || sites.length} sites approved
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Submissions</span>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {rollupLoading ? '—' : rollupData?.eligibleApprovedSubmissionsCount || 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {rollupData?.pendingReviewSubmissionsCount || 0} currently under review
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Data Provenance Status</span>
              <div className="mt-2">
                <span className="px-2 py-1 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Prototype Seed Data (Unverified)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Requires corporate entity registration</p>
            </div>
          </div>

          {/* Environmental KPI Rollup Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Scope 1 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scope 1 Direct GHG</span>
                <Flame className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {rollupLoading ? (
                  '...'
                ) : hasApprovedData && rollupData?.consolidatedMetrics?.totalScope1Emissions_tCO2e != null ? (
                  `${rollupData.consolidatedMetrics.totalScope1Emissions_tCO2e} tCO₂e`
                ) : (
                  <span className="text-sm font-normal text-slate-400">Not yet reported</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">IPCC 2006 Fuel Combustion Factors</p>
            </div>

            {/* Scope 2 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scope 2 Indirect Electricity</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {rollupLoading ? (
                  '...'
                ) : hasApprovedData && rollupData?.consolidatedMetrics?.totalScope2Emissions_tCO2e != null ? (
                  `${rollupData.consolidatedMetrics.totalScope2Emissions_tCO2e} tCO₂e`
                ) : (
                  <span className="text-sm font-normal text-slate-400">Not yet reported</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">CEA India Grid Baseline v19.0 (0.000716 tCO₂e/kWh)</p>
            </div>

            {/* Total Consolidated GHG */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Consolidated GHG</span>
                <BarChart3 className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-bold text-teal-800 font-mono">
                {rollupLoading ? (
                  '...'
                ) : hasApprovedData && rollupData?.consolidatedMetrics?.totalConsolidatedGHG_tCO2e != null ? (
                  `${rollupData.consolidatedMetrics.totalConsolidatedGHG_tCO2e} tCO₂e`
                ) : (
                  <span className="text-sm font-normal text-slate-400">Not yet reported</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Scope 1 + Scope 2 Consolidated Footprint</p>
            </div>

            {/* Water */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Water Consumption</span>
                <Droplets className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {rollupLoading ? (
                  '...'
                ) : hasApprovedData && rollupData?.consolidatedMetrics?.totalNetWaterConsumption_m3 != null ? (
                  `${rollupData.consolidatedMetrics.totalNetWaterConsumption_m3} m³`
                ) : (
                  <span className="text-sm font-normal text-slate-400">Not yet reported</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Withdrawal minus verified discharge</p>
            </div>

            {/* Waste Recycling */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consolidated Recycling Rate</span>
                <Recycle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {rollupLoading ? (
                  '...'
                ) : hasApprovedData && rollupData?.consolidatedMetrics?.consolidatedWasteRecyclingRate_pct != null ? (
                  `${rollupData.consolidatedMetrics.consolidatedWasteRecyclingRate_pct}%`
                ) : (
                  <span className="text-sm font-normal text-slate-400">Not yet reported</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Diverted waste over total generated</p>
            </div>

            {/* Health & Safety */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Workplace Safety (Fatalities)</span>
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {rollupLoading ? (
                  '...'
                ) : hasApprovedData && rollupData?.consolidatedMetrics?.totalFatalities != null ? (
                  `${rollupData.consolidatedMetrics.totalFatalities} (Zero Target)`
                ) : (
                  <span className="text-sm font-normal text-slate-400">Not yet reported</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">SEBI BRSR Principle 3 Occupational Safety</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Group Sites Directory */}
      {activeTab === 'sites' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                Consolidated Enterprise Project Sites ({sites.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All operating project sites across all subsidiaries in this corporate conglomerate.
              </p>
            </div>
          </div>

          {sitesError && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{sitesError}</span>
            </div>
          )}

          {sitesLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Querying enterprise sites from MongoDB...</div>
          ) : sites.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No sites found in corporate group.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {sites.map((site) => (
                <div key={site._id} className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                        {site.code || 'SITE-CODE'}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{site.name}</h3>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      {site.provenance?.verificationStatus || 'Unverified Seed'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <div><span className="text-slate-400">Location:</span> {site.location}, {site.state}</div>
                    <div><span className="text-slate-400">Type:</span> {site.siteType}</div>
                    <div><span className="text-slate-400">Subsidiary:</span> {site.subsidiaryId?.name || 'Enterprise Subsidiary'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Methodology & Provenance */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600" />
              Environmental Calculation Methodology & Regulatory Framework
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditable sources and documented emission factors utilized in the calculation engine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block">Scope 1 Emissions Methodology</span>
              <p className="text-slate-600">
                Direct emissions from stationary and mobile combustion calculated in accordance with IPCC 2006 Guidelines for National Greenhouse Gas Inventories:
              </p>
              <ul className="list-disc list-inside space-y-1 font-mono text-slate-700">
                <li>Diesel: 0.00268 tCO₂e per Liter</li>
                <li>Petrol: 0.00231 tCO₂e per Liter</li>
              </ul>
              <span className="text-[10px] text-slate-400 block">Citation: IPCC 2006 Vol 2 (Energy), Ch 2 (Stationary Combustion).</span>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block">Scope 2 Emissions Methodology</span>
              <p className="text-slate-600">
                Indirect emissions from purchased grid electricity calculated using official national grid factors:
              </p>
              <ul className="list-disc list-inside space-y-1 font-mono text-slate-700">
                <li>Grid Factor: 0.000716 tCO₂e per kWh (0.716 kg CO₂e/kWh)</li>
              </ul>
              <span className="text-[10px] text-slate-400 block">
                Citation: Central Electricity Authority (CEA), Government of India, CO₂ Baseline Database for the Indian Power Sector, Version 19.0 (Dec 2023).
              </span>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block">Water & Waste Calculations</span>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                <li>Net Water Consumption = Water Withdrawal (m³) − Water Discharge (m³)</li>
                <li>Waste Recycling Rate = (Recycled Waste MT / Total Waste Generated MT) × 100</li>
                <li>Zero Denominator Safety: Handled without division-by-zero errors.</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block">SEBI BRSR Regulatory Scope</span>
              <p className="text-slate-600">
                Aligns with SEBI Circular SEBI/HO/CFD/CMD-2/P/CIR/2021/562 (Principle 6: Essential Indicators).
              </p>
              <div className="p-2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                <strong>Compliance Note:</strong> This prototype implements Essential Environmental & Occupational Safety indicators. Additional governance principles require corporate filing verification.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
