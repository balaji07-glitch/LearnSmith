import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { Asset, Question, QualityCheck } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { RegenerateModal } from '../components/RegenerateModal.tsx';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  GitBranch,
  ShieldCheck,
  Save,
  BookOpen,
  HelpCircle,
  Clock,
  Layers,
  FileCheck,
  Lightbulb,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Download,
  Edit3,
} from 'lucide-react';

interface Props {
  unitId: string;
  assetId: string;
  onNavigate: (view: string, unitId?: string, assetId?: string) => void;
}

export const AssetReview: React.FC<Props> = ({ unitId, assetId, onNavigate }) => {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editedTitle, setEditedTitle] = useState<string>('');
  const [editedText, setEditedText] = useState<string>('');
  const [editingQuestions, setEditingQuestions] = useState<Question[]>([]);

  // Regeneration modal state
  const [selectedQuestionForRegen, setSelectedQuestionForRegen] = useState<Question | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetRes, qRes, checksRes] = await Promise.all([
        api.getAsset(unitId, assetId),
        api.getQuestions(unitId, assetId),
        api.getQualityReport(unitId),
      ]);
      setAsset(assetRes.asset);
      setQuestions(qRes.questions);
      setEditingQuestions(qRes.questions);
      setQualityChecks(checksRes.checks.filter((c) => c.assetId === assetId || !c.assetId));
      setEditedTitle(assetRes.asset.title);

      if (assetRes.asset.type === 'explanation') {
        setEditedText(assetRes.asset.content?.fullExplanation || '');
      } else if (assetRes.asset.type === 'revision') {
        setEditedText(assetRes.asset.content?.coreSummary || '');
      }
    } catch (err: any) {
      console.error('Failed to load asset review:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [unitId, assetId]);

  const handleApprove = async () => {
    try {
      await api.approveAsset(unitId, assetId, 'Teacher approved in review');
      fetchData();
    } catch (err: any) {
      alert(err?.message || 'Failed to approve asset');
    }
  };

  const handleMarkRevision = async () => {
    const reason = prompt('Specify revision guidance for this asset:');
    if (reason) {
      try {
        await api.requestRevision(unitId, assetId, reason);
        fetchData();
      } catch (err: any) {
        alert(err?.message || 'Failed to mark revision');
      }
    }
  };

  // --- QUESTION MANAGEMENT ---
  const handleQuestionFieldChange = (id: string, field: keyof Question, value: any) => {
    setEditingQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleOptionChange = (id: string, optIndex: number, value: string) => {
    setEditingQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const currentOptions = q.options ? [...q.options] : ['', '', '', ''];
        const oldVal = currentOptions[optIndex];
        currentOptions[optIndex] = value;
        const isCorrect = q.correctAnswer === oldVal;
        return {
          ...q,
          options: currentOptions,
          correctAnswer: isCorrect ? value : q.correctAnswer,
        };
      })
    );
  };

  const handleSetCorrectAnswer = (id: string, optionValue: string) => {
    setEditingQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, correctAnswer: optionValue } : q))
    );
  };

  const handleAddQuestion = async () => {
    if (!asset) return;
    try {
      setActionLoading(true);
      const res = await api.addQuestion(unitId, asset.id, {
        question: 'What is the primary role of a router in a computer network?',
        options: [
          'Forwarding data packets between disparate networks using logical IP addresses',
          'Connecting physical peripheral devices through serial bus cables',
          'Converting analog audio signals directly into digital optical waves',
          'Operating solely as a passive physical terminator for coaxial cables',
        ],
        correctAnswer: 'Forwarding data packets between disparate networks using logical IP addresses',
        explanation: 'Routers inspect destination IP headers and forward packets across intermediate network segments based on routing tables.',
        difficulty: 'medium',
      });
      const updatedList = [...editingQuestions, res.question];
      setEditingQuestions(updatedList);
      setQuestions(updatedList);
      await fetchData();
    } catch (err: any) {
      alert(err?.message || 'Failed to add question');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGeneratePracticeQuestion = async (section: 'foundation' | 'extension') => {
    if (!asset) return;
    try {
      setActionLoading(true);
      await api.generatePracticeQuestion(unitId, asset.id, section);
      await fetchData();
    } catch (err: any) {
      alert(err?.message || 'Failed to generate practice question from source');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      setActionLoading(true);
      await api.deleteQuestion(unitId, questionId);
      const updatedList = editingQuestions.filter((q) => q.id !== questionId);
      setEditingQuestions(updatedList);
      setQuestions(updatedList);
      await fetchData();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete question');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveQuestion = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= editingQuestions.length) return;

    const listCopy = [...editingQuestions];
    const [moved] = listCopy.splice(index, 1);
    listCopy.splice(targetIndex, 0, moved);

    // Re-index question numbers locally
    const reindexed = listCopy.map((q, idx) => ({ ...q, questionNumber: idx + 1 }));
    setEditingQuestions(reindexed);
    setQuestions(reindexed);

    try {
      setActionLoading(true);
      const questionIds = reindexed.map((q) => q.id);
      await api.reorderQuestions(unitId, assetId, questionIds);
      await fetchData();
    } catch (err: any) {
      alert(err?.message || 'Failed to reorder questions');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!asset) return;
    try {
      setSaving(true);
      const updatedContent = { ...asset.content };

      if (asset.type === 'explanation') {
        updatedContent.fullExplanation = editedText;
      } else if (asset.type === 'revision') {
        updatedContent.coreSummary = editedText;
      } else if (asset.type === 'quiz') {
        updatedContent.questions = editingQuestions;
        for (const q of editingQuestions) {
          await api.updateQuestion(unitId, q.id, q);
        }
      }

      await api.updateAsset(unitId, asset.id, {
        title: editedTitle,
        content: updatedContent,
      });

      setEditMode(false);
      await fetchData();
    } catch (err: any) {
      alert(err?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleQuestionRegenerated = (updatedQ: Question) => {
    setQuestions((prev) => prev.map((q) => (q.id === updatedQ.id ? updatedQ : q)));
    setEditingQuestions((prev) => prev.map((q) => (q.id === updatedQ.id ? updatedQ : q)));
    fetchData();
  };

  if (loading || !asset) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading educational asset for review...</p>
      </div>
    );
  }

  const activeQuestions = editMode ? editingQuestions : questions;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          onClick={() => onNavigate('unit_pack', unitId)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Learning Pack Overview</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('unit_versions', unitId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
            <span>Version Lineage</span>
          </button>

          {/* Direct Preview Button (Step 15) */}
          <button
            onClick={() => onNavigate('unit_student', unitId)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-700 text-xs font-semibold transition-colors"
            title="Preview student-facing view"
          >
            <Eye className="w-3.5 h-3.5 text-sky-600" />
            <span>Preview Student View</span>
          </button>

          {/* Direct Export Button (Step 16) */}
          <button
            onClick={() => onNavigate('unit_export', unitId)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
            title="Export learning pack"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Pack</span>
          </button>

          {asset.status !== 'APPROVED' ? (
            <button
              onClick={handleApprove}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve Asset</span>
            </button>
          ) : (
            <button
              onClick={handleMarkRevision}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Mark Needs Revision</span>
            </button>
          )}
        </div>
      </div>

      {/* Two Column Layout: Left Content, Right Metadata & Provenance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Span 2): Content Review & Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex-1">
                {editMode ? (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Asset Title
                    </label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full text-lg font-bold text-slate-900 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ) : (
                  <h1 className="text-xl font-bold text-slate-900">{asset.title}</h1>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                    {asset.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-mono text-slate-500">v{asset.version}</span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 capitalize">{asset.changeType.replace('_', ' ')}</span>
                  {editMode && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 ml-2 animate-pulse">
                      Editing Mode Active
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {editMode ? (
                  <>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setEditingQuestions(questions);
                        setEditedTitle(asset.title);
                      }}
                      className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setEditMode(true);
                      setEditingQuestions(questions);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-xs font-bold text-indigo-700 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Click Edit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Asset-Specific Content Renderer */}
            {asset.type === 'explanation' && (
              <div className="space-y-6 text-sm text-slate-800">
                <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed font-medium">
                  {asset.content?.summary}
                </div>

                {editMode ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Pedagogical Explanation
                    </label>
                    <textarea
                      rows={12}
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-300 p-4 font-normal text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="leading-relaxed whitespace-pre-line text-slate-700 font-normal">
                    {asset.content?.fullExplanation}
                  </div>
                )}

                {/* Key Ideas */}
                {asset.content?.keyIdeas && (
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Core Takeaways</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
                      {asset.content.keyIdeas.map((idea: string, i: number) => (
                        <li key={i}>{idea}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key Vocabulary */}
                {asset.content?.keyVocabulary && (
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Target Vocabulary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {asset.content.keyVocabulary.map((vocab: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <strong className="text-indigo-700">{vocab.term}: </strong>
                          <span className="text-slate-600">{vocab.definition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Formative Quiz Renderer & Rich Editor */}
            {asset.type === 'quiz' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">{asset.content?.instructions || 'Formative assessment items'}</p>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    disabled={actionLoading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Question</span>
                  </button>
                </div>

                <div className="space-y-5">
                  {activeQuestions.map((q: Question, index: number) => (
                    <div
                      key={q.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        editMode
                          ? 'bg-amber-50/20 border-amber-200/80 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200'
                      } space-y-4`}
                    >
                      {/* Top Bar of Question Card */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                            Q{index + 1}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 capitalize">
                            {q.difficulty}
                          </span>
                          <span className="text-xs font-mono text-slate-400">v{q.version}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Reordering Controls (Step 13) */}
                          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleMoveQuestion(index, -1)}
                              disabled={index === 0 || actionLoading}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Move Question Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveQuestion(index, 1)}
                              disabled={index === activeQuestions.length - 1 || actionLoading}
                              className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Move Question Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Delete Question (Step 12) */}
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Regenerate ONE Question (Step 14) */}
                          <button
                            type="button"
                            onClick={() => setSelectedQuestionForRegen(q)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold shadow-xs transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Regenerate Q{index + 1}</span>
                          </button>
                        </div>
                      </div>

                      {/* Question Text / Editor (Step 10: Change a question) */}
                      {editMode ? (
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            Question Prompt
                          </label>
                          <textarea
                            rows={2}
                            value={q.question}
                            onChange={(e) => handleQuestionFieldChange(q.id, 'question', e.target.value)}
                            className="w-full text-sm font-semibold text-slate-900 border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                          />
                        </div>
                      ) : (
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{q.question}</h4>
                      )}

                      {/* Options / Editor */}
                      {editMode ? (
                        <div className="space-y-2">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            Answer Choices (Select radio button for the correct key)
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {q.options?.map((opt, optIdx) => {
                              const isCorrect = opt.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase();
                              return (
                                <div
                                  key={optIdx}
                                  className={`flex items-center gap-2 p-2.5 rounded-xl border bg-white ${
                                    isCorrect ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-200'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`correct_${q.id}`}
                                    checked={isCorrect}
                                    onChange={() => handleSetCorrectAnswer(q.id, opt)}
                                    className="text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleOptionChange(q.id, optIdx, e.target.value)}
                                    placeholder={`Option ${optIdx + 1}`}
                                    className="flex-1 text-xs text-slate-800 focus:outline-hidden"
                                  />
                                  {isCorrect && (
                                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                      Key
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {q.options?.map((opt, i) => {
                            const isCorrect = opt.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase();
                            return (
                              <div
                                key={i}
                                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <span>{opt}</span>
                                {isCorrect && (
                                  <span className="text-[10px] uppercase font-bold text-emerald-700 px-1.5 py-0.5 bg-emerald-100 rounded">
                                    Correct
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation & Source Provenance */}
                      {editMode ? (
                        <div className="space-y-1.5 pt-2 border-t border-slate-200">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            Educational Rationale & Explanation
                          </label>
                          <textarea
                            rows={2}
                            value={q.explanation}
                            onChange={(e) => handleQuestionFieldChange(q.id, 'explanation', e.target.value)}
                            className="w-full text-xs text-slate-700 border border-slate-300 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                          />
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="text-slate-500">
                            <strong className="text-slate-700">Rationale: </strong>
                            {q.explanation}
                          </div>
                          <div className="flex items-center gap-2 font-mono text-[11px] text-indigo-600 font-semibold">
                            <span>Page {q.sourceRefs?.[0]?.page || 1}</span>
                            <span>•</span>
                            <span>{q.sourceRefs?.[0]?.chunkId || 'chunk'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bottom Add Question Button */}
                <div className="pt-4 border-t border-slate-100 flex justify-center">
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Question to Quiz</span>
                  </button>
                </div>
              </div>
            )}

            {/* Worked Example Renderer */}
            {asset.type === 'worked_example' && (
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Scenario Problem
                  </h4>
                  <p className="text-sm font-medium text-slate-800">{asset.content?.scenarioProblem}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Guided Sequential Steps
                  </h4>
                  {asset.content?.guidedSteps?.map((step: any) => (
                    <div key={step.stepNumber} className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                          {step.stepNumber}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900">{step.title}</h5>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed pl-7">{step.explanation}</p>
                      {step.sourceRefSnippet && (
                        <p className="text-[11px] font-mono text-indigo-600 pl-7">{step.sourceRefSnippet}</p>
                      )}
                    </div>
                  ))}
                </div>

                {asset.content?.solutionSummary && (
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                    <strong className="block font-bold mb-0.5">Solution Deductive Summary:</strong>
                    {asset.content.solutionSummary}
                  </div>
                )}
              </div>
            )}

            {/* Differentiated Practice Renderer */}
            {asset.type === 'practice' && (
              <div className="space-y-8">
                {/* Foundation Tier */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                        Foundation Tier
                      </span>
                      <span className="text-xs text-slate-400">Scaffolded recall & basic principles</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGeneratePracticeQuestion('foundation')}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50/70 text-teal-700 hover:bg-teal-100 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{actionLoading ? 'Generating...' : 'Generate from Source'}</span>
                    </button>
                  </div>

                  {asset.content?.foundationQuestions?.map((q: Question) => (
                    <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Q{q.questionNumber}: {q.question}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedQuestionForRegen(q)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Regenerate</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {q.options?.map((opt, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded-lg border ${
                              opt === q.correctAnswer ? 'bg-emerald-50 border-emerald-300 font-semibold' : 'bg-white'
                            }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Extension Tier */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        Extension Tier
                      </span>
                      <span className="text-xs text-slate-400">Higher-order application & critical inquiry</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGeneratePracticeQuestion('extension')}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50/70 text-purple-700 hover:bg-purple-100 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{actionLoading ? 'Generating...' : 'Generate from Source'}</span>
                    </button>
                  </div>

                  {asset.content?.extensionQuestions?.map((q: Question) => (
                    <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Q{q.questionNumber}: {q.question}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedQuestionForRegen(q)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Regenerate</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {q.options?.map((opt, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded-lg border ${
                              opt === q.correctAnswer ? 'bg-emerald-50 border-emerald-300 font-semibold' : 'bg-white'
                            }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revision Sheet Renderer */}
            {asset.type === 'revision' && (
              <div className="space-y-6 text-xs text-slate-800">
                {editMode ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Core Revision Summary
                    </label>
                    <textarea
                      rows={6}
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-300 p-4 font-normal text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed font-medium">
                    {asset.content?.coreSummary}
                  </div>
                )}

                {/* Critical Relationships */}
                {asset.content?.criticalRelationships && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Critical Scientific Relationships
                    </h4>
                    <div className="space-y-2">
                      {asset.content.criticalRelationships.map((rel: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 text-xs">
                          <strong className="text-slate-900">{rel.conceptA}</strong>
                          <span className="text-indigo-600 font-medium font-mono text-[11px]">→ {rel.relationship} →</span>
                          <strong className="text-slate-900">{rel.conceptB}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formulas / Rules */}
                {asset.content?.essentialFormulasOrRules && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Essential Equations & Rules
                    </h4>
                    <div className="space-y-1.5">
                      {asset.content.essentialFormulasOrRules.map((rule: string, i: number) => (
                        <div key={i} className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200 font-mono text-emerald-900 text-xs">
                          {rule}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Metadata, Provenance, & Quality Audit */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-3 border-b border-slate-100">
              Asset Metadata & Provenance
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Approval Status</span>
                <StatusBadge status={asset.status} size="sm" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Version</span>
                <span className="font-mono font-bold text-slate-800">Version {asset.version}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Change Lineage</span>
                <span className="capitalize font-semibold text-indigo-700">{asset.changeType.replace('_', ' ')}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">AI Model</span>
                <span className="font-mono text-slate-700">{asset.model}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Last Modified</span>
                <span className="text-slate-700">{new Date(asset.updatedAt).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Bound Objectives ({asset.objectiveIds?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {asset.objectiveIds?.map((id) => (
                  <span
                    key={id}
                    className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold"
                  >
                    {id}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Source Citations ({asset.sourceChunkIds?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {asset.sourceChunkIds?.map((cid) => (
                  <span
                    key={cid}
                    className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono"
                  >
                    {cid}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quality Audit Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Quality Checks</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('unit_quality', unitId)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                All Checks →
              </button>
            </div>

            <div className="space-y-2.5">
              {qualityChecks.length > 0 ? (
                qualityChecks.map((qc) => (
                  <div
                    key={qc.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      qc.severity === 'fail'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : qc.severity === 'warning'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{qc.message}</span>
                      <StatusBadge status={qc.status} size="sm" showIcon={false} />
                    </div>
                    <p className="opacity-80 text-[11px] leading-tight">{qc.details}</p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">All checks passed.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controlled Question Regeneration Modal */}
      {selectedQuestionForRegen && (
        <RegenerateModal
          isOpen={true}
          onClose={() => setSelectedQuestionForRegen(null)}
          question={selectedQuestionForRegen}
          unitId={unitId}
          onSuccess={handleQuestionRegenerated}
        />
      )}

    </div>
  );
};
