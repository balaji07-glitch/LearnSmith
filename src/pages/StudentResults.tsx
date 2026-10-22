import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, RefreshCw, Users } from 'lucide-react';
import { api } from '../api.ts';
import type { StudentAssessmentResult } from '../types/index.ts';

interface Props {
  unitId: string;
  onNavigate: (view: string, unitId?: string) => void;
}

export const StudentResults: React.FC<Props> = ({ unitId, onNavigate }) => {
  const [results, setResults] = useState<StudentAssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getStudentAssessmentResults(unitId);
      setResults(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load student results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadResults();
  }, [unitId]);

  const averagePercent = results.length
    ? Math.round(results.reduce((sum, result) => sum + (result.total ? (result.score / result.total) * 100 : 0), 0) / results.length)
    : 0;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('unit_overview', unitId)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Unit
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Student Assessment Results</h1>
          <p className="text-sm text-slate-500 mt-1">Quiz and practice submissions for this learning unit.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadResults()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Results
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Could not load student results</p>
            <p className="mt-1">{error}</p>
            {error.includes('SUPABASE_') && (
              <p className="mt-2 text-xs">Configure the Supabase environment variables and assessment-results table, then refresh.</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Submissions</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '—' : results.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Score</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{loading || results.length === 0 ? '—' : `${averagePercent}%`}</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <Users className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-800">Recent Submissions</h2>
        </div>
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading assessment results...</p>
        ) : results.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">No student submissions yet</p>
            <p className="mt-1 text-xs text-slate-500">Results will appear here when students submit a quiz or practice assessment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-bold">Student</th>
                  <th className="px-5 py-3 font-bold">Assessment</th>
                  <th className="px-5 py-3 font-bold">Score</th>
                  <th className="px-5 py-3 font-bold">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((result) => (
                  <tr key={result.id} className="text-slate-700">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{result.student_name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{result.student_id || result.student_email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{result.assessment_title}</p>
                      <p className="mt-0.5 text-xs capitalize text-slate-500">{result.assessment_type}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900">{result.score}/{result.total}</span>
                      <span className="ml-2 text-xs text-slate-500">
                        {result.total ? `${Math.round((result.score / result.total) * 100)}%` : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {new Date(result.submitted_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
