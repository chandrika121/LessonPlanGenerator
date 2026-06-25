# Implementation Progress

## Current Goal
Implement the `plan.md` roadmap in phases, starting with the foundation needed for the five-phase planner:
- persistent planning workspace
- curriculum approval gate
- workspace-aware restore flow
- backend course-planning recommendation entry point

## Completed In This Pass
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
- Passed frontend and backend TypeScript checks:
  - `npm run lint`
  - `npx tsc --noEmit` in `backend/`
  - `npx tsx backend/classNormalization.test.ts`
  - `npm run lint` after Phase 2 UI/backend changes
  - `npx tsc --noEmit` in `backend/` after Phase 2 UI/backend changes

## In Progress
- Phase 1 and the first Phase 2 workflow are ready for manual testing.
- Next implementation target is Phase 3 session-planning workspace state and recommendation endpoints.

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
3. Extend Phase 2 with editable term allocations and deeper academic calendar fields.
4. Add session-planning recommendation state and endpoints.
5. Add content-generation scope selection and revision history.

## Open Risks
- The current UI is still centered on the old 4-step wizard, so the backend foundation is ahead of the frontend flow.
- Existing saved curriculums created before this change may need workspace auto-creation on first reopen.
- Confidence display may need normalization depending on whether the backend stores fractional or whole-number confidence values.
- Phase 2 currently supports saving academic setup, using AI recommendations, and approving the course plan, but it does not yet offer row-level manual editing of term allocations.
- Remaining extractor improvements from the latest review are still open:
  - page references per unit/chapter
  - per-unit confidence scores
  - explicit field-level provenance
  - reducing duplicated `faithful_structure` vs `planning_structure` payload size
