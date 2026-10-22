import React, { useState, useEffect } from "react";
import { api } from "../api.ts";
import { AuthUser } from "./LoginPage.tsx";
import {
  GraduationCap,
  BookOpen,
  ChevronRight,
  LogOut,
  Search,
  Layers,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface UnitCard {
  id: string;
  title: string;
  subject: string;
  grade: string;
  status: string;
  assetCount: number;
  approvedCount: number;
}

interface Props {
  authUser: AuthUser;
  onSelectUnit: (unitId: string) => void;
  onLogout: () => void;
}

export const StudentHome: React.FC<Props> = ({ authUser, onSelectUnit, onLogout }) => {
  const [allUnits, setAllUnits] = useState<UnitCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .getUnits()
      .then((res) => setAllUnits(res.units as UnitCard[]))
      .catch(() => setAllUnits([]))
      .finally(() => setLoading(false));
  }, []);

  // Students may choose from learning packs across all grades.
  const filtered = search.trim()
    ? allUnits.filter(
        (u) =>
          u.title.toLowerCase().includes(search.toLowerCase()) ||
          u.subject.toLowerCase().includes(search.toLowerCase())
      )
    : allUnits;

  const subjectColors: Record<string, string> = {
    "Computer Science / Networking": "from-indigo-500 to-violet-600",
    Mathematics: "from-amber-500 to-orange-600",
    Physics: "from-sky-500 to-blue-600",
    Chemistry: "from-emerald-500 to-teal-600",
    Biology: "from-green-500 to-emerald-600",
    "English Literature": "from-rose-500 to-pink-600",
    History: "from-amber-600 to-yellow-600",
    Geography: "from-cyan-500 to-sky-600",
    Economics: "from-violet-500 to-purple-600",
  };

  const getGradient = (subject: string) =>
    subjectColors[subject] || "from-slate-500 to-slate-700";

  return (
    <div className="student-home min-h-screen bg-slate-50 font-sans">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
          {/* Brand + student info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-900">LearnSmith</span>
            </div>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {authUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-none">{authUser.name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {authUser.grade || "Student"}
                  {authUser.section ? ` · ${authUser.section}` : ""}
                  {authUser.studentId ? ` · ${authUser.studentId}` : ""}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Welcome hero */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-7 mb-8 text-white relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold mb-2">
              <GraduationCap className="w-4 h-4" />
              <span>Student Learning Portal</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">
              Welcome back, {authUser.name.split(" ")[0]}!
            </h1>
            <p className="text-indigo-200 text-sm">
              Here are all available learning packs. Choose any unit to get started.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
          />
        </div>

        {/* Section heading */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              All Learning Packs
            </h2>
            {!loading && (
              <span className="text-xs text-slate-400 font-medium">
                ({filtered.length} {filtered.length === 1 ? "pack" : "packs"})
              </span>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Loading learning packs...</p>
            </div>
          </div>
        )}

        {/* No packs for this grade */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {search
                ? "No packs match your search"
                : `No learning packs available for ${authUser.grade || "your grade"} yet`}
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              {search
                ? "Try a different search term."
                : "Your teacher hasn't published any approved learning packs for your grade yet. Check back soon!"}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Unit cards grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((unit) => {
              const readyPct =
                unit.assetCount > 0
                  ? Math.round((unit.approvedCount / unit.assetCount) * 100)
                  : 0;
              const isReady = unit.approvedCount > 0;

              return (
                <button
                  key={unit.id}
                  onClick={() => isReady ? onSelectUnit(unit.id) : undefined}
                  disabled={!isReady}
                  className={
                    "group w-full text-left bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all " +
                    (isReady
                      ? "hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 cursor-pointer"
                      : "opacity-60 cursor-not-allowed")
                  }
                >
                  {/* Color header strip */}
                  <div className={`h-2 w-full bg-gradient-to-r ${getGradient(unit.subject)}`} />

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {unit.grade} · {unit.subject}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-indigo-700 transition-colors">
                          {unit.title}
                        </h3>
                      </div>
                      {isReady ? (
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                          Coming Soon
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {isReady ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          <span className="text-xs font-semibold text-slate-700">
                            {unit.approvedCount}/{unit.assetCount} Assets Ready
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-500">{readyPct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            readyPct === 100 ? "bg-emerald-500" : readyPct > 0 ? "bg-indigo-500" : "bg-slate-300"
                          }`}
                          style={{ width: `${readyPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
