# Five-Phase Planner Refactor Plan

## Summary
Replace the current 4-step flow with a persisted 5-phase workflow:

1. Curriculum Setup
2. Course Planning
3. Session Planning
4. Content Generation
5. Assessment & Revision

Recommended delivery approach: build an MVP-first version of the five phases, then extend into chapter/term/course-wide outputs and advanced analytics after the core workflow is stable.

## Current State
- Frontend is a single large wizard in `src/App.tsx`.
- Core frontend types live in `src/types.ts`.
- Backend planning and generation endpoints live in `backend/server.ts`.
- Curriculum persistence currently stores extracted curriculum records in Mongo via `backend/models/Curriculum.ts`.
- Current flow is centered on:
  - curriculum extraction
  - term division
  - session outline generation
  - session detail generation

## Target Product Flow

### Phase 1: Curriculum Setup
- Teacher uploads curriculum sources such as PDF, DOCX, CBSE curriculum, NCERT book, lesson plans, notes, question papers, or lab manual.
- System extracts:
  - subject
  - grade
  - academic year
  - book and publisher details when available
  - units, chapters, topics, subtopics
  - learning outcomes
  - practicals, activities, competencies
  - glossary/keywords
  - estimated teaching hours
- UI shows detected curriculum summary with confidence, editable structured data, and an explicit approval step.
- Planning cannot proceed until curriculum is approved.

### Phase 2: Course Planning
- Teacher configures the full academic setup before planning begins:
  - academic year
  - school
  - board
  - medium
  - language
  - subject
  - class and section
  - book
  - calendar and working days
  - holiday calendar
  - exam dates
  - school events and special days
  - weekly periods, period duration, lab periods
  - revision weeks and buffer weeks
- Teacher defines term structure.
- AI recommends chapter-to-term allocation with reasoning and estimated sessions.
- Teacher edits and approves the course plan.

### Phase 3: Session Planning
- Teacher defines planning preferences:
  - teaching style
  - student level and pace
  - Bloom taxonomy emphasis
  - assessment preference
  - target difficulty
  - teaching resources
  - AI settings such as creativity, language, length, and reading level
- AI estimates sessions by chapter first.
- Teacher adjusts counts and sequence where needed.
- System generates a structured session allocation per chapter and per term.

### Phase 4: Content Generation
- Generation must be selectable by scope:
  - entire course
  - entire term
  - chapter
  - single session
- Do not force full generation.
- Session-level generation should support MVP outputs first:
  - teacher pack
  - lesson plan
  - teaching script
  - teacher notes
  - blackboard plan
  - classroom activities
  - homework
  - exit ticket
  - student notes
  - examples and practice
  - PPT and speaker notes
  - quiz/worksheet/assessment bundle

### Phase 5: Assessment & Revision
- Allow regeneration at multiple levels:
  - course
  - term
  - chapter
  - session
  - artifact only such as PPT, quiz, or notes
- Track which items are generated, revised, regenerated, or approved.
- Provide a clean path to update only one piece without rerunning the whole workflow.

## Data Model Changes

### New persisted workspace model
Add a planning workspace persisted in Mongo and linked to `curriculumId`.

Suggested top-level fields:
- `curriculumId`
- `phase`
- `curriculumApproval`
- `academicConfig`
- `termPlan`
- `teachingStrategy`
- `sessionAllocation`
- `generationScope`
- `generatedArtifacts`
- `revisionState`
- `status`

### Frontend types to add or expand
Extend `src/types.ts` with:
- `PlanningWorkspace`
- `CurriculumApprovalState`
- `AcademicConfig`
- `AcademicCalendarConfig`
- `TermPlan`
- `TermAllocation`
- `TeachingStrategy`
- `SessionAllocation`
- `ChapterSessionPlan`
- `GenerationScope`
- `GeneratedArtifact`
- `ArtifactBundle`
- `RevisionAction`

## API Changes

### Keep existing endpoints
Preserve current curriculum extraction behavior while the new flow is introduced.

### Add workspace-oriented endpoints
Add endpoints similar to:
- `POST /api/planning-workspaces`
- `GET /api/planning-workspaces/:id`
- `PATCH /api/planning-workspaces/:id`
- `POST /api/planning-workspaces/:id/approve-curriculum`
- `POST /api/planning-workspaces/:id/recommend-course-plan`
- `POST /api/planning-workspaces/:id/approve-course-plan`
- `POST /api/planning-workspaces/:id/recommend-session-allocation`
- `POST /api/planning-workspaces/:id/approve-session-allocation`
- `POST /api/planning-workspaces/:id/generate-content`
- `POST /api/planning-workspaces/:id/regenerate-content`

### Validation rules
- Do not allow course planning before curriculum approval.
- Do not allow session planning before academic configuration and term planning are approved.
- Do not allow content generation until session allocation is finalized.
- Restrict regeneration to the requested scope only.

## Frontend Implementation Plan

### Step 1: Refactor the current single-file wizard
- Split `src/App.tsx` into phase-oriented sections or components.
- Keep one top-level container responsible for navigation, loading, persistence, and cross-phase state.
- Replace step numbers with the new five phases.

### Step 2: Add persisted workspace state
- Store a single active planning workspace in frontend state.
- Restore the active workspace on reload the same way current curriculum restore works.
- Keep curriculum extraction and saved curriculum browsing intact during migration.

### Step 3: Build the new phase UIs
- Curriculum Setup:
  detected curriculum, edit panel, approval gate
- Course Planning:
  academic configuration form, term structure UI, AI recommendation review
- Session Planning:
  teaching strategy form, session recommendation review, editable allocation
- Content Generation:
  scope selector, artifact selector, generation actions, progress state
- Assessment & Revision:
  generated outputs list, regenerate controls, revision history/status

### Step 4: Preserve backward compatibility where possible
- Reuse existing extracted curriculum payloads.
- Reuse existing saved curriculum restore until workspace save/restore fully replaces it.
- Keep the current term/session generation endpoints functional until the new workspace endpoints are stable.

## Backend Implementation Plan

### Step 1: Add workspace persistence
- Create a new Mongo model for planning workspaces.
- Store both teacher-authored values and AI recommendations separately where practical.
- Track approval and lock state per phase.

### Step 2: Reuse existing curriculum analysis
- Continue using `/api/analyze-curriculum` for the ingestion pipeline.
- Normalize the saved result into the workspace creation flow.
- Promote existing `normalizedStructure` and `stagedExtraction` data as the source for planning recommendations.

### Step 3: Add recommendation services
- Course planning recommendation:
  assign chapters to terms using curriculum structure, teaching hours, difficulty, and practical load
- Session allocation recommendation:
  estimate sessions per chapter using concept density, outcomes, activities, and assessment needs
- Generation routing:
  route requests based on scope and artifact type

### Step 4: Prompt strategy
- Reuse current prompt files where they already fit.
- Add new prompts only where needed for:
  - academic configuration aware term recommendations
  - session count estimation
  - scoped content generation
  - scoped regeneration

## Testing Plan
- Add backend tests for:
  - workspace creation and persistence
  - curriculum approval enforcement
  - course plan recommendation payload shape
  - session allocation recommendation payload shape
  - generation scope validation
  - regeneration scope isolation
- Add frontend tests for:
  - phase navigation and lock rules
  - restore active workspace
  - approval flow behavior
  - recommendation review and override behavior
  - generation scope selection
- Run regression checks for:
  - current curriculum extraction
  - saved curriculum listing, restore, and delete
  - existing term and session generation paths during transition

## Time Estimate
Assumption: 1 engineer, existing React + Express + Mongo stack, current Ollama integration reused where possible.

### MVP scope
- Foundation refactor and workspace model: 1.5 to 2.5 days
- Curriculum Setup approval flow: 1 to 1.5 days
- Course Planning UI and APIs: 2.5 to 3.5 days
- Session Planning UI and APIs: 2 to 3 days
- Content Generation MVP and regeneration: 2.5 to 3.5 days
- Testing, integration fixes, and polish: 1.5 to 2 days

Estimated MVP total: 11 to 16 working days

### Post-MVP expansion
- Chapter-level and term-level bulk generation: 3 to 5 days
- Course-wide outputs and analytics: 4 to 7 days

Estimated full vision total: 4 to 6 weeks

## Risks
- `src/App.tsx` is currently very large, so UI refactoring may surface hidden state coupling.
- Current backend responses are optimized for the old flow, so compatibility wrappers may be needed during migration.
- Prompt/output shape drift could create instability unless new workspace schemas are strongly validated.
- Scoped regeneration can become brittle if generated artifacts are not stored with enough metadata.

## Defaults And Assumptions
- No auth or multi-user collaboration is added in this phase.
- Mongo remains the persistence layer.
- Existing curriculum extraction remains the ingestion engine.
- The first release prioritizes workflow correctness over a full visual redesign.
- Advanced analytics and complete course-wide reporting are deferred until the five-phase flow is stable.
