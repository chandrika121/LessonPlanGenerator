import {
  BarChart3,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  CheckCheck,
  ClipboardCheck,
  FolderKanban,
  ClipboardList,
  FileCheck2,
  FileSearch,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  LucideIcon,
  NotepadText,
  School,
  Settings,
  ShieldCheck,
  Users,
  UsersRound,
  BookMarked,
  Library,
  Award,
  ScrollText,
  Calendar,
  Clock,
} from "lucide-react";
import type { NavItemConfig, RoleRouteConfig } from "../types/navigation";
import type { UserRole } from "../types/auth";

export const roleRoutes: Record<UserRole, RoleRouteConfig> = {
  student: {
    role: "student",
    basePath: "/student",
    dashboardPath: "/student/dashboard",
    defaultTitle: "Student Dashboard",
  },
  teacher: {
    role: "teacher",
    basePath: "/teacher",
    dashboardPath: "/teacher/dashboard",
    defaultTitle: "Teacher Dashboard",
  },
  principal: {
    role: "principal",
    basePath: "/principal",
    dashboardPath: "/principal/dashboard",
    defaultTitle: "Principal Dashboard",
  },
};

const Icons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  teachers: Users,
  students: GraduationCap,
  classes: School,
  subjects: BookOpen,
  curriculum: FileSearch,
  planner: NotepadText,
  reports: BarChart3,
  settings: Settings,
  analysis: ShieldCheck,
  planning: CalendarDays,
  sessions: ClipboardList,
  generated: FileText,
  assignments: ClipboardCheck,
  homework: BookOpenCheck,
  assessments: CheckCheck,
  profile: UsersRound,
  approvals: FileCheck2,
  analytics: Home,
  timetable: Calendar,
  attendance: Clock,
  grades: Award,
  materials: BookMarked,
  library: Library,
  announcements: ScrollText,
  studentAction: FolderKanban,
};

export const navigationByRole: Record<UserRole, NavItemConfig[]> = {
  student: [
    { label: "Dashboard", to: "/student/dashboard", icon: Icons.dashboard },
    { label: "Homework", to: "/student/homework", icon: Icons.homework },
    { label: "Assessments", to: "/student/assessments", icon: Icons.assessments },
    { label: "Grades", to: "/student/grades", icon: Icons.grades },
    { label: "Student Notes", to: "/student/study-materials", icon: Icons.materials },
    { label: "Announcements", to: "/student/announcements", icon: Icons.announcements },
    { label: "Profile", to: "/student/profile", icon: Icons.profile },
  ],
  teacher: [
    { label: "Dashboard", to: "/teacher/dashboard", icon: Icons.dashboard },
    { label: "Lesson Planner", to: "/teacher/lesson-planner", icon: Icons.planner },
    { label: "Student Action", to: "/teacher/student-action", icon: Icons.studentAction },
    { label: "Evaluation", to: "/teacher/evaluation", icon: Icons.approvals },
    { label: "Announcements", to: "/teacher/announcements", icon: Icons.announcements },
    { label: "My Classes", to: "/teacher/my-classes", icon: Icons.classes },
    { label: "Profile", to: "/teacher/profile", icon: Icons.profile },
  ],
  principal: [
    { label: "Dashboard", to: "/principal/dashboard", icon: Icons.dashboard },
    { label: "Teachers", to: "/principal/teachers", icon: Icons.teachers },
    { label: "Classes", to: "/principal/classes", icon: Icons.classes },
    { label: "Evaluation Reports", to: "/principal/evaluation-reports", icon: Icons.approvals },
    { label: "Announcements", to: "/principal/announcements", icon: Icons.announcements },
    { label: "Settings", to: "/principal/settings", icon: Icons.settings },
    { label: "Profile", to: "/principal/profile", icon: Icons.profile },
  ],
};

export function getPageTitle(pathname: string, role: UserRole | null) {
  if (!role) return "Kamala Niketan LMS";
  const items = navigationByRole[role];
  const flattened = items.flatMap((item) => [item, ...(item.children ?? [])]);
  return flattened.find((item) => pathname.startsWith(item.to))?.label ?? roleRoutes[role].defaultTitle;
}

export function getBreadcrumbs(pathname: string) {
  return pathname
    .split("/")
    .filter(Boolean)
    .map((part) => {
      let decoded = part;
      try {
        decoded = decodeURIComponent(part);
      } catch {
        decoded = part;
      }
      return decoded.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
    });
}
