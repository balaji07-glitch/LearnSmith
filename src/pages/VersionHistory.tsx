import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { VersionRecord } from '../types/index.ts';
import { GitBranch, Clock, RotateCcw, Eye, CheckCircle2 } from 'lucide-react';

interface Props {
  unitId: string;
}

export const VersionHistory: React.FC<Props> = ({ unitId }) => {
  const [versions, setVersions] = useState<VersionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState<VersionRecord | null>(null);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const res = await api.getVersions(unitId);
      setVersions(res.versions);
    } catch (err: any) {
      console.error('Failed to load version history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [unitId]);

  const handleRestore = async (version: VersionRecord) => {
    if (confirm(`Restore Version ${version.versionNumber}? This will create a new current version with these contents.`)) {
      try {
        setRestoringId(version.id);
        const res = await api.restoreVersion(unitId, version.id);
        alert(res.message);
        fetchVersions();
      } catch (err: any) {
        alert(err?.message || 'Failed to restore version');
      } finally {
        setRestoringId(null);
      }
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading version lineage...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
          <span>Audit Trail</span>
          <span>•</span>
          <span>Immutable Lineage</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Version Lineage & Provenance</h1>
        <p className="text-sm text-slate-500 mt-1">
          Every AI generation, question regeneration, and teacher edit is permanently versioned.
        </p>
      </div>

      {versions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
          No previous versions recorded yet.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {versions.map((ver) => (
            <div key={ver.id} className="relative flex items-start gap-4 group">
              <div className="w-5 h-5 rounded-full bg-indigo-600 border-4 border-white shadow-xs shrink-0 mt-1.5 -ml-6" />

              <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                      v{ver.versionNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-800 capitalize">
                      {ver.changeType.replace('_', ' ')}
                    </span>
                    {ver.questionId && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Question Ref
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(ver.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600">
                  <strong className="text-slate-800">Reason / Scope: </strong>
                  {ver.changeReason || 'System generation pipeline'}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-400">Author: {ver.createdBy}</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewVersion(ver)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                    <button
                      onClick={() => handleRestore(ver)}
                      disabled={restoringId === ver.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore As New</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                Version {previewVersion.versionNumber} Content Snapshot
              </h3>
              <button
                onClick={() => setPreviewVersion(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <pre className="text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-y-auto flex-1 font-mono text-slate-800">
              {JSON.stringify(previewVersion.content, null, 2)}
            </pre>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewVersion(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
