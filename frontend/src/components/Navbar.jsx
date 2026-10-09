import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ChevronRight } from 'lucide-react';

export default function Navbar({ systemStatus }) {
  const isOnline = systemStatus?.server === 'online';
  const dbConnected = systemStatus?.database === 'connected';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  ESG Reporting Portal
                </span>
                <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  BRSR Core
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Centralized BRSR & Sustainability Data Management
              </p>
            </div>
          </div>

          {/* Navigation Links & Real-Time System Badge */}
          <div className="flex items-center space-x-4">
            {/* Live System Indicator */}
            <div className="hidden md:flex items-center space-x-3 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs">
              <span className="flex items-center space-x-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span className="font-medium text-slate-700">
                  API: {isOnline ? 'Active' : 'Offline'}
                </span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center space-x-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    dbConnected ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                <span className="font-medium text-slate-700">
                  DB: {dbConnected ? 'Connected' : 'Disconnected'}
                </span>
              </span>
            </div>

            {/* Quick action button for Phase 2 Auth */}
            <Link
              to="/login"
              className="inline-flex items-center space-x-1 text-xs font-semibold px-3 py-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm"
              title="Authentication will be fully enabled in Phase 2"
            >
              <span>Login Portal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
