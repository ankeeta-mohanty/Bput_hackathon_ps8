import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { 
  getSites, 
  getSubmissions, 
  reviewSubmission 
} from '../services/api';
import { 
  Building2, 
  Building, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  CheckSquare, 
  XCircle 
} from 'lucide-react';

export default function SubsidiaryDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [sitesError, setSitesError] = useState('');

  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);

  // Review action modal or inline state
  const [selectedSub, setSelectedSub] = useState(null);
  const [reviewComments, setReviewComments] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState({ type: '', text: '' });

  const fetchSubsidiarySites = useCallback(async () => {
    setSitesLoading(true);
    const res = await getSites();
    if (res.success) {
      setSites(res.data || []);
    } else {
      setSitesError(res.message || 'Unable to retrieve subsidiary project sites.');
    }
    setSitesLoading(false);
  }, []);

  const fetchSubsidiarySubmissions = useCallback(async () => {
    setSubmissionsLoading(true);
    const res = await getSubmissions();
    if (res.success) {
      setSubmissions(res.data || []);
    }
    setSubmissionsLoading(false);
  }, []);

  useEffect(() => {
    fetchSubsidiarySites();
    fetchSubsidiarySubmissions();
  }, [fetchSubsidiarySites, fetchSubsidiarySubmissions]);

  const handleReviewAction = async (submissionId, decision) => {
    setReviewFeedback({ type: '', text: '' });
    setReviewLoading(true);

    const res = await reviewSubmission(submissionId, {
      decision,
      comments: reviewComments || (decision === 'APPROVE' ? 'Verified and approved for group consolidation.' : 'Please correct reported metrics.'),
    });
    setReviewLoading(false);

    if (res.success) {
      setReviewFeedback({
        type: 'success',
        text: `Submission successfully ${decision === 'APPROVE' ? 'APPROVED' : 'returned for REVISION'} in MongoDB!`,
      });
      setSelectedSub(null);
      setReviewComments('');
      fetchSubsidiarySubmissions();
    } else {
      setReviewFeedback({
        type: 'error',
        text: res.message || 'Unable to update submission review status.',
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">DRAFT</span>;
      case 'SUBMITTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">PENDING REVIEW</span>;
      case 'APPROVED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">APPROVED</span>;
      case 'REVISION_REQUIRED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">REVISION REQUIRED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">{status}</span>;
    }
  };

  const pendingReviewCount = submissions.filter((s) => s.status === 'SUBMITTED').length;
  const approvedCount = submissions.filter((s) => s.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 uppercase">
                  Subsidiary ESG Manager
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Subsidiary Sites: {sites.length}</span>
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
            Subsidiary Sites ({sites.length})
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'review' })}
            className={`pb-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'review'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Review & Audit Queue ({pendingReviewCount} pending)
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Authorized Operating Sites</span>
              <p className="text-2xl font-bold text-slate-900 mt-2">{sites.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">Sites in your subsidiary</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Submissions Under Review</span>
              <p className="text-2xl font-bold text-blue-600 mt-2">{pendingReviewCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Awaiting audit approval</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Records</span>
              <p className="text-2xl font-bold text-emerald-700 mt-2">{approvedCount}</p>
              <p className="text-[11px] text-slate-500 mt-1">Eligible for group consolidation</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Subsidiary Submissions Status</h2>
              <button
                onClick={() => setSearchParams({ tab: 'review' })}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800"
              >
                Go to Review Queue →
              </button>
            </div>
            {submissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No ESG submissions currently recorded for sites in this subsidiary.
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
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{sub.siteId?.name || 'Subsidiary Site'}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{sub.reportingPeriod}</td>
                        <td className="py-2.5 px-3 font-mono">{sub.calculatedMetrics?.scope1Emissions_tCO2e ?? '—'}</td>
                        <td className="py-2.5 px-3 font-mono">{sub.calculatedMetrics?.scope2Emissions_tCO2e ?? '—'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-teal-800">{sub.calculatedMetrics?.totalGHGEmissions_tCO2e ?? '—'}</td>
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

      {/* Sites Tab */}
      {activeTab === 'sites' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                Operating Sites in Authorized Subsidiary ({sites.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Restricted to your authorized subsidiary via backend RBAC queries.
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
            <div className="p-8 text-center text-xs text-slate-500">Querying subsidiary sites from MongoDB...</div>
          ) : sites.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No project sites found in your assigned subsidiary.</div>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Review Queue Tab */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          {reviewFeedback.text && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                reviewFeedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {reviewFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{reviewFeedback.text}</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-teal-600" />
                  Subsidiary Review & Audit Queue ({submissions.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify reported measurements, review emission calculation methodology, and approve for group consolidation.
                </p>
              </div>
              <button
                onClick={fetchSubsidiarySubmissions}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800"
              >
                Refresh Queue
              </button>
            </div>

            {submissionsLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">Querying submissions from MongoDB...</div>
            ) : submissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No submissions are currently in the review queue.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-4">
                {submissions.map((sub) => (
                  <div key={sub._id} className="py-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-slate-900">{sub.siteId?.name || 'Site'}</span>
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {sub.reportingPeriod}
                        </span>
                        {getStatusBadge(sub.status)}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Submitted by: {sub.submittedBy?.name || 'Site Manager'}
                      </span>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Scope 1</span>
                        <span className="font-mono font-bold text-slate-800">{sub.calculatedMetrics?.scope1Emissions_tCO2e ?? '—'} tCO₂e</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Scope 2</span>
                        <span className="font-mono font-bold text-slate-800">{sub.calculatedMetrics?.scope2Emissions_tCO2e ?? '—'} tCO₂e</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Total GHG</span>
                        <span className="font-mono font-bold text-teal-800">{sub.calculatedMetrics?.totalGHGEmissions_tCO2e ?? '—'} tCO₂e</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Net Water</span>
                        <span className="font-mono font-bold text-slate-800">{sub.calculatedMetrics?.netWaterConsumption_m3 ?? '—'} m³</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Recycling Rate</span>
                        <span className="font-mono font-bold text-slate-800">{sub.calculatedMetrics?.wasteRecyclingRate_pct ?? '—'}%</span>
                      </div>
                    </div>

                    {/* Review Controls (for SUBMITTED) */}
                    {sub.status === 'SUBMITTED' && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <div className="flex-1 max-w-md">
                          <input
                            type="text"
                            placeholder="Add audit comments or revision notes..."
                            value={selectedSub === sub._id ? reviewComments : ''}
                            onChange={(e) => {
                              setSelectedSub(sub._id);
                              setReviewComments(e.target.value);
                            }}
                            className="w-full text-xs p-1.5 rounded border border-slate-300 focus:ring-teal-500"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={reviewLoading}
                            onClick={() => handleReviewAction(sub._id, 'REQUEST_REVISION')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Request Revision</span>
                          </button>
                          <button
                            type="button"
                            disabled={reviewLoading}
                            onClick={() => handleReviewAction(sub._id, 'APPROVE')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Consolidate</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {sub.status === 'APPROVED' && (
                      <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified and approved. Included in Group Consolidated Rollup.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
