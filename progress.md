# Implementation Progress

## Current Goal
Implement the `plan.md` roadmap in phases, with the current focus expanded to Phase 4 artifact-specific generation quality:
- persistent planning workspace
- curriculum approval gate
- workspace-aware restore flow
- backend course-planning recommendation entry point
- dedicated homework and PPT generation flows with frontend rendering

## Completed In This Pass
- Implemented dedicated homework generation support:
  - added `backend/prompts/homework-generation.md` using the structured homework prompt contract
  - routed homework-only regeneration through its own backend prompt path
  - expanded homework schema/types/rendering so structured homework tasks, marks, timing, LO coverage, and summary data display in the UI
  - surfaced homework content inside the session notes area so it is visible in the generated lesson pack
- Implemented dedicated PPT generation support:
  - added `backend/prompts/session-ppt-prompt.md` for session-faithful classroom PPT generation
  - routed PPT-only regeneration through a dedicated backend prompt path instead of the generic session prompt
  - expanded `materials.ppt` into a full slide-spec contract with speaker notes, visual plan, assets, SVG diagrams, attribution, coverage summary, and license checklist
  - updated the PPT tab to render both the new full-slide schema and legacy `slideTitle + bulletPoints` payloads
  - added PPT export scaffolding in `scripts/export-session-ppt.mjs`
  - added backend PPT normalization and asset hydration so legacy saved sessions are enriched with slide assets and reusable image metadata on workspace load
  - fixed PPT normalization during generation by awaiting async asset enrichment before the session payload is returned
- Added shared planning workspace types in `src/types.ts`.
- Added Mongo persistence model in `backend/models/PlanningWorkspace.ts`.
- Added backend workspace endpoints in `backend/server.ts`:
  - `GET /api/planning-workspaces/:id`
  - `GET /api/planning-workspaces/by-curriculum/:curriculumId`
  - `POST /api/planning-workspaces`
  - `PATCH /api/planning-workspaces/:id`
  - `POST /api/planning-workspaces/:id/approve-curriculum`
  - `POST /api/planning-workspaces/:id/recommend-course-plan`
- Updated curriculum analysis to auto-create a planning workspace and return it with the analyze response.
- Updated curriculum delete flow to remove attached planning workspaces.
- Updated frontend Step 1 to:
  - store `workspaceId`
  - restore the workspace when a curriculum is reopened
  - show planning workspace status
  - require curriculum approval before term generation
- Rewired Step 1 term generation to use the new workspace-aware `recommend-course-plan` backend flow instead of the legacy direct term split request.
- Added curriculum edit persistence:
  - `PATCH /api/curriculums/:id`
  - saves edited JSON back to Mongo
  - resyncs the planning workspace snapshot
  - resets approval and downstream planning state when the curriculum changes
- Completed the Phase 1 review UI:
  - extraction summary cards
  - review checklist
  - approval-first flow
  - explicit warning that manual edits reset approval
- Updated frontend entry behavior so the app opens directly into Phase 1 for testing, and reopening a saved curriculum also returns to Phase 1.
- Hardened curriculum extraction quality in `backend/server.ts`:
  - normalized `Class IX` and `Class X` correctly in addition to XI/XII
  - pruned Stage 3 topics, subtopics, and key concepts back to source-faithful items
  - made normalized/output unit IDs globally unique instead of reusing `U1`, `U2`, etc. across sections
  - stripped parser-only labels such as `Implicit from context` from user-facing names
  - converted fallback/internal warning text into teacher-safe messages
  - removed duplicate `key_concepts` entries when they simply repeat topics
  - added Stage 6 competency extraction fallback so truncation now retries with smaller class-scoped prompts instead of failing the full curriculum run immediately
- Added regression coverage for:
  - IX/X class normalization
  - source-faithful topic pruning
  - globally unique normalized unit IDs
- Fixed Phase 1 curriculum review/dashboard aggregation in `src/App.tsx`:
  - counts now prefer the normalized canonical unit tree instead of empty top-level placeholder arrays
  - topics, subtopics, objectives, practicals, and checklist completion now derive from the populated normalized curriculum hierarchy
  - the review card `Units` stat now uses the same canonical unit count source for consistency
- Implemented the first Phase 2 course-planning workflow:
  - added academic configuration draft state and workspace sync in `src/App.tsx`
  - Step 2 now restores from persisted `termPlan.allocations` or `termPlan.recommendations`
  - added academic setup form fields for year, school, board, medium, language, class, section, book, periods, working days, and preferred term count
  - saving academic configuration now persists through `PATCH /api/planning-workspaces/:id`
  - generating course plans now saves academic config first and calls `recommend-course-plan` with `preferredTermCount`
  - added “Use Recommendations” flow to persist recommended term allocations as the active course plan
  - added explicit course-plan approval backend endpoint:
    - `POST /api/planning-workspaces/:id/approve-course-plan`
    - validates curriculum approval, academic setup presence, and saved allocations
    - advances the workspace to `session_planning`
  - Step 3 is now gated behind approved Phase 2 course planning instead of just any selected term
- Extended Phase 2 into an editable course-planning workspace:
  - added deeper academic calendar inputs for lab periods, revision weeks, buffer weeks, holiday calendar, exam dates, school events, and special days
  - added a manual term-allocation editor for class, term name/number, chapters, marks, estimated sessions, and reasoning
  - added draft editing actions to add/remove term allocations, reset draft allocations back to AI recommendations, and save edited allocations back to the planning workspace
  - kept the review table in sync with the editable allocation draft so Phase 2 reflects teacher edits before approval
- Passed frontend and backend TypeScript checks:
  - `npm run lint`
  - `npx tsc --noEmit` in `backend/`
  - `npx tsx backend/classNormalization.test.ts`
  - `npm run lint` after Phase 2 UI/backend changes
  - `npx tsc --noEmit` in `backend/` after Phase 2 UI/backend changes
  - `npm run lint` after editable Phase 2 workflow changes
  - `npx tsc --noEmit` in `backend/` after editable Phase 2 workflow changes

## In Progress
- Phase 1 and the full editable Phase 2 workflow are ready for manual testing.
- Next implementation target is Phase 3 session-planning workspace state and recommendation endpoints.
- Session content generation now has dedicated prompt paths for:
  - `teacherLessonNotes`
  - `studentLessonNotes`
  - `homework`
  - `materials` when regenerating PPT-only content
- Remaining content subtasks still on the generic session prompt:
  - `assessment`
  - `assignment`
  - `theory`
  - `activities`

## Current Test Access
- Frontend for Phase 1 is currently reachable at `http://localhost:4174/`.
- Backend health is responding on `http://127.0.0.1:3002/api/health`.
- The app now opens directly into Phase 1 by default.

## Next Steps
1. Manual test Phase 1:
   - analyze a curriculum
   - confirm workspace is created
   - edit JSON and save
   - verify approval resets after edits
   - approve curriculum
   - generate term recommendations only after approval
   - reopen the saved curriculum and verify workspace restore
2. Add Phase 2 course-planning UI backed by `recommend-course-plan`.
3. Manually test the editable Phase 2 flow:
   - save extended academic calendar fields
   - generate recommendations
   - edit term allocations
   - save edited allocations
   - approve the course plan and confirm Step 3 unlocks
4. Add Phase 3 session-planning recommendation state and endpoints.
5. Extend prompt specialization to remaining subtasks:
   - assessment
   - assignment
   - theory / lesson core
   - activities
6. Finish productionizing PPT export:
   - ensure resolved asset images are embedded consistently in the downloaded PPTX
   - validate Openverse/Wikimedia asset fetch reliability
   - align generated deck visuals more closely to the reference `Cell.pptx`
7. Add content-generation scope selection and revision history.

## Open Risks
- The current UI is still centered on the old 4-step wizard, so the backend foundation is ahead of the frontend flow.
- Existing saved curriculums created before this change may need workspace auto-creation on first reopen.
- Confidence display may need normalization depending on whether the backend stores fractional or whole-number confidence values.
- PPT asset resolution still depends on live reusable-image lookup:
  - if Openverse/Wikimedia do not resolve a strong match, the system falls back to visual plans and SVG instructions
  - downloaded PPT exports still need deeper verification that remote image embedding succeeds across all generated sessions
- Remaining extractor improvements from the latest review are still open:
  - page references per unit/chapter
  - per-unit confidence scores
  - explicit field-level provenance
  - reducing duplicated `faithful_structure` vs `planning_structure` payload size
