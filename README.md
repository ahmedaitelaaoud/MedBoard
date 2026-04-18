# MedBoard Technical Roadmap (High-Level)

Last updated: 2026-04-18

## Quick Start (Simple Setup)

If someone installs this project for the first time, follow these steps:

1. Clone and enter the project folder.
2. Run initial setup:
  - Preferred: `./setup.sh`
  - Alternative: `make setup`
3. Create your local environment file:
  - `cp .env.example .env`
  - Fill in at least:
    - `JWT_SECRET`
    - `GEMINI_API_KEY`
4. Prepare database and Prisma client:
  - `host-spawn env PATH="/goinfre/$USER/node/bin:$PATH" npx prisma generate`
  - `host-spawn env PATH="/goinfre/$USER/node/bin:$PATH" npx prisma db push`
  - Optional demo data: `host-spawn env PATH="/goinfre/$USER/node/bin:$PATH" npx prisma db seed`
5. Start the development server:
  - `host-spawn env PATH="/goinfre/$USER/node/bin:$PATH" npm run dev`
6. Open the app:
  - `http://localhost:3000`

Notes:
- On some cluster machines, npm is not in PATH by default; use `host-spawn env PATH="/goinfre/$USER/node/bin:$PATH" ...`.
- Do not commit `.env` or any real API keys.

This document explains MedBoard in simple technical terms:
- What the platform does
- Which stack is used
- How data flows through the system
- What logic exists today
- What the future AI Agent layer will add (not implemented yet)

---

## 1) What MedBoard Is

MedBoard is a ward-level hospital operations platform.

Its job is to help medical staff:
- See rooms, wards, and patients in one operational view
- Open structured patient profiles
- Manage medical records and doctor/nurse notes
- Enforce role-based access (doctor, nurse, admin, patient, readonly)
- Track all important actions in an activity log

The product is built around 6 backbone pillars:

```
┌─────────────────────────────────────────────────────────────────┐
│                     MEDBOARD — 6 PILLARS                        │
├───────────────┬───────────────┬───────────────┬─────────────────┤
│  1. VISIBILITY│  2. PATIENT   │  3. DOCTOR    │  4. PERMISSIONS │
│               │     DATA      │    UPDATES    │                 │
│  Live room /  │  Clean patient│  Record +     │  RBAC: doctor,  │
│  floor / ward │  profile      │  notes flow   │  nurse, admin,  │
│  map          │               │               │  patient, ro    │
├───────────────┴───────────────┼───────────────┴─────────────────┤
│      5. OPERATIONAL STATUS    │       6. TRACEABILITY           │
│                               │                                 │
│  Pending actions / escalation │  Audit log / activity history   │
│  context                      │                                 │
└───────────────────────────────┴─────────────────────────────────┘
```

---

## 2) Stack Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        FULL STACK                                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                       FRONTEND                             │  │
│  │                                                            │  │
│  │   Next.js App Router (React + TypeScript)                  │  │
│  │   Tailwind CSS                                             │  │
│  │   /src/components/  →  dashboard / patient / chat /        │  │
│  │                         notes / ...                        │  │
│  └───────────────────────────┬────────────────────────────────┘  │
│                              │  HTTP / fetch                     │
│  ┌───────────────────────────▼────────────────────────────────┐  │
│  │                       BACKEND                              │  │
│  │                                                            │  │
│  │   Next.js Route Handlers  →  /src/app/api/**/route.ts      │  │
│  │   Zod schemas             →  request validation            │  │
│  │   JWT cookie session      →  authentication                │  │
│  │   RBAC utilities          →  permission checks             │  │
│  │   Activity Logger         →  audit trail                   │  │
│  │   Error helpers           →  consistent responses          │  │
│  └───────────────────────────┬────────────────────────────────┘  │
│                              │  Prisma ORM                      │
│  ┌───────────────────────────▼────────────────────────────────┐  │
│  │                      DATABASE                              │  │
│  │                                                            │  │
│  │   SQLite via Prisma                                        │  │
│  │                                                            │  │
│  │   User · Patient · Room · Floor · Ward                     │  │
│  │   MedicalRecord · Note · Assignment · ActivityLog          │  │
│  │   Task · Document · PatientScheduleItem                    │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3) Current Platform Logic (How It Works Today)

### A. Authentication and Access Control

```
  Client
    │
    │  POST /api/auth/login
    ▼
┌─────────────┐     invalid      ┌──────────────────┐
│  Validate   │ ───────────────► │  401 Unauthorized │
│ Credentials │                  └──────────────────┘
└──────┬──────┘
       │ valid
       ▼
┌─────────────┐
│  Issue JWT  │
│Cookie Session│
└──────┬──────┘
       │
       ▼
  Subsequent Requests
       │
       ├──► Read session from cookie
       │
       ├──► Run RBAC permission check
       │           │ forbidden
       │           └──────────────► 403 Forbidden
       │           │ allowed
       └──────────►▼
              Proceed to API logic
```

### B. Operational Dashboard Flow

```
  Browser
    │
    │  GET /api/rooms + /api/wards
    ▼
┌──────────────────────┐
│   Backend resolves   │
│  room / floor / ward │
│  occupancy data      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Link patient        │
│  assignments to      │
│  rooms               │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────┐
│          Dashboard renders           │
│                                      │
│  [Room A]  [Room B]  [Room C]  ...   │
│  occupied  empty     occupied        │
│     │                   │            │
│     └──► drill-down     └──► drill   │
│          patient              patient│
└──────────────────────────────────────┘
```

### C. Patient Profile and Clinical Flow

```
  Doctor / Nurse opens patient
         │
         ▼
┌────────────────────────┐
│  Load patient identity │
│  + medical context     │
└──────────┬─────────────┘
           │  Prisma aggregation
           ▼
┌──────────────────────────────────────────────────┐
│  demographics + record + notes + assignments     │
│  + room info                                     │
└──────────┬───────────────────────────────────────┘
           │
           ├──────────────────────────────────────────┐
           ▼  (Doctor)                                 ▼  (Nurse)
  ┌──────────────────┐                     ┌──────────────────────┐
  │  Create / update │                     │  Add observation     │
  │  clinical notes  │                     │  notes (role-scoped) │
  │  + record fields │                     └──────────┬───────────┘
  └──────────┬───────┘                                │
             └─────────────────┬──────────────────────┘
                               ▼
                   ┌──────────────────────┐
                   │   Activity Logger    │
                   │  actor + action +    │
                   │  patient + timestamp │
                   └──────────────────────┘
```

### D. Activity and Traceability Flow

```
  API write action triggered
         │
         ▼
┌────────────────────────────────┐
│       Activity Logger          │
│                                │
│  actor    →  who did it        │
│  action   →  what happened     │
│  target   →  which patient     │
│  metadata →  contextual detail │
│  timestamp→  when              │
└──────────────┬─────────────────┘
               │  stored to ActivityLog table
               ▼
┌────────────────────────────────┐
│      Activity Feed UI          │
│                                │
│  [09:12]  Dr. Smith updated    │
│           record for P-042     │
│  [09:08]  Nurse Lee added obs. │
│           note for P-019       │
│  [08:55]  Admin assigned       │
│           patient to Room 3B   │
└────────────────────────────────┘
```

---

## 4) Request/Data Flow Pattern (Technical High-Level)

Every API route follows this consistent pipeline:

```
  Incoming HTTP Request
         │
         ▼
  ┌─────────────────┐
  │  1. Receive     │  Parse method, path, body
  │     Request     │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  2. Resolve     │  Read JWT cookie → identify user
  │     Session     │
  └────────┬────────┘     ┌──────────────────┐
           │  no session  │  401 Unauthorized │
           ├─────────────►│                  │
           │              └──────────────────┘
           ▼
  ┌─────────────────┐
  │  3. RBAC        │  Check role + permission map
  │  Permission     │
  │  Check          │
  └────────┬────────┘     ┌──────────────────┐
           │  forbidden   │  403 Forbidden    │
           ├─────────────►│                  │
           │              └──────────────────┘
           ▼
  ┌─────────────────┐
  │  4. Zod Input   │  safeParse request body / query
  │  Validation     │
  └────────┬────────┘     ┌──────────────────┐
           │  invalid     │  400 Bad Request  │
           ├─────────────►│                  │
           │              └──────────────────┘
           ▼
  ┌─────────────────┐
  │  5. Prisma      │  Read or write to SQLite
  │  Read / Write   │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  6. Activity    │  Non-blocking log entry
  │  Logger         │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  7. Return      │  Standardized JSON response
  │  Response       │
  └─────────────────┘
```

---

## 5) What Is In Progress (MVP Completion Focus)

Current phase is about hardening and completeness, especially:
- Secure password lifecycle (hashing and safe verification)
- Enforcing env-only secrets (remove fallback secret behavior)
- Login abuse protection and security telemetry
- Making role behavior obvious in UI (not only API)
- Stronger operational dashboard urgency and pending actions model
- Better doctor-first editing experience for records and notes
- Stronger audit trail depth and list API pagination contracts

---

## 6) Future AI Agent Layer (Planned, Not Implemented Yet)

Source of truth for this section:
- helper.md
- IMPLEMENTATION_PLAN.md

### Safety-first principle
- AI is suggestion-only
- Doctor approval is mandatory before clinical write actions
- Every AI run/suggestion/approval must be auditable

### Planned capabilities
- Note parsing: convert free text to structured actions
- Task extraction: identify labs/imaging/consult/follow-up tasks
- Auto-assignment support: recommend best doctor for intake based on department + workload
- Nurse routing support: recommend best nurse for doctor tickets/tasks
- Schedule suggestion: propose patient schedule items and sync approved items to patient portal
- Escalation detection: highlight urgent cases based on context and confidence

---

### Planned workflow summary

#### Intake and Assignment

```
  Admin registers patient
         │
         ▼
┌────────────────────────┐
│  Agent classifies      │
│  context               │
│  (dept, urgency, etc.) │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  Recommend best        │
│  doctor                │
│  (dept + workload)     │
└──────────┬─────────────┘
           │  suggestion
           ▼
┌────────────────────────┐       ┌──────────────────────┐
│  System applies        │       │  Activity Log records │
│  assignment with       │──────►│  full decision trail  │
│  rationale snapshot    │       │  (AI + human steps)   │
└──────────┬─────────────┘       └──────────────────────┘
           │
           ▼
  Doctor receives bot notification
```

#### Diagnostic Suggestion Flow

```
  Doctor uploads diagnostics / documents
         │
         ▼
┌────────────────────────┐
│   RAG Indexing         │
│   Service              │
│   builds embeddings    │
│   from records/notes   │
└──────────┬─────────────┘
           │  vector search
           ▼
┌────────────────────────┐
│   Qdrant Vector DB     │
│   retrieves relevant   │
│   patient evidence     │
└──────────┬─────────────┘
           │  retrieved context
           ▼
┌────────────────────────┐
│   Gemini LLM           │
│   generates summary    │
│   + care suggestions   │
└──────────┬─────────────┘
           │  suggestion list
           ▼
┌───────────────────────────────────────────┐
│  Doctor reviews each suggestion           │
│                                           │
│   [✓] Approve  →  written to record       │
│   [✗] Reject   →  discarded + logged      │
└───────────────────────────────────────────┘
```

#### Ticket to Nurse Routing

```
  Doctor creates ticket / context
         │
         ▼
┌────────────────────────┐
│  Agent structures task │
│  + recommends best     │
│  nurse (workload-aware)│
└──────────┬─────────────┘
           │  proposal
           ▼
┌────────────────────────┐
│  Doctor approves       │◄─── reject → agent revises
└──────────┬─────────────┘
           │ approved
           ▼
┌────────────────────────┐
│  Task created          │
│  Nurse notified        │
└────────────────────────┘
```

#### Schedule Suggestion and Portal Sync

```
  Doctor requests schedule recommendations
         │
         ▼
┌────────────────────────┐
│  Agent proposes        │
│  schedule set          │
└──────────┬─────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Doctor reviews proposed items      │
│                                     │
│  [Full approve]  [Partial approve]  │
└──────────┬──────────────────────────┘
           │ approved items
           ▼
┌────────────────────────┐
│  Stored to DB          │
│  PatientScheduleItem   │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│  Patient Portal shows  │
│  updated schedule      │
└────────────────────────┘
```

### Proposed AI technical stack (future)

```
┌────────────────────────────────────────────────────────────┐
│                   AI LAYER — TECH STACK                    │
│                                                            │
│   LLM            →   Gemini SDK (@google/genai)            │
│   RAG            →   LangChain + @langchain/google-genai   │
│   Vector DB      →   Qdrant                                │
│   Queue/Retries  →   BullMQ + ioredis                      │
│   PDF extract    →   pdf-parse (+ OCR fallback)            │
│   Validation     →   Zod                                   │
└────────────────────────────────────────────────────────────┘
```

---

## 7) Planned AI Architecture (High-Level Components)

```
  Incoming AI Workflow Request
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                    Agent Orchestrator                        │
│         Entry point · policy enforcement · routing           │
└───────┬──────────────┬──────────────────┬────────────────────┘
        │              │                  │
        ▼              ▼                  ▼
┌──────────────┐ ┌──────────────┐ ┌─────────────────┐
│ RAG Indexing │ │  Decision    │ │   Approval      │
│   Service    │ │  Engine      │ │   Engine        │
│              │ │              │ │                 │
│ Builds       │ │ Deterministic│ │ Stores          │
│ embeddings   │ │ constraints  │ │ suggestions     │
│ from records,│ │ + model      │ │ Applies only    │
│ notes, docs  │ │ output       │ │ approved items  │
│              │ │ scoring      │ │                 │
└──────┬───────┘ └──────┬───────┘ └────────┬────────┘
       │                │                  │
       │    ┌───────────┘                  │
       ▼    ▼                              ▼
  ┌──────────────┐               ┌──────────────────┐
  │  Qdrant      │               │  Notification    │
  │  Vector DB   │               │  Dispatcher      │
  │              │               │                  │
  │  Stores +    │               │  Sends in-app    │
  │  retrieves   │               │  bot alerts to   │
  │  embeddings  │               │  doctor / nurse  │
  └──────────────┘               └──────────────────┘
```

---

## 8) Full Platform Logic In One Simple View

```
┌──────────────────────────────────────────────────────────────────┐
│                        TODAY                                     │
│                                                                  │
│   Rooms ──► Floors ──► Wards ──► Patients ──► Records           │
│                                      │                           │
│                              Notes / Tasks / Docs                │
│                                      │                           │
│                              Activity Log (full audit)           │
│                                                                  │
│   MedBoard is the operational system of record.                  │
└──────────────────────────────────────────────────────────────────┘

                              +
                              │ (future)
                              ▼

┌──────────────────────────────────────────────────────────────────┐
│                     TOMORROW (with AI)                           │
│                                                                  │
│   Same operational core                                          │
│         │                                                        │
│         ▼                                                        │
│   AI Agent Layer  (suggestion only — never direct writes)        │
│         │                                                        │
│         ▼                                                        │
│   Doctor / Human approval gate  ◄──── mandatory                  │
│         │                                                        │
│         ▼                                                        │
│   Approved outcome written to MedBoard + logged                  │
│                                                                  │
│   Model:  Operational core                                       │
│         + Clinical workflow control                              │
│         + Auditable AI-assisted decision support                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9) Suggested Reading Order

1. README.md (product backbone and implementation priorities)
2. helper.md (future AI module summary)
3. IMPLEMENTATION_PLAN.md (detailed AI architecture and delivery phases)
4. future/README.md and future/*/README.md (deferred expansion modules)

---

## 10) Run and Development Commands

- First-time setup (recommended): `./setup.sh`
- Alternative setup: `make setup`
- Start development server: `npm run dev` (or `make dev`)
- Build for production: `npm run build`
- Start production server: `npm start`
- Lint: `npm run lint`
- Prisma after schema changes: `npx prisma generate && npx prisma db push`
- Seed/reset data: `npx prisma db seed` / `make reset`

---

If you are a new engineer joining this project, read sections 1, 2, 3, and 4 first. Then jump to section 6 to understand the AI roadmap and approval-first safety model.
