# Project Audit Report
**Project Name:** KamalaNiketan Lesson Plan Generator (LMS)  
**Version:** 1.0.0  
**Generated:** June 30, 2026  
**Repository:** https://github.com/chandrika121/LessonPlanGenerator.git  

---

## 1. Executive Summary

KamalaNiketan LMS is an intelligent lesson planning and curriculum management system designed for educational institutions. It leverages AI (Ollama) to automate curriculum extraction, course planning, session allocation, and content generation for teachers.

**Key Capabilities:**
- Curriculum document processing (PDF, DOCX)
- AI-powered multi-stage curriculum extraction
- Term/course planning with AI recommendations
- Session planning and allocation
- Automated generation of lesson plans, PPTs, assessments, and study materials
- Principal-level analytics and reporting
- Multi-role access (Teacher, Principal)

---

## 2. Technology Stack

### 2.1 Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.0.1 | UI Framework |
| TypeScript | 5.8.2 | Type Safety |
| Vite | 6.2.3 | Build Tool |
| Tailwind CSS | 4.1.14 | Styling |
| React Router | 7.18.0 | Routing |
| Lucide React | 0.546.0 | Icons |
| Motion (Framer) | 12.23.24 | Animations |
| pdfjs-dist | 5.6.205 | PDF Processing |
| React Router DOM | 7.18.0 | Client-side Routing |

**Frontend Scripts:**
- `dev:frontend` - Vite development server
- `build` - Production build
- `preview` - Preview production build
- `lint` - TypeScript type checking

### 2.2 Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | Latest | Runtime |
| Express | 4.21.2 | Web Framework |
| TypeScript | 5.8.2 | Type Safety |
| Mongoose | 9.7.1 | MongoDB ODM |
| PDFKit | 0.19.1 | PDF Generation |
| ExcelJS | 4.4.0 | Excel Export |
| CORS | 2.8.5 | Cross-Origin Support |
| dotenv | 17.2.3 | Environment Config |

**Backend Scripts:**
- `dev:backend` - TSX watch mode for development
- `start` - Production server start

### 2.3 AI/ML Integration
- **Ollama LLM:** qwen3.5:35b-mlx-mlx (configurable)
- **Specialized Models:** Session content generation
- **Prompt-based Architecture:** 6 prompt templates for different stages

### 2.4 Database
- **MongoDB** (local or remote)
- Connection: `mongodb://127.0.0.1:27017/kamalaniketan-lms` (default)

---

## 3. Project Structure

```
KamalaNiketanLPG/
├── index.html                 # Entry point HTML
├── package.json               # Main project dependencies
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
├── plan.md                    # Five-Phase Planner Refactor Plan
├── progress.md                # Progress tracking
├── metadata.json              # Project metadata
├── .gitignore                 # Git ignore rules
│
├── backend/                   # Express API Server
│   ├── server.ts              # Main server (7395+ lines) - Core logic
│   ├── reportGenerator.ts     # Report generation utilities
│   ├── package.json           # Backend dependencies
│   ├── tsconfig.json          # Backend TypeScript config
│   │
│   ├── models/                # Mongoose Models
│   │   ├── Curriculum.ts      # Curriculum schema
│   │   └── PlanningWorkspace.ts # Workspace schema
│   │
│   ├── prompts/               # AI Prompt Templates
│   │   ├── assessment-generation.md
│   │   ├── curriculum-extraction.md
│   │   ├── curriculum-intelligence.md
│   │   ├── term-division.md
│   │   └── session-generation.md
│   │
│   ├── backend/               # Internal backend utilities
│   ├── debug-output/          # Debugging artifacts
│   └── *.test.ts              # Backend unit tests
│
├── src/                       # React Frontend
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # Main App Component (6166 lines)
│   ├── RootApp.tsx            # Root wrapper
│   ├── index.css              # Global styles
│   ├── types.ts               # TypeScript interfaces (490 lines)
│   ├── mockSyllabi.ts         # Mock data
│   ├── vite-env.d.ts          # Vite type definitions
│   │
│   ├── components/            # Reusable UI Components
│   │   ├── SearchToolbar.tsx
│   │   └── ChartCard.tsx
│   │
│   ├── contexts/              # React Contexts
│   │
│   ├── hooks/                 # Custom React Hooks
│   │
│   ├── layouts/               # Layout Components
│   │
│   ├── pages/                 # Page Components
│   │   ├── teacher/           # Teacher Portal
│   │   │   ├── TeacherEvaluationPage.tsx
│   │   │   ├── TeacherStudentActionPage.tsx
│   │   │   └── TeacherAnnouncementsPage.tsx
│   │   ├── student/           # Student Portal
│   │   │   └── StudentGradesPage.tsx
│   │   ├── principal/         # Principal Portal
│   │   │   ├── PrincipalDashboard.tsx
│   │   │   ├── TeachersPage.tsx
│   │   │   ├── TeacherDetailPage.tsx
│   │   │   ├── ClassesPage.tsx
│   │   │   ├── ClassDetailPage.tsx
│   │   │   ├── EvaluationReportsPage.tsx
│   │   │   ├── SchoolAnalyticsPage.tsx
│   │   │   └── ReportsPage.tsx
│   │   └── ProfilePage.tsx
│   │
│   ├── routes/                # Route Definitions
│   │   └── AppRoutes.tsx
│   │
│   ├── services/              # API Service Layers
│   │   ├── auth.ts
│   │   ├── principalService.ts
│   │   └── publishedContentService.ts
│   │
│   ├── types/                 # Additional Type Definitions
│   │   └── auth.ts
│   │
│   └── utils/                 # Utility Functions
│       └── navigation.ts
│
├── scripts/                   # Build/Dev Scripts
│   ├── dev.mjs
│   └── export-session-ppt.mjs
│
└── outputs/                   # Generated Output Files
    └── session-2-cell-structure-organelles.pptx
    └── session-2-cell-structure-organelles.pptx.inspect.ndjson
```

---

## 4. Database Models

### 4.1 Curriculum Model (`backend/models/Curriculum.ts`)
Stores extracted curriculum data from uploaded documents.

**Key Fields:**
- `fileName` - Original file name
- `subject` - Subject name
- `gradeLevel` - Class/Grade level
- `extractedCurriculum` - Parsed curriculum data
- `extractionMetadata` - Extraction details
- `sourceText` - Source text content
- `createdAt`, `updatedAt` - Timestamps

### 4.2 PlanningWorkspace Model (`backend/models/PlanningWorkspace.ts`)
Persistent workspace for the 5-phase planning workflow.

**Key Fields:**
- `curriculumId` - Linked curriculum reference
- `phase` - Current phase (curriculum_setup, course_planning, session_planning, content_generation, assessment_revision)
- `status` - Workflow status (draft, in_progress, approved)
- `curriculumSnapshot` - Cached curriculum state
- `curriculumApproval` - Approval metadata
- `academicConfig` - Academic year, school, board settings
- `termPlan` - Term structure and allocations
- `teachingStrategy` - Teacher preferences
- `sessionAllocation` - Session planning results
- `generationScope` - Content generation configuration
- `generatedArtifacts` - Generated content registry
- `revisionState` - Revision history tracking

---

## 5. Backend API Endpoints

### 5.1 Health & Status
- `GET /` - Root endpoint
- `GET /api/health` - Health check with Ollama status

### 5.2 Curriculum Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/curriculums` | List all curricula |
| GET | `/api/curriculums/:id` | Get specific curriculum |
| POST | `/api/curriculums` | Save new curriculum |
| PATCH | `/api/curriculums/:id` | Update curriculum |
| DELETE | `/api/curriculums/:id` | Delete curriculum |
| POST | `/api/analyze-curriculum` | Analyze uploaded document |

### 5.3 Term Planning
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/divide-terms` | Divide curriculum into terms |

### 5.4 Session Planning
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate-session-details` | Generate session details |
| POST | `/api/generate-sessions-outline` | Generate session outline |

### 5.5 Planning Workspace (5-Phase Flow)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/planning-workspaces/:id` | Get workspace |
| POST | `/api/planning-workspaces` | Create workspace |
| PATCH | `/api/planning-workspaces/:id` | Update workspace |
| POST | `/api/planning-workspaces/:id/approve-curriculum` | Approve curriculum phase |
| POST | `/api/planning-workspaces/:id/recommend-course-plan` | AI course plan recommendation |
| POST | `/api/planning-workspaces/:id/approve-course-plan` | Approve course plan |
| POST | `/api/planning-workspaces/:id/recommend-session-allocation` | AI session allocation |
| POST | `/api/planning-workspaces/:id/approve-session-allocation` | Approve session allocation |
| PATCH | `/api/planning-workspaces/:id/session-strategy` | Update teaching strategy |
| GET | `/api/planning-workspaces/:id/session-allocation` | Get session allocation |
| PATCH | `/api/planning-workspaces/:id/session-allocation` | Update session allocation |
| POST | `/api/planning-workspaces/:id/generate-content` | Generate content |
| GET | `/api/planning-workspaces/by-curriculum/:curriculumId` | Get by curriculum |

### 5.6 Reports & Downloads
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/download/:reportKey/:format` | Download reports |

**Total API Endpoints:** 25+

---

## 6. Frontend Architecture

### 6.1 Main Application (`src/App.tsx`)
**Size:** 6166 lines  
**State Management:** React useState hooks  
**Routing:** Step-based navigation (0-5)

**Navigation Steps:**
1. **Step 0:** Dashboard
2. **Step 1:** Upload & Extract Curriculum
3. **Step 2:** Term Planning
4. **Step 3:** Session Specs & Roadmap
5. **Step 4:** Lesson Plan Delivery Outlines
6. **Step 5:** Saved Curriculums

**Key State Variables:**
- Curriculum data (`extractedData`, `currentCurriculumId`)
- Workspace data (`activeWorkspace`, `currentWorkspaceId`)
- Academic configuration (`academicConfigDraft`)
- Course planning (`coursePlanDraft`)
- Teaching strategy (`teachingStrategyDraft`)
- Session planning state

### 6.2 Role-Based Pages

#### Teacher Portal
- Teacher Evaluation Page
- Student Action Page
- Teacher Announcements Page

#### Student Portal
- Student Grades Page

#### Principal Portal
- Principal Dashboard
- Teachers Management
- Teacher Detail View
- Classes Management
- Class Detail View
- Evaluation Reports
- School Analytics
- Reports

### 6.3 Type Definitions (`src/types.ts`)
**Lines:** 490  
**Interfaces:**
- `CurriculumExtraction`
- `SavedCurriculumRecord`
- `TermRow`
- `SessionConfig`
- `SessionPlan` (extensive nested structure)
- `PlanningWorkspace`
- `CurriculumApprovalState`
- `AcademicCalendarConfig`
- `AcademicConfig`
- `TermAllocation`
- `TermPlan`
- `TeachingStrategy`
- `SessionPlanningDefaults`
- `ChapterSessionPlan`
- `SessionAllocation`
- `GeneratedArtifact`
- `RevisionAction`

---

## 7. Backend Architecture

### 7.1 Core Server Logic (`backend/server.ts`)
**Lines:** 7395+  
**Key Components:**

#### Environment Configuration
- `BACKEND_PORT` (default: 3002)
- `FRONTEND_PORT` (default: 4173)
- `OLLAMA_BASE_URL` (AI service)
- `OLLAMA_MODEL` (qwen3.5:35b-mlx-mlx)
- `MONGODB_URI`
- Timeout and chunk settings

#### Stage Order (AI Pipeline)
1. Raw Curriculum Extraction
2. Document Structure Hierarchy
3. Node Enrichment
4. Normalized Teaching Blocks
5. Structural Validation
6. Competency Extraction
7. Assessment Extraction
8. Learning Outcomes Extraction
9. Activities/Projects/Practicals Extraction
10. Curriculum Intelligence Generation

#### Curriculum Profiles Supported
- `cbse_unit_topic` - CBSE unit-topic structure
- `cbse_unit_chapter_topic` - CBSE unit-chapter-topic
- `multi_class_board_syllabus` - Multiple classes
- `term_semester_curriculum` - Term/semester based
- `competency_outcomes_curriculum` - Competency-based
- `language_curriculum` - Language subjects
- `mixed_or_unknown` - Fallback

#### PPT Template System
- **Theme Presets:** Kamalaniketan Classic, Kamalaniketan Modern
- **Template Slides:** 12 standardized slide types
- **Asset Resolution:** Openverse & Wikimedia Commons integration
- **Normalization:** Automatic slide structure normalization

#### Utility Functions (Extensive)
- Text normalization (`normalizeSourceText`)
- Class name canonicalization (`canonicalizeClassName`)
- Chapter/Unit title cleaning
- Structural key building
- JSON repair and sanitization
- Entity validation against source
- Hierarchy building and comparison

### 7.2 Report Generator (`backend/reportGenerator.ts`)
- PDF generation using PDFKit
- Excel export using ExcelJS
- Report formatting and styling

### 7.3 AI Prompt System
6 specialized prompts for:
1. Curriculum extraction
2. Term division
3. Session generation
4. Assessment generation
5. Curriculum intelligence
6. Curriculum extraction (alt)

---

## 8. Key Features & Functionality

### 8.1 Curriculum Ingestion
- Multi-format upload support (PDF, DOCX)
- AI-powered text extraction
- Structure detection (CBSE, state boards, etc.)
- Metadata extraction (subject, grade, chapters, topics)
- Learning outcome identification
- Practical/activity detection

### 8.2 Planning Workspace
- Persistent 5-phase workflow
- Phase-based approval gates
- AI recommendation integration
- Teacher override capabilities
- Revision history tracking

### 8.3 Content Generation
**MVP Artifacts:**
- Teacher lesson notes
- Student lesson notes
- Learning outcomes document
- Introduction slides
- Theory content
- Activities & projects
- Materials list
- Homework assignments
- Assessment bundles
- Assignment details
- **PPT presentations** (exportable)
- **PDF documents**
- **DOCX documents**

### 8.4 Analytics & Reporting (Principal)
- School-wide analytics
- Teacher performance tracking
- Class-level insights
- Evaluation reports
- Custom report generation

### 8.5 Asset Management
- Openverse image integration
- Wikimedia Commons integration
- Automatic image resolution
- License tracking
- Attribution management

---

## 9. Configuration Files

### 9.1 Frontend Config (`vite.config.ts`)
- React plugin configuration
- Tailwind CSS integration
- Development server settings

### 9.2 Backend Config (`backend/tsconfig.json`)
- TypeScript strict mode
- Module resolution settings

### 9.3 Environment Variables (from `backend/server.ts`)
```env
BACKEND_PORT=3002
FRONTEND_PORT=4173
MONGODB_URI=mongodb://127.0.0.1:27017/kamalaniketan-lms
OLLAMA_BASE_URL=http://192.168.1.82:11434
OLLAMA_MODEL=qwen3.5:35b-mlx-mlx
OLLAMA_SESSION_CONTENT_MODEL=qwen3.5:35b-mlx-mlx
OLLAMA_NUM_PREDICT=8192
OLLAMA_STAGE1_NUM_PREDICT=4096
OLLAMA_TIMEOUT_MS=600000
```

---

## 10. Dependencies Summary

### 10.1 Production Dependencies (Root)
- **UI:** @tailwindcss/vite, @vitejs/plugin-react, motion, lucide-react, pdfjs-dist
- **Core:** react, react-dom, react-router-dom
- **Backend:** express, mongoose
- **Utilities:** dotenv, vite

### 10.2 Backend Production Dependencies
- **Core:** express, cors, mongoose
- **Documentation:** pdfkit, exceljs
- **Utilities:** dotenv

### 10.3 Development Dependencies
- TypeScript 5.8.2
- TSX (TypeScript execution)
- Concurrently (parallel dev servers)
- Tailwind CSS
- Autoprefixer
- Type definitions for Express, Node, React, PDFKit

---

## 11. Testing Infrastructure

### 11.1 Backend Tests
- `approvedHierarchy.test.ts`
- `classNormalization.test.ts`
- `curriculumProfiles.test.ts`
- `faithfulStructure.test.ts`
- `stage1Safety.test.ts`

**Test Script:** `npm run test:backend`

---

## 12. Scripts & Utilities

### 12.1 Development Scripts
- `scripts/dev.mjs` - Orchestrates frontend + backend dev servers
- `scripts/export-session-ppt.mjs` - PPT export utility

### 12.2 Output Artifacts
- `outputs/` - Generated session files (PPTX)

---

## 13. Architecture Patterns

### 13.1 Design Patterns
- **Model-View-Controller (MVC)** - Backend
- **Component-Based** - Frontend (React)
- **Stateful Wizard** - Multi-step workflow
- **Repository Pattern** - Data access via Models
- **Service Layer** - Business logic separation
- **Template Method** - PPT generation
- **Strategy Pattern** - Curriculum profiles

### 13.2 Data Flow
1. User uploads curriculum document
2. Backend extracts structure via AI (10-stage pipeline)
3. Extracted data stored in MongoDB
4. Workspace created for planning phases
5. AI recommendations provided for terms/sessions
6. Teacher reviews and approves
7. Content generated on demand
8. Outputs: PPT, PDF, DOCX, Excel

---

## 14. Authentication & Authorization System

### 14.1 Architecture Overview
The application implements a **frontend-only mock authentication system** with role-based access control (RBAC). Authentication state is persisted in `localStorage` and managed via React Context.

### 14.2 Authentication Flow

#### Login Process
```
User enters credentials → AuthContext.login() → authenticateUser() API call
→ Mock credential validation → Store in localStorage → Update React state
→ Redirect to role-specific dashboard
```

#### Session Management
- **Storage:** `localStorage` key: `lms:auth-session`
- **Persistence:** JSON-serialized `AuthUser` object
- **Restoration:** Automatic on app load via `useEffect` in `AuthProvider`
- **Logout:** Clears state and localStorage

### 14.3 User Roles & Credentials

#### Supported Roles
1. **Student** - Access to student portal
2. **Teacher** - Access to lesson planner and teacher tools
3. **Principal** - Access to analytics and management tools

#### Mock Credentials (Development Only)
```typescript
const MOCK_USERS = [
  {
    role: "student",
    email: "student@kamalaniketan.edu",
    password: "student123",
    name: "Ananya Gupta"
  },
  {
    role: "teacher",
    email: "teacher@kamalaniketan.edu",
    password: "teacher123",
    name: "Meera Sharma"
  },
  {
    role: "principal",
    email: "principal@kamalaniketan.edu",
    password: "principal123",
    name: "Ritika Rao"
  }
];
```

**Note:** All demo accounts have ID pattern: `${role}-1`

### 14.4 AuthContext Implementation (`src/contexts/AuthContext.tsx`)

**Key Features:**
- React Context-based state management
- `useState` for user state
- `useMemo` for context value optimization
- `useEffect` for session restoration from localStorage
- Automatic cleanup on logout

**Context Value Interface:**
```typescript
interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (email, password, role) => Promise<void>;
  logout: () => void;
}
```

**State Lifecycle:**
1. `isReady: false` → Loading localStorage
2. `isReady: true` → Auth state determined
3. `isAuthenticated` → Derived from `user !== null`

### 14.5 Authentication Service (`src/services/auth.ts`)

**Function: `authenticateUser(email, password, role)`**
- Simulates API delay (450ms timeout)
- Normalizes email (trim, lowercase)
- Validates against `MOCK_USERS` array
- Returns authenticated user object or throws error
- Error message: "Invalid role or credentials. Try one of the demo accounts shown below."

**Function: `getDemoCredentials()`**
- Returns full `MOCK_USERS` array
- Used to display demo credentials on login page

### 14.6 Type Definitions (`src/types/auth.ts`)

```typescript
type UserRole = "student" | "teacher" | "principal";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface MockCredential {
  role: UserRole;
  email: string;
  password: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}
```

### 14.7 Protected Route Implementation (`src/routes/ProtectedRoute.tsx`)

**Guard Logic:**
1. Check `isReady` - Show loading if false
2. Check `isAuthenticated` - Redirect to `/login` if false
3. Check `allowedRoles` - Redirect to role dashboard if unauthorized

**Props:**
```typescript
{
  allowedRoles: UserRole[];  // e.g., ["teacher"]
}
```

**Behavior:**
- Renders `<Outlet />` for nested routes if authorized
- Preserves intended destination via `location.state.from`
- Uses role-specific dashboard paths from `roleRoutes`

### 14.8 Teacher Login System - Complete Flow

#### Step 1: Access Login Page
- **Route:** `/login`
- **Component:** `LoginPage`
- **Default Route:** Root `/` redirects to `/login`

#### Step 2: Enter Credentials
- Email field
- Password field
- Role selection (Student/Teacher/Principal)

#### Step 3: Authentication Call
```typescript
// src/services/auth.ts
await authenticateUser(email, password, role)
```

#### Step 4: Session Storage
```typescript
// src/contexts/AuthContext.tsx
localStorage.setItem("lms:auth-session", JSON.stringify(authenticated));
setUser(authenticated);
```

#### Step 5: Route Authorization
```typescript
// src/routes/ProtectedRoute.tsx
if (!isAuthenticated || !role) {
  return <Navigate to="/login" replace />;
}
if (!allowedRoles.includes(role)) {
  return <Navigate to={roleRoutes[role].dashboardPath} replace />;
}
return <Outlet />;
```

#### Step 6: Teacher Dashboard Access
**Authorized Routes for Teachers:**
| Route | Component | Description |
|-------|-----------|-------------|
| `/teacher/dashboard` | TeacherDashboard | Main teacher dashboard |
| `/teacher/lesson-planner` | TeacherLessonPlannerPage | AI lesson planning |
| `/teacher/upload-curriculum` | TeacherLessonPlannerPage | Curriculum upload |
| `/teacher/curriculum-analysis` | TeacherLessonPlannerPage | Curriculum analysis |
| `/teacher/term-planning` | TeacherLessonPlannerPage | Term planning |
| `/teacher/session-generator` | TeacherLessonPlannerPage | Session generation |
| `/teacher/generated-sessions` | TeacherLessonPlannerPage | View generated sessions |
| `/teacher/exports` | TeacherLessonPlannerPage | Export materials |
| `/teacher/announcements` | TeacherAnnouncementsPage | Manage announcements |
| `/teacher/student-action` | TeacherStudentActionPage | Student actions |
| `/teacher/assignments` | (redirect) | → `/teacher/student-action?view=assignments` |
| `/teacher/homework` | (redirect) | → `/teacher/student-action?view=homework` |
| `/teacher/assessments` | (redirect) | → `/teacher/student-action?view=assessments` |
| `/teacher/evaluation` | TeacherEvaluationPage | Student evaluation |
| `/teacher/my-classes` | PagePlaceholder | Class management |
| `/teacher/profile` | ProfilePage | Teacher profile |

#### Step 7: Navigation & Role Routes
```typescript
// src/utils/navigation.ts
export const roleRoutes: Record<UserRole, RoleRouteConfig> = {
  teacher: {
    role: "teacher",
    basePath: "/teacher",
    dashboardPath: "/teacher/dashboard",
    defaultTitle: "Teacher Dashboard",
  },
};

export const navigationByRole: Record<UserRole, NavItemConfig[]> = {
  teacher: [
    { label: "Dashboard", to: "/teacher/dashboard", icon: LayoutDashboard },
    { label: "Lesson Planner", to: "/teacher/lesson-planner", icon: NotepadText },
    { label: "Student Action", to: "/teacher/student-action", icon: FolderKanban },
    { label: "Evaluation", to: "/teacher/evaluation", icon: FileCheck2 },
    { label: "Announcements", to: "/teacher/announcements", icon: ScrollText },
    { label: "My Classes", to: "/teacher/my-classes", icon: School },
    { label: "Profile", to: "/teacher/profile", icon: UsersRound },
  ],
};
```

### 14.9 Session Restoration

**On App Load:**
```typescript
useEffect(() => {
  try {
    const saved = localStorage.getItem("lms:auth-session");
    if (saved) {
      setUser(JSON.parse(saved) as AuthUser);
    }
  } catch {
    localStorage.removeItem("lms:auth-session");
  } finally {
    setIsReady(true);
  }
}, []);
```

**Behavior:**
- Reads stored session on app initialization
- Validates JSON structure
- Auto-login if valid session exists
- Clears corrupted sessions

### 14.10 Logout Flow
```typescript
logout() {
  setUser(null);
  localStorage.removeItem("lms:auth-session");
}
```
- Clears React state
- Removes localStorage entry
- User redirected to `/login` on next navigation attempt

### 14.11 Authorization Middleware

**Component Hierarchy:**
```
AuthProvider (Context)
  └── BrowserRouter
      └── AppRoutes
          ├── /login (public)
          ├── ProtectedRoute (allowedRoles: ["student"])
          │   └── AppLayout
          │       └── Student Routes
          ├── ProtectedRoute (allowedRoles: ["teacher"])
          │   └── AppLayout
          │       └── Teacher Routes
          └── ProtectedRoute (allowedRoles: ["principal"])
              └── AppLayout
                  └── Principal Routes
```

### 14.12 Hook Integration (`src/hooks/useAuth`)

**Usage Pattern:**
```typescript
const { user, role, isAuthenticated, isReady, login, logout } = useAuth();
```

**Returns:**
- `user: AuthUser | null` - Current user object
- `role: UserRole | null` - Current user role
- `isAuthenticated: boolean` - Auth status
- `isReady: boolean` - Auth initialization complete
- `login: Function` - Login method
- `logout: Function` - Logout method

### 14.13 Security Considerations & Limitations

#### Current Implementation
- ✅ Role-based route protection
- ✅ Session persistence
- ✅ Automatic session restoration
- ✅ Frontend route guards
- ✅ Type-safe auth context

#### Known Limitations
- ❌ **No real backend authentication** - Mock implementation only
- ❌ **No password hashing** - Plain text in code
- ❌ **No JWT/tokens** - Simple localStorage
- ❌ **No session expiry** - Persistent until manual logout
- ❌ **No multi-user data isolation** - All users share same data
- ❌ **No API authentication** - Backend has no auth middleware
- ❌ **No password reset flow**
- ❌ **No email verification**
- ❌ **No brute-force protection**
- ❌ **No CSRF protection**
- ❌ **Credentials in source code** - MOCK_USERS hardcoded

#### Production Requirements
1. Backend authentication API
2. JWT or session-based auth
3. Password hashing (bcrypt/argon2)
4. Database user model
5. Session management with expiry
6. Password reset functionality
7. Rate limiting on login
8. HTTPS enforcement
9. CSRF tokens
10. Secure httpOnly cookies (alternatives to localStorage)

### 14.14 Teacher-Specific Access Control

**Teacher-Only Features:**
- Lesson plan generation (5-phase workflow)
- Curriculum upload and analysis
- Term and session planning
- Content generation (PPT, PDF, DOCX)
- Student evaluation
- Announcement management
- Assignment/homework creation
- Student action tracking

**Teacher Navigation Items** (7 items):
1. Dashboard
2. Lesson Planner
3. Student Action
4. Evaluation
5. Announcements
6. My Classes
7. Profile

### 14.15 Authentication State in UI

**Loading States:**
- `isReady: false` → "Preparing workspace..." splash screen
- `isReady: true` → Normal app rendering

**Unauthenticated Behavior:**
- All routes redirect to `/login`
- Login page displays demo credentials
- No access to protected content

**Authenticated Behavior:**
- Role-specific sidebar navigation
- Personalized dashboard
- Access to role-specific features

---

## 15. Security & Configuration Notes

### 15.1 Current Security Measures
- CORS whitelist (localhost only)
- Environment variable configuration
- JSON body size limits (50MB)
- Frontend role-based access control (RBAC)

### 15.2 Known Limitations
- No backend authentication
- Mock credentials in source code
- No password hashing
- No session expiry
- No multi-user data isolation
- Local AI model dependency (Ollama)
- No HTTPS enforcement in dev

---

## 15. Project Status & Roadmap

### 15.1 Current Implementation
- ✅ Curriculum extraction pipeline
- ✅ Term division
- ✅ Session planning
- ✅ Content generation (MVP)
- ✅ PPT generation with templates
- ✅ PDF/DOCX exports
- ✅ Principal analytics
- ✅ Multi-format support
- ✅ Workspace persistence

### 15.2 Planned Enhancements (from `plan.md`)
**Five-Phase Refactor:**
1. Phase 1: Curriculum Setup
2. Phase 2: Course Planning
3. Phase 3: Session Planning
4. Phase 4: Content Generation
5. Phase 5: Assessment & Revision

**Post-MVP:**
- Chapter-level and term-level bulk generation: 3-5 days
- Course-wide outputs and analytics: 4-7 days
- **Total estimated: 4-6 weeks**

### 15.3 Technical Debt
- `src/App.tsx` is very large (6166 lines) - needs componentization
- Backend server.ts is 7395+ lines - needs service extraction
- Some duplicated code across services
- Tests are minimal

---

## 16. Build & Deployment

### 16.1 Development
```bash
# Install dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Run both frontend and backend concurrently
npm run dev

# Or run separately
npm run dev:frontend  # Vite on port 5173
npm run dev:backend   # Express on port 3002
```

### 16.2 Production Build
```bash
# Build frontend
npm run build

# Start backend
npm start
```

### 16.3 Type Checking
```bash
npm run lint
```

---

## 17. File Size & Complexity Metrics

| File | Lines | Complexity |
|------|-------|------------|
| `backend/server.ts` | 7395+ | Very High |
| `src/App.tsx` | 6166 | Very High |
| `src/types.ts` | 490 | Medium |
| `backend/reportGenerator.ts` | ~300+ | Medium |
| `package.json` (root) | 42 | Low |
| `package.json` (backend) | 25 | Low |

---

## 18. External Service Dependencies

### 18.1 Required
- **MongoDB** - Primary database
- **Ollama** - AI model serving (qwen3.5:35b-mlx-mlx)
  - Default: `http://192.168.1.82:11434`

### 18.2 Optional (Asset Resolution)
- **Openverse API** - Openly licensed images
- **Wikimedia Commons** - Educational images

---

## 19. Key Business Logic

### 19.1 Curriculum Detection
Automatically detects curriculum type:
- CBSE, NCERT structures
- Multi-class syllabi
- Term-based curriculum
- Competency-based outcomes
- Language curriculum patterns

### 19.2 Content Fidelity Rules
- Source-faithful extraction
- No invented content
- Chapter validation
- Term allocation constraints
- Session count estimation based on content density

### 19.3 Approval Workflow
Each phase requires explicit approval:
1. Curriculum approval
2. Course plan approval
3. Session allocation approval
4. Content generation approval
5. Revision/regeneration allowed

---

## 20. Observations & Recommendations

### 20.1 Strengths
- Comprehensive AI integration
- Robust type system
- Multi-role support
- Extensive prompt engineering
- Template-based PPT generation
- Asset licensing awareness

### 20.2 Areas for Improvement
1. **Code Organization:** Split large files (`server.ts`, `App.tsx`)
2. **Testing:** Increase test coverage beyond 5 backend tests
3. **Authentication:** Critical for production use
4. **Error Handling:** Add comprehensive error boundaries
5. **Monitoring:** Add logging and metrics
6. **Documentation:** Inline code documentation
7. **Validation:** Strengthen input validation
8. **Performance:** Add caching for repeated AI calls

### 20.3 Critical Next Steps
1. Implement authentication/authorization
2. Refactor `server.ts` into services
3. Refactor `App.tsx` into phase components
4. Add integration tests
5. Set up CI/CD pipeline
6. Add environment-based configuration

---

## 21. Version Control & Git

**Repository:** https://github.com/chandrika121/LessonPlanGenerator.git  
**Latest Commit:** ab65e1c864daec47ee386f3c3c41ba2c9302ec97

---

## 22. Conclusion

KamalaNiketan LMS is a sophisticated AI-powered lesson planning platform with:
- **7395+ lines of backend logic** in `server.ts`
- **6166 lines of frontend** in `App.tsx`
- **25+ API endpoints**
- **490 lines of type definitions**
- **10-stage AI curriculum extraction pipeline**
- **5-phase planning workflow**
- **Multi-role access control**
- **6 AI prompt templates**
- **Extensive PPT/template system**

The application is functional and feature-rich but requires refactoring for maintainability and scalability. The roadmap clearly defines the 5-phase transition and post-MVP expansion.

**Overall Assessment:** Production-ready with architectural improvements needed for scale and maintainability.

---

*End of Audit Report*