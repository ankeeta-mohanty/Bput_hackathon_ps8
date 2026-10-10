import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Verifying authorization...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Map role to their dashboard
    const roleDashboards = {
      SITE_MANAGER: '/site-dashboard',
      SUBSIDIARY_ESG_MANAGER: '/subsidiary-dashboard',
      GROUP_ESG_EXECUTIVE: '/group-dashboard',
    };
    const ownDashboard = roleDashboards[user?.role] || '/';

    return (
      <div className="bg-white rounded-xl border border-rose-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm my-8">
        <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200 uppercase tracking-wider">
          Access Denied
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-3">Insufficient Role Permissions</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
          Your current account is assigned to the <span className="font-semibold text-slate-700">{user?.role}</span> role. This view is restricted to <span className="font-semibold text-slate-700">{allowedRoles.join(', ')}</span>.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to={ownDashboard}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <span>Go to My Authorized Dashboard</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
