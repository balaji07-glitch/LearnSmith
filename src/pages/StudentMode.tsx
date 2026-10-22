import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { Asset } from '../types/index.ts';
import { AuthUser } from './LoginPage.tsx';
import {
  GraduationCap,
  BookOpen,
  Lightbulb,
  CheckSquare,
  BarChart2,
  FileText,
  ArrowLeft,
  Printer,
  CheckCircle2,
  Sparkles,
  LogOut,
} from 'lucide-react';

interface Props {
  unitId: string;
  onExit: () => void;
  authUser?: AuthUser | null;
  onLogout?: () => void;
}

interface AssessmentResult {
  score: number;
  total: number;
  results: { questionId: string; correct: boolean; correctAnswer: string; explanation: string; incorrectReason: string }[];
}

const getQuestionResult = (result: AssessmentResult | null, questionId: string) =>
  result?.results.find((item) => item.questionId === questionId);

export const StudentMode: React.FC<Props> = ({ unitId, onExit, authUser, onLogout }) => {
  const [data, setData] = useState<{
    unit: { id: string; title: string; subject: string; grade: string };
    assets: Asset[];
    approvedCount: number;
    totalCount: number;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'learn' | 'example' | 'practice' | 'quiz' | 'review'>('learn');
  const [loading, setLoading] = useState(true);

  // Student quiz responses state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<AssessmentResult | null>(null);
  const [quizSubmitError, setQuizSubmitError] = useState<string | null>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [selectedPracticeAnswers, setSelectedPracticeAnswers] = useState<Record<string, string>>({});
  const [submittedPractice, setSubmittedPractice] = useState(false);
  const [practiceResult, setPracticeResult] = useState<AssessmentResult | null>(null);
  const [practiceSubmitError, setPracticeSubmitError] = useState<string | null>(null);
  const [submittingPractice, setSubmittingPractice] = useState(false);

  useEffect(() => {
    setSelectedAnswers({});
    setSubmittedQuiz(false);
    setQuizResult(null);
    setQuizSubmitError(null);
    setSelectedPracticeAnswers({});
    setSubmittedPractice(false);
    setPracticeResult(null);
    setPracticeSubmitError(null);

    async function loadStudentPack() {
      try {
        setLoading(true);
        const res = await api.getStudentPack(unitId);
        setData(res);
      } catch (err: any) {
        console.error('Failed to load student pack:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStudentPack();
  }, [unitId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <p className="text-slate-500 font-medium">Preparing classroom learning pack...</p>
      </div>
    );
  }

  if (!data || data.assets.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 max-w-xl mx-auto flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">No Approved Content Available Yet</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Student mode strictly displays content that has been reviewed and approved by the teacher. Please return to the studio to approve learning assets.
        </p>
        <button
          onClick={onExit}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-slate-800 transition-colors"
        >
          Return to Teacher Studio
        </button>
      </div>
    );
  }

  const { unit, assets } = data;

  const explanationAsset = assets.find((a) => a.type === 'explanation');
  const exampleAsset = assets.find((a) => a.type === 'worked_example');
  const quizAsset = assets.find((a) => a.type === 'quiz');
  const practiceAsset = assets.find((a) => a.type === 'practice');
  const revisionAsset = assets.find((a) => a.type === 'revision');
  const quizQuestions = quizAsset?.content.questions || [];
  const practiceQuestions = practiceAsset
    ? [
        ...(practiceAsset.content.foundationQuestions || []),
        ...(practiceAsset.content.extensionQuestions || []),
      ]
    : [];
  const handleSubmitQuiz = async () => {
    if (!quizAsset) return;
    try {
      setSubmittingQuiz(true);
      setQuizSubmitError(null);
      const result = await api.submitStudentAssessment(unitId, quizAsset.id, selectedAnswers);
      setQuizResult(result);
      setSubmittedQuiz(true);
    } catch (err: any) {
      setQuizSubmitError(err?.message || 'Could not submit quiz. Please try again.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleSubmitPractice = async () => {
    if (!practiceAsset) return;
    try {
      setSubmittingPractice(true);
      setPracticeSubmitError(null);
      const result = await api.submitStudentAssessment(unitId, practiceAsset.id, selectedPracticeAnswers);
      setPracticeResult(result);
      setSubmittedPractice(true);
    } catch (err: any) {
      setPracticeSubmitError(err?.message || 'Could not submit practice. Please try again.');
    } finally {
      setSubmittingPractice(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="student-mode min-h-screen bg-slate-50 font-sans text-slate-900 pb-16">
      {/* Student Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3.5 shadow-xs no-print">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Return to the unit picker for students or the studio for previews. */}
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors p-1 rounded-lg hover:bg-slate-100"
              title={authUser ? 'Back to units' : 'Back to Teacher Studio'}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{authUser ? 'Back to units' : 'Teacher Studio'}</span>
            </button>
            {/* Student branding when logged in as student */}
            {authUser && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {authUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{authUser.name}</p>
                  <p className="text-[10px] text-slate-500">{authUser.grade || 'Student'}{authUser.section ? ` · ${authUser.section}` : ''}{authUser.studentId ? ` · ${authUser.studentId}` : ''}</p>
                </div>
              </div>
            )}
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <h1 className="text-sm font-bold text-slate-900">{unit.title}</h1>
              <p className="text-[11px] text-slate-500">{unit.grade} • {unit.subject}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Handout</span>
            </button>
            {/* Sign out for student role */}
            {authUser && onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-xs font-semibold transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Student Navigation Tabs */}
      <div className="bg-white border-b border-slate-200/80 no-print">
        <div className="max-w-5xl mx-auto px-6 flex items-center gap-2 overflow-x-auto py-2">
          {explanationAsset && (
            <button
              onClick={() => setActiveTab('learn')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'learn'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>1. Learn Concept</span>
            </button>
          )}

          {exampleAsset && (
            <button
              onClick={() => setActiveTab('example')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'example'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>2. Guided Example</span>
            </button>
          )}

          {practiceAsset && (
            <button
              onClick={() => setActiveTab('practice')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'practice'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>3. Practice</span>
            </button>
          )}

          {quizAsset && (
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'quiz'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>4. Check Your Knowledge</span>
            </button>
          )}

          {revisionAsset && (
            <button
              onClick={() => setActiveTab('review')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'review'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>5. Quick Review</span>
            </button>
          )}

        </div>
      </div>

      {/* Main Student Workspace Container */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Printable Unit Header */}
        <div className="hidden print-only mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold">{unit.title}</h1>
          <p className="text-sm text-gray-600">{unit.grade} • {unit.subject} • Student Learning Pack</p>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span>Name: ______________________</span>
            <span>Date: ______________________</span>
          </div>
        </div>

        {/* 1. Learn (Concept Explanation) */}
        {activeTab === 'learn' && explanationAsset && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Core Concept
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">{explanationAsset.title}</h2>
            </div>

            <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-sm text-indigo-950 font-medium leading-relaxed">
              {explanationAsset.content.summary}
            </div>

            <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line space-y-4">
              {explanationAsset.content.fullExplanation}
            </div>

            {explanationAsset.content.keyIdeas && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Key Scientific Takeaways
                </h3>
                <ul className="space-y-2">
                  {explanationAsset.content.keyIdeas.map((idea: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                      <span>{idea}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {explanationAsset.content.keyVocabulary && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Target Vocabulary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {explanationAsset.content.keyVocabulary.map((vocab: any, i: number) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <strong className="text-indigo-800">{vocab.term}: </strong>
                      <span className="text-slate-600">{vocab.definition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Example (Guided Step-by-Step) */}
        {activeTab === 'example' && exampleAsset && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Step-by-Step Thinking
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">{exampleAsset.title}</h2>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Problem Scenario
              </h3>
              <p className="text-sm font-medium text-slate-800">{exampleAsset.content.scenarioProblem}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Reasoning Process
              </h3>
              {exampleAsset.content.guidedSteps?.map((step: any) => (
                <div key={step.stepNumber} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                      {step.stepNumber}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed pl-8.5">{step.explanation}</p>
                </div>
              ))}
            </div>

            {exampleAsset.content.solutionSummary && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950">
                <strong className="block font-bold mb-1">Final Summary:</strong>
                {exampleAsset.content.solutionSummary}
              </div>
            )}
          </div>
        )}

        {/* 3. Practice */}
        {activeTab === 'practice' && practiceAsset && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-8">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Practice Challenges
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">{practiceAsset.title}</h2>
            </div>

            {submittedPractice && practiceResult && practiceResult.total > 0 && (
              <div role="status" className={`flex items-center gap-3 rounded-xl border p-4 ${practiceResult.score === practiceResult.total ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : practiceResult.score === 0 ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-indigo-200 bg-indigo-50 text-indigo-900'}`}>
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-bold">Practice results</p>
                  <p className="text-xs">
                    {practiceResult.score} of {practiceResult.total} correct
                    {' '}({Math.round((practiceResult.score / practiceResult.total) * 100)}%)
                  </p>
                </div>
              </div>
            )}
            {practiceSubmitError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{practiceSubmitError}</p>}

            {/* Foundation Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full w-fit border border-teal-200">
                Part A: Foundation Principles
              </h3>
              {practiceAsset.content.foundationQuestions?.map((q: any) => (
                <div key={q.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <p className="text-sm font-bold text-slate-900">
                    {q.questionNumber}. {q.question}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options?.map((opt: string, i: number) => {
                      const isSelected = selectedPracticeAnswers[q.id] === opt;
                      const questionResult = getQuestionResult(practiceResult, q.id);
                      const isCorrect = opt === questionResult?.correctAnswer;
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={submittedPractice}
                          onClick={() => setSelectedPracticeAnswers((previous) => ({ ...previous, [q.id]: opt }))}
                          className={`p-3 rounded-xl border text-left transition-colors disabled:cursor-default ${submittedPractice
                            ? isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : isSelected
                                ? 'bg-rose-50 border-rose-300 text-rose-900'
                                : 'bg-white border-slate-200 text-slate-700'
                            : isSelected
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-900'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {submittedPractice && (
                    <div className={`rounded-xl border p-3 text-xs ${getQuestionResult(practiceResult, q.id)?.correct ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`}>
                      <p className="font-bold">
                        {getQuestionResult(practiceResult, q.id)?.correct
                          ? 'Correct'
                          : selectedPracticeAnswers[q.id]
                            ? 'Incorrect'
                            : 'Not answered'}
                      </p>
                      {!getQuestionResult(practiceResult, q.id)?.correct && (
                        <p className="mt-1">
                          {selectedPracticeAnswers[q.id] ? 'Why your answer is incorrect: ' : ''}
                          {getQuestionResult(practiceResult, q.id)?.incorrectReason}
                        </p>
                      )}
                      <p className="mt-1">Correct answer: {getQuestionResult(practiceResult, q.id)?.correctAnswer || 'Not available for this question'}</p>
                      {getQuestionResult(practiceResult, q.id)?.correct && getQuestionResult(practiceResult, q.id)?.explanation && <p className="mt-1">{getQuestionResult(practiceResult, q.id)?.explanation}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Extension Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full w-fit border border-purple-200">
                Part B: Extension & Critical Inquiry
              </h3>
              {practiceAsset.content.extensionQuestions?.map((q: any) => (
                <div key={q.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <p className="text-sm font-bold text-slate-900">
                    {q.questionNumber}. {q.question}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options?.map((opt: string, i: number) => {
                      const isSelected = selectedPracticeAnswers[q.id] === opt;
                      const questionResult = getQuestionResult(practiceResult, q.id);
                      const isCorrect = opt === questionResult?.correctAnswer;
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={submittedPractice}
                          onClick={() => setSelectedPracticeAnswers((previous) => ({ ...previous, [q.id]: opt }))}
                          className={`p-3 rounded-xl border text-left transition-colors disabled:cursor-default ${submittedPractice
                            ? isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : isSelected
                                ? 'bg-rose-50 border-rose-300 text-rose-900'
                                : 'bg-white border-slate-200 text-slate-700'
                            : isSelected
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-900'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {submittedPractice && (
                    <div className={`rounded-xl border p-3 text-xs ${getQuestionResult(practiceResult, q.id)?.correct ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`}>
                      <p className="font-bold">
                        {getQuestionResult(practiceResult, q.id)?.correct
                          ? 'Correct'
                          : selectedPracticeAnswers[q.id]
                            ? 'Incorrect'
                            : 'Not answered'}
                      </p>
                      {!getQuestionResult(practiceResult, q.id)?.correct && (
                        <p className="mt-1">
                          {selectedPracticeAnswers[q.id] ? 'Why your answer is incorrect: ' : ''}
                          {getQuestionResult(practiceResult, q.id)?.incorrectReason}
                        </p>
                      )}
                      <p className="mt-1">Correct answer: {getQuestionResult(practiceResult, q.id)?.correctAnswer || 'Not available for this question'}</p>
                      {getQuestionResult(practiceResult, q.id)?.correct && getQuestionResult(practiceResult, q.id)?.explanation && <p className="mt-1">{getQuestionResult(practiceResult, q.id)?.explanation}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-500">
                {Object.keys(selectedPracticeAnswers).length} of {practiceQuestions.length} answered
              </span>
              {!submittedPractice ? (
                <button
                  type="button"
                  onClick={handleSubmitPractice}
                  disabled={practiceQuestions.length === 0 || submittingPractice}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingPractice ? 'Checking answers...' : 'Submit Practice'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedPractice(false);
                    setPracticeResult(null);
                    setPracticeSubmitError(null);
                    setSelectedPracticeAnswers({});
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. Quiz (Interactive Student Quiz) */}
        {activeTab === 'quiz' && quizAsset && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Self-Check Assessment
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">{quizAsset.title}</h2>
              <p className="text-xs text-slate-500 mt-1">{quizAsset.content.instructions}</p>
            </div>

            {submittedQuiz && quizResult && quizResult.total > 0 && (
              <div role="status" className={`flex items-center gap-3 rounded-xl border p-4 ${quizResult.score === quizResult.total ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : quizResult.score === 0 ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-indigo-200 bg-indigo-50 text-indigo-900'}`}>
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-bold">Quiz results</p>
                  <p className="text-xs">
                    {quizResult.score} of {quizResult.total} correct
                    {' '}({Math.round((quizResult.score / quizResult.total) * 100)}%)
                  </p>
                </div>
              </div>
            )}
            {quizSubmitError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{quizSubmitError}</p>}

            <div className="space-y-6">
              {quizAsset.content.questions?.map((q: any) => (
                <div key={q.id} className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                  <p className="text-sm font-bold text-slate-900">
                    {q.questionNumber}. {q.question}
                  </p>

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {q.options?.map((opt: string, i: number) => {
                      const isSelected = selectedAnswers[q.id] === opt;
                      const questionResult = getQuestionResult(quizResult, q.id);
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={submittedQuiz}
                          onClick={() => {
                            if (!submittedQuiz) {
                              setSelectedAnswers({ ...selectedAnswers, [q.id]: opt });
                            }
                          }}
                          className={`p-3.5 rounded-xl border text-left text-xs font-medium transition-all disabled:cursor-default ${submittedQuiz
                            ? opt === questionResult?.correctAnswer
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : isSelected
                                ? 'bg-rose-50 border-rose-300 text-rose-900'
                                : 'bg-white border-slate-200 text-slate-700'
                            : isSelected
                              ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {submittedQuiz && (
                    <div className={`rounded-xl border p-3 text-xs ${getQuestionResult(quizResult, q.id)?.correct ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`}>
                      <p className="font-bold">
                        {getQuestionResult(quizResult, q.id)?.correct
                          ? 'Correct'
                          : selectedAnswers[q.id]
                            ? 'Incorrect'
                            : 'Not answered'}
                      </p>
                      {!getQuestionResult(quizResult, q.id)?.correct && (
                        <p className="mt-1">
                          {selectedAnswers[q.id] ? 'Why your answer is incorrect: ' : ''}
                          {getQuestionResult(quizResult, q.id)?.incorrectReason}
                        </p>
                      )}
                      <p className="mt-1">Correct answer: {getQuestionResult(quizResult, q.id)?.correctAnswer || 'Not available for this question'}</p>
                      {getQuestionResult(quizResult, q.id)?.correct && getQuestionResult(quizResult, q.id)?.explanation && <p className="mt-1">{getQuestionResult(quizResult, q.id)?.explanation}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between no-print">
              <span className="text-xs text-slate-500">
                {Object.keys(selectedAnswers).length} of {quizQuestions.length} answered
              </span>

              {!submittedQuiz ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submittingQuiz || quizQuestions.length === 0}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingQuiz ? 'Checking answers...' : 'Submit Quiz Answers'}
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    ✓ Quiz Submitted Successfully
                  </span>
                  <button
                    onClick={() => {
                      setSubmittedQuiz(false);
                      setQuizResult(null);
                      setQuizSubmitError(null);
                      setSelectedAnswers({});
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Revision Sheet */}
        {activeTab === 'review' && revisionAsset && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Exam Preparation
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">{revisionAsset.title}</h2>
            </div>

            <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs text-indigo-950 font-medium leading-relaxed">
              {revisionAsset.content.coreSummary}
            </div>

            {revisionAsset.content.criticalRelationships && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Concept Connections
                </h3>
                <div className="space-y-2">
                  {revisionAsset.content.criticalRelationships.map((rel: any, i: number) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 text-xs">
                      <strong className="text-slate-900">{rel.conceptA}</strong>
                      <span className="text-indigo-600 font-mono text-[11px]">→ {rel.relationship} →</span>
                      <strong className="text-slate-900">{rel.conceptB}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {revisionAsset.content.essentialFormulasOrRules && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Essential Equations & Rules
                </h3>
                <div className="space-y-2">
                  {revisionAsset.content.essentialFormulasOrRules.map((r: string, i: number) => (
                    <div key={i} className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 font-mono text-xs text-emerald-950">
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
