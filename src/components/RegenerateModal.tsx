import React, { useState } from 'react';
import { Question } from '../types/index.ts';
import { Sparkles, X, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../api.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
  unitId: string;
  onSuccess: (updatedQuestion: Question) => void;
}

const REASONS = [
  { id: 'Duplicate', label: 'Near duplicate of another question' },
  { id: 'Too easy', label: 'Too easy / lacks cognitive depth' },
  { id: 'Too difficult', label: 'Too difficult for target grade' },
  { id: 'Poor wording', label: 'Poor wording / ambiguous options' },
  { id: 'Unsupported', label: 'Unsupported by source passage' },
  { id: 'Incorrect', label: 'Incorrect answer key or rationale' },
  { id: 'Other', label: 'Other pedagogical adjustment' },
];

export const RegenerateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  question,
  unitId,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('Duplicate');
  const [instruction, setInstruction] = useState<string>('Make this more application-based with a practical scenario.');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setError('Please select a reason for regeneration.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.regenerateQuestion(
        unitId,
        question.id,
        selectedReason,
        instruction
      );
      onSuccess(res.question);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to regenerate question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                Regenerate Question {question.questionNumber}
              </h3>
              <p className="text-xs text-slate-500">
                Controlled replacement • Creates Version {question.version + 1}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
              Current Question (v{question.version})
            </label>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700">
              <p className="font-medium text-slate-800 mb-1">{question.question}</p>
              <p className="text-xs text-slate-500">Correct Answer: {question.correctAnswer}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
              Reason for Regeneration
            </label>
            <div className="grid grid-cols-1 gap-2">
              {REASONS.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-sm cursor-pointer transition-all ${
                    selectedReason === r.id
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-medium shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.id}
                    checked={selectedReason === r.id}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
              Teacher Instruction for AI
            </label>
            <textarea
              rows={2}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Make this more application-based, avoiding stomata definitions..."
              className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
            <p className="text-xs text-slate-400 mt-1">
              The AI will read the source context and constraints to craft an aligned replacement.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating v{question.version + 1}...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate New Version
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
