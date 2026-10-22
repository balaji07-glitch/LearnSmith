import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { Objective, ObjectiveContract, Asset } from '../types/index.ts';
import {
  Target,
  Sliders,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  Save,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  unitId: string;
  onNavigate: (view: string, unitId?: string) => void;
}

export const ObjectivesView: React.FC<Props> = ({ unitId, onNavigate }) => {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [contract, setContract] = useState<ObjectiveContract | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reChecking, setReChecking] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [objRes, contractRes, assetsRes] = await Promise.all([
        api.getObjectives(unitId),
        api.getContract(unitId),
        api.getAssets(unitId),
      ]);
      setObjectives(objRes.objectives);
      setContract(contractRes.contract);
      setAssets(assetsRes.assets);
    } catch (err: any) {
      console.error('Error fetching objectives/contract:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [unitId]);

  const handleAddObjective = () => {
    const nextNum = objectives.length + 1;
    const code = `OBJ-${String(nextNum).padStart(2, '0')}`;
    setObjectives([...objectives, { id: `new_${Date.now()}`, unitId, code, text: '', createdAt: new Date().toISOString() }]);
    setHasChanged(true);
  };

  const handleRemoveObjective = (index: number) => {
    if (objectives.length <= 2) {
      alert('A minimum of two learning objectives is required for an aligned learning pack.');
      return;
    }
    const updated = objectives.filter((_, i) => i !== index);
    setObjectives(updated);
    setHasChanged(true);
  };

  const handleTextChange = (index: number, text: string) => {
    const updated = [...objectives];
    updated[index].text = text;
    setObjectives(updated);
    setHasChanged(true);
  };

  const handleSaveContract = async () => {
    try {
      setSaving(true);
      // 1. Save objectives
      await api.setObjectives(
        unitId,
        objectives.map((o) => ({ code: o.code, text: o.text }))
      );

      // 2. Save contract constraints
      if (contract) {
        await api.saveContract(unitId, contract);
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      setHasChanged(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to save contract');
    } finally {
      setSaving(false);
    }
  };

  const handleReRunChecks = async () => {
    try {
      setReChecking(true);
      await api.runQualityChecks(unitId);
      onNavigate('unit_quality', unitId);
    } catch (err: any) {
      alert(err?.message || 'Failed to run quality checks');
    } finally {
      setReChecking(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading objective contract...</div>;
  }

  const hasGeneratedAssets = assets.length > 0;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
            <span>Pedagogical Contract</span>
            <span>•</span>
            <span>Alignment Foundation</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Objective Contract</h1>
          <p className="text-sm text-slate-500 mt-1">
            The persistent contract governing content alignment, vocabulary constraints, and assessment boundaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Contract Saved
            </span>
          )}
          <button
            onClick={handleSaveContract}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Contract Changes'}</span>
          </button>
        </div>
      </div>

      {/* Invalidation Warning Banner if changed after generation */}
      {hasGeneratedAssets && hasChanged && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">Contract Modification Notice</h4>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Changing the objective contract after generation may invalidate existing asset alignments. Approved assets remain intact, but quality audits will need refreshing.
              </p>
            </div>
          </div>
          <button
            onClick={handleReRunChecks}
            disabled={reChecking}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reChecking ? 'animate-spin' : ''}`} />
            <span>Re-run Affected Checks</span>
          </button>
        </div>
      )}

      {/* Objectives Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Learning Objectives ({objectives.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Every item in quiz and practice must map here</span>
        </div>

        <div className="space-y-3">
          {objectives.map((obj, idx) => (
            <div key={obj.id || idx} className="flex items-center gap-3">
              <span className="w-16 px-2 py-2 text-center text-xs font-bold rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                {obj.code}
              </span>
              <input
                type="text"
                value={obj.text}
                onChange={(e) => handleTextChange(idx, e.target.value)}
                placeholder="Enter learning objective statement..."
                className="flex-1 text-sm rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
              <button
                type="button"
                onClick={() => handleRemoveObjective(idx)}
                disabled={objectives.length <= 2}
                className="p-2.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-xl hover:bg-slate-50 transition-colors"
                title="Remove objective"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddObjective}
          className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 pt-1"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Learning Objective</span>
        </button>
      </div>

      {/* Constraints Section */}
      {contract && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Contract Constraints
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Vocabulary Policy
              </label>
              <select
                value={contract.vocabularyPolicy}
                onChange={(e: any) => {
                  setContract({ ...contract, vocabularyPolicy: e.target.value });
                  setHasChanged(true);
                }}
                className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
              >
                <option value="source_only">Strictly Source Vocabulary Only</option>
                <option value="teacher_defined">Teacher-Defined Vocabulary</option>
                <option value="flexible">Flexible Curriculum Vocabulary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Answer Reveal Policy
              </label>
              <select
                value={contract.answerRevealPolicy}
                onChange={(e: any) => {
                  setContract({ ...contract, answerRevealPolicy: e.target.value });
                  setHasChanged(true);
                }}
                className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-white"
              >
                <option value="never">Never reveal answer in question</option>
                <option value="hints_allowed">Allow progressive hints</option>
                <option value="custom">Custom teacher review</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Max Explanation Word Count ({contract.maxExplanationLength} words)
              </label>
              <input
                type="range"
                min="250"
                max="800"
                step="50"
                value={contract.maxExplanationLength}
                onChange={(e) => {
                  setContract({ ...contract, maxExplanationLength: Number(e.target.value) });
                  setHasChanged(true);
                }}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Quiz Question Count ({contract.questionCount} questions)
              </label>
              <input
                type="range"
                min="3"
                max="8"
                step="1"
                value={contract.questionCount}
                onChange={(e) => {
                  setContract({ ...contract, questionCount: Number(e.target.value) });
                  setHasChanged(true);
                }}
                className="w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Teacher Instructions
              </label>
              <textarea
                rows={2}
                value={contract.teacherInstructions}
                onChange={(e) => {
                  setContract({ ...contract, teacherInstructions: e.target.value });
                  setHasChanged(true);
                }}
                className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
