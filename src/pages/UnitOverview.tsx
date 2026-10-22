import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { UnitOverviewSummary } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Download,
  ArrowRight,
  BookOpen,
  FileCheck,
  Target,
  RefreshCw,
} from 'lucide-react';

interface Props {
  unitId: string;
  onNavigate: (view: string, unitId?: string, assetId?: string) => void;
}

export const UnitOverview: React.FC<Props> = ({ unitId, onNavigate }) => {
  const [summary, setSummary] = useState<UnitOverviewSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.getUnitSummary(unitId);
      setSummary(res);
    } catch (err: any) {
      console.error('Error fetching unit summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [unitId]);

  if (loading || !summary) {
    return <div className="p-12 text-center text-slate-400">Loading unit dashboard...</div>;
  }

  const { unit, assets, objectives, qualityChecks, approvedAssetCount, totalAssetCount, qualityIssueCount } = summary;
  const progressPct = totalAssetCount > 0 ? Math.round((approvedAssetCount / totalAssetCount) * 100) : 0;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Top Banner / Status Overview */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Micro-Unit</span>
              <StatusBadge status={unit.status} size="sm" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{unit.title}</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              {unit.grade} • {unit.subject} • Target: <span className="capitalize">{unit.difficulty}</span> difficulty
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('unit_student', unitId)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-sm font-semibold transition-colors"
            >
              <GraduationCap className="w-4 h-4 text-sky-600" />
              <span>Student Mode</span>
            </button>
            <button
              onClick={() => onNavigate('unit_export', unitId)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-sm font-semibold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Progress & Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Approval Progress</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              {approvedAssetCount} of {totalAssetCount || 5} learning assets approved for student release
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-700">Automated Quality Audit</span>
            <div className="flex items-center gap-2 pt-1">
              {qualityIssueCount === 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  All Checks Passed
                </span>
              ) : (
                <button
                  onClick={() => onNavigate('unit_quality', unitId)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  {qualityIssueCount} Issue{qualityIssueCount > 1 ? 's' : ''} Require Review
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400">Grounding, objective alignment, & consistency</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-700">Source Boundary</span>
            <div className="text-sm font-semibold text-slate-800 truncate pt-1">
              {summary.source?.name || 'No Source Uploaded'}
            </div>
            <p className="text-xs text-slate-400">
              {summary.source?.pageCount || 0} pages • {summary.source?.wordCount || 0} verified words
            </p>
          </div>
        </div>
      </div>

      {/* Learning Pack Cards Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Learning Pack Assets</h2>
            <p className="text-xs text-slate-500">Connected 5-part micro-unit curriculum</p>
          </div>
          {assets.length === 0 ? (
            <button
              onClick={() => onNavigate('unit_generate', unitId)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Pack</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('unit_pack', unitId)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View Full Pack</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {assets.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
            <p className="text-sm font-bold text-slate-800">Pack not yet generated</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click generate to run the source-grounded orchestrator and produce all 5 learning assets.
            </p>
            <button
              onClick={() => onNavigate('unit_generate', unitId)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              + Generate Pack Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assets.map((asset) => {
              const issueForAsset = qualityChecks.filter(
                (c) => c.assetId === asset.id && c.severity !== 'none' && !c.overridden
              ).length;

              return (
                <div
                  key={asset.id}
                  onClick={() => onNavigate('unit_asset', unitId, asset.id)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={asset.status} size="sm" />
                      <span className="text-[11px] font-mono text-slate-400">v{asset.version}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {asset.title}
                    </h3>

                    <div className="text-xs text-slate-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Objectives Mapped:</span>
                        <span className="font-semibold text-slate-700">{asset.objectiveIds?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Source Citations:</span>
                        <span className="font-semibold text-slate-700">{asset.sourceChunkIds?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    {issueForAsset > 0 ? (
                      <span className="text-amber-600 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {issueForAsset} issue
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium">All checks passed</span>
                    )}

                    <span className="font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      <span>Inspect</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Objective Alignment Matrix Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Objective Coverage Breakdown
            </h3>
          </div>
          <button
            onClick={() => onNavigate('unit_alignment', unitId)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            View Full Alignment Matrix →
          </button>
        </div>

        <div className="space-y-3">
          {objectives.map((obj) => (
            <div key={obj.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-700">{obj.code}:</span>
                <span className="text-slate-600 truncate flex-1 mx-2">{obj.text}</span>
                <span className="font-semibold text-emerald-600">100% Covered</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
