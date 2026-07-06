export interface PrincipalDashboardData {
  totalTeachers: number;
  totalClasses: number;
  totalStudents: number;
  lessonPlansGenerated: number;
  evaluationsCompleted: number;
  alerts: PrincipalAlert[];
  lessonPlansBySubject: { subject: string; count: number }[];
  evaluationPerformance: { label: string; score: number }[];
  teacherActivity: { name: string; sessions: number }[];
  monthlyProgress: { month: string; value: number }[];
  recentActivity: { teacherName: string; role: string; action: string; timeAgo: string }[];
}

export interface PrincipalAlert {
  id: string;
  type: "curriculum_delay" | "teacher_inactive";
  severity: "warning" | "danger";
  title: string;
  message: string;
  teacherId?: string;
  teacherName?: string;
  className?: string;
  subject?: string;
  daysInactive?: number;
  curriculumProgress?: number;
  createdAt: string;
}

export interface TeacherAllocationInfo {
  allocationId: string;
  classId: string;
  className: string;
  section: string;
  subjectIds: string[];
  subjects: string[];
  academicYear: string;
  status: "draft" | "published";
}

export interface TeacherSummary {
  id: string;
  name: string;
  employeeId: string;
  assignedClasses: string[];
  subjects: string[];
  lessonPlansGenerated: number;
  homeworkGenerated: number;
  assessmentsGenerated: number;
  lastLogin: string;
  status: "Active" | "Offline";
  allocations?: TeacherAllocationInfo[];
}

export interface PrincipalManagedUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "teacher" | "student" | "principal";
  classId?: string;
  section?: string;
  stream?: string;
  employeeId?: string;
  subjects?: string[];
  status?: "active" | "inactive";
}

export interface PrincipalClassUserSearchResult {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "teacher" | "student";
  employeeId?: string;
  rollNo?: string;
  currentClass?: string;
}

export interface TeacherDetail extends TeacherSummary {
  email: string;
  phone: string;
  joinedDate: string;
  classes: {
    className: string;
    subject: string;
    studentCount: number;
    curriculumProgress: number;
  }[];
  recentActivity: { action: string; time: string }[];
}

export interface PrincipalClassSummary {
  classKey: string;
  classId: string;
  className: string;
  section: string;
  academicYear: string;
  classTeacher: string;
  subjects: number;
  teachers: number;
  students: number;
  curriculumProgress: number;
  totalTerms: number;
  sessionsGenerated: number;
  sessionsCompleted: number;
  pendingSessions: number;
  assignments: number;
  homework: number;
  assessments: number;
  evaluations: number;
  submissionRate: number;
  averageClassPerformance: number;
  lastActivity: string;
  status: string;
  evaluationCompletion: number;
}

export interface PrincipalSubjectSummary {
  subjectKey: string;
  subject: string;
  teacherId: string;
  teacher: string;
  studentCount: number;
  curriculumProgress: number;
  terms: number;
  sessionsGenerated: number;
  sessionsCompleted: number;
  pendingSessions: number;
  assignments: number;
  homework: number;
  assessments: number;
  evaluationCount: number;
  evaluationCompletion: number;
  submissionPercentage: number;
  averageMarks: number;
  lastUpdated: string;
  assignedSince: string;
}

export interface PrincipalClassMember {
  id: string;
  name: string;
  email: string;
  employeeId?: string;
  rollNo?: string;
  subjects?: string[];
  section?: string;
  status?: string;
  currentClass?: string;
}

export interface PrincipalClassDetail extends PrincipalClassSummary {
  totalTeachers: number;
  teacherRoster: PrincipalClassMember[];
  studentRoster: PrincipalClassMember[];
  subjectDetails: PrincipalSubjectSummary[];
}

export interface PrincipalSubjectDetail extends Omit<PrincipalSubjectSummary, "assignments" | "homework" | "assessments"> {
  teacherInfo: {
    id: string;
    name: string;
    email: string;
    assignedSince: string;
    curriculumProgress: number;
    lessonPlanProgress: number;
    terms: number;
    sessions: number;
    pendingSessions?: number;
    assignmentsCreated: number;
    homeworkCreated: number;
    assessmentsCreated: number;
    evaluationsCompleted: number;
  };
  students: {
    id: string;
    name: string;
    rollNo: string;
    email: string;
    assignmentStatus: string;
    homeworkStatus: string;
    assessmentStatus: string;
    submissionCount: number;
    submissionLabel?: string;
    evaluationResult: string;
    attendance: string;
    overallProgress: number;
    sessionId?: string;
    sessionIds?: string[];
  }[];
  curriculum: {
    units: string[];
    chapters: string[];
    terms: string[];
    sessions: {
      sessionId: string;
      sessionNumber: number;
      title: string;
    }[];
    sessionProgress: {
      generated: number;
      completed: number;
      pending: number;
    };
  };
  assignments: {
    id: string;
    name: string;
    dueDate: string;
    totalSubmissions: number;
    pendingStudents: number;
    status: string;
  }[];
  homeworkRecords: {
    id: string;
    name: string;
    submissionStatus: string;
    pendingCount: number;
    studentSubmissions?: {
      studentId: string;
      studentName: string;
      status: string;
      submittedDate?: string;
      fileName?: string;
    }[];
  }[];
  assessments: {
    id: string;
    name: string;
    totalStudentsAttempted: number;
    pendingStudents: number;
    averageScore: number;
    studentSubmissions?: {
      studentId: string;
      studentName: string;
      status: string;
      submittedDate?: string;
      fileName?: string;
    }[];
  }[];
  evaluations: {
    id: string;
    studentName: string;
    marks: number;
    percentage: number;
    grade: string;
    status: string;
  }[];
}

export interface EvaluationReport {
  classWise: { className: string; average: number; highest: number; lowest: number }[];
  subjectWise: { subject: string; average: number; highest: number; lowest: number }[];
  teacherWise: { teacher: string; average: number; totalEvaluated: number }[];
  studentWise: { student: string; className: string; marks: number; grade: string }[];
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  gradeDistribution: { grade: string; count: number }[];
  weakTopics: { topic: string; avgScore: number }[];
  strongTopics: { topic: string; avgScore: number }[];
}

export interface SchoolAnalytics {
  curriculumCompletion: number;
  lessonPlanGeneration: number;
  evaluationCompletion: number;
  averageStudentPerformance: number;
  teacherProductivity: number;
  homeworkCompletion: number;
  assessmentCompletion: number;
  monthlyTrend: { month: string; curriculum: number; evaluation: number; performance: number }[];
  subjectPerformance: { subject: string; score: number }[];
  gradePie: { grade: string; count: number }[];
}

export interface ReportData {
  teacherReport: Record<string, unknown>;
  classReport: Record<string, unknown>;
  evaluationReport: Record<string, unknown>;
  schoolPerformanceReport: Record<string, unknown>;
  studentPerformanceReport: Record<string, unknown>;
}

export interface PrincipalClassAllocation {
  _id: string;
  teacherId: string;
  classId: string;
  className: string;
  section: string;
  subjectIds: string[];
  subjects: string[];
  academicYear: string;
  status: "draft" | "published";
  publishedAt: string | null;
  publishedBy: string;
}

export interface PrincipalAllocationClassOption {
  classKey: string;
  className: string;
  section: string;
  subjects?: string[];
}

const AUTH_STORAGE_KEY = "lms:auth-session";
const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT || "3002"}`;

function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { id?: string; schoolId?: string; role?: string };
  } catch {
    return null;
  }
}

function isPrincipalSession() {
  return String(getSession()?.role || "").trim().toLowerCase() === "principal";
}

function withSchoolScope(path: string): string {
  const session = getSession();
  const params = new URLSearchParams();
  if (session?.schoolId) params.set("schoolId", session.schoolId);
  if (session?.id) params.set("userId", session.id);
  if (session?.role) params.set("role", session.role);
  const query = params.toString();
  if (!query) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${query}`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${withSchoolScope(path)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `Request failed with HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function mutateJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${withSchoolScope(path)}`, init);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `Request failed with HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getDashboard(): Promise<PrincipalDashboardData> {
  const [summary, alerts, lessonPlansBySubject, evaluationPerformance, teacherActivity, monthlyProgress] = await Promise.all([
    fetchJson<{
      success: boolean;
      totalTeachers: number;
      totalClasses: number;
      totalStudents: number;
      lessonPlansGenerated: number;
      evaluationsCompleted: number;
      recentActivity: { teacherName: string; role: string; action: string; timeAgo: string }[];
    }>("/api/principal/dashboard-summary"),
    fetchJson<{ success: boolean; items: PrincipalAlert[] }>("/api/principal/alerts"),
    fetchJson<{ success: boolean; items: { subject: string; count: number }[] }>("/api/principal/lesson-plans-by-subject"),
    fetchJson<{ success: boolean; items: { label: string; score: number }[] }>("/api/principal/evaluation-performance"),
    fetchJson<{ success: boolean; items: { name: string; sessions: number }[] }>("/api/principal/teacher-activity"),
    fetchJson<{ success: boolean; items: { month: string; value: number }[] }>("/api/principal/monthly-progress"),
  ]);

  return {
    totalTeachers: summary.totalTeachers,
    totalClasses: summary.totalClasses,
    totalStudents: summary.totalStudents,
    lessonPlansGenerated: summary.lessonPlansGenerated,
    evaluationsCompleted: summary.evaluationsCompleted,
    alerts: alerts.items,
    lessonPlansBySubject: lessonPlansBySubject.items,
    evaluationPerformance: evaluationPerformance.items,
    teacherActivity: teacherActivity.items,
    monthlyProgress: monthlyProgress.items,
    recentActivity: summary.recentActivity,
  };
}

export async function getPrincipalAlerts(): Promise<PrincipalAlert[]> {
  if (!isPrincipalSession()) {
    return [];
  }
  const response = await fetchJson<{ success: boolean; items: PrincipalAlert[] }>("/api/principal/alerts");
  return response.items;
}

export async function getTeachers(): Promise<TeacherSummary[]> {
  const response = await fetchJson<{ success: boolean; items: TeacherSummary[] }>("/api/principal/teachers");
  return response.items;
}

export async function getTeacher(id: string): Promise<TeacherDetail> {
  const response = await fetchJson<{ success: boolean; item: TeacherDetail }>(`/api/principal/teachers/${encodeURIComponent(id)}`);
  return response.item;
}

export async function deletePrincipalUser(id: string): Promise<void> {
  await mutateJson(`/api/principal/users/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getPrincipalUsers(): Promise<PrincipalManagedUser[]> {
  if (!isPrincipalSession()) {
    return [];
  }
  const response = await fetchJson<{ success: boolean; items: PrincipalManagedUser[] }>("/api/principal/users");
  return response.items;
}

export async function createPrincipalUser(payload: {
  role: "teacher" | "student";
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  classId?: string;
  section?: string;
  stream?: string;
  subject?: string;
}): Promise<PrincipalManagedUser> {
  const data = await mutateJson<{ success: boolean; user: PrincipalManagedUser }>("/api/principal/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return data.user;
}

export async function getClasses(): Promise<PrincipalClassSummary[]> {
  const response = await fetchJson<{ success: boolean; items: PrincipalClassSummary[] }>("/api/principal/classes");
  return response.items;
}

export async function getClassDetails(classKey: string): Promise<PrincipalClassDetail> {
  if (!String(classKey || "").trim()) {
    throw new Error("Missing class key");
  }
  const response = await fetchJson<{ success: boolean; item: PrincipalClassDetail }>(`/api/principal/classes/${encodeURIComponent(classKey)}`);
  return response.item;
}

export async function getSubjectDetails(classKey: string, subjectKey: string, options?: { sessionId?: string }): Promise<PrincipalSubjectDetail> {
  if (!String(classKey || "").trim() || !String(subjectKey || "").trim()) {
    throw new Error("Missing class or subject key");
  }
  const query = new URLSearchParams();
  if (options?.sessionId) query.set("sessionId", options.sessionId);
  const queryString = query.toString();
  const response = await fetchJson<{ success: boolean; item: PrincipalSubjectDetail }>(`/api/principal/classes/${encodeURIComponent(classKey)}/subjects/${encodeURIComponent(subjectKey)}${queryString ? `?${queryString}` : ""}`);
  return response.item;
}

export async function searchClassUsers(classKey: string, params: { q?: string; role?: "teacher" | "student" | "all" }) {
  if (!String(classKey || "").trim()) {
    return [];
  }
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.role && params.role !== "all") query.set("role", params.role);
  const response = await fetchJson<{ success: boolean; items: PrincipalClassUserSearchResult[] }>(`/api/principal/classes/${encodeURIComponent(classKey)}/users/search${query.toString() ? `?${query.toString()}` : ""}`);
  return response.items;
}

export async function assignUsersToClass(payload: {
  classKey: string;
  role: "teacher" | "student";
  userIds: string[];
  subject?: string;
  subjects?: string[];
}) {
  const response = await mutateJson<{ success: boolean; item: PrincipalClassDetail }>(`/api/principal/classes/${encodeURIComponent(payload.classKey)}/users/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.item;
}

export async function updateClassTeacherAssignment(classKey: string, teacherId: string, subjects: string[]) {
  const response = await mutateJson<{ success: boolean; classDetail: PrincipalClassDetail }>(`/api/principal/classes/${encodeURIComponent(classKey)}/teachers/${encodeURIComponent(teacherId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subjects }),
  });
  return response.classDetail;
}

export async function removeTeacherFromClass(classKey: string, teacherId: string) {
  const response = await mutateJson<{ success: boolean; item: PrincipalClassDetail }>(`/api/principal/classes/${encodeURIComponent(classKey)}/teachers/${encodeURIComponent(teacherId)}`, {
    method: "DELETE",
  });
  return response.item;
}

export async function removeStudentFromClass(classKey: string, studentId: string) {
  const response = await mutateJson<{ success: boolean; item: PrincipalClassDetail }>(`/api/principal/classes/${encodeURIComponent(classKey)}/students/${encodeURIComponent(studentId)}`, {
    method: "DELETE",
  });
  return response.item;
}

export async function addSubjectToClass(classKey: string, subject: string) {
  const response = await mutateJson<{ success: boolean; item: PrincipalClassDetail }>(`/api/principal/classes/${encodeURIComponent(classKey)}/subjects`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject }),
  });
  return response.item;
}

export async function deletePrincipalClass(classKey: string) {
  await mutateJson(`/api/principal/classes/${encodeURIComponent(classKey)}`, {
    method: "DELETE",
  });
}

export async function getEvaluationReports(): Promise<EvaluationReport> {
  const response = await fetchJson<{ success: boolean; report: EvaluationReport }>("/api/principal/evaluation-reports");
  return response.report;
}

export async function getAnalytics(): Promise<SchoolAnalytics> {
  const response = await fetchJson<{ success: boolean; analytics: SchoolAnalytics }>("/api/principal/analytics");
  return response.analytics;
}

export async function getReports(): Promise<ReportData> {
  const response = await fetchJson<{ success: boolean; reports: ReportData }>("/api/principal/reports");
  return response.reports;
}

export async function downloadReport(reportKey: string, format: "pdf" | "xlsx"): Promise<Blob> {
  const url = `${BACKEND_URL}${withSchoolScope(`/api/reports/download/${reportKey}/${format}`)}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage = errorData?.error || `Failed to download report (HTTP ${response.status})`;
    throw new Error(errorMessage);
  }

  return response.blob();
}

export async function getClassAllocations(): Promise<PrincipalClassAllocation[]> {
  const response = await fetchJson<{ success: boolean; items: PrincipalClassAllocation[] }>("/api/principal/class-allocations");
  return response.items;
}

export async function getAllocationClassOptions(): Promise<PrincipalAllocationClassOption[]> {
  const response = await fetchJson<{ success: boolean; items: PrincipalAllocationClassOption[] }>("/api/principal/allocation-class-options");
  return response.items;
}

export async function saveClassAllocation(payload: {
  teacherId: string;
  classId: string;
  className: string;
  section: string;
  subjectIds: string[];
  subjects: string[];
  academicYear: string;
  status: "draft" | "published";
}): Promise<PrincipalClassAllocation> {
  const data = await mutateJson<{ success: boolean; item: PrincipalClassAllocation }>("/api/principal/class-allocations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return data.item;
}

export async function updateClassAllocation(id: string, payload: Partial<{
  teacherId: string;
  classId: string;
  className: string;
  section: string;
  subjectIds: string[];
  subjects: string[];
  academicYear: string;
  status: "draft" | "published";
}>): Promise<PrincipalClassAllocation> {
  const data = await mutateJson<{ success: boolean; item: PrincipalClassAllocation }>(`/api/principal/class-allocations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return data.item;
}

export async function publishClassAllocation(id: string): Promise<PrincipalClassAllocation> {
  const data = await mutateJson<{ success: boolean; item: PrincipalClassAllocation }>(`/api/principal/class-allocations/${id}/publish`, {
    method: "POST",
  });
  return data.item;
}

export async function deleteClassAllocation(id: string): Promise<void> {
  await mutateJson(`/api/principal/class-allocations/${id}`, { method: "DELETE" });
}

export { fetchJson, mutateJson };
