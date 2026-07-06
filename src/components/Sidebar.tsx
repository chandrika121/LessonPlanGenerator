import { memo, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { navigationByRole } from "../utils/navigation";
import { startDevTimer } from "../utils/devTiming";
import type { NavItemConfig } from "../types/navigation";
import type { UserRole } from "../types/auth";

interface SidebarProps {
  role: UserRole;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

const NavItem = memo(function NavItem({ item, collapsed, onClose }: { item: NavItemConfig; collapsed: boolean; onClose: () => void }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = currentPath === item.to || currentPath.startsWith(`${item.to}/`);
  const Icon = item.icon;

  const navClassName = useCallback(({ isActive: linkActive }: { isActive: boolean }) => [
    "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",
    collapsed ? "justify-center" : "",
    linkActive || isActive ? "bg-[#36ADAA] text-white shadow-lg" : "text-slate-300 hover:bg-white/8 hover:text-white",
  ].join(" "), [collapsed, isActive]);

  const handleClick = useCallback(() => {
    startDevTimer(`[nav-click] ${item.to}`);
    onClose();
  }, [item.to, onClose]);

  return (
    <div className="space-y-1">
      <NavLink to={item.children?.[0]?.to ?? item.to} onClick={handleClick} className={navClassName}>
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && item.children?.length ? <ChevronDown className="ml-auto h-4 w-4 opacity-70" /> : null}
      </NavLink>
      {!collapsed && item.children?.length ? (
        <AnimatePresence initial={false}>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pl-4"
          >
            <div className="space-y-1 rounded-2xl border border-white/6 bg-white/4 p-2">
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                const childActive = currentPath === child.to || currentPath.startsWith(`${child.to}/`);
                return (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    onClick={handleClick}
                    className={({ isActive: linkActive }) =>
                      [
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition",
                        linkActive || childActive ? "bg-white text-slate-900" : "text-slate-300 hover:bg-white/10 hover:text-white",
                      ].join(" ")
                    }
                  >
                    <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>{child.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      ) : null}
    </div>
  );
});

const MemoizedNavItem = memo(NavItem);

export const Sidebar = memo(function Sidebar({ role, collapsed, mobileOpen, onToggleCollapse, onCloseMobile }: SidebarProps) {
  const items = navigationByRole[role];

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#172126] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <div className={`${collapsed ? "hidden" : "block"} min-w-0`}>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#9FCDD2]">Kamala Niketan</p>
          <h2 className="font-display text-xl font-extrabold text-white">LMS Console</h2>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 lg:inline-flex"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-200 lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {items.map((item) => (
          <MemoizedNavItem key={item.to} item={item} collapsed={collapsed} onClose={onCloseMobile} />
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <aside className={`hidden border-r border-slate-200 bg-[#172126] transition-all duration-300 lg:block ${collapsed ? "w-24" : "w-80"}`}>
        {sidebarContent}
      </aside>
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
              onClick={onCloseMobile}
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="fixed inset-y-0 left-0 z-50 w-[88vw] max-w-sm lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
});
