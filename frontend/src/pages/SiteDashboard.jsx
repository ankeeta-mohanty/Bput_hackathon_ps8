import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { 
  getSites, 
  createOrUpdateSubmission, 
  getSubmissions, 
  submitSubmission 
} from '../services/api';
import { 
  Briefcase, 
  Building2, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  FileEdit, 
  Send, 
  Calculator, 
  Flame, 
  Droplets, 
  UserCheck 
} from 'lucide-react';

export default function SiteDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [sitesError, setSitesError] = useState('');

  // Submissions list state
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Data entry form state
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [reportingPeriod, setReportingPeriod] = useState('FY2025-Q3');
  const [formData, setFormData] = useState({
    electricityKwh: '',
    dieselLiters: '',
    petrolLiters: '',
    waterWithdrawalM3: '',
    waterDischargeM3: '',
    totalWasteGeneratedMT: '',
    wasteRecycledMT: '',
    workforceCount: '',
    fatalitiesCount: '0',
    ehsPolicyAdopted: 'true',
    notes: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [currentSubmissionId, setCurrentSubmissionId] = useState(null);

  const fetchSites = useCallback(async () => {
    setSitesLoading(true);
    const res = await getSites();
    if (res.success) {
      setSites(res.data || []);
      if (res.data?.length > 0 && !selectedSiteId) {
        setSelectedSiteId(res.data[0]._id);
      }
    } else {
      setSitesError(res.message || 'Unable to retrieve assigned project sites.');
    }
    setSitesLoading(false);
  }, [selectedSiteId]);

  const fetchSubmissionsList = useCallback(async () => {
    setSubmissionsLoading(true);
    const res = await getSubmissions();
    if (res.success) {
      setSubmissions(res.data || []);
    }
    setSubmissionsLoading(false);
  }, []);

  useEffect(() => {
    fetchSites();
    fetchSubmissionsList();
  }, [fetchSites, fetchSubmissionsList]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Live client calculation preview
  const elecKwh = parseFloat(formData.electricityKwh) || 0;
  const dieselL = parseFloat(formData.dieselLiters) || 0;
  const petrolL = parseFloat(formData.petrolLiters) || 0;
  const waterIn = parseFloat(formData.waterWithdrawalM3) || 0;
  const waterOut = parseFloat(formData.waterDischargeM3) || 0;
  const wasteTot = parseFloat(formData.totalWasteGeneratedMT) || 0;
  const wasteRec = parseFloat(formData.wasteRecycledMT) || 0;

  const previewScope1 = Number(((dieselL * 0.00268) + (petrolL * 0.00231)).toFixed(4));
  const previewScope2 = Number((elecKwh * 0.000716).toFixed(4));
  const previewTotalGHG = Number((previewScope1 + previewScope2).toFixed(4));
  const previewNetWater = Number(Math.max(0, waterIn - waterOut).toFixed(2));
  const previewRecyclingRate = wasteTot > 0 ? Number(((wasteRec / wasteTot) * 100).toFixed(2)) : 0;

  // Helper to parse reporting period like 'FY2025-Q3' into reportingYear (number) and reportingPeriod (string)
  const parseReportingPeriod = (val) => {
    const str = String(val || '').trim();
    const match = str.match(/(?:FY)?(\d{4})[-_\s]?(Q[1-4]|Annual|M\d{2})/i);
    if (match) {
      return {
        reportingYear: parseInt(match[1], 10),
        reportingPeriod: match[2].toUpperCase(),
      };
    }
    return {
      reportingYear: 2025,
      reportingPeriod: str || 'Q3',
    };
  };

  const handleSaveDraft = async () => {
    setStatusMessage({ type: '', text: '' });
    if (!selectedSiteId) {
      setStatusMessage({ type: 'error', text: 'Please select an assigned project site.' });
      return null;
    }

    setActionLoading(true);
    const { reportingYear: derivedYear, reportingPeriod: derivedPeriod } = parseReportingPeriod(reportingPeriod);

    const payload = {
      siteId: selectedSiteId,
      reportingYear: derivedYear,
      reportingPeriod: derivedPeriod,
      rawMetrics: {
        energy: {
          electricityKWh: formData.electricityKwh === '' ? null : Number(formData.electricityKwh),
          dieselLitres: formData.dieselLiters === '' ? null : Number(formData.dieselLiters),
          petrolLitres: formData.petrolLiters === '' ? null : Number(formData.petrolLiters),
        },
        water: {
          withdrawalKL: formData.waterWithdrawalM3 === '' ? null : Number(formData.waterWithdrawalM3),
          dischargeKL: formData.waterDischargeM3 === '' ? null : Number(formData.waterDischargeM3),
        },
        waste: {
          hazardousWasteMT: null,
          nonHazardousWasteMT: formData.totalWasteGeneratedMT === '' ? null : Number(formData.totalWasteGeneratedMT),
          recycledWasteMT: formData.wasteRecycledMT === '' ? null : Number(formData.wasteRecycledMT),
        },
        social: {
          totalEmployees: formData.workforceCount === '' ? null : Number(formData.workforceCount),
          femaleEmployees: null,
          fatalities: formData.fatalitiesCount === '' ? null : Number(formData.fatalitiesCount),
          lostTimeInjuries: null,
        },
        governance: {
          antiCorruptionPolicyApproved: formData.ehsPolicyAdopted === 'true',
          poshComplaintsReceived: null,
          poshComplaintsResolved: null,
        },
      },
      dataProvenance: {
        collectionMethod: 'MANUAL_ENTRY',
        evidenceNotes: formData.notes || '',
        sourceDocuments: [],
      },
    };

    const res = await createOrUpdateSubmission(payload);
    setActionLoading(false);

    if (res.success) {
      setCurrentSubmissionId(res.data._id);
      const s1 = res.data.calculatedMetrics?.scope1Emissions_tCO2e ?? res.data.calculatedMetrics?.emissions?.totalScope1TCO2e ?? 0;
      const s2 = res.data.calculatedMetrics?.scope2Emissions_tCO2e ?? res.data.calculatedMetrics?.emissions?.totalScope2TCO2e ?? 0;
      setStatusMessage({ 
        type: 'success', 
        text: `Draft saved successfully! Record persisted in MongoDB with Scope 1: ${s1} tCO₂e, Scope 2: ${s2} tCO₂e.` 
      });
      fetchSubmissionsList();
      return res.data._id;
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Failed to save submission draft.' });
      return null;
    }
  };

  const handleSubmitForReview = async () => {
    setStatusMessage({ type: '', text: '' });
    let subId = currentSubmissionId;
    if (!subId) {
      // First save draft
      subId = await handleSaveDraft();
      if (!subId) return;
    }

    setActionLoading(true);
    const res = await submitSubmission(subId, 'Submitted for subsidiary ESG manager verification.');
    setActionLoading(false);

    if (res.success) {
      setStatusMessage({ 
        type: 'success', 
        text: 'Submission successfully forwarded to Subsidiary ESG Manager for audit and approval!' 
      });
      fetchSubmissionsList();
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Unable to submit for review.' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">DRAFT</span>;
      case 'SUBMITTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">UNDER REVIEW</span>;
      case 'APPROVED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">APPROVED</span>;
      case 'REVISION_REQUIRED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">REVISION REQUIRED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase">
                  Site Manager
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Assigned Sites: {sites.length}</span>
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
            Overview & Metrics
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'sites' })}
            className={`pb-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'sites'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Assigned Sites ({sites.length})
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'entry' })}
            className={`pb-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'entry'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ESG Data Entry Form
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'submissions' })}
            className={`pb-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'submissions'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            My Submissions ({submissions.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Operational Sites</span>
              <p className="text-2xl font-bold text-slate-900 mt-2">{sites.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">Authorized under your profile</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Submissions Recorded</span>
              <p className="text-2xl font-bold text-slate-900 mt-2">{submissions.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">Active periods in database</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Reports</span>
              <p className="text-2xl font-bold text-emerald-700 mt-2">
                {submissions.filter((s) => s.status === 'APPROVED').length}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Ready for group consolidation</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Recent Reporting Activity</h2>
              <button
                onClick={() => setSearchParams({ tab: 'entry' })}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800"
              >
                + Enter New Period Data
              </button>
            </div>
            {submissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No ESG submissions recorded yet for your assigned sites. Use the ESG Data Entry tab to record operational measurements.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Site</th>
                      <th className="py-2.5 px-3">Period</th>
                      <th className="py-2.5 px-3">Scope 1 (tCO₂e)</th>
                      <th className="py-2.5 px-3">Scope 2 (tCO₂e)</th>
                      <th className="py-2.5 px-3">Total GHG</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.map((sub) => (
                      <tr key={sub._id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{sub.siteId?.name || 'Assigned Site'}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {sub.reportingYear ? `FY${sub.reportingYear}-${sub.reportingPeriod}` : sub.reportingPeriod}
                        </td>
                        <td className="py-2.5 px-3 font-mono">{sub.calculatedMetrics?.scope1Emissions_tCO2e ?? sub.calculatedMetrics?.emissions?.totalScope1TCO2e ?? 'Not reported'}</td>
                        <td className="py-2.5 px-3 font-mono">{sub.calculatedMetrics?.scope2Emissions_tCO2e ?? sub.calculatedMetrics?.emissions?.totalScope2TCO2e ?? 'Not reported'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-teal-800">{sub.calculatedMetrics?.totalGHGEmissions_tCO2e ?? sub.calculatedMetrics?.emissions?.grossGHGEmissions_tCO2e ?? 'Not reported'}</td>
                        <td className="py-2.5 px-3">{getStatusBadge(sub.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Assigned Sites */}
      {activeTab === 'sites' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                Assigned Operational Sites ({sites.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Organizational sites assigned to your user account and scoped via backend queries.
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
            <div className="p-8 text-center text-xs text-slate-500">Querying assigned site records from MongoDB...</div>
          ) : sites.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No sites have been assigned to your account.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                    <div><span className="text-slate-400">Subsidiary:</span> {site.subsidiaryId?.name || 'Assigned Subsidiary'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: ESG Data Entry Form */}
      {activeTab === 'entry' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileEdit className="w-4 h-4 text-teal-600" />
                  Site-Level ESG Data Collection Form
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record actual energy, water, waste, and social disclosures for the selected reporting period.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Target Site</label>
                  <select
                    value={selectedSiteId}
                    onChange={(e) => setSelectedSiteId(e.target.value)}
                    className="text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 font-medium focus:ring-teal-500"
                  >
                    {sites.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Reporting Period</label>
                  <select
                    value={reportingPeriod}
                    onChange={(e) => setReportingPeriod(e.target.value)}
                    className="text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 font-medium focus:ring-teal-500"
                  >
                    <option value="FY2025-Q3">FY2025-Q3 (Oct-Dec 2024)</option>
                    <option value="FY2025-Q2">FY2025-Q2 (Jul-Sep 2024)</option>
                    <option value="FY2025-Q1">FY2025-Q1 (Apr-Jun 2024)</option>
                    <option value="FY2024-Q4">FY2024-Q4 (Jan-Mar 2024)</option>
                  </select>
                </div>
              </div>
            </div>

            {statusMessage.text && (
              <div
                className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Metric Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Energy & Fuels */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span>Energy & Fuel Consumption</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Grid Electricity Consumption (kWh)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.electricityKwh}
                    onChange={(e) => handleInputChange('electricityKwh', e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-[10px] text-slate-400">Used for Scope 2 calculation (CEA v19: 0.000716 tCO₂e/kWh)</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Diesel Consumption (Liters)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.dieselLiters}
                    onChange={(e) => handleInputChange('dieselLiters', e.target.value)}
                    placeholder="e.g. 4000"
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-[10px] text-slate-400">Stationary combustion (IPCC 2006: 0.00268 tCO₂e/L)</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Petrol / Gasoline Consumption (Liters)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.petrolLiters}
                    onChange={(e) => handleInputChange('petrolLiters', e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-[10px] text-slate-400">Mobile combustion (IPCC 2006: 0.00231 tCO₂e/L)</span>
                </div>
              </div>

              {/* Water & Waste */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  <span>Water & Waste Metrics</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Water Withdrawal (m³)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.waterWithdrawalM3}
                    onChange={(e) => handleInputChange('waterWithdrawalM3', e.target.value)}
                    placeholder="e.g. 12000"
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-300 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Water Discharge (m³)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.waterDischargeM3}
                    onChange={(e) => handleInputChange('waterDischargeM3', e.target.value)}
                    placeholder="e.g. 4000"
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-300 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Total Waste Generated (Metric Tonnes)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.totalWasteGeneratedMT}
                    onChange={(e) => handleInputChange('totalWasteGeneratedMT', e.target.value)}
                    placeholder="e.g. 150"
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-300 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Waste Recycled / Diverted (Metric Tonnes)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.wasteRecycledMT}
                    onChange={(e) => handleInputChange('wasteRecycledMT', e.target.value)}
                    placeholder="e.g. 75"
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-300 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Social & Governance */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Social & Safety Metrics</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Total Workforce Headcount</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.workforceCount}
                    onChange={(e) => handleInputChange('workforceCount', e.target.value)}
                    placeholder="e.g. 240"
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-300 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Work-Related Fatalities (Zero Target)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.fatalitiesCount}
                    onChange={(e) => handleInputChange('fatalitiesCount', e.target.value)}
                    placeholder="0"
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-[10px] text-slate-400">Zero is recorded as an authentic measurement, not missing.</span>
                </div>
              </div>

              {/* Governance & Evidence */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Governance & Operational Notes</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">EHS Policy Formally Adopted at Site?</label>
                  <select
                    value={formData.ehsPolicyAdopted}
                    onChange={(e) => handleInputChange('ehsPolicyAdopted', e.target.value)}
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-300 focus:ring-teal-500"
                  >
                    <option value="true">Yes — Formally Adopted & Audited</option>
                    <option value="false">No — In Draft / Pending Approval</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Operational Notes / Supporting Citations</label>
                  <textarea
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Citations, utility invoice references, logbook numbers..."
                    className="w-full mt-1 p-2 text-xs rounded-lg border border-slate-300 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Calculation Preview Banner */}
            <div className="mt-6 p-4 rounded-xl bg-teal-50/70 border border-teal-200">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-900 mb-3">
                <Calculator className="w-4 h-4 text-teal-700" />
                <span>Live Environmental Calculations (Automated Engine Preview)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="bg-white p-2.5 rounded-lg border border-teal-200">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Scope 1 (tCO₂e)</div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{previewScope1}</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-teal-200">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Scope 2 (tCO₂e)</div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{previewScope2}</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-teal-200">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Total GHG (tCO₂e)</div>
                  <div className="text-sm font-bold text-teal-800 font-mono mt-0.5">{previewTotalGHG}</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-teal-200">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Net Water (m³)</div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{previewNetWater}</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-teal-200">
                  <div className="text-[10px] uppercase font-semibold text-slate-500">Recycling Rate</div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{previewRecyclingRate}%</div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>Save Draft in Database</span>
              </button>
              <button
                type="button"
                onClick={handleSubmitForReview}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Subsidiary Review</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: My Submissions */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-teal-600" />
                My ESG Reporting Submissions ({submissions.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit history of all drafts, submitted records, and approvals for your assigned sites.
              </p>
            </div>
            <button
              onClick={fetchSubmissionsList}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800"
            >
              Refresh Records
            </button>
          </div>

          {submissionsLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Querying submissions from MongoDB...</div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No ESG submissions have been recorded for your account. Use the Data Entry Form to record measurements.
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Site</th>
                    <th className="py-2.5 px-3">Period</th>
                    <th className="py-2.5 px-3">Scope 1 (tCO₂e)</th>
                    <th className="py-2.5 px-3">Scope 2 (tCO₂e)</th>
                    <th className="py-2.5 px-3">Total GHG</th>
                    <th className="py-2.5 px-3">Net Water</th>
                    <th className="py-2.5 px-3">Recycling %</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{sub.siteId?.name || 'Assigned Site'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {sub.reportingYear ? `FY${sub.reportingYear}-${sub.reportingPeriod}` : sub.reportingPeriod}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{sub.calculatedMetrics?.scope1Emissions_tCO2e ?? sub.calculatedMetrics?.emissions?.totalScope1TCO2e ?? '—'}</td>
                      <td className="py-2.5 px-3 font-mono">{sub.calculatedMetrics?.scope2Emissions_tCO2e ?? sub.calculatedMetrics?.emissions?.totalScope2TCO2e ?? '—'}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-800">{sub.calculatedMetrics?.totalGHGEmissions_tCO2e ?? sub.calculatedMetrics?.emissions?.grossGHGEmissions_tCO2e ?? '—'}</td>
                      <td className="py-2.5 px-3 font-mono">{sub.calculatedMetrics?.netWaterConsumption_m3 ?? sub.calculatedMetrics?.water?.netConsumption_m3 ?? '—'} m³</td>
                      <td className="py-2.5 px-3 font-mono">{sub.calculatedMetrics?.wasteRecyclingRate_pct ?? sub.calculatedMetrics?.waste?.recyclingRate_pct ?? '—'}%</td>
                      <td className="py-2.5 px-3">{getStatusBadge(sub.status)}</td>
                      <td className="py-2.5 px-3 text-right">
                        {sub.status === 'DRAFT' && (
                          <button
                            onClick={async () => {
                              await submitSubmission(sub._id, 'Submitted for subsidiary audit');
                              fetchSubmissionsList();
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 px-2 py-1 rounded border border-teal-200"
                          >
                            <Send className="w-3 h-3" />
                            <span>Submit</span>
                          </button>
                        )}
                        {sub.status === 'SUBMITTED' && (
                          <span className="text-[11px] text-slate-400 italic">Pending Audit</span>
                        )}
                        {sub.status === 'APPROVED' && (
                          <span className="text-[11px] text-emerald-700 font-medium">Consolidated</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
