# MedBoard Product Review and Implementation TODO

Last updated: 2026-04-17

This document is the project backbone and delivery checklist.

Target product statement:

We are building a ward-level hospital operations platform where staff can see rooms and patients live, open structured patient files, let doctors manage medical notes, control access by role, track operational status, and keep a traceable activity history.

## Backbone Pillars (Scope Guard)

1. Visibility: live room/floor/ward map
2. Patient data: clean patient profile
3. Doctor update flow: medical record + notes
4. Permissions: role-based access controls
5. Operational status: pending actions and escalation context
6. Traceability: activity log and accountability

If a new feature does not strengthen one of the 6 pillars above, treat it as scope creep.

## Current Requirement Coverage Snapshot

Legend:
- COMPLETE = implemented and usable for MVP
- PARTIAL = implemented but weak/incomplete
- MISSING = not implemented

| Requirement | Current State | Status | Notes |
| --- | --- | --- | --- |
| Login/Auth | Cookie JWT auth, login/logout/me endpoints, route middleware | PARTIAL | Works, but insecure password handling and weak auth hardening |
| Live hospital map | Floor/ward/room dashboard with occupancy and filters | PARTIAL | Strong base, but no real-time updates and limited operational urgency cues |
| Patient profile | Dedicated patient page with demographics, status, room, assignments | PARTIAL | Strong read view, but missing edit workflows and deeper ops context |
| Medical record + notes | Clinical summary + note creation + timeline | PARTIAL | Creation works, but editing/versioning/workflow depth is limited |
| Role permissions | Role matrix + API permission checks in many routes | PARTIAL | Good base, but UX and some policy edges need tightening |
| Operational status/pending actions | Status fields exist for room and patient | PARTIAL | Pending action workflow is mostly missing |
| Activity log/traceability | Action logging and activity page implemented | PARTIAL | Missing key security and audit details |
| Search/filter | Room and patient search/filter available | COMPLETE | Good MVP baseline |

## Already Satisfying Core Requirements (Keep and Refine)

- [x] Basic authentication flow is working (login, session cookie, logout)
- [x] Main dashboard exists with floors/wards/rooms and occupancy context
- [x] Room card allows quick access to patient details
- [x] Patient profile page contains identity, age/sex, allergies, room and assignment data
- [x] Medical record sections exist (diagnosis, history, current plan)
- [x] Timestamped notes are supported with role-aware note-type creation
- [x] Activity feed is implemented and visible
- [x] Search/filter exists on dashboard and patient endpoints

## Phase 1 (MVP Completion) - Active Work

Note: Phase 1 is the only execution focus now. Phase 2 is intentionally deferred.

### [ ] P1-01 Secure password lifecycle (critical)

Description:
Current login compares plaintext passwords, and seeded users are stored in plaintext. This is not acceptable even for a serious MVP demo.

Current gap:
- Passwords in database are plaintext.
- Login uses direct string comparison.

Final acceptable outcome:
- Passwords are hashed at creation/seed time (bcrypt or argon2).
- Login verifies hash safely.
- No plaintext password remains in seed or runtime logic.

Implementation notes:
- Update seed script to hash demo passwords before insert.
- Update auth login route to compare hash.

### [ ] P1-02 Remove secret fallbacks and enforce env-only secrets (critical)

Description:
JWT secrets currently fall back to hardcoded strings. This can silently deploy insecure instances.

Current gap:
- `JWT_SECRET` has code fallback values.
- Auth and middleware should rely on one mandatory secret policy.

Final acceptable outcome:
- App fails fast at startup when `JWT_SECRET` is missing.
- No hardcoded fallback secret in code.
- Same secret strategy used consistently for token creation and verification.

### [ ] P1-03 Add login abuse protection and security telemetry

Description:
Login has no brute-force protection and no failed-attempt traceability.

Current gap:
- No per-email/IP throttling.
- Failed logins are not tracked in activity.

Final acceptable outcome:
- Rate limit login attempts (for example 5 attempts per minute per identity/IP bucket).
- Failed login events are logged.
- API returns explicit 429 when throttled.

### [ ] P1-04 Make role behavior visible in UX, not only in APIs

Description:
Backend checks exist, but navigation and screens should adapt cleanly per role.

Current gap:
- Some pages are visible in navigation even when API will deny access.
- UX can feel broken for low-permission users.

Final acceptable outcome:
- Sidebar and page actions are filtered by role permissions.
- Read-only users only see allowed areas.
- Forbidden paths show clear message and recovery path.

### [ ] P1-05 Strengthen live map as primary product screen

Description:
Dashboard is the platform identity and needs stronger operational clarity.

Current gap:
- Dashboard works but urgency is not visually strong enough.
- No explicit operational queue context from map view.

Final acceptable outcome:
- Critical rooms/patients are visually unmistakable.
- Room card includes a clear at-a-glance set: occupancy, patient identity, status, assigned staff.
- Quick navigation from map to patient profile remains one-click.

### [ ] P1-06 Add operational pending actions model and UI

Description:
Status exists, but pending action workflows (lab, scan, transport, follow-up, escalation) are mostly absent.

Current gap:
- No dedicated structure for pending tasks per patient/room.
- No queue or badges for pending operational actions.

Final acceptable outcome:
- Introduce pending action entities (type, priority, state, owner, due time).
- Show pending actions on patient profile and in dashboard summary.
- Include an urgent escalation flag visible in both map and patient page.

### [ ] P1-07 Deliver doctor-first medical record editing flow

Description:
Clinical summary is readable, but update flow should be first-class for doctor role.

Current gap:
- Record updates exist via API but no dedicated record editor in patient UI.

Final acceptable outcome:
- Doctors can edit diagnosis summary, medical history, and current plan in the patient page.
- Non-doctors only read these fields.
- Validation and error states are visible in UI.

### [ ] P1-08 Complete note lifecycle (create + edit UX with ownership)

Description:
Note creation exists, but edit workflow and history handling are not complete from product perspective.

Current gap:
- Doctors can edit notes via API but no clear edit UX.
- Timeline truncates and does not provide stronger note management controls.

Final acceptable outcome:
- Author doctor can edit own notes from UI.
- Timeline supports full history view (not only first items).
- Role rules are obvious in UI (nurse observation-only creation).

### [ ] P1-09 Add patient-room movement trace and assignment events

Description:
Current patient-to-room link is snapshot style and weak for operational traceability.

Current gap:
- No explicit room transfer history model.
- Assignment changes are not represented as first-class workflow events.

Final acceptable outcome:
- Add room assignment history (patient, room, from, to).
- Log transfer and assignment changes with clear actor/timestamp.
- Show latest transfer context on patient profile.

### [ ] P1-10 Expand activity log into real audit trail

Description:
Activity feed exists, but compliance-grade traceability is incomplete.

Current gap:
- Missing security events (failed login, denied actions).
- Metadata is stringified and harder to query.
- Feed has limited filtering and browsing depth.

Final acceptable outcome:
- Security events included in activity stream.
- Structured metadata shape for easier filtering.
- Activity API and UI support pagination and filters (action/user/date).

### [ ] P1-11 Align patient profile with final acceptance checklist

Description:
Profile is strong but should become fully reliable as pillar 2 deliverable.

Current gap:
- History/attachments are still placeholder-level.
- Some clinical/operational details are visible but not workflow-connected.

Final acceptable outcome:
- Patient page always includes: identity/MRN, age/sex/allergies, diagnosis summary, current condition, room/ward/floor, assigned doctor/nurse, recent notes, attachments section.
- Attachments section at least supports realistic placeholder states and clear next workflow actions.

### [ ] P1-12 Add pagination and response contracts on list APIs

Description:
As data grows, unbounded list APIs create performance and UX issues.

Current gap:
- Some list endpoints return broad datasets with limited controls.

Final acceptable outcome:
- Standardize `limit`, `offset` (or cursor), and `totalCount` for list APIs.
- Apply to patients, activity, staff, and room list usage where applicable.
- Frontend supports incremental loading patterns.

### [ ] P1-13 Resolve consistency and polish issues in login/auth UX

Description:
Login page works and looks better now, but needs final cleanup for production-like MVP behavior.

Current gap:
- Minor content/label inconsistencies remain.
- Demo-account section should be clean and intentional.

Final acceptable outcome:
- Login copy and helper text are complete and project-aligned.
- Error handling feels deliberate (clear messages and no empty labels).
- Auth entry experience is consistent with the rest of the platform style.

### [ ] P1-14 Add quality gates for permissions and workflows

Description:
Critical authorization and workflow rules should be protected with tests to avoid regressions.

Current gap:
- No explicit automated tests protecting role behavior and data access boundaries.

Final acceptable outcome:
- Add API tests for role permissions across key routes.
- Add tests for note-type role restrictions and record-write constraints.
- Add tests for auth failure paths and middleware protected routes.

## Phase 2 (Deferred Backlog) - Not In Current Execution Scope

Phase 2 items are intentionally parked until Phase 1 is fully complete.

### [ ] P2-01 Real-time dashboard updates (WebSocket/SSE)
- Final acceptable outcome: map and activity feed update without manual refresh.

### [ ] P2-02 Alerts and escalation engine
- Final acceptable outcome: critical and overdue pending actions trigger configurable alerts.

### [ ] P2-03 Shift handoff workflow
- Final acceptable outcome: outgoing/incoming staff handoff is structured and logged.

### [ ] P2-04 Ward/department scoped permissions
- Final acceptable outcome: access can be constrained by organizational scope, not global role only.

### [ ] P2-05 Rich document management
- Final acceptable outcome: upload/download/tagging/versioning for patient documents.

### [ ] P2-06 Clinical workflow expansions (labs/imaging/transport)
- Final acceptable outcome: pending actions connect to concrete workflow entities and statuses.

### [ ] P2-07 Integration foundations (FHIR/HL7 stubs)
- Final acceptable outcome: clear adapter layer for future hospital-system integrations.

### [ ] P2-08 Advanced search and saved views
- Final acceptable outcome: richer search operators and saved operational filters.

### [ ] P2-09 Compliance lifecycle for audit logs
- Final acceptable outcome: retention, archival, and export policy for audit data.

### [ ] P2-10 Operational optimization extensions
- Final acceptable outcome: workload balancing, transfer optimization, and recommendation tooling.

## Phase 1 Exit Criteria (Definition of Acceptable MVP)

Phase 1 is complete only when all points below are true:

- Authentication is secure enough for MVP (hashed passwords, no fallback secrets, throttled login).
- Dashboard is reliable as the core operational screen with clear critical visibility.
- Patient profile is complete and consistently structured.
- Doctors can manage record updates and notes through clear UI workflows.
- Role permissions are enforced at API and reflected in UI behavior.
- Operational pending actions are visible and actionable.
- Activity log captures clinically and operationally important events with queryable detail.
- Search/filter and list navigation are usable at realistic data volume.

## Working Rule For New Ideas

Before accepting any new scope, ask:

Does this directly improve one of the 6 backbone pillars?

If not, move it to deferred backlog.

## Phase UI (Professional Product Polish) - Design Execution Layer

Purpose:
This phase upgrades presentation quality across the whole platform without changing the backend scope. The goal is a clean, white-first, professional interface that looks intentional and product-grade, not auto-generated.

### [ ] UI-01 Build one coherent visual system across all screens

Description:
The interface should feel like one product family, not separate pages with separate styling decisions.

Final acceptable outcome:
- Single design language for spacing, borders, radius, shadows, typography, and states.
- Shared components are the source of truth for visual style.
- No page-specific ad-hoc styles that conflict with system primitives.

### [ ] UI-02 Improve information hierarchy and page framing

Description:
Users should immediately understand what is primary, secondary, and actionable on each screen.

Final acceptable outcome:
- Every page has a clear section hierarchy (title, context, controls, content).
- Header, filters, and content blocks use consistent vertical rhythm.
- Critical statuses are visually obvious without noise.

### [ ] UI-03 Professionalize control styling and states

Description:
Inputs, selects, search, buttons, and toggles should feel polished and consistent in all states.

Final acceptable outcome:
- Hover, focus, active, disabled, and error states are all deliberate and consistent.
- Form controls align in height and visual weight.
- Color contrast is strong enough for practical clinical use.

### [ ] UI-04 Upgrade navigation experience and role clarity

Description:
Navigation should feel stable, readable, and confidence-inspiring.

Final acceptable outcome:
- Sidebar active states are obvious and elegant.
- Topbar reflects context clearly.
- High-risk actions (like sign out) are visually distinct and safe.

### [ ] UI-05 Clean dashboard composition for operations readability

Description:
Dashboard is the identity screen and must be highly scannable under pressure.

Final acceptable outcome:
- Summary metrics, filters, and room grid read in a natural sequence.
- Room cards are compact but readable, with clear occupancy and assignment context.
- Empty/loading states are polished and informative.

### [ ] UI-06 Refine patient page for clinical reading flow

Description:
Patient page should prioritize fast clinical comprehension.

Final acceptable outcome:
- Header, demographics, clinical summary, notes, and documents are visually balanced.
- Text blocks are readable with controlled line lengths and spacing.
- Breadcrumb/context area is clear and unobtrusive.

### [ ] UI-07 Replace generic visual patterns that feel auto-generated

Description:
Remove common low-quality design signals (random emoji, inconsistent chips, uneven paddings).

Final acceptable outcome:
- Icons, badges, and feedback elements use a coherent style.
- No decorative elements that reduce professionalism.
- Components feel designed, not assembled from defaults.

### [ ] UI-08 Add subtle brand warmth while keeping white-first simplicity

Description:
The interface should stay clean and mostly white, with restrained accent color usage.

Final acceptable outcome:
- Accent color is used intentionally for emphasis and focus only.
- White/surface layers remain dominant.
- The app feels calm, not flat or sterile.

### [ ] UI-09 Ensure responsive quality on real laptop and mobile widths

Description:
Polish should survive breakpoints, not only desktop snapshots.

Final acceptable outcome:
- Filters, cards, tables/lists, and navigation remain clean on narrow screens.
- No cramped controls or clipped labels.
- Core workflows stay usable without horizontal scrolling.

### [ ] UI-10 Define final visual acceptance checklist before release

Description:
UI quality must be testable with clear acceptance criteria, not subjective opinions.

Final acceptable outcome:
- Team has a short visual QA checklist for all primary screens.
- Checklist includes consistency, alignment, spacing, contrast, and interaction states.
- MVP release requires passing this checklist.
