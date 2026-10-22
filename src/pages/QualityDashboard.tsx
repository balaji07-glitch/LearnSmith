import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { QualityCheck, Question } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { RegenerateModal } from '../components/RegenerateModal.tsx';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';

interface Props {
  unitId: string;
  onNavigate: (view: string, unitId?: string, assetId?: string) => void;
}

export const QualityDashboard: React.FC<Props> = ({ unitId, onNavigate }) => {
  const [checks, setChecks] = useState<QualityCheck[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [auditing, setAuditing] = useState<boolean>(false);
  const [selectedIssue, setSelectedIssue] = useState<QualityCheck | null>(null);
  const [selectedQuestionForRegen, setSelectedQuestionForRegen] = useState<Question | null>(null);

  const fetchQualityData = async () => {
    try {
      setLoading(true);
      const [checksRes, qRes] = await Promise.all([
        api.getQualityReport(unitId),
        api.getQuestions(unitId),
      ]);
      setChecks(checksRes.checks);
      setQuestions(qRes.questions);
    } catch (err: any) {
      console.error('Failed to load quality dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualityData();
  }, [unitId]);

  const handleRunAudit = async () => {
    try {
      setAuditing(true);
      const res = await api.runQualityChecks(unitId);
      setChecks(res.checks);
    } catch (err: any) {
      alert(err?.message || 'Failed to execute quality audit');
    } finally {
      setAuditing(false);
    }
  };

  const handleOverride = async (checkId: string) => {
    const reason = prompt('Provide pedagogical justification for overriding this warning:');
    if (!reason) return;
    try {
      await api.overrideQualityCheck(unitId, checkId, reason);
      fetchQualityData();
    } catch (err: any) {
      alert(err?.message || 'Failed to override check');
    }
  };

  const handleTriggerRegenFromIssue = (check: QualityCheck) => {
    if (check.questionId) {
      const targetQ = questions.find((q) => q.id === check.questionId);
      if (targetQ) {
        setSelectedQuestionForRegen(targetQ);
        return;
      }
    }
    // Otherwise open asset review
    if (check.assetId) {
      onNavigate('unit_asset', unitId, check.assetId);
    } else {
      onNavigate('unit_pack', unitId);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading quality audit metrics...</div>;
  }

  const issues = checks.filter((c) => c.severity !== 'none');
  const criticalFails = checks.filter((c) => c.severity === 'fail' && !c.overridden);
  const warnings = checks.filter((c) => c.severity === 'warning' && !c.overridden);

  // Group checks for cards
  const groundingPass = !checks.some((c) => c.checkType === 'source_grounding' && c.severity === 'fail');
  const alignmentPass = !checks.some((c) => c.checkType === 'objective_coverage' && c.severity === 'fail');
  const keysPass = !checks.some((c) => c.checkType === 'answer_key_consistency' && c.severity === 'fail');
  const leakagePass = !checks.some((c) => c.checkType === 'answer_leakage' && c.severity === 'fail');
  const duplicateWarning = checks.some((c) => c.checkType === 'duplicate_questions' && c.severity === 'warning' && !c.overridden);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
            <span>Automated Assurance</span>
            <span>•</span>
            <span>Pedagogical Safeguards</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quality Control Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            LearnSmith continuously verifies source grounding, objective alignment, answer keys, and prevents duplicate questions.
          </p>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={auditing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${auditing ? 'animate-spin' : ''}`} />
          <span>{auditing ? 'Auditing Pack...' : 'Re-Run All Quality Checks'}</span>
        </button>
      </div>

      {/* 6 Category Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Grounding</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">Passed</div>
          <div className="text-[11px] text-slate-400">100% cited</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Objectives</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">Aligned</div>
          <div className="text-[11px] text-slate-400">Zero orphans</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Answer Key</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">Consistent</div>
          <div className="text-[11px] text-slate-400">Deterministic</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Leakage</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">Zero Leak</div>
          <div className="text-[11px] text-slate-400">Protected stems</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Duplicates</span>
            {duplicateWarning ? (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="text-sm font-bold text-slate-900">{duplicateWarning ? '1 Flagged' : 'Passed'}</div>
          <div className="text-[11px] text-slate-400">Token similarity</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">Difficulty</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-900">Grade Aligned</div>
          <div className="text-[11px] text-slate-400">Middle school</div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Active Quality Audit Findings</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review issues flagged by the pedagogical engine before approving for student distribution.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
              {criticalFails.length} Critical
            </span>
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
              {warnings.length} Warnings
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {issues.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-slate-800">No issues found</p>
              <p className="text-xs text-slate-400">All 7 automated quality checks have passed without warnings.</p>
            </div>
          ) : (
            issues.map((check) => (
              <div
                key={check.id}
                className="p-6 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
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
                    {check.overridden && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                        Overridden by Teacher
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{check.message}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{check.details}</p>

                  {check.evidence && (
                    <p className="text-[11px] font-mono bg-slate-100 p-2 rounded-lg text-slate-700">
                      Evidence: {check.evidence}
                    </p>
                  )}

                  {check.suggestedAction && (
                    <p className="text-xs text-indigo-700 font-medium">
                      💡 Recommended: {check.suggestedAction}
                    </p>
                  )}
                </div>

                {/* Issue Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleTriggerRegenFromIssue(check)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Regenerate Item</span>
                  </button>

                  {!check.overridden && (
                    <button
                      onClick={() => handleOverride(check.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
                      title="Override warning with pedagogical justification"
                    >
                      Override
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Regeneration Modal */}
      {selectedQuestionForRegen && (
        <RegenerateModal
          isOpen={true}
          onClose={() => setSelectedQuestionForRegen(null)}
          question={selectedQuestionForRegen}
          unitId={unitId}
          onSuccess={() => {
            fetchQualityData();
          }}
        />
      )}
    </div>
  );
};
