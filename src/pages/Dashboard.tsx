import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { Unit } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import {
  PlusCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  GraduationCap,
  Layers,
  CheckCircle2,
  Trash2,
  UploadCloud,
  RefreshCw,
} from 'lucide-react';

interface Props {
  onNavigate: (view: string, unitId?: string) => void;
  onSelectUnit: (unit: Unit) => void;
}

export const Dashboard: React.FC<Props> = ({ onNavigate, onSelectUnit }) => {
  const [units, setUnits] = useState<(Unit & { assetCount: number; approvedCount: number; issuesCount: number })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await api.getUnits();
      setUnits(res.units);
    } catch (err: any) {
      setError(err?.message || 'Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleOpenUnit = (unit: Unit) => {
    onSelectUnit(unit);
    onNavigate('unit_overview', unit.id);
  };

  const handleDeleteUnit = async (e: React.MouseEvent, unitId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this learning unit?')) {
      try {
        await api.deleteUnit(unitId);
        fetchUnits();
      } catch (err: any) {
        alert(err?.message || 'Failed to delete unit');
      }
    }
  };

  const handleLoadDemo = async () => {
    try {
      await api.loadDemoUnit();
      fetchUnits();
    } catch (err: any) {
      alert(err?.message || 'Failed to load demo unit');
    }
  };

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = (reader.result as string).split(',')[1];
            const res = await api.createUnitFromSource({
              name: file.name,
              type: 'pdf',
              fileBase64: base64,
            });
            onSelectUnit(res.unit);
            onNavigate('unit_source', res.unit.id);
          } catch (err: any) {
            setError(err?.message || 'Failed to process document');
          } finally {
            setUploading(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const text = await file.text();
        const res = await api.createUnitFromSource({
          name: file.name,
          type: 'text',
          rawText: text,
        });
        onSelectUnit(res.unit);
        onNavigate('unit_source', res.unit.id);
        setUploading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to process document');
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teacher Learning Pack Studio</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create verified, classroom-ready micro-unit learning packs strictly grounded in your uploaded curriculum documents.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLoadDemo}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Load Demo Unit</span>
          </button>
          <button
            onClick={() => onNavigate('unit_new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all hover:shadow-indigo-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create Learning Unit</span>
          </button>
        </div>
      </div>

      {/* Fast-Track Upload Card */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-white to-emerald-50/90 rounded-2xl border-2 border-dashed border-indigo-200 p-6 shadow-xs hover:border-indigo-400 transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              {uploading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {uploading ? 'Processing Curriculum Document...' : 'Upload Curriculum PDF & Verify'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload any PDF textbook or lesson notes. LearnSmith auto-detects topics, binds knowledge boundaries, and ensures zero outside hallucinations.
              </p>
            </div>
          </div>

          <label className="shrink-0 cursor-pointer">
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleQuickUpload}
              disabled={uploading}
              className="hidden"
            />
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer">
              <span>{uploading ? 'Analyzing...' : 'Upload PDF & Auto-Detect'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </label>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Units</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{units.length}</div>
          <div className="text-xs text-slate-500 mt-1">Micro-units in studio</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ready for Class</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {units.filter((u) => u.status === 'READY' || u.status === 'PUBLISHED').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Fully approved & verified</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Review Queue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {units.reduce((acc, u) => acc + (u.issuesCount || 0), 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Pending quality items</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Student Access</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">Enabled</div>
          <div className="text-xs text-slate-500 mt-1">Only approved content shown</div>
        </div>
      </div>

      {/* Unit Cards List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Your Learning Units</h2>
          <span className="text-xs text-slate-500">{units.length} unit{units.length !== 1 ? 's' : ''} available</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading learning units...</div>
        ) : error ? (
          <div className="p-6 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 text-sm">
            {error}
          </div>
        ) : units.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">No learning units yet</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                Upload your curriculum source material and define learning objectives to generate classroom-ready packs.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleLoadDemo}
                className="px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
              >
                Load Demo Unit (Networking)
              </button>
              <button
                onClick={() => onNavigate('unit_new')}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
              >
                + Create First Unit
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {units.map((unit) => (
              <div
                key={unit.id}
                onClick={() => handleOpenUnit(unit)}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 p-6 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <StatusBadge status={unit.status} />
                    <button
                      onClick={(e) => handleDeleteUnit(e, unit.id)}
                      className="text-slate-300 hover:text-rose-600 p-1 rounded-md transition-colors"
                      title="Delete unit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {unit.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                    <span>{unit.grade}</span>
                    <span>•</span>
                    <span>{unit.subject}</span>
                    <span>•</span>
                    <span className="capitalize">{unit.difficulty}</span>
                  </div>

                  {/* Asset status & issue pills */}
                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Pack Assets</span>
                      <span className="font-semibold text-slate-800">
                        {unit.approvedCount}/{unit.assetCount || 5} Approved
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{
                          width: `${
                            unit.assetCount > 0 ? (unit.approvedCount / unit.assetCount) * 100 : 0
                          }%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      {unit.issuesCount > 0 ? (
                        <span className="text-amber-600 font-semibold flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          {unit.issuesCount} Quality issue{unit.issuesCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Quality checks passed
                        </span>
                      )}

                      <span className="text-slate-400">
                        Updated {new Date(unit.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Action */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectUnit(unit);
                      onNavigate('unit_student', unit.id);
                    }}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Student View</span>
                  </button>

                  <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Open Unit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
