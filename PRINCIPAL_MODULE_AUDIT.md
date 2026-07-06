# PRINCIPAL MODULE — COMPLETE ARCHITECTURE ANALYSIS

> **Date**: July 4, 2026
> **Scope**: Analysis-only — no code changes
> **Objective**: Understand every metric, API, component, collection, and calculation in the Principal module

---

## TABLE OF CONTENTS

1. [Module Overview & Architecture](#1-module-overview--architecture)
2. [API Flow — All Backend Routes](#2-api-flow)
3. [Database Collections & Fields](#3-database-collections)
4. [Dashboard — Metric Calculations](#4-dashboard-metric-calculations)
5. [School Analytics — Metric Calculations](#5-school-analytics-metric-calculations)
6. [Teachers Module](#6-teachers-module)
7. [Classes Module](#7-classes-module)
8. [Subject Detail Module](#8-subject-detail-module)
9. [Evaluation Reports Module](#9-evaluation-reports-module)
10. [Reports Module](#10-reports-module)
11. [Announcements Module](#11-announcements-module)
12. [Settings Module](#12-settings-module)
13. [Performance Calculation Formulas](#13-performance-calculation-formulas)
14. [Data Flow Diagram](#14-data-flow-diagram)
15. [Live vs Static vs Cached Data](#15-live-vs-static-vs-cached-data)
16. [Missing Analytics & Recommended Improvements](#16-missing-analytics)
17. [Files, Controllers, Services & Components](#17-files-inventory)

---

## 1. MODULE OVERVIEW & ARCHITECTURE

### Architecture Pattern
- **Frontend**: React SPA with TypeScript
- **Backend**: Express.js (single `server.ts` file, no separate controllers/services)
- **Database**: MongoDB (Mongoose ODM)
- **Data Flow**: Frontend → `principalServiceApi.ts` → Express routes → MongoDB → aggregation in memory → JSON response

### Key Design Observation
- **NO separate controllers or services exist.** All principal logic is defined inline as Express route handlers in `backend/server.ts`.
- The single critical function is `getPrincipalDashboardAnalytics()` at line 12478 which powers 6 of the 7 dashboard API endpoints.
- Helper functions like `getPrincipalTeachers()`, `getPrincipalTeacherDetail()`, `getPrincipalAlerts()`, `getPrincipalClasses()` etc. are also inline in `server.ts`.

---

## 2. API FLOW

### All Principal API Endpoints (27 total)

| # | Method | Route | Function Called | Page |
|---|--------|-------|-----------------|------|
| 1 | GET | `/api/principal/dashboard-summary` | `getPrincipalDashboardAnalytics()` | Dashboard |
| 2 | GET | `/api/principal/lesson-plans-by-subject` | `getPrincipalDashboardAnalytics()` | Dashboard |
| 3 | GET | `/api/principal/evaluation-performance` | `getPrincipalDashboardAnalytics()` | Dashboard |
| 4 | GET | `/api/principal/teacher-activity` | `getPrincipalDashboardAnalytics()` | Dashboard |
| 5 | GET | `/api/principal/monthly-progress` | `getPrincipalDashboardAnalytics()` | Dashboard + School Analytics |
| 6 | GET | `/api/principal/alerts` | `getPrincipalAlerts()` | Dashboard |
| 7 | GET | `/api/principal/teachers` | `getPrincipalTeachers()` | Teachers |
| 8 | GET | `/api/principal/teachers/:id` | `getPrincipalTeacherDetail()` | Teacher Detail |
| 9 | GET | `/api/principal/users` | inline UserModel.find | Settings |
| 10 | POST | `/api/principal/users` | inline UserModel.create | Settings |
| 11 | DELETE | `/api/principal/users/:id` | inline UserModel.deleteOne | Settings |
| 12 | GET | `/api/principal/classes` | `getPrincipalClasses()` | Classes |
| 13 | GET | `/api/principal/classes/:className` | `getPrincipalClassDetail()` | Class Detail |
| 14 | GET | `/api/principal/classes/:className/subjects/:subjectKey` | `getPrincipalSubjectDetail()` | Subject Detail |
| 15 | GET | `/api/principal/classes/:className/users/search` | inline UserModel.find | Class Detail |
| 16 | POST | `/api/principal/classes/:className/users/assign` | inline UserModel.update | Class Detail |
| 17 | PATCH | `/api/principal/classes/:className/teachers/:teacherId` | inline TeacherClassAllocationModel | Class Detail |
| 18 | DELETE | `/api/principal/classes/:className/teachers/:teacherId` | inline TeacherClassAllocationModel | Class Detail |
| 19 | DELETE | `/api/principal/classes/:className/students/:studentId` | inline UserModel | Class Detail |
| 20 | DELETE | `/api/principal/classes/:className` | inline ClassModel + UserModel | Class Detail |
| 21 | GET | `/api/principal/evaluation-reports` | inline aggregation | Evaluation Reports |
| 22 | GET | `/api/principal/reports` | inline stub (returns empty objects) | Reports |
| 23 | POST | `/api/principal/class-allocations` | inline TeacherClassAllocationModel.create | Teachers Allocation |
| 24 | GET | `/api/principal/class-allocations` | inline TeacherClassAllocationModel.find | Teachers Allocation |
| 25 | PATCH | `/api/principal/class-allocations/:id` | inline TeacherClassAllocationModel.findByIdAndUpdate | Teachers Allocation |
| 26 | POST | `/api/principal/class-allocations/:id/publish` | inline TeacherClassAllocationModel.findByIdAndUpdate | Teachers Allocation |
| 27 | DELETE | `/api/principal/class-allocations/:id` | inline TeacherClassAllocationModel.findByIdAndDelete | Teachers Allocation |

### Frontend Service Layer
- **File**: `src/services/principalServiceApi.ts`
- **Pattern**: Pure fetch-based API client with school-scoped query parameters
- **Key functions**: `getDashboard()`, `getTeachers()`, `getTeacher()`, `getClasses()`, `getClassDetails()`, `getSubjectDetails()`, `getEvaluationReports()`, `getAnalytics()`, `getReports()`
- **Auth**: Uses `localStorage` session token with schoolId/userId/role appended as query params
- **Backend URL**: Resolved from `VITE_API_BASE_URL` env var or `localhost:3002`

---

## 3. DATABASE COLLECTIONS

### Collections Used by Principal Module

#### 1. `UserModel` (users)
- **Fields used**: `_id`, `name`, `email`, `phone`, `role`, `schoolId`, `classId`, `section`, `stream`, `subjects`, `subjectIds`, `employeeId`, `status`, `lastLoginAt`, `assignedClasses`, `assignedSections`, `designation`, `password`, `createdAt`
- **Relationships**: `schoolId` → School, `classId` → Class
- **Principal query patterns**: `find({ schoolId, role })`, `find({ schoolId, role: { $in: ["teacher", "student"] } })`

#### 2. `ClassModel` (classes)
- **Fields used**: `_id`, `name`, `gradeLevel`, `section`, `schoolId`, `teacherIds`, `subjectIds`, `academicYear`, `status`
- **Relationships**: `schoolId` → School, `teacherIds` → User (teachers)
- **Principal query patterns**: `find({ schoolId })`, upsert based on gradeLevel + section

#### 3. `PlanningWorkspaceModel` (lesson plan workspaces)
- **Fields used**: `_id`, `schoolId`, `teacherId`, `createdBy`, `curriculumSnapshot.subject`, `curriculumSnapshot.units`, `curriculumSnapshot.chapters`, `curriculumSnapshot.gradeLevel`, `academicConfig.subject`, `academicConfig.className`, `academicConfig.section`, `generationScope.generatedSessions`, `generatedArtifacts`, `sessionAllocation.allocations`, `curriculumApproval.approved`, `updatedAt`
- **This is the primary collection for lesson plan metrics**

#### 4. `CurriculumModel` (curriculums)
- **Fields used**: `_id`, `schoolId`, `createdAt`, basic metadata
- **Purpose**: Counting active curriculums

#### 5. `EvaluationModel` (evaluations)
- **Fields used**: `_id`, `schoolId`, `teacherId`, `title`, `status`, `completedAt`, `updatedAt`
- **Statuses**: "completed", "saved", "in_progress"
- **Principal query patterns**: Filtered by `status` for completion counting

#### 6. `EvaluationResultModel` (evaluation results)
- **Fields used**: `_id`, `schoolId`, `classId`, `studentId`, `marks`, `percentage`, `grade`, `subject`, `topic`, `updatedAt`
- **Critical for**: Performance calculations, grade distributions, weak/strong topics

#### 7. `AssignmentSubmissionModel` (assignment/assessment submissions)
- **Fields used**: `_id`, `schoolId`, `createdAt`
- **Usage**: Counting total assessment submissions

#### 8. `HomeworkSubmissionModel` (homework submissions)
- **Fields used**: `_id`, `schoolId`, `createdAt`
- **Usage**: Counting total homework submissions

#### 9. `ActivityLogModel` (activity logs)
- **Fields used**: `_id`, `schoolId`, `userId`, `teacherId`, `studentId`, `role`, `actionType`, `actionLabel`, `occurredAt`, `createdAt`
- **Critical for**: Teacher activity scoring, recent activity feed
- **Action types tracked**: `teacher_login`, `student_login`, `principal_login`, `lesson_plan_generated`, `session_plan_approved`, `term_plan_approved`, `curriculum_approved`, `curriculum_uploaded`, `evaluation_saved`, `evaluation_completed`

#### 10. `TeacherClassAllocationModel` (teacher-class assignments)
- **Fields used**: `_id`, `schoolId`, `teacherId`, `classId`, `className`, `section`, `subjectIds`, `subjects`, `academicYear`, `status` (draft/published), `publishedAt`, `publishedBy`

---

## 4. DASHBOARD METRIC CALCULATIONS

### `getPrincipalDashboardAnalytics()` — The Core Function

**Data loaded**: All 9 collections are loaded fully into memory for the school scope, then iterated.

#### Total Teachers
- **Source**: `UserModel.find({ schoolId })` filtered to `role === "teacher"`
- **Calculation**: `teachers.length`
- **Type**: Live, in-memory count

#### Total Classes
- **Source**: `ClassModel.find({ schoolId })`
- **Calculation**: `classes.length`
- **Type**: Live, in-memory count

#### Total Students
- **Source**: `UserModel.find({ schoolId })` filtered to `role === "student"`
- **Calculation**: `students.length`
- **Type**: Live, in-memory count

#### Lesson Plans Generated
- **Source**: `PlanningWorkspaceModel.find({ schoolId })`
- **Calculation per workspace**:
  ```
  const generatedSessions = Object.values(workspace.generationScope.generatedSessions)
  const artifactCount = workspace.generatedArtifacts ? workspace.generatedArtifacts.length : 0
  const lessonPlanIncrement = Math.max(generatedSessions.length, artifactCount, 0)
  ```
- **Total**: Sum of all `lessonPlanIncrement` across all workspaces
- **Type**: Live, calculated from stored workspace data

#### Evaluations Completed
- **Source**: `EvaluationModel.find({ schoolId })`
- **Calculation**: Filter where `status === "completed"` or `status === "saved"`
- **Type**: Live count

#### Lesson Plans by Subject
- **Source**: Same workspace iteration as above
- **Calculation**: Groups workspaces by `curriculumSnapshot.subject` → sums `lessonPlanIncrement` per subject
- **Type**: Live aggregation

#### Evaluation Performance (Average Score by Class)
- **Source**: `EvaluationResultModel.find({ schoolId })`
- **Calculation**:
  ```
  For each evaluation result:
    label = classNameById[result.classId] || result.classId || "Unassigned"
    percentage = Number(result.percentage || 0)
    Per class: average = totalPercentage / count
  ```
- **Type**: Live, in-memory aggregation

#### Teacher Activity
- **Source**: Combined from workspaces, evaluations, and activity logs
- **Calculation**:
  ```
  For each workspace: teacherActivityMap[teacherId].sessions += lessonPlanIncrement
  For each completed evaluation: teacherActivityMap[teacherId].sessions += 1
  For each activityLog matching teacher action types: teacherActivityMap[actorId].sessions += 1
  ```
- **Action types that increment teacher score**: `lesson_plan_generated`, `session_plan_approved`, `term_plan_approved`, `curriculum_approved`, `curriculum_uploaded`, `evaluation_saved`, `evaluation_completed`, `teacher_login`
- **Type**: Live, composite calculation

#### Monthly Progress
- **Source**: All 9 collections (curriculums createdAt, workspaces updatedAt, evaluations, results, submissions, activity logs)
- **Calculation**:
  1. Initialize 12 monthly buckets for current year with value 0
  2. For each document: `monthlyBuckets[toMonthLabel(date)] += count`
  3. Normalize: `value = (rawValue / maxMonthlyActivity) * 100`
- **Type**: Live calculation, normalized to percentage of max month

#### Recent Activity
- **Source**: ActivityLogModel sorted by `occurredAt` DESC
- **Priority**: Non-login activities first, then one unique login per user
- **Limit**: Top 8 entries
- **Type**: Live, with prioritization logic

#### Alerts
- **Source**: `getPrincipalAlerts()` function (separate from dashboard analytics)
- **Types**: `curriculum_delay` (teacher falling behind), `teacher_inactive` (no recent login)
- **Calculation**: Compares teacher lastLoginAt against thresholds, checks curriculum progress
- **Type**: Live calculation with threshold-based logic

---

## 5. SCHOOL ANALYTICS METRIC CALCULATIONS

### Curriculum Completion
- **Calculation**: `(workspaces.filter(w => w.curriculumApproval?.approved).length / curriculums.length) * 100`
- **Note**: Requires curriculum to exist AND workspace curriculumApproval.approved = true
- **Issue**: If no curriculums exist, returns 0

### Lesson Plan Generation
- **Calculation**: `(workspaces.filter(w => generatedSessionsCount > 0 || artifactsCount > 0).length / workspaces.length) * 100`
- **Measures**: Percentage of workspaces that have generated content

### Evaluation Completion
- **Calculation**: If `totalEvaluationsCompleted > 0` return `100` else `0`
- **CRITICAL BUG**: This is a binary check — either 0% or 100%. There is no percentage scale.
- **Should be**: `(totalEvaluationsCompleted / totalEvaluationsCreated) * 100`

### Average Student Performance
- **Calculation**: `sum of all evaluationResult.percentage / count of evaluationResults`
- **Source**: `EvaluationResultModel`
- **Type**: Simple average

### Teacher Productivity
- **Calculation**: `((lessonPlansGenerated + totalEvaluationsCompleted) / teachers.length) * 10`
- **Note**: The `* 10` factor is arbitrary. Results are uncalibrated.
- **Max value**: If a teacher produces 10 lesson plans + 10 evaluations → score = 20/1*10 = 200%

### Homework Completion
- **Calculation**: `homeworkSubmissions.length`
- **ISSUE**: This is a raw count, not a percentage. Labels suggest it should be a percentage.
- **Should be**: Submitted vs assigned ratio

### Assessment Completion
- **Calculation**: `assignmentSubmissions.length`
- **Same issue**: Raw count, not percentage.

### Monthly Trend
- **Source**: Monthly buckets from all 9 collections
- **Curriculum per month**: `(curriculums.filter(match) / maxMonthlyActivity) * 100`
- **Evaluation per month**: `(evaluations.filter(match) / maxMonthlyActivity) * 100`
- **Performance per month**: `(rawTotal / maxMonthlyActivity) * 100`
- **Type**: Normalized percentage of max monthly activity

### Subject Performance
- **Calculation**: `(subjectLessonsCount / lessonPlansGenerated) * 100`
- **Note**: This measures lesson plan distribution, NOT actual student marks per subject
- **Misleading label**: Should be "Lesson Plan Distribution by Subject"

### Grade Distribution (gradePie)
- **Source**: EvaluationResultModel.grade
- **Calculation**: Groups by grade letter (A+, A, B+, B, C, D) → counts per grade
- **Type**: Live aggregation

---

## 6. TEACHERS MODULE

### Page: Teachers Page (`TeachersPage.tsx`)
- **API**: `GET /api/principal/teachers`
- **Backend function**: `getPrincipalTeachers(schoolId)`
- **Data returned**: `TeacherSummary[]` with fields: id, name, employeeId, assignedClasses[], subjects[], lessonPlansGenerated, homeworkGenerated, assessmentsGenerated, lastLogin, status
- **Frontend features**: Search by name/ID/subject/class, filter by status (All/Active/Offline), sort by name/status
- **Calculation of lastLogin**: From UserModel.lastLoginAt
- **Status**: Based on lastLoginAt recency (threshold unknown — needs verification)

### Page: Teacher Detail Page (`TeacherDetailPage.tsx`)
- **API**: `GET /api/principal/teachers/:id`
- **Backend function**: `getPrincipalTeacherDetail(id, schoolId)`
- **Data returned**: `TeacherDetail` with profile info, classes[] (className, subject, studentCount, curriculumProgress), recentActivity[], lessonPlansGenerated, homeworkGenerated, assessmentsGenerated
- **Static data displayed**: name, email, phone, employeeId, joinedDate
- **Dynamic data**: lessonPlansGenerated, homeworkGenerated, assessmentsGenerated, classes, recentActivity

### Page: Teachers Allocation (`TeachersAllocationPage.tsx`)
- **APIs**: CRUD operations on `/api/principal/class-allocations`
- **Collection**: `TeacherClassAllocationModel`
- **Status workflow**: "draft" → "published"
- **Purpose**: Assign teachers to classes/subjects/sections with academic year tracking

---

## 7. CLASSES MODULE

### Page: Classes Page (`ClassesPage.tsx`)
- **API**: `GET /api/principal/classes`
- **Backend function**: `getPrincipalClasses(schoolId)`
- **Data per class**: classKey, classId, className, section, academicYear, classTeacher, subjects, teachers, students, curriculumProgress, totalTerms, sessionsGenerated, sessionsCompleted, pendingSessions, assignments, homework, assessments, evaluations, submissionRate, averageClassPerformance, lastActivity, status, evaluationCompletion
- **Frontend**: Deduplication by classKey as safety net
- **Sort options**: By name, students count, curriculum progress

### Page: Class Detail Page (`ClassDetailPage.tsx`)
- **API**: `GET /api/principal/classes/:className`
- **Backend function**: `getPrincipalClassDetail(className, schoolId)`
- **Data returned**: `PrincipalClassDetail` including: teacherRoster, studentRoster, subjectDetails[]
- **CRUD operations on class detail**:
  - Assign users to class (POST `/users/assign`)
  - Update teacher subjects (PATCH `/teachers/:teacherId`)
  - Remove teacher/student (DELETE)
  - Delete class (DELETE `/classes/:className`)
  - Add subject (PATCH `/subjects`)

### Page: Subject Detail Page (`SubjectDetailPage.tsx`)
- **API**: `GET /api/principal/classes/:className/subjects/:subjectKey`
- **Backend function**: `getPrincipalSubjectDetail(className, subjectKey, schoolId)`
- **Data**: teacherInfo, students[], curriculum (units, chapters, terms, sessionProgress), homeworkRecords[], assessments[], evaluations[]
- **Features**: Search students, view submission/evaluation status per student

---

## 8. SUBJECT DETAIL MODULE

### Metrics Displayed:
| Metric | Source | Type |
|--------|--------|------|
| Curriculum Progress | curriculumProgress field | Dynamic |
| Submission Rate | submissionPercentage | Dynamic |
| Teacher Info (email, assigned since) | UserModel | Static/Dynamic |
| Lesson Plan Progress | teacherInfo.lessonPlanProgress | Dynamic |
| Terms count | teacherInfo.terms | Dynamic |
| Sessions count | teacherInfo.sessions | Dynamic |
| Homework Created | teacherInfo.homeworkCreated | Dynamic |
| Assessments Created | teacherInfo.assessmentsCreated | Dynamic |
| Evaluations Completed | teacherInfo.evaluationsCompleted | Dynamic |
| Curriculum (Units/Chapters/Terms) | subject.curriculum | Static (stored) |
| Session Progress (Generated/Completed/Pending) | curriculum.sessionProgress | Dynamic |
| Student List with Status | subject.students[] | Dynamic |

---

## 9. EVALUATION REPORTS MODULE

### Page: Evaluation Reports (`EvaluationReportsPage.tsx`)
- **API**: `GET /api/principal/evaluation-reports`
- **Data returned**: `EvaluationReport` with:
  - classWise: `{ className, average, highest, lowest }[]`
  - subjectWise: `{ subject, average, highest, lowest }[]`
  - teacherWise: `{ teacher, average, totalEvaluated }[]`
  - studentWise: `{ student, className, marks, grade }[]`
  - averageMarks, highestMarks, lowestMarks (school-wide)
  - gradeDistribution: `{ grade, count }[]`
  - weakTopics: `{ topic, avgScore }[]`
  - strongTopics: `{ topic, avgScore }[]`
- **Backend**: Inline aggregation using `EvaluationResultModel.aggregate()`

### Calculation Details:
- **Average Marks (school-wide)**: `SUM(marks) / COUNT(results)`
- **Highest Marks**: `MAX(marks)` across all results
- **Lowest Marks**: `MIN(marks)` across all results
- **Class-wise**: Group by classId → average/highest/lowest per class
- **Subject-wise**: Group by subject → average/highest/lowest per subject
- **Teacher-wise**: Group by teacherId → average score, count evaluated
- **Student-wise**: Per-student marks and grade mapping
- **Grade Distribution**: Group by grade letter
- **Weak/Strong Topics**: Group by topic field, sort by avgScore ascending/descending

---

## 10. REPORTS MODULE

### Page: Reports (`ReportsPage.tsx`)
- **API**: `GET /api/principal/reports`
- **Backend**: Returns **stub/empty objects** for all 5 report types
- **Report Types (all stub)**:
  1. `teacherReport` — `Record<string, unknown>`
  2. `classReport` — `Record<string, unknown>`
  3. `evaluationReport` — `Record<string, unknown>`
  4. `schoolPerformanceReport` — `Record<string, unknown>`
  5. `studentPerformanceReport` — `Record<string, unknown>`
- **Download**: `GET /api/reports/download/:reportKey/:format` — returns blob in PDF or XLSX
- **Status**: Reports show empty "No data available" preview. Download likely returns empty or placeholder content.
- **CRITICAL**: Reports module is **not implemented** — it is a placeholder UI only.

---

## 11. ANNOUNCEMENTS MODULE

### Page: Principal Announcements (`PrincipalAnnouncementsPage.tsx`)
- **Storage**: `localStorage` using utility functions from `../../utils/announcements`
- **APIs**: None — purely client-side
- **CRUD operations**: `addAnnouncement()`, `updateAnnouncement()`, `deleteAnnouncement()`, `readAnnouncements()`
- **Data type**: `AnnouncementItem { id, title, message, author, createdAt }`
- **Cross-module**: The same `AnnouncementList` component is used in teacher and student dashboards (reading from localStorage)
- **ISSUE**: Not persisted to database. Announcements disappear if user clears localStorage or on different devices.

---

## 12. SETTINGS MODULE

### Page: Principal Settings (`PrincipalSettingsPage.tsx`)
- **APIs**:
  - `GET /api/principal/users` — List all teachers/students
  - `POST /api/principal/users` — Create new teacher/student
  - `DELETE /api/principal/users/:id` — Remove user
- **User creation form**: Supports role selection (teacher/student), name, email, phone, password, class assignment, section, stream (for XI/XII), subject (for teacher)
- **Validation**: Email format, phone (10 digits), password match, required fields
- **User management**: Filter by role (All/Teachers/Students), view/delete users

---

## 13. PERFORMANCE CALCULATION FORMULAS

### Student Performance
- **Currently**: Just `EvaluationResult.percentage` — the score from a single evaluation
- **Not computed from**: Assignments, homework, attendance, or weighted averages
- **Formula**: `studentPerformance = evaluationResult.percentage` (single metric)
- **Missing**: Composite score across homework, assessments, attendance, and multiple evaluations

### Teacher Performance
- **Formula**: `teacherProductivity = ((lessonPlansGenerated + totalEvaluationsCompleted) / teachers.length) * 10`
- **Factors included**: Lesson plan count + evaluation completion count
- **Factors missing**: Curriculum completion rate, session completion rate, homework publishing rate, student submission rate, student average marks, assessment publishing rate
- **Issue**: This is a school-wide metric, NOT per-teacher. There's no per-teacher performance formula.

### Class Performance
- **Displayed as**: `averageClassPerformance` in `PrincipalClassSummary`
- **Calculation**: Needs further code inspection to confirm exact formula

### School Performance
- **Formula**: Composite of all 7 analytics metrics (curriculumCompletion, lessonPlanGeneration, evaluationCompletion, averageStudentPerformance, teacherProductivity, homeworkCompletion, assessmentCompletion)
- **No single unified school performance score exists** — it's shown as 7 separate ProgressRing values

---

## 14. DATA FLOW DIAGRAM

```
Teacher Uploads Curriculum PDF
        ↓
Curriculum Extraction (Stage 1-10)
        ↓
PlanningWorkspace Created
    ├── curriculumSnapshot (extracted content)
    └── academicConfig (subject, class, section)
        ↓
Term Division (sessionAllocation.allocations)
        ↓
Session Generation (generationScope.generatedSessions)
        ↓
    ┌─── Session Content (teacherNotes, studentNotes, theory)
    ├─── Homework Created
    ├─── Assessments Created
    ├─── Materials Generated
    └─── PowerPoint Exported
        ↓
Student Submits Homework → HomeworkSubmissionModel
Student Completes Assessment → AssignmentSubmissionModel
        ↓
Teacher Evaluates → EvaluationModel + EvaluationResultModel
        ↓
Activity Logged → ActivityLogModel
        ↓
┌─── PRINCIPAL MODULE ──────────────────────────────┐
│                                                    │
│  getPrincipalDashboardAnalytics()                  │
│  ┌─────────────────────────────────────────┐       │
│  │  Reads ALL 9 collections into memory    │       │
│  │  CPU-side aggregation (no MongoDB       │       │
│  │  aggregation pipeline used)             │       │
│  └─────────────────────────────────────────┘       │
│        ↓                                          │
│  Dashboard Numbers                               │
│  Teachers → Users(teachers).length                │
│  Classes → Classes.length                         │
│  Students → Users(students).length                │
│  Lesson Plans → Workspaces iteration              │
│  Evaluations → Evaluations.filter(status)         │
│  Monthly → Date bucket iteration                  │
│  Activity → ActivityLog iteration                 │
│  Performance → EvaluationResult iteration         │
│        ↓                                          │
│  SchoolAnalyticsPage                              │
│  Dashboard                                        │
│  EvaluationReports                                │
└───────────────────────────────────────────────────┘
        ↓
Reports Module (NOT IMPLEMENTED - Stub only)
```

---

## 15. LIVE VS STATIC VS CACHED DATA

### Live Calculated (every page load)
| Metric | Collections Scanned |
|--------|-------------------|
| Total Teachers | Users (full scan) |
| Total Classes | Classes (full scan) |
| Total Students | Users (full scan) |
| Lesson Plans Generated | PlanningWorkspace (full scan) |
| Evaluations Completed | Evaluation (full scan) |
| Teacher Activity | PlanningWorkspace + Evaluation + ActivityLog |
| Evaluation Performance | EvaluationResult (full scan) |
| Monthly Progress | ALL 9 collections (full scan) |
| Recent Activity | ActivityLog + Users |
| School Analytics | ALL 9 collections |
| Grade Distribution | EvaluationResult |
| Subject Performance | PlanningWorkspace |
| Alerts | Users.lastLoginAt |
| Teacher List | Users (teacher role) |
| Teacher Detail | Users + PlanningWorkspace + Evaluation |
| Class List | PlanningWorkspace + Users + Class |
| Class Detail | Class + User + PlanningWorkspace + EvaluationResult |
| Subject Detail | PlanningWorkspace + Users + HomeworkSubmission + AssignmentSubmission + EvaluationResult |
| Evaluation Reports | EvaluationResult (aggregate pipeline) |

### Pre-calculated / Stored (not computed on read)
- **None**. Every metric is computed on-the-fly from raw MongoDB documents.

### Cached
- **None**. There is no caching layer anywhere in the principal module.

### Hardcoded / Placeholder
| Item | Reason |
|------|--------|
| `getAnalytics()` returns `monthly-progress` endpoint data (NOT analytics endpoint) | **API URL mismatch** in principalServiceApi.ts line 468: calls `/api/principal/monthly-progress` instead of `/api/principal/analytics` |
| Reports module data | Stub empty objects `Record<string, unknown>` |
| Evaluation Completion analytics | Binary (0% or 100%), not a proper percentage |
| Homework/Assessment Completion | Raw counts, not percentages |
| Subject Performance | Actually lesson plan distribution, not marks-based |
| Teacher Productivity | Arbitrary `* 10` factor, uncalibrated |

### Dummy / Missing
- Reports download likely returns empty/invalid content
- `getAnalytics()` returns wrong API endpoint (needs separate endpoint)
- No proper `/api/principal/analytics` endpoint exists

---

## 16. MISSING ANALYTICS

### Currently Missing — Principal Level

| Missing Metric | Why Important |
|----------------|---------------|
| **Student Attendance %** | No attendance tracking system exists |
| **Per-Teacher Performance Score** | No composite teacher evaluation metric |
| **Subject-wise Average Marks** | Subject performance shows lesson plan count, not marks |
| **Homework Submission %** | Only raw count, not percentage of assigned |
| **Assessment Completion %** | Only raw count, not percentage of assigned |
| **Session Completion %** | No ratio of completed vs total sessions |
| **Curriculum Coverage % by Subject** | No per-subject curriculum completion tracking |
| **Time-based Trends (Weekly/Bi-weekly)** | Only monthly aggregation exists |
| **Teacher Login Frequency** | No login streak/consistency tracking |
| **Student Performance Trends** | No per-student trend over time |
| **Class Ranking/Comparison** | No comparative class analytics |
| **Department/Stream Performance** | No grouping by Science/Commerce/Arts |
| **Parent Engagement Metrics** | No parent module exists |
| **Budget/Resource Allocation** | No financial data tracked |
| **Infrastructure/Asset Tracking** | No asset management |

### Recommended Production-Ready Analytics

#### For Principal
1. **Executive Summary Dashboard** — All key metrics on one screen with trends
2. **Teacher Performance Scorecard** — Per-teacher metric across 10+ dimensions
3. **Student Performance Analytics** — With trend lines, subject-wise breakdowns
4. **Class Comparison Reports** — Side-by-side class performance
5. **Attendance Dashboard** — Daily/weekly/monthly attendance %
6. **Homework/Assessment Compliance** — Submission rates with deadlines
7. **Curriculum Coverage Heatmap** — Visual of completed vs pending curriculum
8. **Alerts & Exceptions** — Automated flagging of underperforming areas
9. **Year-over-Year Comparison** — Academic year performance trends
10. **Export-ready Executive Reports** — Proper PDF generation

#### For Vice Principal
1. **Teacher Workload Distribution** — Sessions/homework/assessments per teacher
2. **Student Discipline Records** — Behavior tracking
3. **Class-wise Progress Monitoring** — More granular than principal
4. **Substitute Teacher Management** — Absence coverage
5. **Department Meeting Tracking** — Meeting minutes and action items

#### For School Administrator
1. **Fee Collection Reports** — Financial management
2. **Student Enrollment Analytics** — Admission trends, demographics
3. **Staff HR Management** — Payroll, leave tracking, certifications
4. **Infrastructure Utilization** — Classroom/lab usage
5. **Transport Management** — Route and vehicle tracking
6. **Library Management** — Book issuance and returns
7. **Examination Scheduling** — Exam timetable and hall allocation

---

## 17. FILES INVENTORY

### Frontend — React Pages (12 files)
| File | Component Name | Module |
|------|---------------|--------|
| `src/pages/principal/PrincipalDashboard.tsx` | `PrincipalDashboard` | Dashboard |
| `src/pages/principal/TeachersPage.tsx` | `TeachersPage` | Teachers |
| `src/pages/principal/TeacherDetailPage.tsx` | `TeacherDetailPage` | Teacher Detail |
| `src/pages/principal/TeachersAllocationPage.tsx` | `TeachersAllocationPage` | Teachers Allocation |
| `src/pages/principal/ClassesPage.tsx` | `ClassesPage` | Classes |
| `src/pages/principal/ClassDetailPage.tsx` | `ClassDetailPage` | Class Detail |
| `src/pages/principal/SubjectDetailPage.tsx` | `SubjectDetailPage` | Subject Detail |
| `src/pages/principal/EvaluationReportsPage.tsx` | `EvaluationReportsPage` | Evaluation Reports |
| `src/pages/principal/SchoolAnalyticsPage.tsx` | `SchoolAnalyticsPage` | School Analytics |
| `src/pages/principal/ReportsPage.tsx` | `ReportsPage` | Reports |
| `src/pages/principal/PrincipalAnnouncementsPage.tsx` | `PrincipalAnnouncementsPage` | Announcements |
| `src/pages/principal/PrincipalSettingsPage.tsx` | `PrincipalSettingsPage` | Settings |

### Frontend — Shared Components Used
| Component | Usage in Principal |
|-----------|-------------------|
| `StatCard` | Dashboard (total teachers, classes, students, etc.) |
| `ChartCard` | Dashboard, Teacher Detail, Class Detail, Subject Detail, Evaluation Reports, School Analytics |
| `SearchToolbar` | Teachers page, Class Detail (student search) |
| `AnnouncementList` | Announcements page |

### Frontend — Services
| File | Purpose |
|------|---------|
| `src/services/principalServiceApi.ts` | All principal API calls (540 lines) |
| `src/services/evaluationService.ts` | Evaluation-specific API calls (referenced by evaluation reports) |
| `src/services/publishedContentService.ts` | Published content service (used by student notes) |
| `src/services/auth.ts` | Authentication service |

### Frontend — Types
| File | Purpose |
|------|---------|
| `src/types/auth.ts` | Auth types (session, login) |
| `src/types/evaluation.ts` | Evaluation types |
| `src/types/student-content.ts` | Student published content types |
| `src/types/announcements.ts` | Used by AnnouncementList |

### Backend — Single File (`backend/server.ts`)
- **Total size**: ~676 KB, ~16,000+ lines
- **Principal routes**: Lines 15039–15950
- **Principal business logic functions**: Lines 12478–12680+ (all inline)
- **Key functions** (all defined in server.ts):
  - `getPrincipalDashboardAnalytics()` — Lines 12478–12680+
  - `getPrincipalTeachers()` — Inline in route handler line 15112
  - `getPrincipalTeacherDetail()` — Inline in route handler line 15124
  - `getPrincipalAlerts()` — Inline in route handler line 15099
  - `getPrincipalClasses()` — Inline in route handler line 15319
  - `getPrincipalClassDetail()` — Inline in route handler line 15331
  - `getPrincipalSubjectDetail()` — Inline in route handler line 15347

### Backend — Models (8 models used by principal)
| Model | File | Documents |
|-------|------|-----------|
| `UserModel` | `backend/models/User.ts` | Teachers, students, principals |
| `ClassModel` | `backend/models/Class.ts` | Class definitions |
| `CurriculumModel` | `backend/models/Curriculum.ts` | Curriculum records |
| `PlanningWorkspaceModel` | `backend/models/PlanningWorkspace.ts` | Lesson plan workspaces |
| `EvaluationModel` | `backend/models/Evaluation.ts` | Evaluation records |
| `EvaluationResultModel` | `backend/models/EvaluationResult.ts` | Evaluation results |
| `AssignmentSubmissionModel` | `backend/models/AssignmentSubmission.ts` | Assessment submissions |
| `HomeworkSubmissionModel` | `backend/models/HomeworkSubmission.ts` | Homework submissions |
| `ActivityLogModel` | NOT in list — likely missing file entry (inline schema in server.ts) |
| `TeacherClassAllocationModel` | `backend/models/TeacherClassAssignment.ts` | Teacher-class allocations |

### Backend — Middleware Used
| Middleware | File | Purpose |
|-----------|------|---------|
| `ensurePrincipalAccess` | Inline in `server.ts` | Validates principal role for sensitive operations |
| `teacherIsolation` | `backend/middleware/teacherIsolation.ts` | Data isolation helpers (buildSchoolMatch, etc.) |

### Routes — Frontend
| Route | Component |
|-------|-----------|
| `/principal/dashboard` | `PrincipalDashboard` |
| `/principal/teachers` | `TeachersPage` |
| `/principal/teachers/:id` | `TeacherDetailPage` |
| `/principal/teachers-allocation` | `TeachersAllocationPage` |
| `/principal/classes` | `ClassesPage` |
| `/principal/classes/:className` | `ClassDetailPage` |
| `/principal/classes/:className/subjects/:subjectKey` | `SubjectDetailPage` |
| `/principal/evaluation-reports` | `EvaluationReportsPage` |
| `/principal/school-analytics` | `SchoolAnalyticsPage` |
| `/principal/reports` | `ReportsPage` |
| `/principal/announcements` | `PrincipalAnnouncementsPage` |
| `/principal/settings` | `PrincipalSettingsPage` |

---

## KEY ISSUES IDENTIFIED

### Critical Issues

1. **`getAnalytics()` API URL mismatch** (`principalServiceApi.ts` line 468):
   ```javascript
   const response = await fetchJson("/api/principal/monthly-progress");
   ```
   This calls the monthly-progress endpoint instead of an analytics endpoint. It happens to work because the monthly-progress handler also returns `analytics` in its response.

2. **No aggregation pipeline** — All calculations are CPU-side in Node.js. Every metric loads ALL documents from 9 collections into memory on every request. This will not scale beyond a few hundred documents.

3. **Reports module is a stub** — All 5 report types return empty objects. The download feature likely produces empty/invalid files.

4. **Announcements use localStorage** — Not persisted to database. Will be lost on cache clear or across devices.

5. **Evaluation Completion is binary** (0% or 100%) — Not a proper percentage.

6. **Homework/Assessment metrics are raw counts** — Not percentages.

### Performance Issues

1. All dashboard analytics are recalculated on every page load from raw data
2. No caching layer exists
3. No MongoDB aggregation pipelines are used (CPU-side processing)
4. Activity logs are loaded completely for recent activity (no pagination in query)

### Architectural Issues

1. No separation of concerns — all logic in `server.ts`
2. No dedicated controller/service/helper files for principal
3. No TypeScript types shared between frontend/backend
4. No input validation middleware for most routes
5. No pagination on list endpoints (teachers, classes, users)
6. School ID is passed as query parameter (should be from JWT/auth context)