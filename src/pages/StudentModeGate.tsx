import React, { useState } from "react";
import { X, GraduationCap, Eye, EyeOff, Sparkles, UserPlus, LogIn } from "lucide-react";
import { AuthUser } from "./LoginPage.tsx";

interface Props {
  onSuccess: (student: AuthUser) => void;
  onCancel: () => void;
}

const ic = (err?: string) =>
  "w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:ring-2 " +
  (err ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-emerald-200 focus:border-emerald-400");
const lc = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5";

export const StudentModeGate: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [studentId, setStudentId] = useState("");
  const [school, setSchool] = useState("");

  const reset = () => {
    setName(""); setEmail(""); setPassword(""); setConfirmPw("");
    setStudentId(""); setSchool(""); setErrors({});
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (mode === "signup") {
      if (!name.trim()) errs.name = "Full name is required";
      if (!studentId.trim()) errs.studentId = "Student ID is required";
      if (!school.trim()) errs.school = "School / Institution is required";
      if (password !== confirmPw) errs.confirmPw = "Passwords do not match";
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Valid email required";
    if (!password || password.length < 4) errs.password = "At least 4 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      onSuccess({
        role: "student",
        name: mode === "signup" ? name : (email.split("@")[0] || "Student"),
        email,
        studentId: mode === "signup" ? studentId : undefined,
        school: mode === "signup" ? school : undefined,
      });
      setLoading(false);
    }, 600);
  };

  const fillDemo = () => {
    setName("Alex Johnson"); setEmail("alex.j@students.greenwood.edu");
    setStudentId("STU-2024-0847"); setSchool("Greenwood High School");
    setPassword("demo1234"); setConfirmPw("demo1234");
    setErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-[420px] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Student Mode</h2>
              <p className="text-[11px] text-slate-400">Sign in as a student to preview learning packs</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sign In / Sign Up Tabs */}
        <div className="px-6 pt-5">
          <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 mb-4">
            <button
              type="button"
              onClick={() => { setMode("signin"); reset(); }}
              className={"flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all " +
                (mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-white")}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); reset(); }}
              className={"flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all " +
                (mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-white")}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Sign Up
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3.5" noValidate>

          {mode === "signup" && (
            <div>
              <label className={lc}>Full Name *</label>
              <input id="sg-name" type="text" placeholder="Alex Johnson" value={name} onChange={(e) => setName(e.target.value)} className={ic(errors.name)} />
              {errors.name && <p className="text-rose-400 text-[11px] mt-1">{errors.name}</p>}
            </div>
          )}

          <div>
            <label className={lc}>Email Address *</label>
            <input id="sg-email" type="email" placeholder="student@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} className={ic(errors.email)} />
            {errors.email && <p className="text-rose-400 text-[11px] mt-1">{errors.email}</p>}
          </div>

          {mode === "signup" && (
            <>
              <div>
                <label className={lc}>School / Institution *</label>
                <input id="sg-school" type="text" placeholder="Greenwood High School" value={school} onChange={(e) => setSchool(e.target.value)} className={ic(errors.school)} />
                {errors.school && <p className="text-rose-400 text-[11px] mt-1">{errors.school}</p>}
              </div>
              <div>
                <label className={lc}>Student ID *</label>
                <input id="sg-sid" type="text" placeholder="STU-2024-0001" value={studentId} onChange={(e) => setStudentId(e.target.value)} className={ic(errors.studentId)} />
                {errors.studentId && <p className="text-rose-400 text-[11px] mt-1">{errors.studentId}</p>}
              </div>
            </>
          )}

          <div>
            <label className={lc}>Password *</label>
            <div className="relative">
              <input id="sg-password" type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={ic(errors.password) + " pr-11"} />
              <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-rose-400 text-[11px] mt-1">{errors.password}</p>}
          </div>

          {mode === "signup" && (
            <div>
              <label className={lc}>Confirm Password *</label>
              <input id="sg-confirm-pw" type={showPw ? "text" : "password"} placeholder="••••••••" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={ic(errors.confirmPw)} />
              {errors.confirmPw && <p className="text-rose-400 text-[11px] mt-1">{errors.confirmPw}</p>}
            </div>
          )}

          {mode === "signup" && (
            <button type="button" onClick={fillDemo} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-white/20 text-xs text-slate-400 hover:text-white hover:border-white/40 transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
              Fill with demo details
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {mode === "signin" ? "Signing in..." : "Creating account..."}
              </span>
            ) : mode === "signin" ? "Sign In as Student" : "Create Student Account"}
          </button>

          <p className="text-center text-[11px] text-slate-500">
            {mode === "signin" ? "No account yet?" : "Already have an account?"}
            {" "}
            <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); reset(); }} className="text-emerald-400 font-semibold hover:underline">
              {mode === "signin" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
