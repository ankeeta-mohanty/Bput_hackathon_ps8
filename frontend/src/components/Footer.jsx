import React from 'react';
import { ShieldCheck, FileCheck, Layers } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <span className="font-semibold text-slate-800">ESG Reporting Portal</span>
              <span className="text-xs text-slate-400 font-mono">v1.0 (Phase 1 Setup)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              A prototype platform demonstrating centralized BRSR data collection, validation, aggregation, and compliance reporting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <Layers className="w-4 h-4 text-teal-600" />
              Architecture: React + Express + MongoDB
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <FileCheck className="w-4 h-4 text-teal-600" />
              Standard: SEBI BRSR & NGRBC Aligned
            </span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Corporate ESG Reporting Portal Prototype. Built for Hackathon demonstration.</p>
          <p className="mt-2 sm:mt-0 font-medium text-slate-500">
            Phase 1: Project Setup & Architecture
          </p>
        </div>
      </div>
    </footer>
  );
}
