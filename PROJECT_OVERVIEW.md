# KamalaNiketan LMS — Project Overview

**Project:** KamalaNiketan Lesson Plan Generator (LMS)  
**Version:** 1.0.0  
**Last Updated:** July 6, 2026  
**Repository:** https://github.com/chandrika121/LessonPlanGenerator.git

---

## 1. What is KamalaNiketan LMS?

KamalaNiketan LMS is an **AI-powered lesson planning and curriculum management system** designed for educational institutions. It automates the entire workflow from curriculum document upload to generating ready-to-use classroom materials — lesson plans, presentations, homework, assessments, and more.

The system uses **Ollama LLM (qwen3.5:35b-mlx-mlx)** to intelligently extract, structure, and generate educational content, reducing teachers' planning time from hours to minutes.

---

## 2. Core Purpose

| Problem | Solution |
|---------|----------|
| Teachers spend hours manually creating lesson plans | AI generates complete lesson packs in minutes |
| Curriculum documents are unstructured PDFs/DOCX | 10-stage AI pipeline extracts structured curriculum data |
| Planning across terms/sessions is complex | 5-phase guided workflow with AI recommendations |
| Creating presentations is time-consuming | Auto-generates PPTs with templates and image assets |
| Principal oversight is difficult | Real-time analytics dashboard with 12 management pages |

---

## 3. Who Uses It?

| Role | Access | Key Features |
|------|--------|--------------|
| **Teacher** | Full lesson planner | Upload curriculum, plan terms/sessions, generate content, evaluate students |
| **Principal** | Management dashboard | View analytics, manage teachers/classes, evaluation reports, school performance |
| **Student** | Limited view | View grades and performance (placeholder) |

---

## 4. System Architecture (High-Level)

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Teacher  │  │ Principal│  │ Student  │  │  Auth Layer  │ │
│  │ Portal   │  │ Portal   │  │ Portal   │  │  (Mock)      │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
│                        │ HTTP/JSON                           │
├────────────────────────┼────────────────────────────────────┤
│              BACKEND (Express + TypeScript)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  Routes  │  │  AI      │  │  Report  │  │  Middleware   │ │
│  │  (50+)   │  │  Pipeline│  │  Gen     │  │  (CORS, etc)  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
│                        │                                      │
├────────────────────────┼────────────────────────────────────┤
│              DATA LAYER                                        │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │    MongoDB        │  │    Ollama LLM    │                  │
│  │  (11 collections) │  │  (qwen3.5:35b)   │                  │
│  └──────────────────┘  └──────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4 | UI framework |
| **Backend** | Node.js, Express 4, TypeScript | API server |
| **Database** | MongoDB with Mongoose 9 | Data persistence |
| **AI** | Ollama (qwen3.5:35b-mlx-mlx) | Content generation |
| **Reports** | PDFKit, ExcelJS | PDF/Excel export |
| **Routing** | React Router 7 | Client-side navigation |

---

## 5. Key Features

### 5.1 AI Curriculum Extraction
- Upload PDF or DOCX curriculum documents
- 10-stage AI pipeline extracts: units, chapters, topics, competencies, assessments, learning outcomes, activities
- Supports multiple curriculum formats (CBSE, NCERT, term-based, competency-based, language)
- Source-faithful extraction with validation

### 5.2 5-Phase Planning Workflow

```
Phase 1: Curriculum Setup    → Upload → Extract → Review → Approve
Phase 2: Course Planning     → Academic config → AI term recommendations → Approve
Phase 3: Session Planning    → Session allocation → AI recommendations → Approve
Phase 4: Content Generation  → Generate lesson notes, PPT, homework, assessments
Phase 5: Assessment & Revision → Review, revise, regenerate content
```

### 5.3 Content Generation
| Artifact | Format | Description |
|----------|--------|-------------|
| Teacher Lesson Notes | HTML/Text | Detailed teaching guide |
| Student Lesson Notes | HTML/Text | Student-friendly version |
| Presentations | PPTX | 12 slide templates with images |
| Homework | Text | Structured assignments with rubrics |
| Assessments | Text | Question papers with answer keys |
| Activities | Text | Classroom activities & projects |
| Materials List | Text | Required resources |
| PDF Documents | PDF | Printable lesson packs |

### 5.4 Principal Dashboard (12 Pages)
- **Dashboard:** Real-time stats (teachers, classes, students, lesson plans, evaluations)
- **Teachers:** Search, filter, manage teacher profiles and allocations
- **Classes:** Class list with performance metrics, CRUD operations
- **Subject Detail:** Per-subject view with student submission tracking
- **School Analytics:** 7-dimension performance analysis with trends
- **Evaluation Reports:** Class/subject/teacher/student performance breakdowns
- **Reports:** Downloadable PDF/Excel reports
- **Settings:** User management (create/delete teachers & students)

### 5.5 PPT Template System
- 2 theme presets (Kamalaniketan Classic, Kamalaniketan Modern)
- 12 standardized slide types
- Automatic image resolution from Openverse & Wikimedia Commons
- License tracking and attribution management
- Export to PPTX format

---

## 6. Project Structure (Simplified)

```
KamalaNiketanLPG/
├── backend/                     # Express API Server
│   ├── server.ts                # Main server (~16,000 lines)
│   ├── models/                  # 11 MongoDB models
│   ├── prompts/                 # 7 AI prompt templates
│   └── middleware/              # Express middleware
├── src/                         # React Frontend
│   ├── App.tsx                  # Main app (~6,166 lines)
│   ├── pages/                   # 20+ page components
│   │   ├── teacher/             # Teacher portal (3 pages)
│   │   ├── principal/           # Principal portal (12 pages)
│   │   └── student/             # Student portal (1 page)
│   ├── components/              # Reusable UI components
│   ├── services/                # API service layer
│   ├── contexts/                # React contexts (Auth)
│   └── types/                   # TypeScript type definitions
├── scripts/                     # Dev & export utilities
└── outputs/                     # Generated files
```

---

## 7. Database Collections

| Collection | Records | Purpose |
|------------|---------|---------|
| Users | Teachers, Students, Principals | User management |
| Classes | Class definitions | Class management |
| Curriculums | Extracted curricula | Curriculum storage |
| PlanningWorkspaces | 5-phase workflow state | Planning persistence |
| Evaluations | Evaluation records | Assessment tracking |
| EvaluationResults | Student scores | Performance data |
| ActivityLogs | User activity | Audit trail |
| HomeworkSubmissions | Student homework | Submission tracking |
| AssignmentSubmissions | Student assessments | Submission tracking |
| TeacherClassAssignments | Teacher-class mapping | Allocation management |
| Announcements | School announcements | Communication |

---

## 8. API Overview

**Total Endpoints:** 50+

| Category | Count | Examples |
|----------|-------|----------|
| Health & Status | 2 | `/api/health` |
| Curriculum | 6 | CRUD + analyze |
| Planning Workspace | 13 | 5-phase workflow |
| Principal | 27 | Dashboard, teachers, classes, reports |
| Reports | 1 | Download reports |

---

## 9. Development Status

| Module | Status | Readiness |
|--------|--------|-----------|
| AI Curriculum Extraction | ✅ Complete | 8/10 |
| 5-Phase Planning Workflow | ✅ Complete (Phases 1-3) | 7/10 |
| Content Generation | ✅ MVP Complete | 7/10 |
| PPT Generation & Export | ✅ Complete | 7/10 |
| Principal Dashboard | ✅ Complete | 7/10 |
| Teacher Management | ✅ Complete | 7/10 |
| Class Management | ✅ Complete | 7/10 |
| Evaluation Reports | ✅ Complete | 7/10 |
| School Analytics | ✅ Complete | 7/10 |
| Teacher Evaluation | ⚠️ UI Only | 2/10 |
| Reports Module | ⚠️ Stub | 1/10 |
| Authentication | ⚠️ Mock Only | 3/10 |
| Student Portal | ⚠️ Placeholder | 1/10 |
| Testing | ⚠️ Minimal | 3/10 |

---

## 10. Quick Start

### Prerequisites
- Node.js (latest)
- MongoDB (local or remote)
- Ollama with qwen3.5:35b-mlx-mlx model

### Setup
```bash
# Install dependencies
npm install
cd backend && npm install

# Configure environment
# Edit .env file with your settings

# Run development servers
npm run dev
```

### Access
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3002
- **Demo Credentials:**
  - Teacher: teacher@kamalaniketan.edu / teacher123
  - Principal: principal@kamalaniketan.edu / principal123
  - Student: student@kamalaniketan.edu / student123

---

## 11. Key Metrics

| Metric | Value |
|--------|-------|
| Backend Code | ~16,000+ lines |
| Frontend Code | ~8,000+ lines |
| API Endpoints | 50+ |
| Database Collections | 11 |
| AI Prompts | 7 |
| Frontend Pages | 20+ |
| Backend Tests | 10 |
| Frontend Tests | 0 |
| Team Size | 1 developer |

---

## 12. Current Limitations

1. **No real authentication** — Mock credentials, no backend security
2. **Monolithic codebase** — server.ts (16K lines) and App.tsx (6K lines) need refactoring
3. **Evaluation module is UI-only** — No backend for actual answer evaluation
4. **Reports module is a stub** — Returns empty data
5. **No testing** — Only 10 backend tests, zero frontend tests
6. **No caching** — Every request recalculates from raw data
7. **No background jobs** — AI pipeline blocks HTTP for up to 10 minutes
8. **No pagination** — List endpoints will fail with large datasets

---

## 13. Roadmap Summary

| Phase | Focus | Timeline |
|-------|-------|----------|
| P0 | Critical bug fixes | Week 1-2 |
| P1 | Authentication & security | Week 2-3 |
| P2 | Backend refactoring | Week 3-5 |
| P3 | Frontend refactoring | Week 5-7 |
| P4 | Evaluation module backend | Week 7-9 |
| P5 | Testing & quality | Week 9-11 |
| P6 | Reports & analytics | Week 11-13 |
| P7 | Polish & scale | Week 13-16 |

---

*For detailed technical analysis, see [COMPREHENSIVE_PROJECT_AUDIT.md](./COMPREHENSIVE_PROJECT_AUDIT.md)*