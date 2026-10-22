import React from 'react';
import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  FileCheck2,
  FileText,
  Target,
  Sparkles,
  PackageCheck,
  ShieldCheck,
  GitBranch,
  GraduationCap,
  Download,
  BookOpen,
  Split,
  LogOut,
} from 'lucide-react';
import { Unit } from '../types/index.ts';
import { AuthUser } from '../pages/LoginPage.tsx';

interface Props {
  currentView: string;
  onNavigate: (view: string, unitId?: string) => void;
  activeUnit?: Unit | null;
  onLoadDemo: () => void;
  authUser: AuthUser;
  onLogout: () => void;
}

export const Sidebar: React.FC<Props> = ({
  currentView,
  onNavigate,
  activeUnit,
  onLoadDemo,
  authUser,
  onLogout,
}) => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div
          onClick={() => onNavigate('dashboard')}
          className="cursor-pointer flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight">LearnSmith</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Generate • Check • Review • Approve</p>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Global Links */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onNavigate('units')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'units'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>My Units</span>
            </button>

            <button
              onClick={() => onNavigate('unit_new')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'unit_new'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Create Unit</span>
            </button>

            <button
              onClick={() => onNavigate('review_queue')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'review_queue'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              <span>Review Queue</span>
            </button>
          </nav>
        </div>

        {/* Active Unit Context Nav */}
        {activeUnit && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                Active Unit
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                {activeUnit.grade}
              </span>
            </div>

            <div className="px-3 py-2 mb-2 rounded-xl bg-slate-800/50 border border-slate-800">
              <p className="text-xs font-semibold text-white truncate" title={activeUnit.title}>
                {activeUnit.title}
              </p>
              <p className="text-[11px] text-slate-400">{activeUnit.subject}</p>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => onNavigate('unit_overview', activeUnit.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentView === 'unit_overview'
                    ? 'bg-indigo-600/80 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Unit Overview</span>
              </button>

              <button
                onClick={() => onNavigate('unit_source', activeUnit.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentView === 'unit_source'
                    ? 'bg-indigo-600/80 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Source Material</span>
              </button>

              <button
                onClick={() => onNavigate('unit_objectives', activeUnit.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentView === 'unit_objectives'
                    ? 'bg-indigo-600/80 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Objectives & Contract</span>
              </button>

              <button
                onClick={() => onNavigate('unit_generate', activeUnit.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentView === 'unit_generate'
                    ? 'bg-indigo-600/80 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Generate Pack</span>
              </button>

              <button
                onClick={() => onNavigate('unit_pack', activeUnit.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentView === 'unit_pack' || currentView === 'unit_asset'
                    ? 'bg-indigo-600/80 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Learning Pack</span>
              </button>

              <button
                onClick={() => onNavigate('unit_quality', activeUnit.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentView === 'unit_quality'
                    ? 'bg-indigo-600/80 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Quality Control</span>
              </button>

              <button
                onClick={() => onNavigate('unit_alignment', activeUnit.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentView === 'unit_alignment'
                    ? 'bg-indigo-600/80 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Split className="w-3.5 h-3.5" />
                <span>Alignment Map</span>
              </button>

              <button
                onClick={() => onNavigate('unit_versions', activeUnit.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentView === 'unit_versions'
                    ? 'bg-indigo-600/80 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Version History</span>
              </button>

              <button
                onClick={() => onNavigate('unit_student', activeUnit.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentView === 'unit_student'
                    ? 'bg-indigo-600/80 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                <span>Student Mode</span>
              </button>

              <button
                onClick={() => onNavigate('unit_export', activeUnit.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentView === 'unit_export'
                    ? 'bg-indigo-600/80 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Pack</span>
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Footer Profile & Demo Loader */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
        <button
          onClick={onLoadDemo}
          className="w-full py-2 px-3 rounded-xl border border-indigo-500/30 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/50 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Load Demo Unit (Networking)</span>
        </button>

        <div className="flex items-center gap-3 pt-1">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
            {authUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{authUser.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{authUser.school || authUser.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full py-2 px-3 rounded-lg text-slate-400 hover:bg-rose-950/50 hover:text-rose-300 text-xs font-medium flex items-center gap-2 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};
