# MedBoard Technical Roadmap (High-Level)

Last updated: 2026-04-18

This document explains MedBoard in simple technical terms:
- What the platform does
- Which stack is used
- How data flows through the system
- What logic exists today
- What the future AI Agent layer will add (not implemented yet)

## 1) What MedBoard Is

MedBoard is a ward-level hospital operations platform.

Its job is to help medical staff:
- See rooms, wards, and patients in one operational view
- Open structured patient profiles
- Manage medical records and doctor/nurse notes
- Enforce role-based access (doctor, nurse, admin, patient, readonly)
- Track all important actions in an activity log

The product is built around 6 backbone pillars:
1. Visibility (live room/floor/ward map)
2. Patient data (clean patient profile)
3. Doctor update flow (record + notes)
4. Permissions (RBAC)
5. Operational status (pending actions/escalation context)
6. Traceability (audit/activity history)

## 2) Stack Overview

## Frontend
- Next.js App Router (React + TypeScript)
- Tailwind CSS for UI styling
- Componentized UI in src/components grouped by domain (dashboard, patient, chat, notes, etc.)

## Backend
- Next.js Route Handlers in src/app/api/**/route.ts
- Prisma ORM for database access
- Zod schemas for API request validation
- JWT cookie session authentication
- Role and permission checks through shared permission utilities
- Shared error helpers for consistent API responses
- Activity logger for auditable state changes

## Database
- SQLite via Prisma datasource
- Core models include User, Patient, Room, Floor, Ward, MedicalRecord, Note, Assignment, ActivityLog, Task, Document, PatientScheduleItem

## 3) Current Platform Logic (How It Works Today)

## A. Authentication and access control
1. User logs in through API
2. Backend validates credentials and issues JWT cookie session
3. Middleware/API reads session for each request
4. Permission checks run in APIs before data access or write
5. Forbidden/unauthorized requests return standardized error responses

## B. Operational dashboard flow
1. Frontend requests rooms/floors/wards and occupancy data
2. Backend returns room context and linked patient assignments
3. Dashboard renders occupancy, status, and quick drill-down links
4. User opens patient profile directly from room-level context

## C. Patient profile and clinical flow
1. Frontend loads patient identity + medical context
2. Backend aggregates demographics, record, notes, assignments, and room info
3. Doctors can create clinical notes (and update record fields where allowed)
4. Nurses can add role-appropriate note types (observation-focused)
5. Every important state change is logged to activity stream

## D. Activity and traceability flow
1. API write actions trigger activity logger
2. Logger stores actor, action, target patient (if relevant), metadata, and timestamp
3. Activity feed UI displays historical events for accountability

## 4) Request/Data Flow Pattern (Technical High-Level)

Most API routes follow this pattern:
1. Receive HTTP request
2. Resolve authenticated session
3. Run RBAC permission check
4. Validate input with Zod safeParse
5. Execute Prisma read/write
6. Log action through activity logger (non-blocking)
7. Return standardized JSON response

This pattern keeps behavior consistent across modules and reduces security/validation drift.

## 5) What Is In Progress (MVP Completion Focus)

Current phase is about hardening and completeness, especially:
- Secure password lifecycle (hashing and safe verification)
- Enforcing env-only secrets (remove fallback secret behavior)
- Login abuse protection and security telemetry
- Making role behavior obvious in UI (not only API)
- Stronger operational dashboard urgency and pending actions model
- Better doctor-first editing experience for records and notes
- Stronger audit trail depth and list API pagination contracts

## 6) Future AI Agent Layer (Planned, Not Implemented Yet)

Source of truth for this section:
- helper.md
- IMPLEMENTATION_PLAN.md

## Safety-first principle
- AI is suggestion-only
- Doctor approval is mandatory before clinical write actions
- Every AI run/suggestion/approval must be auditable

## Planned capabilities
- Note parsing: convert free text to structured actions
- Task extraction: identify labs/imaging/consult/follow-up tasks
- Auto-assignment support: recommend best doctor for intake based on department + workload
- Nurse routing support: recommend best nurse for doctor tickets/tasks
- Schedule suggestion: propose patient schedule items and sync approved items to patient portal
- Escalation detection: highlight urgent cases based on context and confidence

## Planned workflow summary

### Intake and assignment
1. Admin registers patient
2. Agent classifies context and recommends doctor
3. System applies assignment (with rationale snapshot)
4. Doctor receives bot notification
5. Activity log records decision trail

### Diagnostic suggestion flow
1. Doctor uploads diagnostics/documents
2. RAG retrieves patient evidence
3. Gemini generates summary and care suggestions
4. Doctor approves/rejects per item
5. Only approved items are written to record

### Ticket to nurse routing
1. Doctor creates ticket/context
2. Agent structures the task and recommends nurse
3. Doctor approves
4. Task is created and nurse is notified

### Schedule suggestion and portal sync
1. Doctor requests schedule recommendations
2. Agent proposes schedule set
3. Doctor approves full/partial plan
4. Approved items are stored
5. Patient portal shows updated schedule

## Proposed AI technical stack (future)
- Gemini SDK: @google/genai
- RAG orchestration: langchain + @langchain/google-genai
- Vector DB: Qdrant
- Queue/retries for production mode: bullmq + ioredis
- Extraction support: pdf-parse (+ OCR fallback when needed)
- Validation contracts: zod

## 7) Planned AI Architecture (High-Level Components)

1. Agent Orchestrator
- Entry point for AI workflows and policy enforcement

2. RAG Indexing Service
- Builds embeddings from records/notes/documents with metadata

3. Decision Engine
- Combines deterministic constraints with model output scoring

4. Approval Engine
- Stores suggestions and applies only approved outcomes

5. Notification Dispatcher
- Sends doctor/nurse bot notifications in-app

## 8) Full Platform Logic In One Simple View

Today:
- MedBoard is the operational system of record for rooms, patients, records, notes, tasks, and activity tracking.

Tomorrow (with Agent layer):
- MedBoard remains the source of truth.
- AI adds recommendation intelligence on top.
- Humans (especially doctors) stay in control of final clinical actions.

So the platform model is:
- Operational core + clinical workflow control + auditable AI-assisted decision support

## 9) Suggested Reading Order

1. README.md (product backbone and implementation priorities)
2. helper.md (future AI module summary)
3. IMPLEMENTATION_PLAN.md (detailed AI architecture and delivery phases)
4. future/README.md and future/*/README.md (deferred expansion modules)

## 10) Run and Development Commands

- First-time setup (recommended): ./setup.sh
- Alternative setup: make setup
- Start development server: npm run dev (or make dev)
- Build for production: npm run build
- Start production server: npm start
- Lint: npm run lint
- Prisma after schema changes: npx prisma generate && npx prisma db push
- Seed/reset data: npx prisma db seed / make reset

---

If you are a new engineer joining this project, read sections 1, 2, 3, and 4 first. Then jump to section 6 to understand the AI roadmap and approval-first safety model.
