import React, { useState } from "react";
import {
  BookOpen,
  GraduationCap,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  UserPlus,
  LogIn,
} from "lucide-react";

export type UserRole = "teacher" | "student";
export type AuthMode = "signin" | "signup";

export interface AuthUser {
  role: UserRole;
  name: string;
  email: string;
  school?: string;
  subject?: string;
  employeeId?: string;
  studentId?: string;
  grade?: string;
  section?: string;
}

interface Props {
  onLogin: (user: AuthUser) => void;
  defaultRole?: UserRole;
  compact?: boolean; // for modal usage
}

const ic = (err?: string) =>
  "w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:ring-2 " +
  (err
    ? "border-rose-400 focus:ring-rose-200"
    : "border-slate-200 focus:ring-indigo-200 focus:border-indigo-400");
const lc = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5";

export const LoginPage: React.FC<Props> = ({ onLogin, defaultRole, compact }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(defaultRole || null);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Shared fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Teacher extra
  const [school, setSchool] = useState("");
  const [subject, setSubject] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  // Student extra
  const [studentId, setStudentId] = useState("");

  const resetForm = () => {
    setName(""); setEmail(""); setPassword(""); setConfirmPassword("");
    setSchool(""); setSubject(""); setEmployeeId("");
    setStudentId("");
    setErrors({});
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const isSignUp = authMode === "signup";

    if (isSignUp && !name.trim()) errs.name = "Full name is required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Valid email is required";
    if (!password || password.length < 4)
      errs.password = "Password must be at least 4 characters";
    if (isSignUp && password !== confirmPassword)
      errs.confirmPassword = "Passwords do not match";

    if (isSignUp && selectedRole === "teacher") {
      if (!school.trim()) errs.school = "School / Institution is required";
      if (!subject.trim()) errs.subject = "Subject area is required";
    }
    if (selectedRole === "student") {
      if (isSignUp && !studentId.trim()) errs.studentId = "Student ID is required";
      if (isSignUp && !school.trim()) errs.school = "School / Institution is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      if (selectedRole === "teacher") {
        onLogin({
          role: "teacher",
          name: authMode === "signin" ? email.split("@")[0] : name,
          email,
          school: authMode === "signup" ? school : undefined,
          subject: authMode === "signup" ? subject : undefined,
          employeeId: authMode === "signup" ? employeeId : undefined,
        });
      } else {
        onLogin({
          role: "student",
          name: authMode === "signin" ? (email.split("@")[0] || studentId) : name,
          email,
          studentId: authMode === "signup" ? studentId : undefined,
          school: authMode === "signup" ? school : undefined,
        });
      }
      setLoading(false);
    }, 700);
  };

  const fillDemo = () => {
    if (selectedRole === "teacher") {
      setName("Sarah Mitchell"); setEmail("sarah@greenwood.edu");
      setSchool("Greenwood High School"); setSubject("Computer Science / Networking");
      setEmployeeId("TCH-2024-001"); setPassword("demo1234"); setConfirmPassword("demo1234");
    } else {
      setName("Alex Johnson"); setEmail("alex.j@students.greenwood.edu");
      setSchool("Greenwood High School");
      setStudentId("STU-2024-0847"); setPassword("demo1234"); setConfirmPassword("demo1234");
    }
    setErrors({});
  };

  const roleColor = selectedRole === "teacher" ? "indigo" : "emerald";
  const submitLabel = authMode === "signin"
    ? (selectedRole === "teacher" ? "Sign In to Teacher Studio" : "Sign In to Learning Pack")
    : (selectedRole === "teacher" ? "Create Teacher Account" : "Create Student Account");

  const wrapper = compact
    ? "w-full"
    : "min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden";

  const inner = compact ? "w-full" : "w-full max-w-[440px] relative z-10";

  return (
    <div className={wrapper}>
      {!compact && (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 right-0 w-72 h-72 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      <div className={inner}>
        {/* Brand — hidden in compact mode */}
        {!compact && (
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white tracking-tight">LearnSmith</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/30">Studio</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">AI Learning Pack Studio</p>
            </div>
          </div>
        )}

        {!selectedRole ? (
          /* ── Role Selection ── */
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white">Welcome to LearnSmith</h1>
              <p className="text-slate-400 text-sm mt-1.5">Who are you? Choose your role to continue.</p>
            </div>

            <button
              onClick={() => setSelectedRole("teacher")}
              className="w-full group bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-400/50 rounded-2xl p-6 text-left transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/10"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white">I'm a Teacher</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Create, review and approve learning packs</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Generate Packs", "Review Assets", "Export Materials"].map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 font-medium">{t}</span>
                ))}
              </div>
            </button>

            <button
              onClick={() => setSelectedRole("student")}
              className="w-full group bg-white/5 hover:bg-emerald-600/20 border border-white/10 hover:border-emerald-400/50 rounded-2xl p-6 text-left transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/10"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white">I'm a Student</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Access your class learning packs</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Learn Content", "Practice Quiz", "Revision Notes"].map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-medium">{t}</span>
                ))}
              </div>
            </button>

            {!compact && <p className="text-center text-[11px] text-slate-600 mt-4">LearnSmith · AI Learning Pack Studio © 2026</p>}
          </div>

        ) : (
          /* ── Auth Form ── */
          <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl">
            {/* Header row */}
            <div className="flex items-center gap-3 mb-5">
              {!defaultRole && (
                <button
                  onClick={() => { setSelectedRole(null); resetForm(); }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className={"w-8 h-8 rounded-lg flex items-center justify-center " + (selectedRole === "teacher" ? "bg-indigo-600" : "bg-emerald-600")}>
                {selectedRole === "teacher" ? <ShieldCheck className="w-4 h-4 text-white" /> : <GraduationCap className="w-4 h-4 text-white" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {selectedRole === "teacher" ? "Teacher" : "Student"} Account
                </h2>
                <p className="text-[11px] text-slate-400">
                  {selectedRole === "teacher" ? "Teaching studio access" : "Learning pack access"}
                </p>
              </div>
            </div>

            {/* Sign In / Sign Up Tabs */}
            <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 mb-5">
              <button
                type="button"
                onClick={() => { setAuthMode("signin"); resetForm(); }}
                className={"flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all " +
                  (authMode === "signin"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-white")}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("signup"); resetForm(); }}
                className={"flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all " +
                  (authMode === "signup"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-white")}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>

              {/* ── SIGN UP only: name ── */}
              {authMode === "signup" && (
                <div>
                  <label className={lc}>Full Name *</label>
                  <input
                    id="auth-name"
                    type="text"
                    placeholder={selectedRole === "teacher" ? "Sarah Mitchell" : "Alex Johnson"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={ic(errors.name)}
                  />
                  {errors.name && <p className="text-rose-400 text-[11px] mt-1">{errors.name}</p>}
                </div>
              )}

              {/* Email */}
              <div>
                <label className={lc}>Email Address *</label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder={selectedRole === "teacher" ? "teacher@school.edu" : "student@school.edu"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={ic(errors.email)}
                />
                {errors.email && <p className="text-rose-400 text-[11px] mt-1">{errors.email}</p>}
              </div>

              {/* ── SIGN UP Teacher extra fields ── */}
              {authMode === "signup" && selectedRole === "teacher" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lc}>School / Institution *</label>
                      <input
                        id="t-school"
                        type="text"
                        placeholder="Greenwood High"
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        className={ic(errors.school)}
                      />
                      {errors.school && <p className="text-rose-400 text-[11px] mt-1">{errors.school}</p>}
                    </div>
                    <div>
                      <label className={lc}>Employee ID</label>
                      <input
                        id="t-emp-id"
                        type="text"
                        placeholder="TCH-2024-001"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        className={ic()}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={lc}>Subject Area *</label>
                    <select
                      id="t-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className={ic(errors.subject)}
                    >
                      <option value="">Select your subject...</option>
                      {["Computer Science / Networking","Mathematics","Physics","Chemistry","Biology","English Literature","History","Geography","Economics","Other"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors.subject && <p className="text-rose-400 text-[11px] mt-1">{errors.subject}</p>}
                  </div>
                </>
              )}

              {/* ── SIGN UP Student extra fields ── */}
              {authMode === "signup" && selectedRole === "student" && (
                <>
                  <div>
                    <label className={lc}>School / Institution *</label>
                    <input
                      id="s-school"
                      type="text"
                      placeholder="Greenwood High School"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      className={ic(errors.school)}
                    />
                    {errors.school && <p className="text-rose-400 text-[11px] mt-1">{errors.school}</p>}
                  </div>
                  <div>
                    <label className={lc}>Student ID *</label>
                    <input
                      id="s-student-id"
                      type="text"
                      placeholder="STU-2024-0001"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className={ic(errors.studentId)}
                    />
                    {errors.studentId && <p className="text-rose-400 text-[11px] mt-1">{errors.studentId}</p>}
                  </div>
                </>
              )}

              {/* Password */}
              <div>
                <label className={lc}>Password *</label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={ic(errors.password) + " pr-11"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-rose-400 text-[11px] mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password — Sign Up only */}
              {authMode === "signup" && (
                <div>
                  <label className={lc}>Confirm Password *</label>
                  <input
                    id="auth-confirm-pw"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={ic(errors.confirmPassword)}
                  />
                  {errors.confirmPassword && <p className="text-rose-400 text-[11px] mt-1">{errors.confirmPassword}</p>}
                </div>
              )}

              {/* Demo fill */}
              {authMode === "signup" && (
                <button
                  type="button"
                  onClick={fillDemo}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-white/20 text-xs text-slate-400 hover:text-white hover:border-white/40 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Fill with demo details
                </button>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={
                  "w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-1 " +
                  (selectedRole === "teacher"
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-indigo-500/30"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/30")
                }
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {authMode === "signin" ? "Signing in..." : "Creating account..."}
                  </span>
                ) : submitLabel}
              </button>

              {/* Toggle link */}
              <p className="text-center text-[11px] text-slate-500 pt-1">
                {authMode === "signin" ? "Don't have an account?" : "Already have an account?"}
                {" "}
                <button
                  type="button"
                  onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); resetForm(); }}
                  className={"font-semibold hover:underline " + (selectedRole === "teacher" ? "text-indigo-400" : "text-emerald-400")}
                >
                  {authMode === "signin" ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
