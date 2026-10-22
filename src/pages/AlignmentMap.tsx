import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { AlignmentMatrixRow, Objective } from '../types/index.ts';
import { Check, X, AlertCircle, Split, FileCheck } from 'lucide-react';

interface Props {
  unitId: string;
}

export const AlignmentMap: React.FC<Props> = ({ unitId }) => {
  const [matrix, setMatrix] = useState<AlignmentMatrixRow[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getAlignmentMap(unitId);
        setMatrix(res.matrix);
        setObjectives(res.objectives);
      } catch (err: any) {
        console.error('Failed to load alignment map:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [unitId]);

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading alignment matrix...</div>;
  }

  const orphanRows = matrix.filter((r) => r.isOrphan);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
            <span>Traceability Matrix</span>
            <span>•</span>
            <span>Objective Alignment</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Curriculum Alignment Matrix</h1>
          <p className="text-sm text-slate-500 mt-1">
            Every learning asset and assessment question mapped against your approved objective contract.
          </p>
        </div>
      </div>

      {orphanRows.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>
            <strong>Orphan Content Detected:</strong> {orphanRows.length} item(s) have no mapped learning objective.
          </span>
        </div>
      )}

      {/* Alignment Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6 w-1/3">Curriculum Item / Assessment</th>
                <th className="py-4 px-4 w-32">Type</th>
                {objectives.map((obj) => (
                  <th key={obj.id} className="py-4 px-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-indigo-600 font-bold">{obj.code}</span>
                      <span className="text-[10px] text-slate-400 normal-case font-normal max-w-[120px] truncate" title={obj.text}>
                        {obj.text}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="py-4 px-4 text-center">Source Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrix.map((row) => (
                <tr
                  key={row.itemId}
                  className={`hover:bg-slate-50/60 transition-colors ${
                    row.isOrphan ? 'bg-rose-50/40' : ''
                  }`}
                >
                  <td className="py-3.5 px-6 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      {row.isOrphan && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase">
                          Orphan
                        </span>
                      )}
                      <span className="line-clamp-1">{row.itemLabel}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-500">
                    {row.itemType}
                  </td>

                  {objectives.map((obj) => {
                    const isCovered = row.objectiveCoverage[obj.id];
                    return (
                      <td key={obj.id} className="py-3.5 px-4 text-center">
                        {isCovered ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-200 mx-auto" />
                        )}
                      </td>
                    );
                  })}

                  <td className="py-3.5 px-4 text-center font-mono text-xs text-indigo-600 font-semibold">
                    p.{row.sourcePages.join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
