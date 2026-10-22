import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { Asset, QualityCheck } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import {
  FileText,
  Lightbulb,
  CheckSquare,
  BarChart2,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface Props {
  unitId: string;
  onNavigate: (view: string, unitId?: string, assetId?: string) => void;
}

const ASSET_ICONS: Record<string, any> = {
  explanation: BookOpen,
  worked_example: Lightbulb,
  quiz: CheckSquare,
  practice: BarChart2,
  revision: FileText,
};

export const PackOverview: React.FC<Props> = ({ unitId, onNavigate }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsRes, qualityRes] = await Promise.all([
        api.getAssets(unitId),
        api.getQualityReport(unitId),
      ]);
      setAssets(assetsRes.assets);
      setQualityChecks(qualityRes.checks);
    } catch (err: any) {
      console.error('Failed to load pack overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [unitId]);

  const handleQuickApprove = async (e: React.MouseEvent, assetId: string) => {
    e.stopPropagation();
    try {
      setApprovingId(assetId);
      await api.approveAsset(unitId, assetId, 'Quick approval from pack overview');
      fetchData();
    } catch (err: any) {
      alert(err?.message || 'Failed to approve asset');
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading learning pack...</div>;
  }

  const approvedCount = assets.filter((a) => a.status === 'APPROVED').length;
  const isAllApproved = assets.length === 5 && approvedCount === 5;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
            <span>Learning Pack Studio</span>
            <span>•</span>
            <span>Micro-Unit Curriculum</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Learning Pack Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            5 connected educational assets grounded in your approved source material.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
            {approvedCount} of {assets.length || 5} Approved
          </div>
          <button
            onClick={() => onNavigate('unit_student', unitId)}
            className="px-4 py-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold hover:bg-sky-100 transition-colors"
          >
            Preview Student Pack
          </button>
        </div>
      </div>

      {/* Readiness Banner */}
      <div
        className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isAllApproved
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isAllApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
            }`}
          >
            {isAllApproved ? <CheckCircle2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold">
              {isAllApproved ? 'Pack Fully Approved & Student Ready' : 'Teacher Review in Progress'}
            </h3>
            <p className="text-xs opacity-80 mt-0.5">
              {isAllApproved
                ? 'All 5 assets have been approved and verified. Student Mode now displays the complete micro-unit.'
                : 'Review each asset below. Individual quiz/practice questions can be regenerated without altering other content.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('unit_quality', unitId)}
          className="shrink-0 text-xs font-bold px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-50 text-slate-800 transition-colors"
        >
          View Quality Audit
        </button>
      </div>

      {/* 5 Asset Cards */}
      <div className="space-y-4">
        {assets.map((asset, index) => {
          const Icon = ASSET_ICONS[asset.type] || BookOpen;
          const issuesForAsset = qualityChecks.filter(
            (c) => c.assetId === asset.id && c.severity !== 'none' && !c.overridden
          );

          return (
            <div
              key={asset.id}
              onClick={() => onNavigate('unit_asset', unitId, asset.id)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-5 group"
            >
              {/* Left Info */}
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Asset {index + 1} • {asset.type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">v{asset.version}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {asset.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                    <span>
                      <strong className="text-slate-700">{asset.objectiveIds?.length || 0}</strong> Objectives
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-700">{asset.sourceChunkIds?.length || 0}</strong> Source Citations
                    </span>
                    <span>•</span>
                    <span>Model: {asset.model}</span>
                  </div>
                </div>
              </div>

              {/* Right Status & Actions */}
              <div className="flex items-center gap-4 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-right space-y-1">
                  <StatusBadge status={asset.status} size="sm" />
                  {issuesForAsset.length > 0 ? (
                    <div className="text-[11px] font-semibold text-amber-600">
                      {issuesForAsset.length} Issue requiring review
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-600 font-medium">Checks passed</div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {asset.status !== 'APPROVED' && (
                    <button
                      onClick={(e) => handleQuickApprove(e, asset.id)}
                      disabled={approvingId === asset.id}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {approvingId === asset.id ? 'Approving...' : '✓ Approve'}
                    </button>
                  )}

                  <button
                    onClick={() => onNavigate('unit_asset', unitId, asset.id)}
                    className="p-2 rounded-xl text-slate-400 group-hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
