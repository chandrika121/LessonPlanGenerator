import { AlertCircle, Eye, EyeOff, LockKeyhole, Mail, Phone, School, ShieldCheck, User, Users } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { registerUser } from "../services/auth";
import type { RegisterPayload, UserRole } from "../types/auth";
import { roleRoutes } from "../utils/navigation";

const classOptions = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const sectionOptions = ["A", "B", "C", "D"];
const streamOptions = ["Science", "Commerce", "Humanities"];

const roleCards: Array<{ role: UserRole; label: string; icon: typeof User }> = [
  { role: "student", label: "Student", icon: School },
  { role: "teacher", label: "Teacher", icon: Users },
  { role: "principal", label: "Principal", icon: ShieldCheck },
];

function isSeniorClass(classId: string) {
  return classId === "XI" || classId === "XII";
}

export function RegisterPage() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<RegisterPayload>({
    role: "student",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    classId: "",
    section: "",
    stream: "",
    subject: "",
  });

  if (isAuthenticated && role) {
    return <Navigate to={roleRoutes[role].dashboardPath} replace />;
  }

  const seniorStudent = useMemo(() => form.role === "student" && isSeniorClass(form.classId || ""), [form.classId, form.role]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const created = await registerUser(form);
      navigate("/login", {
        replace: true,
        state: {
          registrationSuccess: `Account created for ${created.name}. Please log in.`,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(54,173,170,0.18),_transparent_32%),linear-gradient(160deg,#f7fbfc_0%,#eef5f8_48%,#f7efe9_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <section className="flex w-full items-center justify-center">
          <div className="w-full max-w-3xl rounded-[36px] border border-white/80 bg-white/90 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-10">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#36ADAA]">Authentication</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold text-slate-900">Create your account</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">Register once, then continue with the same role-based dashboard flow already used in the app.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {roleCards.map(({ role, label, icon: Icon }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, role, classId: "", section: "", stream: "", subject: "" }))}
                    className={[
                      "flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                      form.role === role
                        ? "border-[#36ADAA] bg-[#36ADAA] text-white shadow-lg shadow-[#36ADAA]/25"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-5 rounded-[28px] border border-slate-100 bg-slate-50/80 p-5">
                  <h3 className="font-display text-lg font-extrabold text-slate-900">Personal Information</h3>

                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Full Name</span>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <User className="h-4 w-4 text-slate-400" />
                      <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full bg-transparent text-sm outline-none" />
                    </div>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Email Address</span>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="w-full bg-transparent text-sm outline-none" />
                    </div>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Phone Number</span>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <input type="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="w-full bg-transparent text-sm outline-none" />
                    </div>
                  </label>
                </div>

                <div className="space-y-5 rounded-[28px] border border-slate-100 bg-slate-50/80 p-5">
                  <h3 className="font-display text-lg font-extrabold text-slate-900">
                    {form.role === "student" ? "Academic Information" : form.role === "teacher" ? "Professional Information" : "Account Information"}
                  </h3>

                  {form.role === "student" ? (
                    <>
                      <label className="block space-y-2">
                        <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Class</span>
                        <select value={form.classId} onChange={(event) => setForm((current) => ({ ...current, classId: event.target.value, stream: "" }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none">
                          <option value="">Select Class</option>
                          {classOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </label>

                      <label className="block space-y-2">
                        <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Section</span>
                        <select value={form.section} onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none">
                          <option value="">Select Section</option>
                          {sectionOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </label>

                      {seniorStudent ? (
                        <label className="block space-y-2">
                          <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Stream</span>
                          <select value={form.stream} onChange={(event) => setForm((current) => ({ ...current, stream: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none">
                            <option value="">Select Stream</option>
                            {streamOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                          </select>
                        </label>
                      ) : null}
                    </>
                  ) : null}

                  {form.role === "teacher" ? (
                    <label className="block space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Subject</span>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <Users className="h-4 w-4 text-slate-400" />
                        <input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} className="w-full bg-transparent text-sm outline-none" />
                      </div>
                    </label>
                  ) : null}

                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Password</span>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <LockKeyhole className="h-4 w-4 text-slate-400" />
                      <input type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="w-full bg-transparent text-sm outline-none" />
                      <button type="button" onClick={() => setShowPassword((current) => !current)} className="text-slate-400 transition hover:text-slate-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Confirm Password</span>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <LockKeyhole className="h-4 w-4 text-slate-400" />
                      <input type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} className="w-full bg-transparent text-sm outline-none" />
                      <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} className="text-slate-400 transition hover:text-slate-600">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </label>
                </div>
              </div>

              {error ? (
                <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <button type="submit" disabled={submitting} className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? "Creating account..." : "Register"}
              </button>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-[#36ADAA] transition hover:text-[#2d9491]">
                  Login
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
