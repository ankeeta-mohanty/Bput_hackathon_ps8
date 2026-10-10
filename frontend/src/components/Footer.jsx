import React from 'react';
import { ShieldCheck, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span className="font-semibold text-slate-700">Corporate ESG Reporting Portal</span>
            <span className="text-slate-300">|</span>
            <span>Business Responsibility and Sustainability Reporting (BRSR)</span>
          </div>

          <div className="flex items-center space-x-4">
            <Link 
              to="/diagnostics" 
              className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>System Diagnostics</span>
            </Link>
            <span className="text-slate-300">|</span>
            <span>© {new Date().getFullYear()} Corporate Sustainability Portal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
