import React from 'react';
import { Unit } from '../types/index.ts';
import { StatusBadge } from './StatusBadge.tsx';
import { GraduationCap, Download, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';

interface Props {
  unit?: Unit | null;
  approvedCount?: number;
  totalCount?: number;
  qualityIssuesCount?: number;
  onNavigate: (view: string, unitId?: string) => void;
  activeView: string;
}

export const Header: React.FC<Props> = ({
  unit,
  approvedCount = 0,
  totalCount = 5,
  qualityIssuesCount = 0,
  onNavigate,
  activeView,
}) => {
  if (!unit) {
    return (
      <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <span className="text-slate-800 font-semibold">Teacher Studio</span>
        </div>
      </header>
    );
  }

  const progressPercent = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;
  const isStudentMode = activeView === 'unit_student';

  if (isStudentMode) {
    return null; // Student mode renders its own clean header
  }

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
      {/* Left: Breadcrumbs & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('dashboard')}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          Units
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-sm font-bold text-slate-900">{unit.title}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
          {unit.grade} • {unit.subject}
        </span>
        <StatusBadge status={unit.status} size="sm" />
      </div>

      {/* Right: Progress & Primary Actions */}
      <div className="flex items-center gap-4">
        {/* Readiness Bar */}
        <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {approvedCount}/{totalCount} Assets Approved
            </span>
          </div>
          <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {qualityIssuesCount > 0 && (
            <button
              onClick={() => onNavigate('unit_quality', unit.id)}
              className="flex items-center gap-1 text-amber-700 bg-amber-100/70 hover:bg-amber-100 px-2 py-0.5 rounded-md font-semibold transition-colors"
            >
              <ShieldCheck className="w-3 h-3 text-amber-600" />
              <span>{qualityIssuesCount} Issue{qualityIssuesCount > 1 ? 's' : ''}</span>
            </button>
          )}
        </div>

        {/* Student Mode Button */}
        <button
          onClick={() => onNavigate('unit_student', unit.id)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 text-xs font-semibold transition-colors"
          title="Open student preview (only approved assets shown)"
        >
          <GraduationCap className="w-4 h-4 text-sky-600" />
          <span>Student Mode</span>
        </button>

        {/* Export Button */}
        <button
          onClick={() => onNavigate('unit_export', unit.id)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Pack</span>
        </button>
      </div>
    </header>
  );
};
