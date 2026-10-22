import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { Source, Objective, Unit } from '../types/index.ts';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Target,
  RefreshCw,
} from 'lucide-react';

interface Props {
  unitId: string;
  initialUnit?: Unit | null;
  onNavigate: (view: string, unitId?: string) => void;
}

const STEPS = [
  { id: 1, label: 'Source processing & chunk indexing' },
  { id: 2, label: 'Objectives & contract constraints loaded' },
  { id: 3, label: 'Generating Concept Explanation (Asset 1)' },
  { id: 4, label: 'Generating Guided Worked Example (Asset 2)' },
  { id: 5, label: 'Generating Formative Mastery Quiz (Asset 3)' },
  { id: 6, label: 'Generating Differentiated Practice (Asset 4)' },
  { id: 7, label: 'Generating High-Yield Revision Sheet (Asset 5)' },
  { id: 8, label: 'Executing Automated Quality & Alignment Audit' },
  { id: 9, label: 'Persisting learning pack to database' },
  { id: 10, label: 'Pack ready for teacher review' },
];

export const GenerateScreen: React.FC<Props> = ({ unitId, initialUnit, onNavigate }) => {
  const [unit, setUnit] = useState<Unit | null>(initialUnit || null);
  const [source, setSource] = useState<Source | null>(null);
  const [objectives, setObjectives] = useState<Objective[]>([]);

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPrerequisites() {
      try {
        const [sRes, oRes] = await Promise.all([
          api.getSource(unitId),
          api.getObjectives(unitId),
        ]);
        setUnit(initialUnit || null);
        setSource(sRes.source);
        setObjectives(oRes.objectives);
      } catch (err: any) {
        setError(err?.message || 'Failed to load unit details');
      }
    }
    loadPrerequisites();
  }, [unitId, initialUnit]);

  const startGeneration = async () => {
    if (!source) {
      setError('Please upload or paste source material before generating.');
      return;
    }
    if (objectives.length < 2) {
      setError('Please define at least two learning objectives before generating.');
      return;
    }

    setIsGenerating(true);
    setIsCompleted(false);
    setError(null);
    setCurrentStepIndex(1);

    // Simulate animated step progression while backend API generates
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < 8) return prev + 1;
        return prev;
      });
    }, 1800);

    try {
      await api.generateLearningPack(unitId);
      clearInterval(interval);
      setCurrentStepIndex(10);
      setIsCompleted(true);
    } catch (err: any) {
      clearInterval(interval);
      setError(err?.message || 'Generation failed. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
          <span>AI Studio Engine</span>
          <span>•</span>
          <span>Pack Orchestrator</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Generate Learning Pack</h1>
        <p className="text-sm text-slate-500 mt-1">
          LearnSmith will transform your source material and objectives into a connected 5-asset micro-unit.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Generation error</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={startGeneration}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Prerequisites Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                source ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Source Boundary</h3>
              <p className="text-xs text-slate-500">
                {source
                  ? `${source.name} (${source.pageCount} pages, ${source.wordCount} words)`
                  : 'No source uploaded yet'}
              </p>
            </div>
          </div>

          {source ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <button
              onClick={() => onNavigate('unit_source', unitId)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              + Upload
            </button>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                objectives.length >= 2 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Objective Contract</h3>
              <p className="text-xs text-slate-500">
                {objectives.length} Explicit Objective{objectives.length !== 1 ? 's' : ''} defined
              </p>
            </div>
          </div>

          {objectives.length >= 2 ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <button
              onClick={() => onNavigate('unit_objectives', unitId)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              + Add
            </button>
          )}
        </div>
      </div>

      {/* Main Orchestration Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Generation Pipeline Status</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Produces 5 structured assets grounded strictly in source evidence.
            </p>
          </div>

          {!isGenerating && !isCompleted && (
            <button
              onClick={startGeneration}
              disabled={!source || objectives.length < 2}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-40"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Complete Learning Pack</span>
            </button>
          )}

          {isCompleted && (
            <button
              onClick={() => onNavigate('unit_pack', unitId)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all"
            >
              <span>Review Generated Pack</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Step Progress List */}
        <div className="space-y-3">
          {STEPS.map((step) => {
            const isDone = currentStepIndex > step.id || isCompleted;
            const isCurrent = currentStepIndex === step.id && isGenerating;
            const isUpcoming = currentStepIndex < step.id && !isCompleted;

            return (
              <div
                key={step.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  isCurrent
                    ? 'border-indigo-400 bg-indigo-50/50 shadow-xs'
                    : isDone
                    ? 'border-slate-200 bg-emerald-50/30'
                    : 'border-slate-100 bg-slate-50/50 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-indigo-600 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                  </div>
                  <span
                    className={`text-sm ${
                      isCurrent
                        ? 'font-bold text-indigo-900'
                        : isDone
                        ? 'font-medium text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                <div>
                  {isCurrent && (
                    <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                  )}
                  {isDone && (
                    <span className="text-xs font-semibold text-emerald-600">✓ Done</span>
                  )}
                  {isUpcoming && (
                    <span className="text-xs text-slate-400">Waiting</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
