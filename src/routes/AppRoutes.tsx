import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { StudentDashboard } from "../pages/student/StudentDashboard";
import { StudentAnnouncementsPage } from "../pages/student/StudentAnnouncementsPage";
import { StudentGradesPage } from "../pages/student/StudentGradesPage";
import { StudentPublishedContentPage } from "../pages/student/StudentPublishedContentPage";
import StudentNotesPage from "../pages/student/StudentNotesPage";
import StudentSubjectNotesPage from "../pages/student/StudentSubjectNotesPage";
import { PrincipalDashboard } from "../pages/principal/PrincipalDashboard";
import { PrincipalAnnouncementsPage } from "../pages/principal/PrincipalAnnouncementsPage";
import { TeachersAllocationPage } from "../pages/principal/TeachersAllocationPage";
import { TeacherDetailPage } from "../pages/principal/TeacherDetailPage";
import { ClassesPage } from "../pages/principal/ClassesPage";
import { ClassDetailPage } from "../pages/principal/ClassDetailPage";
import { SubjectDetailPage } from "../pages/principal/SubjectDetailPage";
import { EvaluationReportsPage } from "../pages/principal/EvaluationReportsPage";
import { SchoolAnalyticsPage } from "../pages/principal/SchoolAnalyticsPage";
import { ReportsPage } from "../pages/principal/ReportsPage";
import { PrincipalSettingsPage } from "../pages/principal/PrincipalSettingsPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { PagePlaceholder } from "../components/PagePlaceholder";

const TeacherDashboard = lazy(() => import("../pages/teacher/TeacherDashboard").then(m => ({ default: m.TeacherDashboard })));
const TeacherEvaluationPage = lazy(() => import("../pages/teacher/TeacherEvaluationPage").then(m => ({ default: m.TeacherEvaluationPage })));
const TeacherLessonPlannerPage = lazy(() => import("../pages/teacher/TeacherLessonPlannerPage").then(m => ({ default: m.TeacherLessonPlannerPage })));
const TeacherStudentActionPage = lazy(() => import("../pages/teacher/TeacherStudentActionPage").then(m => ({ default: m.TeacherStudentActionPage })));
const LazyProfilePage = lazy(() => import("../pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const TeacherMyClassesPage = lazy(() => import("../pages/teacher/TeacherMyClassesPage").then(m => ({ default: m.TeacherMyClassesPage })));
const TeacherMyClassDetailPage = lazy(() => import("../pages/teacher/TeacherMyClassDetailPage").then(m => ({ default: m.TeacherMyClassDetailPage })));
const TeacherAnnouncementsPage = lazy(() => import("../pages/teacher/TeacherAnnouncementsPage").then(m => ({ default: m.TeacherAnnouncementsPage })));

function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="space-y-4">
        <div className="h-8 animate-pulse rounded-2xl bg-slate-200/80" />
        <div className="h-64 animate-pulse rounded-[30px] border border-white/70 bg-white/70" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-36 animate-pulse rounded-[30px] border border-white/70 bg-white/70" />
          <div className="h-36 animate-pulse rounded-[30px] border border-white/70 bg-white/70" />
        </div>
        <div className="h-72 animate-pulse rounded-[30px] border border-white/70 bg-white/70" />
      </div>
    </div>
  );
}

function PlannerAliasRedirect({ step }: { step: number }) {
  return <Navigate to={`/teacher/lesson-planner${step === 0 ? "" : `?step=${step}`}`} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/my-classes" element={<PagePlaceholder eyebrow="Student" title="My Classes" description="View your class schedule, section details, and enrolled subjects." />} />
          <Route path="/student/timetable" element={<PagePlaceholder eyebrow="Student" title="Timetable" description="Your weekly class timetable with subject periods and break times." />} />
          <Route path="/student/attendance" element={<PagePlaceholder eyebrow="Student" title="Attendance" description="Track your attendance records across all subjects and terms." />} />
          <Route path="/student/homework" element={<StudentPublishedContentPage kind="homework" title="Homework" description="Homework published by your teacher appears here." />} />
          <Route path="/student/assessments" element={<StudentPublishedContentPage kind="assessments" title="Assessments" description="Published assessments created by your teacher appear here." />} />
          <Route path="/student/grades" element={<StudentGradesPage />} />
          <Route path="/student/study-materials" element={<StudentNotesPage />} />
          <Route path="/student/study-materials/:subject" element={<StudentSubjectNotesPage />} />
          <Route path="/student/library" element={<PagePlaceholder eyebrow="Student" title="Library" description="Digital library resources, e-books, and reference materials." />} />
          <Route path="/student/announcements" element={<StudentAnnouncementsPage />} />
          <Route path="/student/profile" element={<Suspense fallback={<PageSkeleton />}><LazyProfilePage /></Suspense>} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/teacher/dashboard" element={<Suspense fallback={<PageSkeleton />}><TeacherDashboard /></Suspense>} />
          <Route path="/teacher/lesson-planner" element={<Suspense fallback={<PageSkeleton />}><TeacherLessonPlannerPage /></Suspense>} />
          <Route path="/teacher/upload-curriculum" element={<PlannerAliasRedirect step={1} />} />
          <Route path="/teacher/curriculum-analysis" element={<PlannerAliasRedirect step={1} />} />
          <Route path="/teacher/term-planning" element={<PlannerAliasRedirect step={2} />} />
          <Route path="/teacher/session-generator" element={<PlannerAliasRedirect step={3} />} />
          <Route path="/teacher/generated-sessions" element={<PlannerAliasRedirect step={4} />} />
          <Route path="/teacher/exports" element={<PlannerAliasRedirect step={5} />} />
          <Route path="/teacher/announcements" element={<Suspense fallback={<PageSkeleton />}><TeacherAnnouncementsPage /></Suspense>} />
          <Route path="/teacher/student-action" element={<Suspense fallback={<PageSkeleton />}><TeacherStudentActionPage /></Suspense>} />
          <Route path="/teacher/homework" element={<Navigate to="/teacher/student-action?view=homework" replace />} />
          <Route path="/teacher/assessments" element={<Navigate to="/teacher/student-action?view=assessments" replace />} />
          <Route path="/teacher/evaluation" element={<Suspense fallback={<PageSkeleton />}><TeacherEvaluationPage /></Suspense>} />
          <Route path="/teacher/my-classes" element={<Suspense fallback={<PageSkeleton />}><TeacherMyClassesPage /></Suspense>} />
          <Route path="/teacher/my-classes/:classId" element={<Suspense fallback={<PageSkeleton />}><TeacherMyClassDetailPage /></Suspense>} />
          <Route path="/teacher/profile" element={<Suspense fallback={<PageSkeleton />}><LazyProfilePage /></Suspense>} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["principal"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/principal/dashboard" element={<PrincipalDashboard />} />
          <Route path="/principal/teachers" element={<TeachersAllocationPage />} />
          <Route path="/principal/teachers/:id" element={<TeacherDetailPage />} />
          <Route path="/principal/classes" element={<ClassesPage />} />
          <Route path="/principal/classes/:className" element={<ClassDetailPage />} />
          <Route path="/principal/classes/:className/subjects/:subjectKey" element={<SubjectDetailPage />} />
          <Route path="/principal/evaluation-reports" element={<EvaluationReportsPage />} />
          <Route path="/principal/school-analytics" element={<SchoolAnalyticsPage />} />
          <Route path="/principal/reports" element={<ReportsPage />} />
          <Route path="/principal/settings" element={<PrincipalSettingsPage />} />
          <Route path="/principal/profile" element={<LazyProfilePage />} />
          <Route path="/principal/announcements" element={<PrincipalAnnouncementsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
