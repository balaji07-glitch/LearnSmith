import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { Unit, QualityCheck, Asset } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import {
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface Props {
  onNavigate: (view: string, unitId?: string, assetId?: string) => void;
}

export const ReviewQueue: React.FC<Props> = ({ onNavigate }) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [items, setItems] = useState<
    {
      unit: Unit;
      check: QualityCheck;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQueue() {
      try {
        setLoading(true);
        const unitsRes = await api.getUnits();
        setUnits(unitsRes.units);

        const allItems: { unit: Unit; check: QualityCheck }[] = [];
        for (const u of unitsRes.units) {
          const qRes = await api.getQualityReport(u.id);
          const activeIssues = qRes.checks.filter(
            (c) => c.severity !== 'none' && !c.overridden
          );
          for (const check of activeIssues) {
            allItems.push({ unit: u, check });
          }
        }
        setItems(allItems);
      } catch (err: any) {
        console.error('Failed to load review queue:', err);
      } finally {
        setLoading(false);
      }
    }
    loadQueue();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading teacher review queue...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">
            <span>Teacher Attention</span>
            <span>•</span>
            <span>Action Queue</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Review Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Curriculum items and automated quality warnings requiring your review before student publishing.
          </p>
        </div>

        <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
          {items.length} Action Items Pending
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Your review queue is completely clear</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All generated packs have satisfied grounding, objective alignment, and consistency constraints.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(({ unit, check }) => (
            <div
              key={check.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-indigo-400 transition-colors"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {unit.title}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      check.severity === 'fail'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {check.severity}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 capitalize">
                    {check.checkType.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{check.message}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{check.details}</p>

                {check.evidence && (
                  <p className="text-[11px] font-mono bg-slate-50 p-2 rounded-lg text-slate-700">
                    {check.evidence}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => onNavigate('unit_quality', unit.id)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Resolve in Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
