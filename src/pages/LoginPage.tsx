import { AlertCircle, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { roleRoutes } from "../utils/navigation";

export function LoginPage() {
  const { isAuthenticated, login, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && role) {
    return <Navigate to={roleRoutes[role].dashboardPath} replace />;
  }

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const registrationSuccess = (location.state as { registrationSuccess?: string } | null)?.registrationSuccess;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const authenticated = await login(email, password);
      navigate(from || roleRoutes[authenticated.role].dashboardPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(54,173,170,0.18),_transparent_32%),linear-gradient(160deg,#f7fbfc_0%,#eef5f8_48%,#f7efe9_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <section className="flex items-center justify-center">
          <div className="w-full max-w-xl rounded-[36px] border border-white/80 bg-white/90 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-10">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#36ADAA]">Authentication</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold text-slate-900">Welcome back</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">Sign in with your registered account to continue to your dashboard.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {registrationSuccess ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  {registrationSuccess}
                </div>
              ) : null}

              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Email Address</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                    type="email"
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Password</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-slate-400 transition hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setError("Forgot password flow will be available from the real backend recovery process.")}
                  className="text-sm font-semibold text-[#36ADAA] transition hover:text-[#2d9491]"
                >
                  Forgot Password
                </button>
              </div>

              {error ? (
                <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Signing in..." : "Login"}
              </button>

              <p className="text-center text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link to="/register" className="font-semibold text-[#36ADAA] transition hover:text-[#2d9491]">
                  Register
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
