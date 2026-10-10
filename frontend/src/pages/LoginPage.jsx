import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Loader2,
  Building2,
  Users,
  Briefcase
} from 'lucide-react';

export default function LoginPage() {
  const { login, authError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientError, setClientError] = useState('');

  const redirectByRole = React.useCallback((role) => {
    const from = location.state?.from?.pathname;
    if (from && from !== '/login') {
      navigate(from, { replace: true });
      return;
    }

    switch (role) {
      case 'SITE_MANAGER':
        navigate('/site-dashboard', { replace: true });
        break;
      case 'SUBSIDIARY_ESG_MANAGER':
        navigate('/subsidiary-dashboard', { replace: true });
        break;
      case 'GROUP_ESG_EXECUTIVE':
        navigate('/group-dashboard', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
    }
  }, [location.state?.from?.pathname, navigate]);

  useEffect(() => {
    if (isAuthenticated && user) {
      redirectByRole(user.role);
    }
  }, [isAuthenticated, user, redirectByRole]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setClientError('');

    if (!email.trim()) {
      setClientError('Please enter your organizational email address.');
      return;
    }
    if (!password) {
      setClientError('Please enter your password.');
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (result.success && result.user) {
      redirectByRole(result.user.role);
    }
  };

  const fillPrototypeCredentials = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('Demo@2026!');
    setClientError('');
  };

  return (
    <div className="max-w-md mx-auto my-8 sm:my-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-sm mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Authentication</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your authorized ESG & BRSR reporting workspace
          </p>
        </div>

        {/* Error Alert */}
        {(clientError || authError) && (
          <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{clientError || authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Organizational Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Prototype Evaluation Accounts Helper */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            Prototype Evaluation Accounts:
          </div>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => fillPrototypeCredentials('site.manager@meil.demo')}
              className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-left text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-800">Site Manager</div>
                  <div className="text-[10px] text-slate-500">site.manager@meil.demo</div>
                </div>
              </div>
              <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                Select
              </span>
            </button>

            <button
              type="button"
              onClick={() => fillPrototypeCredentials('subsidiary.manager@meil.demo')}
              className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-left text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-800">Subsidiary ESG Manager</div>
                  <div className="text-[10px] text-slate-500">subsidiary.manager@meil.demo</div>
                </div>
              </div>
              <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                Select
              </span>
            </button>

            <button
              type="button"
              onClick={() => fillPrototypeCredentials('group.executive@meil.demo')}
              className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-left text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-800">Group ESG Executive</div>
                  <div className="text-[10px] text-slate-500">group.executive@meil.demo</div>
                </div>
              </div>
              <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                Select
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
