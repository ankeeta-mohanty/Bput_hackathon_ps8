import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { 
  ShieldCheck, 
  LogOut, 
  User 
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'SITE_MANAGER':
        return 'Site Manager';
      case 'SUBSIDIARY_ESG_MANAGER':
        return 'Subsidiary Manager';
      case 'GROUP_ESG_EXECUTIVE':
        return 'Group Executive';
      default:
        return 'User';
    }
  };

  const renderRoleNavigation = () => {
    if (!isAuthenticated || !user) return null;

    if (user.role === 'SITE_MANAGER') {
      return (
        <div className="hidden md:flex items-center space-x-1">
          <Link
            to="/site-dashboard"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              location.pathname === '/site-dashboard' && !location.search.includes('tab=')
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/site-dashboard?tab=sites"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              location.search.includes('tab=sites')
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Assigned Sites
          </Link>
          <Link
            to="/site-dashboard?tab=entry"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              location.search.includes('tab=entry')
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            ESG Data Entry
          </Link>
          <Link
            to="/site-dashboard?tab=submissions"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              location.search.includes('tab=submissions')
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            My Submissions
          </Link>
        </div>
      );
    }

    if (user.role === 'SUBSIDIARY_ESG_MANAGER') {
      return (
        <div className="hidden md:flex items-center space-x-1">
          <Link
            to="/subsidiary-dashboard"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              location.pathname === '/subsidiary-dashboard' && !location.search.includes('tab=')
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/subsidiary-dashboard?tab=sites"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              location.search.includes('tab=sites')
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Subsidiary Sites
          </Link>
          <Link
            to="/subsidiary-dashboard?tab=review"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              location.search.includes('tab=review')
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Submission Review
          </Link>
        </div>
      );
    }

    if (user.role === 'GROUP_ESG_EXECUTIVE') {
      return (
        <div className="hidden md:flex items-center space-x-1">
          <Link
            to="/group-dashboard"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              location.pathname === '/group-dashboard' && !location.search.includes('tab=')
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/group-dashboard?tab=sites"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              location.search.includes('tab=sites')
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Group Overview
          </Link>
          <Link
            to="/group-dashboard?tab=rollup"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              location.search.includes('tab=rollup')
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Consolidation & Rollup
          </Link>
          <Link
            to="/group-dashboard?tab=audit"
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              location.search.includes('tab=audit')
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Methodology & Provenance
          </Link>
        </div>
      );
    }

    return null;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Branding */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm group-hover:bg-teal-700 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                Corporate ESG Reporting Portal
              </span>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                SEBI BRSR & Sustainability Reporting System
              </p>
            </div>
          </Link>

          {/* Role Navigation */}
          {renderRoleNavigation()}

          {/* Authentication & User Controls */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-teal-700 font-medium">
                    {getRoleLabel()}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors"
                  title="Sign out of portal"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
