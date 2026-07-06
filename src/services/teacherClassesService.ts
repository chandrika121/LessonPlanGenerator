export interface TeacherClassCard {
  id: string;
  routeKey: string;
  classId: string;
  className: string;
  section: string;
  subjects: string[];
  totalStudents: number;
  curriculumProgress: number;
  sessionsGenerated: number;
  remainingSessions: number;
  lessonPlans: number;
  assignments: number;
  homework: number;
  assessments: number;
  evaluationsCompleted: number;
  lastActivity: string;
  sessionCounts: {
    totalTerms: number;
    totalSessions: number;
    totalAssignments: number;
    totalAssessments: number;
    totalHomework: number;
    sessions: Array<{
      sessionId: string;
      sessionTitle: string;
      sessionNumber: number;
      assignments: number;
      assessments: number;
      homework: number;
    }>;
  };
}

export interface TeacherClassDetail extends TeacherClassCard {
  students: { id: string; name: string; rollNo: string; email: string }[];
  lessonPlanItems: { id: string; title: string; updatedAt: string }[];
  sessionItems: { id: string; title: string; status: string }[];
  assignmentItems: { id: string; title: string; status: string }[];
  homeworkItems: { id: string; title: string; status: string }[];
  assessmentItems: { id: string; title: string; status: string }[];
  evaluationResults: { id: string; studentName: string; marks: number; percentage: number; grade: string }[];
}

const AUTH_STORAGE_KEY = "lms:auth-session";
const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT || "3002"}`;

function getAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { id?: string; schoolId?: string; role?: string };
  } catch {
    return null;
  }
}

function buildTeacherScopedPath(path: string) {
  const session = getAuthSession();
  const params = new URLSearchParams();
  if (session?.id) params.set("userId", session.id);
  if (session?.schoolId) params.set("schoolId", session.schoolId);
  if (session?.role) params.set("role", session.role);
  const query = params.toString();
  if (!query) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${query}`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${buildTeacherScopedPath(path)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `Request failed with HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getTeacherClasses() {
  const response = await fetchJson<{ success: boolean; items: TeacherClassCard[] }>("/api/teacher/my-classes");
  return response.items;
}

export async function getTeacherClassDetail(routeKey: string) {
  const response = await fetchJson<{ success: boolean; item: TeacherClassDetail }>(`/api/teacher/my-classes/${encodeURIComponent(routeKey)}`);
  return response.item;
}
