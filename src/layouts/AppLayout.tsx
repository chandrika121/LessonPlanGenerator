import { AlertTriangle, Bell, ChevronRight, LogOut, Menu, MoonStar, Search, SunMedium } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../hooks/useAuth";
import { getPrincipalAlerts } from "../services/principalServiceApi";
import type { PrincipalAlert } from "../services/principalServiceApi";
import { endDevTimer, restartDevTimer } from "../utils/devTiming";
import { getBreadcrumbs, getPageTitle } from "../utils/navigation";

export const AppLayout = memo(function AppLayout() {
  const { logout, role, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [principalAlerts, setPrincipalAlerts] = useState<PrincipalAlert[]>([]);
  const routeRenderLabelRef = useRef<string | null>(null);
  const alertsPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const navLabel = `[nav-click] ${location.pathname}`;
    const routeLabel = `[route-render] ${location.pathname}`;

    endDevTimer(navLabel);
    restartDevTimer(routeLabel);
    routeRenderLabelRef.current = routeLabel;

    return () => {
      if (routeRenderLabelRef.current) {
        endDevTimer(routeRenderLabelRef.current);
        routeRenderLabelRef.current = null;
      }
    };
  }, [location.pathname]);

  useEffect(() => {
    if (role !== "principal") {
      setPrincipalAlerts([]);
      return;
    }

    let mounted = true;
    void getPrincipalAlerts()
      .then((items) => {
        if (!mounted) return;
        setPrincipalAlerts(items);
      })
      .catch(() => {
        if (!mounted) return;
        setPrincipalAlerts([]);
      });

    return () => {
      mounted = false;
    };
  }, [location.pathname, role]);

  useEffect(() => {
    if (!alertsOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!alertsPanelRef.current?.contains(event.target as Node)) {
        setAlertsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [alertsOpen]);

  if (!role || !user) {
    return null;
  }

  const pageTitle = useMemo(() => getPageTitle(location.pathname, role), [location.pathname, role]);
  const crumbs = useMemo(() => getBreadcrumbs(location.pathname), [location.pathname]);
  const handleToggleCollapse = useCallback(() => setCollapsed((value) => !value), []);
  const handleOpenMobile = useCallback(() => setMobileOpen(true), []);
  const handleCloseMobile = useCallback(() => setMobileOpen(false), []);
  const handleToggleTheme = useCallback(() => {
    setTheme((value) => (value === "light" ? "dark" : "light"));
  }, []);
  const handleLogout = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);
  const handleToggleAlerts = useCallback(() => {
    if (role !== "principal") return;
    setAlertsOpen((value) => !value);
  }, [role]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(54,173,170,0.14),_transparent_30%),linear-gradient(180deg,#f7fbfc_0%,#eef4f7_100%)] text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar
          role={role}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleCollapse={handleToggleCollapse}
          onCloseMobile={handleCloseMobile}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 px-4 py-4 backdrop-blur-xl sm:px-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenMobile}
                  className="inline-flex rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-sm lg:hidden"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#36ADAA] text-white shadow-lg shadow-[#36ADAA]/30">
                      <span className="font-display text-lg font-black">K</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#36ADAA]">Application</p>
                      <h1 className="truncate font-display text-2xl font-extrabold text-slate-900">{pageTitle}</h1>
                    </div>
                  </div>
                </div>
                {!location.pathname.includes("/principal/settings") ? (
                  <div className="hidden flex-1 items-center justify-center xl:flex">
                    <label className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <Search className="h-4 w-4 text-slate-400" />
                      <input
                        type="search"
                        placeholder="Search classes, sessions, reports..."
                        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      />
                    </label>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <div className="relative" ref={alertsPanelRef}>
                    <button
                      type="button"
                      onClick={handleToggleAlerts}
                      className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 shadow-sm"
                    >
                      <Bell className="h-4 w-4" />
                      {role === "principal" && principalAlerts.length > 0 ? (
                        <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white">
                          {principalAlerts.length}
                        </span>
                      ) : null}
                    </button>

                    {role === "principal" && alertsOpen ? (
                      <div className="absolute right-0 top-[calc(100%+0.75rem)] z-40 w-[360px] rounded-[28px] border border-white/80 bg-white/95 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <h3 className="font-display text-lg font-extrabold text-slate-900">Alerts & Notifications</h3>
                            <p className="mt-1 text-xs font-semibold text-slate-500">Principal alerts based on live school activity</p>
                          </div>
                          {principalAlerts.length > 0 ? (
                            <span className="rounded-full bg-[#36ADAA]/10 px-2.5 py-1 text-[11px] font-black text-[#36ADAA]">
                              {principalAlerts.length}
                            </span>
                          ) : null}
                        </div>

                        {principalAlerts.length === 0 ? (
                          <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                            No alerts right now.
                          </div>
                        ) : (
                          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                            {principalAlerts.map((alert) => (
                              <div
                                key={alert.id}
                                className={`rounded-2xl border px-4 py-4 ${
                                  alert.severity === "danger"
                                    ? "border-rose-200 bg-rose-50/80"
                                    : "border-amber-200 bg-amber-50/80"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`rounded-2xl p-2 ${
                                      alert.severity === "danger"
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    <AlertTriangle className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-bold text-slate-900">{alert.title}</div>
                                    <div className="mt-1 text-sm text-slate-600">{alert.message}</div>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                                      {alert.teacherName ? <span>{alert.teacherName}</span> : null}
                                      {alert.className ? <span>{alert.className}</span> : null}
                                      {alert.subject ? <span>{alert.subject}</span> : null}
                                      {typeof alert.daysInactive === "number" ? <span>{alert.daysInactive} day{alert.daysInactive === 1 ? "" : "s"} inactive</span> : null}
                                      {typeof alert.curriculumProgress === "number" ? <span>{alert.curriculumProgress}% progress</span> : null}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleTheme}
                    className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 shadow-sm"
                  >
                    {theme === "light" ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">
                  {crumbs.map((crumb, index) => (
                    <div key={`${crumb}-${index}`} className="flex items-center gap-2">
                      {index > 0 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
                      <span className={index === crumbs.length - 1 ? "text-slate-700" : ""}>{crumb}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">{user.role}</p>
                    <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
});
