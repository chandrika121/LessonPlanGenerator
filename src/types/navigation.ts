import type { LucideIcon } from "lucide-react";
import type { UserRole } from "./auth";

export interface NavItemConfig {
  label: string;
  to: string;
  icon: LucideIcon;
  children?: NavItemConfig[];
}

export interface RoleRouteConfig {
  role: UserRole;
  basePath: string;
  dashboardPath: string;
  defaultTitle: string;
}
