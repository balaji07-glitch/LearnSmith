import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { UnitOverviewSummary } from '../types/index.ts';
import {
  Printer,
  FileDown,
  Copy,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

interface Props {
  unitId: string;
}

export const ExportCenter: React.FC<Props> = ({ unitId }) => {
  const [summary, setSummary] = useState<UnitOverviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getUnitSummary(unitId);
        setSummary(res);
      } catch (err: any) {
        console.error('Failed to load summary for export:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [unitId]);

  if (loading || !summary) {
    return <div className="p-12 text-center text-slate-400">Loading export center...</div>;
  }

  const { unit, assets, objectives, questions, qualityChecks } = summary;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = (isTeacherVersion: boolean) => {
    let md = `# ${unit.title}\n**Grade:** ${unit.grade} | **Subject:** ${unit.subject}\n\n`;

    assets
      .filter((a) => a.status === 'APPROVED')
      .forEach((asset) => {
        md += `## ${asset.title}\n\n`;
        if (asset.type === 'explanation') {
          md += `${asset.content.summary}\n\n${asset.content.fullExplanation}\n\n`;
        } else if (asset.type === 'quiz') {
          asset.content.questions?.forEach((q: any) => {
            md += `### Q${q.questionNumber}. ${q.question}\n`;
            q.options?.forEach((opt: string) => {
              md += `- ${opt}\n`;
            });
            if (isTeacherVersion) {
              md += `\n**Correct Answer:** ${q.correctAnswer}\n*Rationale:* ${q.explanation}\n\n`;
            } else {
              md += '\n';
            }
          });
        } else if (asset.type === 'revision') {
          md += `${asset.content.coreSummary}\n\n`;
        }
      });

    if (isTeacherVersion) {
      md += `\n## Teacher Provenance & Quality Report\n`;
      qualityChecks.forEach((c) => {
        md += `- [${c.severity.toUpperCase()}] ${c.message}: ${c.details}\n`;
      });
    }

    navigator.clipboard.writeText(md);
    setCopiedType(isTeacherVersion ? 'teacher' : 'student');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${unit.title.replace(/\s+/g, '_')}_LearnSmith_Pack.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-6 no-print">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
          <span>Publishing & Export</span>
          <span>•</span>
          <span>Classroom Distribution</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Export Center</h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate clean, classroom-ready student handouts or a comprehensive teacher master dossier with complete answer keys.
        </p>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
        {/* Student Pack Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Student Learning Handout</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Contains only approved assets: concept explanation, guided example, tiered practice, clean self-check quiz, and revision sheet.
              </p>
            </div>
            <div className="text-xs text-slate-400">
              * Answers, AI models, and internal notes are strictly omitted.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Handout</span>
            </button>
            <button
              onClick={() => handleCopyMarkdown(false)}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedType === 'student' ? 'Copied!' : 'Copy Markdown'}</span>
            </button>
          </div>
        </div>

        {/* Teacher Master Pack Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Teacher Master Pack</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete classroom dossier containing full student material, verified answer keys with rationales, curriculum alignment matrix, and quality check audit log.
              </p>
            </div>
            <div className="text-xs text-slate-400">
              * Includes full provenance citations and source page references.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Master Dossier</span>
            </button>
            <button
              onClick={() => handleCopyMarkdown(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedType === 'teacher' ? 'Copied!' : 'Copy Teacher MD'}</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              title="Download entire pack JSON"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Document Preview Area */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-8 print:border-none print:shadow-none print:p-0">
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{unit.title}</h2>
              <p className="text-xs text-slate-500">{unit.grade} • {unit.subject} • Micro-Unit Learning Pack</p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-slate-100 rounded-md font-mono text-slate-600">
              LearnSmith Verified
            </span>
          </div>
        </div>

        {/* Assets Preview */}
        {assets.map((asset) => (
          <div key={asset.id} className="avoid-break space-y-3 pb-6 border-b border-slate-100 last:border-b-0">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-l-4 border-indigo-600 pl-2">
              {asset.title}
            </h3>

            {asset.type === 'explanation' && (
              <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                <p className="font-semibold text-slate-900">{asset.content.summary}</p>
                <p className="whitespace-pre-line">{asset.content.fullExplanation}</p>
              </div>
            )}

            {asset.type === 'worked_example' && (
              <div className="text-xs text-slate-700 space-y-2">
                <p className="font-medium text-slate-800">Problem: {asset.content.scenarioProblem}</p>
                {asset.content.guidedSteps?.map((s: any) => (
                  <p key={s.stepNumber} className="pl-4">
                    <strong>Step {s.stepNumber}: {s.title}</strong> — {s.explanation}
                  </p>
                ))}
              </div>
            )}

            {asset.type === 'quiz' && (
              <div className="text-xs text-slate-700 space-y-3">
                {asset.content.questions?.map((q: any) => (
                  <div key={q.id} className="space-y-1">
                    <p className="font-bold text-slate-900">
                      Q{q.questionNumber}. {q.question}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      {q.options?.map((opt: string, i: number) => (
                        <span key={i}>• {opt}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {asset.type === 'practice' && (
              <div className="text-xs text-slate-700 space-y-3">
                <p className="font-bold text-indigo-700">Part A: Foundation</p>
                {asset.content.foundationQuestions?.map((q: any) => (
                  <p key={q.id} className="pl-4">
                    <strong>Q{q.questionNumber}.</strong> {q.question}
                  </p>
                ))}
                <p className="font-bold text-purple-700 pt-2">Part B: Extension</p>
                {asset.content.extensionQuestions?.map((q: any) => (
                  <p key={q.id} className="pl-4">
                    <strong>Q{q.questionNumber}.</strong> {q.question}
                  </p>
                ))}
              </div>
            )}

            {asset.type === 'revision' && (
              <div className="text-xs text-slate-700 space-y-2">
                <p>{asset.content.coreSummary}</p>
                {asset.content.essentialFormulasOrRules?.map((r: string, i: number) => (
                  <p key={i} className="font-mono bg-slate-50 p-2 rounded">
                    {r}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
