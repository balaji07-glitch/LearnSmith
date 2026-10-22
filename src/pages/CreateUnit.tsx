import React, { useState } from 'react';
import { api } from '../api.ts';
import { Unit } from '../types/index.ts';
import { Plus, Trash2, ArrowRight, BookOpen, Target, Sliders, AlertCircle, UploadCloud, RefreshCw } from 'lucide-react';

interface Props {
  onNavigate: (view: string, unitId?: string) => void;
  onSelectUnit: (unit: Unit) => void;
}

export const CreateUnit: React.FC<Props> = ({ onNavigate, onSelectUnit }) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('Grade 10');
  const [learnerDescription, setLearnerDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Objectives (min 2)
  const [objectives, setObjectives] = useState<{ code: string; text: string }[]>([
    { code: 'OBJ-01', text: '' },
    { code: 'OBJ-02', text: '' },
  ]);

  // Constraints
  const [vocabularyPolicy, setVocabularyPolicy] = useState<'source_only' | 'teacher_defined' | 'flexible'>('source_only');
  const [maxExplanationLength, setMaxExplanationLength] = useState<number>(450);
  const [questionCount, setQuestionCount] = useState<number>(4);
  const [answerRevealPolicy, setAnswerRevealPolicy] = useState<'never' | 'hints_allowed' | 'custom'>('never');
  const [practiceLevels, setPracticeLevels] = useState<('Foundation' | 'Standard' | 'Extension')[]>(['Foundation', 'Extension']);
  const [teacherInstructions, setTeacherInstructions] = useState('');

  const [loading, setLoading] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFastTrackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPdf(true);
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
            setError(err?.message || 'Failed to process curriculum PDF');
          } finally {
            setUploadingPdf(false);
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
        setUploadingPdf(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to process curriculum file');
      setUploadingPdf(false);
    }
  };

  const handleAddObjective = () => {
    const nextNum = objectives.length + 1;
    const code = `OBJ-${String(nextNum).padStart(2, '0')}`;
    setObjectives([...objectives, { code, text: '' }]);
  };

  const handleRemoveObjective = (index: number) => {
    if (objectives.length <= 2) {
      alert('A minimum of two learning objectives is required for aligned pack generation.');
      return;
    }
    const updated = objectives.filter((_, i) => i !== index);
    const recoded = updated.map((obj, i) => ({
      code: `OBJ-${String(i + 1).padStart(2, '0')}`,
      text: obj.text,
    }));
    setObjectives(recoded);
  };

  const handleObjectiveTextChange = (index: number, text: string) => {
    const updated = [...objectives];
    updated[index].text = text;
    setObjectives(updated);
  };

  const togglePracticeLevel = (level: 'Foundation' | 'Standard' | 'Extension') => {
    if (practiceLevels.includes(level)) {
      if (practiceLevels.length === 1) return;
      setPracticeLevels(practiceLevels.filter((l) => l !== level));
    } else {
      setPracticeLevels([...practiceLevels, level]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim() || !grade.trim()) {
      setError('Please fill in title, subject, and grade.');
      return;
    }

    const emptyObj = objectives.some((o) => !o.text.trim());
    if (emptyObj) {
      setError('Please provide text for all learning objectives.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Create Unit & save objectives
      const res = await api.createUnit({
        title,
        subject,
        grade,
        learnerDescription,
        difficulty,
        objectives,
      });

      // 2. Save Contract Constraints
      await api.saveContract(res.unit.id, {
        vocabularyPolicy,
        maxExplanationLength,
        questionCount,
        answerRevealPolicy,
        practiceLevels,
        teacherInstructions,
      });

      onSelectUnit(res.unit);
      // Navigate to step 2: Source Workspace
      onNavigate('unit_source', res.unit.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to create unit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
          <span>Step 1 of 3</span>
          <span>•</span>
          <span>Unit Definition</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Learning Unit</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload your curriculum PDF directly for automatic topic detection, or configure your unit details manually.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Fast-Track PDF Upload Box */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/80 rounded-2xl border-2 border-dashed border-indigo-200 p-6 shadow-xs hover:border-indigo-400 transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              {uploadingPdf ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {uploadingPdf ? 'Analyzing PDF & Detecting Topics...' : 'Fast-Track: Upload Curriculum PDF First'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically extracts text, detects subject domain, target grade, curriculum topics, and learning objectives.
              </p>
            </div>
          </div>

          <label className="shrink-0 cursor-pointer">
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleFastTrackUpload}
              disabled={uploadingPdf}
              className="hidden"
            />
            <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer">
              <span>{uploadingPdf ? 'Processing...' : 'Upload PDF & Auto-Detect'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Unit Metadata</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Unit Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Networking Fundamentals – Grade 10"
                className="w-full text-sm font-medium rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Subject Domain *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Computer Science / Networking, Physics, Mathematics"
                className="w-full text-sm rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Grade / Level *
              </label>
              <input
                type="text"
                required
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. Grade 10, Secondary, Advanced Placement"
                className="w-full text-sm rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Learner Profile
              </label>
              <input
                type="text"
                value={learnerDescription}
                onChange={(e) => setLearnerDescription(e.target.value)}
                placeholder="e.g. Secondary school students studying digital communications and networking protocols"
                className="w-full text-sm rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Expected Cognitive Difficulty
              </label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`flex-1 py-2 text-xs font-semibold capitalize rounded-xl border transition-all ${
                      difficulty === lvl
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Explicit Learning Objectives */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Explicit Learning Objectives (Min 2)
              </h2>
            </div>
            <span className="text-xs text-slate-500">Every generated item maps to an objective</span>
          </div>

          <div className="space-y-3">
            {objectives.map((obj, index) => (
              <div key={obj.code} className="flex items-center gap-3">
                <span className="w-16 px-2 py-2 text-center text-xs font-bold rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                  {obj.code}
                </span>
                <input
                  type="text"
                  required
                  value={obj.text}
                  onChange={(e) => handleObjectiveTextChange(index, e.target.value)}
                  placeholder={`e.g. Explain core network architecture and topologies...`}
                  className="flex-1 text-sm rounded-xl border border-slate-200 px-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveObjective(index)}
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

        {/* Section 3: Objective Contract & Generation Constraints */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Objective Contract Constraints
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Vocabulary Policy
              </label>
              <select
                value={vocabularyPolicy}
                onChange={(e: any) => setVocabularyPolicy(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
              >
                <option value="source_only">Strictly Source Vocabulary Only</option>
                <option value="teacher_defined">Teacher-Defined Vocabulary</option>
                <option value="flexible">Flexible / Domain-Standard Vocabulary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Answer Reveal Policy
              </label>
              <select
                value={answerRevealPolicy}
                onChange={(e: any) => setAnswerRevealPolicy(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
              >
                <option value="never">Never reveal answer in question / stem</option>
                <option value="hints_allowed">Allow progressive pedagogical hints</option>
                <option value="custom">Custom teacher review</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Max Explanation Length ({maxExplanationLength} words)
              </label>
              <input
                type="range"
                min="250"
                max="800"
                step="50"
                value={maxExplanationLength}
                onChange={(e) => setMaxExplanationLength(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Quiz Question Count ({questionCount} questions)
              </label>
              <input
                type="range"
                min="3"
                max="8"
                step="1"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tiered Practice Levels
              </label>
              <div className="flex gap-3">
                {(['Foundation', 'Standard', 'Extension'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => togglePracticeLevel(tier)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      practiceLevels.includes(tier)
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                        : 'bg-white text-slate-400 border-slate-200'
                    }`}
                  >
                    {tier} {practiceLevels.includes(tier) ? '✓' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Additional Teacher Guidance
              </label>
              <textarea
                rows={2}
                value={teacherInstructions}
                onChange={(e) => setTeacherInstructions(e.target.value)}
                placeholder="Any special pedagogical instructions grounded in the uploaded curriculum..."
                className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Submit action */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Creating Unit...' : 'Save Unit & Add Source Material'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
