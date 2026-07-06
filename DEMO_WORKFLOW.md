# KamalaNiketan LMS — Demo Workflow Guide

**Document Type:** End-to-End Demo Walkthrough  
**Audience:** Stakeholders, New Users, Demo Viewers  
**Last Updated:** July 6, 2026

---

## Table of Contents

1. [Demo Overview](#1-demo-overview)
2. [Prerequisites & Login](#2-prerequisites--login)
3. [Teacher Workflow: Complete Lesson Planning](#3-teacher-workflow-complete-lesson-planning)
4. [Principal Workflow: Analytics & Management](#4-principal-workflow-analytics--management)
5. [Evaluation Workflow: Answer Sheet Assessment](#5-evaluation-workflow-answer-sheet-assessment)
6. [Allocation Workflow: Teacher-Class Assignment](#6-allocation-workflow-teacher-class-assignment)
7. [Reports Workflow: Download & Export](#7-reports-workflow-download--export)
8. [Screenshot Guidance](#8-screenshot-guidance)
9. [Troubleshooting Common Demo Issues](#9-troubleshooting-common-demo-issues)

---

## 1. Demo Overview

### 1.1 What This Demo Covers

This document provides step-by-step walkthroughs for the **3 primary user roles** in the system:

| Role | Workflow | Est. Time |
|------|----------|-----------|
| **Teacher** | Upload curriculum → Extract → Plan terms/sessions → Generate content (PPT, homework, assessments) | 15-20 min |
| **Principal** | View dashboard → Analyze school performance → Manage teachers & classes → View evaluation reports | 10-15 min |
| **Teacher (Evaluation)** | Select assessment → Upload answer sheets → Run AI evaluation → View results | 5-10 min |

### 1.2 Demo Environment Details

| Item | Value |
|------|-------|
| **Frontend URL** | `http://localhost:5173` |
| **Backend URL** | `http://localhost:3002` |
| **MongoDB** | `mongodb://127.0.0.1:27017/kamalaniketan-lms` |
| **Ollama Model** | `qwen3.5:35b-mlx-mlx` |
| **Ollama API** | `http://192.168.1.82:11434` |

### 1.3 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Teacher** | `teacher@kamalaniketan.edu` | `teacher123` |
| **Principal** | `principal@kamalaniketan.edu` | `principal123` |
| **Student** | `student@kamalaniketan.edu` | `student123` |

---

## 2. Prerequisites & Login

### 2.1 Starting the Application

```bash
# Terminal 1: Start both frontend & backend
npm run dev

# Or run separately:
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

**Verify Services:**
- ✅ Frontend loads at `http://localhost:5173`
- ✅ Backend responds at `http://localhost:3002/api/health`
- ✅ MongoDB connected (check backend terminal logs)
- ✅ Ollama model loaded (check backend health endpoint)

### 2.2 Login Flow

```
Step 1: Open http://localhost:5173 in browser
        → Redirected to /login page
        → See "Welcome to KamalaNiketan LMS" heading

Step 2: Enter demo credentials
        → Email: teacher@kamalaniketan.edu
        → Password: teacher123
        → Role: Select "Teacher" from dropdown

Step 3: Click "Sign In" button
        → Authenticated via mock auth (localStorage)
        → Redirected to /teacher/dashboard

Step 4: Verify successful login
        → Sidebar shows Teacher navigation items
        → Dashboard displays with stats
        → User name "Meera Sharma" appears in header
```

**Visual Indicators of Success:**
- Sidebar navigation appears with 7 menu items
- Header shows "Welcome, Meera Sharma"
- No redirect back to /login

---

## 3. Teacher Workflow: Complete Lesson Planning

### 3.1 Phase 1: Curriculum Setup (Step 1)

**Goal:** Upload a curriculum document and extract structured data.

```
1. Navigate to Lesson Planner
   → Sidebar → Click "Lesson Planner"
   → Main app opens at Step 0 (Dashboard)

2. Click "Upload Curriculum" or Step 1
   → File upload area appears
   → Supported: PDF, DOCX

3. Upload a Curriculum File
   → Click "Choose File" button
   → Select: backend/Maths_SecP1IX_2026-27 (1).pdf
   → Click "Upload & Extract" button
   → Progress indicator shows extraction status

4. Wait for AI Extraction (2-5 minutes)
   → Progress bar shows: "Extracting curriculum..."
   → Backend runs 10-stage AI pipeline:
      Stage 1: Raw text extraction
      Stage 2: Structure hierarchy detection
      Stage 3: Node enrichment
      Stage 4: Normalized teaching blocks
      Stage 5: Structural validation
      Stage 6: Competency extraction
      Stage 7: Assessment extraction
      Stage 8: Learning outcomes
      Stage 9: Activities extraction
      Stage 10: Curriculum intelligence

5. Review Extracted Curriculum
   → Curriculum summary cards appear:
      • Subject name (e.g., "Mathematics")
      • Grade level (e.g., "Class IX")
      • Units count (e.g., "4 Units")
      • Chapters count (e.g., "12 Chapters")
      • Topics count (e.g., "48 Topics")
   → Curriculum tree view shows hierarchical structure
   → AI confidence score displayed per section

6. Edit Curriculum (Optional)
   → Click "Edit JSON" button
   → Raw JSON editor opens
   → Make changes to units/chapters/topics
   → Click "Save Changes"
   → Warning appears: "Editing resets approval status"
   → Changes persisted to MongoDB

7. Approve Curriculum
   → Review checklist items:
      ✓ Units extracted correctly
      ✓ Chapters mapped to units
      ✓ Topics under chapters
      ✓ Learning outcomes present
      ✓ Assessment criteria present
   → Click "Approve Curriculum" button
   → Status changes to "Approved ✓"
   → Phase 2 becomes accessible
   → Workspace auto-created in MongoDB
```

**Backend Actions:**
- `POST /api/analyze-curriculum` — Triggers AI pipeline
- `POST /api/planning-workspaces` — Creates workspace
- `PATCH /api/curriculums/:id` — Save edits
- `POST /api/planning-workspaces/:id/approve-curriculum` — Approve phase

### 3.2 Phase 2: Course Planning (Step 2)

**Goal:** Configure academic settings and plan term structure.

```
1. Navigate to Step 2 (Course Planning)
   → Click "Next" or Step 2 tab
   → Academic configuration form appears

2. Configure Academic Settings
   → Academic Year: 2026-2027
   → School Name: KamalaNiketan
   → Board: CBSE
   → Medium: English
   → Language: English
   → Class: IX
   → Section: A
   → Textbook: Mathematics NCERT
   → Total Periods/Week: 8
   → Working Days/Week: 6
   → Preferred Term Count: 2
   → Click "Save Configuration"

3. Advanced Academic Calendar (Optional)
   → Expand "Advanced Settings"
   → Lab Periods/Week: 1
   → Revision Weeks: 2
   → Buffer Weeks: 1
   → Holiday Calendar dates (if available)
   → Exam dates (if available)
   → School events (if available)

4. Generate Term Recommendations
   → Click "Generate Course Plan" button
   → AI analyzes curriculum density
   → Returns recommended term allocations:
      • Term 1: Units 1-2 (Chapters 1-6)
      • Term 2: Units 3-4 (Chapters 7-12)
   → Each allocation shows:
      • Term name & number
      • Assigned chapters
      • Estimated sessions
      • Reasoning from AI

5. Edit Term Allocations (Optional)
   → Click "Edit Allocations"
   → Add/remove term rows
   → Adjust chapter assignments
   → Update estimated sessions
   → Add reasoning notes
   → Click "Save Draft Allocations"

6. Review & Approve Course Plan
   → Review table shows:
      • Term breakdown
      • Chapter distribution
      • Session estimates
      • Marks allocation
   → Click "Use Recommendations" (to accept AI plan)
   → Click "Approve Course Plan"
   → Status: "Course Plan Approved ✓"
   → Phase 3 (Session Planning) unlocks
```

**Backend Actions:**
- `PATCH /api/planning-workspaces/:id` — Save academic config
- `POST /api/planning-workspaces/:id/recommend-course-plan` — AI recommendation
- `POST /api/planning-workspaces/:id/approve-course-plan` — Approve phase

### 3.3 Phase 3: Session Planning (Step 3)

**Goal:** Allocate sessions across chapters with AI recommendations.

```
1. Navigate to Step 3 (Session Planning)
   → Click "Next" or Step 3 tab
   → Session planning interface loads

2. Review Session Allocation
   → Shows all chapters organized by term:
      Term 1:
        Chapter 1: Number Systems (8 sessions)
        Chapter 2: Polynomials (10 sessions)
        Chapter 3: Coordinate Geometry (6 sessions)
      Term 2:
        Chapter 4: Linear Equations (8 sessions)
        ...

3. AI Session Recommendation
   → Click "Recommend Session Plan"
   → AI analyzes topic density & complexity
   → Returns recommended sessions per chapter:
      • Chapter 1 → 8 sessions
      • Chapter 2 → 10 sessions
      • Chapter 3 → 6 sessions
      • Total: 60 sessions (matches term estimate)

4. Manual Adjustments
   → Click "Edit Session Allocation"
   → Adjust session counts per chapter
   → Add notes for specific sessions
   → Reorder sessions within term
   → Click "Save Allocation"

5. Set Teaching Strategy
   → Select teaching approach:
      • Theory-focused (60% theory, 20% practice, 20% activities)
      • Practice-focused (30% theory, 50% practice, 20% activities)
      • Balanced (40% theory, 30% practice, 30% activities)
   → Set assessment frequency: per chapter / per unit / per term
   → Set homework frequency: per session / per week

6. Approve Session Allocation
   → Review total session count matches available periods
   → Click "Approve Session Allocation"
   → Status: "Session Plan Approved ✓"
   → Phase 4 (Content Generation) unlocks
```

**Backend Actions:**
- `POST /api/planning-workspaces/:id/recommend-session-allocation`
- `PATCH /api/planning-workspaces/:id/session-allocation`
- `PATCH /api/planning-workspaces/:id/session-strategy`
- `POST /api/planning-workspaces/:id/approve-session-allocation`

### 3.4 Phase 4: Content Generation (Step 4)

**Goal:** Generate all lesson materials for selected sessions.

```
1. Navigate to Step 4 (Content Generation)
   → Click "Next" or Step 4 tab
   → Session list with generation status appears

2. Select Sessions for Generation
   → Checkboxes per session:
      ☑ Chapter 1: Session 1 - Introduction to Numbers
      ☑ Chapter 1: Session 2 - Types of Numbers
      ☐ Chapter 1: Session 3 - Number Operations
      ...
   → Or use "Select All" for batch generation

3. Choose Content Types
   → Checkboxes for each artifact:
      ☑ Teacher Lesson Notes
      ☑ Student Lesson Notes
      ☑ Homework Assignments
      ☑ Assessment Questions
      ☑ PPT Presentation
      ☑ Activities & Projects
      ☑ Materials List

4. Generate Content
   → Click "Generate Selected Content"
   → Progress indicator per content type:
      [====>      ] Teacher Notes (40%)
      [===>       ] Student Notes (30%)
      [=>         ] Homework (10%)
      [           ] PPT (0%)
   → Each content type uses dedicated AI prompt:
      • Teacher notes → session-generation.md
      • Student notes → session-generation.md
      • Homework → homework-generation.md (dedicated)
      • PPT → session-ppt-prompt.md (dedicated)
      • Assessment → assessment-generation.md

5. Review Generated Content
   → Click on each tab to preview:

   📄 **Teacher Lesson Notes Tab:**
      • Learning objectives
      • Lesson flow / procedure
      • Key concepts with explanations
      • Teaching tips
      • Discussion questions
      • Summary points

   📄 **Student Lesson Notes Tab:**
      • Simplified explanations
      • Key points to remember
      • Examples with solutions
      • Practice questions
      • Self-assessment checklist

   📄 **Homework Tab:**
      • Assignment title & description
      • Questions with mark allocation
      • Due date and submission instructions
      • Rubric / grading criteria
      • Learning outcomes covered

   📄 **PPT Tab:**
      • Slide preview with content
      • Slide title & bullet points
      • Speaker notes per slide
      • Visual asset suggestions
      • Slide count & structure

   📄 **Assessment Tab:**
      • Question paper with sections
      • Marking scheme / answer key
      • Bloom's taxonomy levels
      • Time duration suggestions

6. Regenerate Specific Content
   → Click "Regenerate" on any section
   → Only that specific content is regenerated
   → Other sections remain unchanged

7. Export Content
   → **Download PPT:** sessions → "Download PPTX"
      → Runs scripts/export-session-ppt.mjs
      → Downloads .pptx file with:
         • 12 standardized slide templates
         • Kamalaniketan theme styling
         • Auto-resolved images from Openverse/Wikimedia
         • Speaker notes included
   → **Download PDF:** Click "Download PDF"
      → Generates via PDFKit
      → Complete lesson pack document
   → **Download DOCX:** Click "Download DOCX"
      → Generates via ExcelJS/Word format
```

**Backend Actions:**
- `POST /api/planning-workspaces/:id/generate-content` — Trigger generation
- `GET /api/reports/download/:reportKey/:format` — Download artifacts

### 3.5 Generated Content Examples

#### PPT Output Example
```
Slide 1: Title Slide
  - Chapter 1: Number Systems
  - Session 1: Introduction to Numbers
  - Class IX - Mathematics

Slide 2: Learning Objectives
  - Understand the concept of natural numbers
  - Identify whole numbers and integers
  - Differentiate between rational and irrational numbers

Slide 3: Key Concepts
  - Natural Numbers: 1, 2, 3, ...
  - Whole Numbers: 0, 1, 2, 3, ...
  - Integers: ..., -2, -1, 0, 1, 2, ...
  [Speaker Note: Ask students for examples of each]

...

Slide 12: Summary
  - Number line representation
  - Real number system hierarchy
  - Practice problems for next session
```

#### Homework Output Example
```
Homework: Number Systems - Practice Set 1
Subject: Mathematics | Class: IX
Due Date: 2026-07-10

Learning Outcomes Covered:
  - LO1: Classify numbers into natural, whole, integer categories
  - LO2: Represent numbers on a number line
  - LO3: Identify rational numbers between given numbers

Questions:
  1. (5 marks) Classify the following numbers:
     a) -3  b) 0  c) 2.5  d) √2  e) 22/7
  2. (3 marks) Represent 3/4 and -1/2 on a number line.
  3. (2 marks) Find three rational numbers between 1/3 and 1/2.

Rubric:
  - Correct classification: 1 mark each
  - Accurate number line: 1.5 marks each
  - Correct rational numbers: 1 mark each
  - Clear reasoning: 1 mark bonus
```

---

## 4. Principal Workflow: Analytics & Management

### 4.1 Logging in as Principal

```
Step 1: Logout from Teacher account
   → Click profile icon → "Logout"

Step 2: Login as Principal
   → Email: principal@kamalaniketan.edu
   → Password: principal123
   → Role: Select "Principal"
   → Click "Sign In"

Step 3: Verify Principal Dashboard
   → Sidebar shows 12 navigation items
   → Header shows "Ritika Rao"
```

### 4.2 Principal Dashboard

```
1. Navigate: Sidebar → "Dashboard"
   → Page: PrincipalDashboard.tsx

2. View Top Stats Cards (5 cards)
   ┌──────────────────────────────────────────────────┐
   │  👨‍🏫 Teachers: 45   📚 Classes: 30              │
   │  👩‍🎓 Students: 720  📝 Lesson Plans: 156        │
   │  ✅ Evaluations: 89                              │
   └──────────────────────────────────────────────────┘

3. View Alerts Section
   → Teacher inactivity warnings
   → Curriculum delay alerts
   → Color-coded by severity (warning/danger)
   → Click alert to navigate to teacher detail

4. Lesson Plans by Subject Chart
   → Bar chart showing:
      • Mathematics: 42 plans
      • Science: 38 plans
      • English: 32 plans
      • History: 24 plans
      • Geography: 20 plans

5. Evaluation Performance Chart
   → Class-wise average scores:
      • Class X-A: 82%
      • Class X-B: 78%
      • Class IX-A: 75%
      • Class IX-B: 71%

6. Teacher Activity Chart
   → Top teachers by activity score:
      • Priya Sharma: 45 sessions
      • Amit Kumar: 38 sessions
      • Sunita Patel: 35 sessions

7. Monthly Progress Chart
   → Line chart showing activity over 12 months
   → Normalized to percentage of peak month

8. Recent Activity Feed
   → Last 8 activities with:
      • Teacher name & action
      • Time ago (e.g., "2 hours ago")
      • Non-login activities prioritized
```

**Backend Actions:**
- `GET /api/principal/dashboard-summary`
- `GET /api/principal/alerts`
- `GET /api/principal/lesson-plans-by-subject`
- `GET /api/principal/evaluation-performance`
- `GET /api/principal/teacher-activity`
- `GET /api/principal/monthly-progress`

### 4.3 School Analytics

```
1. Navigate: Sidebar → "School Analytics"
   → Page: SchoolAnalyticsPage.tsx

2. View 7 Performance Metrics (Progress Rings)
   ┌────────────────────────────────────────────┐
   │  📊 Curriculum Completion: 68%             │
   │  📊 Lesson Plan Generation: 72%            │
   │  📊 Evaluation Completion: 45%             │
   │  📊 Average Student Performance: 76%       │
   │  📊 Teacher Productivity: 82%              │
   │  📊 Homework Completion: 340 submissions   │
   │  📊 Assessment Completion: 280 submissions │
   └────────────────────────────────────────────┘

3. Monthly Trends Line Chart
   → 3 lines: Curriculum, Evaluation, Performance
   → X-axis: Months (Jan-Dec)
   → Y-axis: Normalized percentage

4. Subject Performance Chart
   → Bar chart of lesson plan distribution by subject
   → (Note: Currently shows distribution, not marks)

5. Grade Distribution Pie Chart
   → Segments: A+, A, B+, B, C, D
   → Count per grade from evaluation results
```

### 4.4 Teacher Management

```
1. Navigate: Sidebar → "Teachers"
   → Page: TeachersPage.tsx

2. View Teacher List
   → Table with columns:
      • Name | Employee ID | Classes | Subjects | Plans | Homework | Assessments | Last Login | Status
   → Sortable by name or status

3. Search Teachers
   → Search bar: type name, employee ID, subject, or class
   → Real-time filtering

4. Filter by Status
   → Toggle: "All" | "Active" | "Offline"
   → Active = logged in within threshold period

5. View Teacher Detail
   → Click teacher name → TeacherDetailPage.tsx
   → Profile section: name, email, phone, employee ID, joined date
   → Classes taught with curriculum progress per class
   → Recent activity timeline
   → Lesson plan, homework, assessment counts
```

### 4.5 Class Management

```
1. Navigate: Sidebar → "Classes"
   → Page: ClassesPage.tsx

2. View Class List
   → Cards/grid showing per class:
      • Class name & section (e.g., "X-A")
      • Class teacher name
      • Subjects count
      • Students count
      • Curriculum progress %
      • Sessions generated/completed/pending
      • Submission rate %
      • Average performance %
      • Evaluation completion %
   → Sort by name, students, or progress

3. View Class Detail
   → Click class → ClassDetailPage.tsx
   → Teacher Roster: list of assigned teachers
   → Student Roster: list with search
   → Subject Details: per-subject summary cards
   → CRUD Operations:
      • Add teacher to class
      • Remove teacher from class
      • Assign student to class
      • Remove student from class
      • Add subject to class

4. Subject Detail Drill-down
   → Click subject → SubjectDetailPage.tsx
   → Teacher info card (name, email, assigned since)
   → Curriculum section (units, chapters, terms, session progress)
   → Student table with:
      • Homework status
      • Assessment status
      • Submission count
      • Evaluation result
      • Submission label
   → Student search by name, email, roll number
```

### 4.6 Evaluation Reports

```
1. Navigate: Sidebar → "Evaluation Reports"
   → Page: EvaluationReportsPage.tsx

2. View School-Wide Stats
   → Average Marks: 68
   → Highest Marks: 98
   → Lowest Marks: 22

3. Class-Wise Performance
   → Table: Class | Average | Highest | Lowest
   → Class X-A: 82% | 98% | 55%
   → Class X-B: 78% | 95% | 45%

4. Subject-Wise Performance
   → Table: Subject | Average | Highest | Lowest
   → Mathematics: 76% | 98% | 30%
   → Science: 72% | 95% | 35%

5. Teacher-Wise Performance
   → Table: Teacher | Average Score | Students Evaluated
   → Priya Sharma: 82% | 45 students

6. Student-Wise Results
   → Table: Student | Class | Marks | Grade
   → Searchable by student name

7. Grade Distribution
   → Pie chart: A+: 12%, A: 25%, B+: 30%, B: 18%, C: 10%, D: 5%

8. Weak & Strong Topics
   → Weak Topics: Fractions (avg 45%), Decimals (avg 52%)
   → Strong Topics: Algebra (avg 88%), Geometry (avg 85%)
```

### 4.7 Reports Module

```
1. Navigate: Sidebar → "Reports"
   → Page: ReportsPage.tsx

2. View Available Reports (5 types)
   → Teacher Report
   → Class Report
   → Evaluation Report
   → School Performance Report
   → Student Performance Report

3. ⚠️ Current Limitation
   → All reports show "No data available"
   → Reports module is a stub (not yet implemented)
   → Download buttons exist but return empty content
```

### 4.8 Settings: User Management

```
1. Navigate: Sidebar → "Settings"
   → Page: PrincipalSettingsPage.tsx

2. Create New User
   → Click "Add User" button
   → Fill form:
      • Role: Teacher / Student
      • Name: Full name
      • Email: Email address
      • Phone: 10-digit number
      • Password + Confirm Password
      • Class assignment (for students)
      • Section (for students)
      • Stream (for XI/XII: Science/Commerce/Arts)
      • Subject (for teachers)
   → Click "Create User"
   → User appears in the list

3. Manage Existing Users
   → Filter by role: All / Teachers / Students
   → View user details
   → Delete user (with confirmation)
```

### 4.9 Teachers Allocation

```
1. Navigate: Sidebar → "Teachers Allocation"
   → Page: TeachersAllocationPage.tsx

2. Create New Allocation
   → Click "Add Allocation"
   → Select: Teacher, Class, Section
   → Select Subjects
   → Set Academic Year
   → Status: Draft (default)
   → Click "Save"

3. Publish Allocation
   → Click "Publish" on a draft
   → Status changes to "Published"
   → Teacher-student-class mapping activated

4. Edit / Delete Allocations
   → Edit button → Modify assignment details
   → Delete button → Remove allocation
```

---

## 5. Evaluation Workflow: Answer Sheet Assessment

### 5.1 Login as Teacher

```
→ Email: teacher@kamalaniketan.edu
→ Password: teacher123
→ Role: Teacher
```

### 5.2 Navigate to Evaluation

```
Sidebar → Click "Evaluation"
→ Page: TeacherEvaluationPage.tsx
→ 6-Step Wizard loads
```

### 5.3 Step-by-Step Evaluation

```
Step 1: Select Evaluation Type
   → 3 options:
      📋 Session Evaluation (single session)
      📋 Lesson Evaluation (chapter-level)
      📋 Term Evaluation (full term paper)
   → Click on "Session Evaluation"
   → Card highlights as selected

Step 2: Select Assessment
   → Hierarchical dropdowns:
      Term: "Term 1"
         → Chapter: "Chemical Reactions"
            → Lesson: "Types of Reactions"
               → Session: "Oxidation & Reduction"
                  → Assessment: "Session Quiz - Oxidation"
   → Assessment details appear:
      • Question paper preview
      • Answer key (if available)
      • Rubric criteria
      • Max marks: 25

Step 3: Select Students
   → Student list displayed:
      ☐ Aarav Sharma (Roll 1)
      ☑ Diya Patel (Roll 2)
      ☑ Ishaan Verma (Roll 3)
      ☐ Meera Singh (Roll 4)
      ☐ Riya Gupta (Roll 5)
   → Search bar to filter students
   → "Select All" checkbox
   → Selected count: "2 students selected"

Step 4: Upload Answer Sheets
   → Per student upload panel:
      Diya Patel: [Upload] 📎 answer_sheet_diya.pdf ✓
      Ishaan Verma: [Upload] 📎 answer_sheet_ishaan.pdf ✓
   → Upload status indicators:
      • not_uploaded (gray)
      • uploaded (green check)
      • already_available (blue)

Step 5: Run AI Evaluation
   → Click "Start Evaluation" button
   → 6-stage progress animation:
      [====>......................] Reading answer sheet (20%)
      [========>..................] Extracting answers (33%)
      [============>..............] Comparing with answer key (46%)
      [================>..........] Applying rubric (60%)
      [===================>.......] Calculating marks (73%)
      [======================>....] Generating feedback (86%)
      [==========================] Complete! (100%)

Step 6: View Results
   → Results table:
      Student     | Marks | Max | %   | Grade
      Diya Patel  | 22    | 25  | 88% | A+
      Ishaan Verma| 18    | 25  | 72% | B+

   → Click student row to expand:
      Question-wise breakdown:
      Q1 (8 marks) | 7 marks | "Correct concept, minor error"
      Q2 (10 marks)| 9 marks | "Well explained with examples"
      Q3 (7 marks) | 6 marks | "Good attempt, missed one point"

   → Overall feedback per student

   → Actions:
      💾 "Save Evaluation" → Persists results
      🔄 "Re-evaluate" → Reruns evaluation
      📥 "Download Report" → Downloads TXT report
```

**Note:** All evaluation features currently use **mock data**. No actual AI evaluation occurs.

---

## 6. Allocation Workflow: Teacher-Class Assignment

This workflow runs entirely within the Principal portal.

```
1. Login as Principal
   → principal@kamalaniketan.edu / principal123

2. Navigate to Teachers Allocation
   → Sidebar → "Teachers Allocation"

3. View All Allocations
   → List of existing teacher-class assignments
   → Each shows: Teacher | Class | Section | Subjects | Academic Year | Status

4. Create New Allocation
   → Click "Add Allocation"
   → Form opens:
      Teacher: [Dropdown] Select teacher
      Class: [Dropdown] Select class
      Section: [Dropdown] Select section (A/B/C)
      Subjects: [Multi-select] Mathematics, Science, English
      Academic Year: 2026-2027
   → Click "Save" → Status: "Draft"

5. Publish Allocation
   → Click "Publish" on draft allocation
   → Confirmation dialog: "Are you sure?"
   → Click "Confirm" → Status changes to "Published"
   → Teacher now visible in class roster
   → Students see teacher assigned

6. Edit Allocation (Published)
   → Click "Edit" → Modify subjects or section
   → Save changes

7. Delete Allocation
   → Click "Delete" → Confirm → Removed
   → Teacher removed from class
```

---

## 7. Reports Workflow: Download & Export

### 7.1 Download Reports (Principal)

```
1. Principal Dashboard → Reports
2. Select report type from 5 available
3. Click "Download" button
4. Select format: PDF or XLSX
5. Browser downloads file
```

**⚠️ Current Limitation:** Report data is empty (stub implementation).

### 7.2 Export PPT (Teacher)

```
1. Teacher → Lesson Planner → Step 4
2. Select session with generated PPT content
3. Click "Download PPTX" button
4. PPT file generates with:
   - Kamalaniketan theme
   - Auto-resolved images
   - Speaker notes
   - 12-slide structure
5. Browser saves .pptx file

Example output path:
outputs/session-2-cell-structure-organelles.pptx
```

---

## 8. Screenshot Guidance

When capturing screenshots for documentation or presentations, capture these key screens:

### Teacher Workflow Screenshots

| # | Screen | What to Capture |
|---|--------|-----------------|
| 1 | Login page | Login form with demo credentials visible |
| 2 | Teacher Dashboard | Stats cards and navigation sidebar |
| 3 | Upload Curriculum | File upload area with PDF selected |
| 4 | Curriculum Review | Extracted units, chapters, topics |
| 5 | Approve Curriculum | Approval button and checklist |
| 6 | Academic Config | Academic year, class, board form |
| 7 | Term Recommendations | AI-generated term allocations |
| 8 | Session Allocation | Sessions per chapter table |
| 9 | Content Generation | Content type checkboxes |
| 10 | Generated PPT | Slide preview in PPT tab |

### Principal Workflow Screenshots

| # | Screen | What to Capture |
|---|--------|-----------------|
| 1 | Principal Dashboard | 5 stats cards + charts |
| 2 | School Analytics | 7 progress rings |
| 3 | Teachers List | Searchable teacher table |
| 4 | Teacher Detail | Profile + classes + activity |
| 5 | Classes List | Class cards with metrics |
| 6 | Subject Detail | Student submission table |
| 7 | Evaluation Reports | Performance breakdowns |
| 8 | Teachers Allocation | Allocation CRUD interface |

---

## 9. Troubleshooting Common Demo Issues

### Issue 1: Backend Won't Start

```
Symptom: npm run dev:backend fails
Fix:    • Check MongoDB is running: mongod
        • Check port 3002 is free
        • Check .env file exists with correct values
        • Run: cd backend && npm install
```

### Issue 2: AI Pipeline Fails

```
Symptom: Curriculum extraction fails after upload
Fix:    • Check Ollama is running: curl http://192.168.1.82:11434
        • Check model is loaded: ollama list
        • Load model: ollama pull qwen3.5:35b-mlx-mlx
        • Check backend logs for specific error
        • Large PDFs may timeout → increase OLLAMA_TIMEOUT_MS in .env
```

### Issue 3: Frontend Shows Blank Page

```
Symptom: http://localhost:5173 shows white screen
Fix:    • Check browser console for errors
        • Run: npm run build (check for build errors)
        • Run: npm install (reinstall dependencies)
        • Clear browser cache & localStorage
```

### Issue 4: Login Fails

```
Symptom: "Invalid role or credentials" error
Fix:    • Use exact credentials from Section 1.3
        • Check role dropdown matches credential role
        • Clear localStorage: localStorage.clear()
        • Refresh page and try again
```

### Issue 5: PPT Export Fails

```
Symptom: "Failed to download PPT" error
Fix:    • Run: cd scripts && npx tsx export-session-ppt.mjs --help
        • Check output directory exists
        • Check session has generated PPT content first
```

### Issue 6: MongoDB Connection Error

```
Symptom: Backend logs "MongoDB connection error"
Fix:    • Start MongoDB: net start MongoDB  (Windows)
        • Check URI in .env matches local instance
        • Verify MongoDB port: 27017
```

---

## Quick Reference: Key Demo Flow Paths

```
┌────────────────────────────────────────────────────────────────┐
│                     TEACHER DEMO PATH                          │
│                                                                │
│  Login → Lesson Planner → Upload Curriculum                    │
│  → Review → Approve → Configure Academics → Generate Terms     │
│  → Approve → Plan Sessions → Approve → Generate Content        │
│  → View PPT → Download PPTX                                    │
│                                                                │
│  OR (Shorter):                                                 │
│  Login → Evaluation → Select Type → Pick Students              │
│  → Upload Papers → Run Evaluation → View Results               │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                    PRINCIPAL DEMO PATH                         │
│                                                                │
│  Login → Dashboard (stats + charts)                            │
│  → School Analytics (7 metrics)                                │
│  → Teachers (search & view)                                    │
│  → Classes (drill-down to subject detail)                      │
│  → Evaluation Reports (performance breakdowns)                 │
│  → Teachers Allocation (create & publish)                      │
│  → Settings (create a test user)                               │
└────────────────────────────────────────────────────────────────┘
```

---

*End of Demo Workflow Guide — For questions, contact the development team.*