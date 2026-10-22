import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { Unit } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import {
  Layers,
  PlusCircle,
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  GraduationCap,
} from 'lucide-react';

interface Props {
  onNavigate: (view: string, unitId?: string) => void;
  onSelectUnit: (unit: Unit) => void;
}

export const UnitsList: React.FC<Props> = ({ onNavigate, onSelectUnit }) => {
  const [units, setUnits] = useState<(Unit & { assetCount: number; approvedCount: number; issuesCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await api.getUnits();
      setUnits(res.units);
    } catch (err: any) {
      console.error('Failed to load units:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this learning unit?')) {
      try {
        await api.deleteUnit(id);
        fetchUnits();
      } catch (err: any) {
        alert(err?.message || 'Failed to delete unit');
      }
    }
  };

  const filtered = units.filter(
    (u) =>
      u.title.toLowerCase().includes(search.toLowerCase()) ||
      u.subject.toLowerCase().includes(search.toLowerCase()) ||
      u.grade.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
            <span>Curriculum Library</span>
            <span>•</span>
            <span>All Units</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Learning Units</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your library of verified micro-unit packs and track classroom deployment.
          </p>
        </div>

        <button
          onClick={() => onNavigate('unit_new')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Create Learning Unit</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by unit title, subject, or grade level..."
          className="w-full text-sm outline-hidden text-slate-800 placeholder:text-slate-400"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading units...</div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
          <p className="text-sm font-bold text-slate-800">No matching units found</p>
          <p className="text-xs text-slate-400">Try adjusting your search criteria or create a new unit.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((unit) => (
            <div
              key={unit.id}
              onClick={() => {
                onSelectUnit(unit);
                onNavigate('unit_overview', unit.id);
              }}
              className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <StatusBadge status={unit.status} />
                  <button
                    onClick={(e) => handleDelete(e, unit.id)}
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
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Approved Assets</span>
                    <span className="font-semibold text-slate-800">
                      {unit.approvedCount}/{unit.assetCount || 5}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{
                        width: `${unit.assetCount > 0 ? (unit.approvedCount / unit.assetCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectUnit(unit);
                    onNavigate('unit_student', unit.id);
                  }}
                  className="font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student View</span>
                </button>

                <span className="font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  <span>Open Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
