import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { Source, SourceChunk } from '../types/index.ts';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  Check,
  Sparkles,
} from 'lucide-react';

interface Props {
  unitId: string;
  onNavigate: (view: string, unitId?: string) => void;
}

export const SourceWorkspace: React.FC<Props> = ({ unitId, onNavigate }) => {
  const [source, setSource] = useState<Source | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedPage, setSelectedPage] = useState<number>(1);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSource = async () => {
    try {
      setLoading(true);
      const res = await api.getSource(unitId);
      setSource(res.source);
      if (res.source) {
        setSelectedPage(1);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load source');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSource();
  }, [unitId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = (reader.result as string).split(',')[1];
            const res = await api.uploadSource(unitId, {
              name: file.name,
              type: 'pdf',
              fileBase64: base64,
            });
            setSource(res.source);
          } catch (err: any) {
            setError(err?.message || 'Failed to process document');
          } finally {
            setUploading(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const text = await file.text();
        const res = await api.uploadSource(unitId, {
          name: file.name,
          type: 'text',
          rawText: text,
        });
        setSource(res.source);
        setUploading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to process document');
      setUploading(false);
    }
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) {
      setError('Please paste curriculum source text.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const res = await api.uploadSource(unitId, {
        name: fileName.trim() || 'Curriculum_Source_Notes',
        type: 'text',
        rawText: pastedText,
      });
      setSource(res.source);
      setPastedText('');
    } catch (err: any) {
      setError(err?.message || 'Failed to process text source');
    } finally {
      setUploading(false);
    }
  };

  const currentPageChunks: SourceChunk[] = (source?.chunks || []).filter(
    (c) => c.page === selectedPage
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
            <span>Knowledge Boundary</span>
            <span>•</span>
            <span>Step 2</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Source Material Workspace</h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload verified curriculum material. The uploaded source document is the single source of truth for generated educational content.
          </p>
        </div>

        {source && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('unit_objectives', unitId)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
            >
              Review Objectives
            </button>
            <button
              onClick={() => onNavigate('unit_generate', unitId)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <span>Proceed to Generate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Trust boundary banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-indigo-900">Single Source of Truth Knowledge Rule</h3>
          <p className="text-xs text-indigo-800/80 mt-0.5 leading-relaxed">
            All generated assets (Explanation, Worked Example, Formative Quiz, Differentiated Practice, and Revision Notes) are generated <strong>exclusively</strong> from this uploaded source document. No outside domains or fallback topics will ever be substituted. If the source lacks sufficient information, the system will explicitly indicate this rather than inventing content.
          </p>
        </div>
      </div>

      {/* SOURCE VERIFIED Preview Card */}
      {source && (
        <div className="bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 rounded-2xl border-2 border-emerald-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    SOURCE VERIFIED
                  </span>
                  {source.detectedSubject && (
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {source.detectedSubject}
                    </span>
                  )}
                  {source.detectedGrade && (
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {source.detectedGrade}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{source.name}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                  <span className="uppercase font-semibold">{source.type}</span>
                  <span>•</span>
                  <span>{source.pageCount} Page{source.pageCount > 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{source.wordCount} Words</span>
                  <span>•</span>
                  <span>{source.chunks?.length || 0} Chunks Indexed</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('unit_generate', unitId)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Learning Pack</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Detected Topics Checklist */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Detected Curriculum Topics (Verified from Document)</span>
            </h4>

            {source.detectedTopics && source.detectedTopics.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {source.detectedTopics.map((topic, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-emerald-200/80 text-xs font-semibold text-slate-800 shadow-2xs hover:border-emerald-400 transition-colors"
                  >
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="truncate">{topic}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs font-semibold text-slate-700">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Curriculum Source Indexed & Grounded
                </span>
              </div>
            )}
          </div>

          {/* Interactive Source Preview */}
          <div className="pt-2 border-t border-emerald-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Inspecting Source Pages & Chunks
                </h4>
              </div>

              {/* Page Selector Tabs */}
              {source.pageCount > 1 && (
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {Array.from({ length: source.pageCount }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setSelectedPage(pg)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedPage === pg
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Page {pg}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chunks display */}
            <div className="space-y-3">
              {currentPageChunks.length > 0 ? (
                currentPageChunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="p-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-100 pb-1.5">
                      <span className="text-indigo-600 font-semibold">{chunk.id}</span>
                      <span>Page {chunk.page} • {chunk.wordCount} words</span>
                    </div>
                    <p className="leading-relaxed text-slate-800 whitespace-pre-line font-normal text-xs md:text-sm">
                      {chunk.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-500">
                  {source.rawText.substring(0, 500)}...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload / Replace Workspace */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            {source ? 'Replace / Update Source Material' : 'Upload Source Material'}
          </h3>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'upload'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Upload PDF / File
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'paste'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Paste Source Text
            </button>
          </div>
        </div>

        {uploading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-800">
              Extracting text, creating chunks & verifying topics...
            </p>
            <p className="text-xs text-slate-400">
              Preserving page numbers and constructing knowledge boundaries.
            </p>
          </div>
        ) : activeTab === 'upload' ? (
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors group bg-slate-50/50 hover:bg-indigo-50/20">
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">Click to upload curriculum PDF or text</p>
            <p className="text-xs text-slate-400 mt-1">Supports PDF textbook chapters, lesson notes, and curriculum guidelines</p>
          </label>
        ) : (
          <form onSubmit={handlePasteSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Document Label
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. Unit 3: Networking Fundamentals & Protocols"
                className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Source Text
                </label>
                <span className="text-xs text-slate-400">
                  {pastedText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                rows={8}
                required
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the educational content, textbook excerpts, or lesson text here..."
                className="w-full text-xs font-mono rounded-xl border border-slate-200 p-3.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Process & Index Source Text
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
