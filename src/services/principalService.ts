/**
 * Principal Service — provides all data needed by the Principal module.
 * Uses mock data for now. Replace each method with real API calls later
 * without changing the UI layer.
 *
 * Migration path:
 *   1. Replace `mock*` imports / local mocks with real fetch calls.
 *   2. Keep the return types exactly the same.
 *   3. UI components will keep working unchanged.
 */

import { getBackendBaseUrl } from "../utils/api";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PrincipalDashboardData {
  totalTeachers: number;
  totalClasses: number;
  totalStudents: number;
  lessonPlansGenerated: number;
  evaluationsCompleted: number;
  lessonPlansBySubject: { subject: string; count: number }[];
  evaluationPerformance: { label: string; score: number }[];
  teacherActivity: { name: string; sessions: number }[];
  monthlyProgress: { month: string; value: number }[];
  recentActivity: { teacherName: string; action: string; timeAgo: string }[];
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

export interface ClassSummary {
  className: string;
  subjects: number;
  teachers: number;
  students: number;
  curriculumProgress: number;
  sessionsGenerated: number;
  evaluationCompletion: number;
}

export interface ClassDetail extends ClassSummary {
  subjectDetails: {
    subject: string;
    teacher: string;
    studentCount: number;
    curriculumProgress: number;
    sessionsGenerated: number;
    sessionsCompleted: number;
    evaluationCompletion: number;
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

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_TEACHERS: TeacherSummary[] = [
  { id: "t1", name: "Anitha", employeeId: "EMP-001", assignedClasses: ["8", "9", "10"], subjects: ["Science", "Biology"], lessonPlansGenerated: 24, homeworkGenerated: 18, assessmentsGenerated: 12, lastLogin: "2026-06-29T08:30:00Z", status: "Active" },
  { id: "t2", name: "Bharath", employeeId: "EMP-002", assignedClasses: ["6", "7", "8"], subjects: ["Mathematics"], lessonPlansGenerated: 31, homeworkGenerated: 22, assessmentsGenerated: 15, lastLogin: "2026-06-29T07:45:00Z", status: "Active" },
  { id: "t3", name: "Chandra", employeeId: "EMP-003", assignedClasses: ["9", "10"], subjects: ["Physics", "Chemistry"], lessonPlansGenerated: 18, homeworkGenerated: 14, assessmentsGenerated: 8, lastLogin: "2026-06-28T16:20:00Z", status: "Active" },
  { id: "t4", name: "Deepa", employeeId: "EMP-004", assignedClasses: ["6", "7"], subjects: ["English"], lessonPlansGenerated: 27, homeworkGenerated: 20, assessmentsGenerated: 10, lastLogin: "2026-06-27T12:10:00Z", status: "Offline" },
  { id: "t5", name: "Eswar", employeeId: "EMP-005", assignedClasses: ["9", "10"], subjects: ["Social Studies", "History"], lessonPlansGenerated: 15, homeworkGenerated: 10, assessmentsGenerated: 6, lastLogin: "2026-06-29T09:00:00Z", status: "Active" },
  { id: "t6", name: "Farida", employeeId: "EMP-006", assignedClasses: ["6", "7", "8"], subjects: ["Tamil", "French"], lessonPlansGenerated: 33, homeworkGenerated: 25, assessmentsGenerated: 16, lastLogin: "2026-06-26T14:30:00Z", status: "Offline" },
  { id: "t7", name: "Ganesh", employeeId: "EMP-007", assignedClasses: ["8", "9"], subjects: ["Mathematics"], lessonPlansGenerated: 22, homeworkGenerated: 16, assessmentsGenerated: 11, lastLogin: "2026-06-29T06:15:00Z", status: "Active" },
  { id: "t8", name: "Hema", employeeId: "EMP-008", assignedClasses: ["10"], subjects: ["English Literature"], lessonPlansGenerated: 14, homeworkGenerated: 9, assessmentsGenerated: 5, lastLogin: "2026-06-28T10:45:00Z", status: "Active" },
];

const MOCK_TEACHER_DETAILS: Record<string, TeacherDetail> = {
  t1: {
    id: "t1", name: "Anitha", employeeId: "EMP-001", assignedClasses: ["8", "9", "10"], subjects: ["Science", "Biology"],
    lessonPlansGenerated: 24, homeworkGenerated: 18, assessmentsGenerated: 12, lastLogin: "2026-06-29T08:30:00Z", status: "Active",
    email: "anitha@kamalaniketan.edu", phone: "+91 98765 43201", joinedDate: "2020-06-01",
    classes: [
      { className: "Class 8", subject: "Science", studentCount: 38, curriculumProgress: 82 },
      { className: "Class 9", subject: "Biology", studentCount: 35, curriculumProgress: 76 },
      { className: "Class 10", subject: "Biology", studentCount: 32, curriculumProgress: 68 },
    ],
    recentActivity: [
      { action: "Generated Grade 8 Science Lesson Plan", time: "5 minutes ago" },
      { action: "Created assessment for Biology Chapter 4", time: "2 hours ago" },
      { action: "Uploaded homework for Class 9", time: "1 day ago" },
    ],
  },
  t2: {
    id: "t2", name: "Bharath", employeeId: "EMP-002", assignedClasses: ["6", "7", "8"], subjects: ["Mathematics"],
    lessonPlansGenerated: 31, homeworkGenerated: 22, assessmentsGenerated: 15, lastLogin: "2026-06-29T07:45:00Z", status: "Active",
    email: "bharath@kamalaniketan.edu", phone: "+91 98765 43202", joinedDate: "2019-04-15",
    classes: [
      { className: "Class 6", subject: "Mathematics", studentCount: 40, curriculumProgress: 90 },
      { className: "Class 7", subject: "Mathematics", studentCount: 37, curriculumProgress: 85 },
      { className: "Class 8", subject: "Mathematics", studentCount: 38, curriculumProgress: 78 },
    ],
    recentActivity: [
      { action: "Generated Grade 7 Math Lesson Plan", time: "10 minutes ago" },
      { action: "Evaluated term exam papers for Class 6", time: "3 hours ago" },
    ],
  },
};

function getTeachersDetail(id: string): TeacherDetail {
  return MOCK_TEACHER_DETAILS[id] || {
    ...(MOCK_TEACHERS.find((t) => t.id === id) || MOCK_TEACHERS[0]),
    email: "teacher@kamalaniketan.edu",
    phone: "+91 98765 43200",
    joinedDate: "2020-01-01",
    classes: [
      { className: "Class 8", subject: "General", studentCount: 36, curriculumProgress: 70 },
    ],
    recentActivity: [
      { action: "Logged in to the system", time: "Today" },
    ],
  };
}

// ─── Helper ─────────────────────────────────────────────────────────────────

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const delay = 300;
const BACKEND_URL = getBackendBaseUrl();

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `Request failed with HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// ─── Service Methods ────────────────────────────────────────────────────────

export async function getDashboard(): Promise<PrincipalDashboardData> {
  const [summary, lessonPlansBySubject, evaluationPerformance, teacherActivity, monthlyProgress] = await Promise.all([
    fetchJson<{
      success: boolean;
      totalTeachers: number;
      totalClasses: number;
      totalStudents: number;
      lessonPlansGenerated: number;
      evaluationsCompleted: number;
      recentActivity: { teacherName: string; action: string; timeAgo: string }[];
    }>("/api/principal/dashboard-summary"),
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
    lessonPlansBySubject: lessonPlansBySubject.items,
    evaluationPerformance: evaluationPerformance.items,
    teacherActivity: teacherActivity.items,
    monthlyProgress: monthlyProgress.items,
    recentActivity: summary.recentActivity,
  };
}

export async function getTeachers(): Promise<TeacherSummary[]> {
  await wait(delay);
  return MOCK_TEACHERS;
}

export async function getTeacher(id: string): Promise<TeacherDetail> {
  await wait(delay);
  return getTeachersDetail(id);
}

export async function getClasses(): Promise<ClassSummary[]> {
  await wait(delay);
  return [
    { className: "Class 6", subjects: 7, teachers: 6, students: 82, curriculumProgress: 85, sessionsGenerated: 210, evaluationCompletion: 78 },
    { className: "Class 7", subjects: 8, teachers: 7, students: 76, curriculumProgress: 79, sessionsGenerated: 195, evaluationCompletion: 72 },
    { className: "Class 8", subjects: 8, teachers: 6, students: 84, curriculumProgress: 74, sessionsGenerated: 188, evaluationCompletion: 68 },
    { className: "Class 9", subjects: 9, teachers: 8, students: 90, curriculumProgress: 68, sessionsGenerated: 170, evaluationCompletion: 62 },
    { className: "Class 10", subjects: 9, teachers: 8, students: 88, curriculumProgress: 71, sessionsGenerated: 175, evaluationCompletion: 65 },
    { className: "Class 11", subjects: 6, teachers: 5, students: 45, curriculumProgress: 55, sessionsGenerated: 90, evaluationCompletion: 48 },
    { className: "Class 12", subjects: 6, teachers: 5, students: 50, curriculumProgress: 60, sessionsGenerated: 95, evaluationCompletion: 52 },
  ];
}

export async function getClassDetails(className: string): Promise<ClassDetail> {
  await wait(delay);
  const base = await getClasses();
  const summary = base.find((c) => c.className === className) || base[0];
  return {
    ...summary,
    subjectDetails: [
      { subject: "Mathematics", teacher: "Bharath", studentCount: 40, curriculumProgress: 90, sessionsGenerated: 45, sessionsCompleted: 38, evaluationCompletion: 85 },
      { subject: "Science", teacher: "Anitha", studentCount: 40, curriculumProgress: 82, sessionsGenerated: 42, sessionsCompleted: 34, evaluationCompletion: 76 },
      { subject: "English", teacher: "Deepa", studentCount: 40, curriculumProgress: 88, sessionsGenerated: 40, sessionsCompleted: 36, evaluationCompletion: 80 },
      { subject: "Tamil", teacher: "Farida", studentCount: 40, curriculumProgress: 76, sessionsGenerated: 38, sessionsCompleted: 30, evaluationCompletion: 70 },
      { subject: "Social Studies", teacher: "Eswar", studentCount: 40, curriculumProgress: 72, sessionsGenerated: 35, sessionsCompleted: 28, evaluationCompletion: 65 },
      { subject: "French", teacher: "Farida", studentCount: 20, curriculumProgress: 70, sessionsGenerated: 30, sessionsCompleted: 24, evaluationCompletion: 60 },
    ],
  };
}

export async function getEvaluationReports(): Promise<EvaluationReport> {
  await wait(delay);
  return {
    classWise: [
      { className: "Class 6", average: 82, highest: 98, lowest: 45 },
      { className: "Class 7", average: 78, highest: 95, lowest: 38 },
      { className: "Class 8", average: 74, highest: 92, lowest: 35 },
      { className: "Class 9", average: 71, highest: 96, lowest: 30 },
      { className: "Class 10", average: 68, highest: 94, lowest: 28 },
    ],
    subjectWise: [
      { subject: "Mathematics", average: 79, highest: 98, lowest: 32 },
      { subject: "Science", average: 76, highest: 95, lowest: 35 },
      { subject: "English", average: 82, highest: 97, lowest: 40 },
      { subject: "Social Studies", average: 73, highest: 93, lowest: 30 },
      { subject: "Tamil", average: 84, highest: 99, lowest: 45 },
      { subject: "French", average: 80, highest: 96, lowest: 42 },
    ],
    teacherWise: [
      { teacher: "Anitha", average: 76, totalEvaluated: 42 },
      { teacher: "Bharath", average: 81, totalEvaluated: 55 },
      { teacher: "Chandra", average: 74, totalEvaluated: 28 },
      { teacher: "Deepa", average: 84, totalEvaluated: 38 },
      { teacher: "Eswar", average: 71, totalEvaluated: 22 },
      { teacher: "Farida", average: 85, totalEvaluated: 48 },
      { teacher: "Ganesh", average: 79, totalEvaluated: 34 },
      { teacher: "Hema", average: 83, totalEvaluated: 18 },
    ],
    studentWise: [
      { student: "Aarav Sharma", className: "Class 6", marks: 95, grade: "A+" },
      { student: "Diya Patel", className: "Class 7", marks: 88, grade: "A" },
      { student: "Ishaan Reddy", className: "Class 8", marks: 72, grade: "B+" },
      { student: "Meera Nair", className: "Class 9", marks: 91, grade: "A+" },
      { student: "Riya Das", className: "Class 10", marks: 65, grade: "B" },
      { student: "Rohit Singh", className: "Class 6", marks: 78, grade: "B+" },
      { student: "Sneha Kapoor", className: "Class 7", marks: 82, grade: "A" },
      { student: "Vikram Raj", className: "Class 8", marks: 45, grade: "C" },
      { student: "Priya Nair", className: "Class 9", marks: 93, grade: "A+" },
      { student: "Arjun Menon", className: "Class 10", marks: 58, grade: "C" },
    ],
    averageMarks: 74,
    highestMarks: 99,
    lowestMarks: 28,
    gradeDistribution: [
      { grade: "A+", count: 28 },
      { grade: "A", count: 45 },
      { grade: "B+", count: 52 },
      { grade: "B", count: 38 },
      { grade: "C", count: 22 },
      { grade: "D", count: 10 },
    ],
    weakTopics: [
      { topic: "Trigonometry", avgScore: 52 },
      { topic: "Chemical Bonding", avgScore: 55 },
      { topic: "Grammar - Tenses", avgScore: 58 },
      { topic: "Mensuration", avgScore: 60 },
    ],
    strongTopics: [
      { topic: "Algebra Basics", avgScore: 88 },
      { topic: "Cell Structure", avgScore: 85 },
      { topic: "Reading Comprehension", avgScore: 82 },
      { topic: "Number Systems", avgScore: 86 },
    ],
  };
}

export async function getAnalytics(): Promise<SchoolAnalytics> {
  const response = await fetchJson<{ success: boolean; analytics: SchoolAnalytics }>("/api/principal/monthly-progress");
  return response.analytics;
}

export async function getReports(): Promise<ReportData> {
  await wait(delay);
  return {
    teacherReport: { generated: "2026-06-29", teachers: MOCK_TEACHERS.length, active: MOCK_TEACHERS.filter((t) => t.status === "Active").length, offline: MOCK_TEACHERS.filter((t) => t.status === "Offline").length },
    classReport: { classrooms: 10, totalStudents: 485, averageSize: 48 },
    evaluationReport: { totalEvaluations: 96, averageScore: 74, highestClass: "Class 6" },
    schoolPerformanceReport: { overall: 74, curriculum: 74, evaluation: 62, performance: 76 },
    studentPerformanceReport: { toppers: 28, average: 74, needsImprovement: 32 },
  };
}

// ─── Report Download (Real API) ──────────────────────────────────────────

export async function downloadReport(reportKey: string, format: "pdf" | "xlsx"): Promise<Blob> {
  const url = `${BACKEND_URL}/api/reports/download/${reportKey}/${format}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage = errorData?.error || `Failed to download report (HTTP ${response.status})`;
    throw new Error(errorMessage);
  }

  return response.blob();
}
