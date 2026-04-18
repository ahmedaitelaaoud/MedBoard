# AI Clinical Agent Implementation Plan (Gemini + RAG)

Last updated: 2026-04-18

## 1) Objective

Build a safe, approval-first AI layer on top of MedBoard that:
- Assigns new patients to the right doctor by department/workload.
- Notifies doctors about new patient intake.
- Converts doctor diagnostics and tickets into structured suggestions/tasks.
- Routes nurse tasks using context-aware matching.
- Suggests patient schedules and syncs approved schedules to patient portal.

Clinical safety policy:
- AI suggests only.
- Doctor approval is mandatory before any clinical write action.
- Every AI action is traceable in audit logs.

## 2) Current Platform Baseline (What we can reuse)

Already available:
- Patient intake and updates via API.
- Staff users with role, specialty, availability fields.
- Assignment, Task, Note, Document, ActivityLog, and PatientScheduleItem models.
- Direct chat and nurse/doctor dashboard task views.
- Patient portal already reads schedule from PatientScheduleItem.

This means the agent layer can be added incrementally without rewriting the core platform.

## 3) Target End-to-End Workflow

### A. Intake and Auto-assignment
1. Admin registers patient with identity details, CNI, and illness/injury context.
2. Agent classifies department and proposes best doctor.
3. System creates/updates assignment.
4. Doctor receives bot notification with patient summary.
5. Activity log stores assignment decision and rationale snapshot.

### B. Diagnostic upload and doctor-facing suggestions
1. Doctor uploads documents (analysis, X-ray report, etc.).
2. RAG pipeline indexes patient context + uploaded evidence.
3. Gemini generates:
- Clinical summary draft
- Diagnostic considerations
- Initial care-plan suggestions
4. Doctor approves/rejects each suggestion item.
5. Approved items are written to medical record and activity feed.

### C. Ticket to nurse routing
1. Doctor creates ticket with patient mention/context.
2. Agent parses ticket intent and extracts task structure.
3. RAG retrieves patient and care context, plus nurse availability/workload.
4. Agent proposes best nurse and clean task description.
5. On approval, task is created and assigned.
6. Nurse dashboard displays the new task and bot notification is sent.

### D. Schedule suggestion and patient portal sync
1. Doctor opens patient profile.
2. Agent suggests schedule items based on diagnosis, notes, and active tasks.
3. Doctor approves full or partial schedule.
4. Approved schedule items are persisted.
5. Patient portal automatically reflects the approved schedule.

## 4) Proposed Architecture

## 4.1 Services

### Agent Orchestrator
- Entry point for all AI workflows.
- Coordinates retrieval, prompting, validation, scoring, approvals, and writes.

### RAG Indexing Service
- Converts notes/documents/records to chunked embeddings.
- Stores vectors with metadata filters (patientId, sourceType, createdAt, department).

### Decision Engine
- Deterministic scoring + LLM output.
- Enforces hard constraints before accepting recommendations.

### Approval Engine
- Persists suggestions with status lifecycle.
- Applies approved suggestions to target entities.

### Notification Dispatcher
- Sends bot notifications to doctor/nurse (in-app + optional chat mirror).

## 4.2 Execution Mode

Phase 1 MVP:
- API-triggered synchronous call for fast feature delivery.

Phase 2 production hardening:
- Queue-based async jobs with retries and dead-letter handling.

Recommended queue stack:
- bullmq + ioredis

## 5) Recommended Libraries

Core AI:
- @google/genai (official Gemini API SDK)
- langchain + @langchain/google-genai (retrieval + chain composition)

Vector database:
- @qdrant/js-client-rest (Qdrant Cloud or self-hosted Qdrant)

Parsing and extraction:
- pdf-parse for PDF text extraction
- tesseract.js for OCR fallback when needed

Validation and contracts:
- zod (already used in platform)

Reliability and observability:
- bullmq + ioredis
- pino for structured logs

Why this stack:
- Aligns with TypeScript/Next.js project.
- Keeps Gemini as LLM provider.
- Keeps RAG implementation explicit and controllable.

## 6) Data Model Changes (Prisma)

## 6.1 Extend existing models

Patient (add):
- cni: String? @unique
- chiefComplaint: String?
- injuryType: String?
- suspectedDepartment: String?
- triageLevel: String? // LOW | MEDIUM | HIGH | CRITICAL

Task (add):
- source: String @default("MANUAL") // MANUAL | AGENT
- sourceSuggestionId: String?
- confidence: Float?
- reasoning: String?

PatientScheduleItem (add):
- createdById: String?
- source: String @default("MANUAL") // MANUAL | AGENT
- approvalSuggestionId: String?

## 6.2 New models

Department:
- id, code, name

DoctorDepartment:
- doctorId, departmentId, priorityWeight

AgentRun:
- id, workflowType, triggerEntityType, triggerEntityId, status
- modelName, promptVersion, latencyMs, tokenInput, tokenOutput
- errorCode, errorMessage, createdAt

AgentSuggestion:
- id, agentRunId, patientId, targetType
- payloadJson, confidence, status
- approvedById, approvedAt, rejectedById, rejectedAt

SuggestionEvidence:
- id, suggestionId, sourceType, sourceId, snippet, score

AgentNotification:
- id, recipientUserId, type, title, message, relatedEntityType, relatedEntityId
- readAt, createdAt

PromptTemplate:
- id, workflowType, version, template, active

Note:
- Optional: add aiSummary field for quick retrieval and embeddings quality

## 7) API and Workflow Contract Changes

## 7.1 New endpoints

POST /api/agent/intake/assign-doctor
- Input: patientId
- Output: recommendation + applied assignment

POST /api/agent/suggestions/diagnostic
- Input: patientId, documentIds[]
- Output: summary/plan suggestion set

POST /api/agent/ticket/route
- Input: patientId, ticketContent
- Output: structured task draft + recommended nurse

POST /api/agent/schedule/suggest
- Input: patientId
- Output: list of suggested schedule items

POST /api/agent/suggestions/:id/approve
- Applies suggestion write action

POST /api/agent/suggestions/:id/reject
- Stores rejection reason

GET /api/agent/suggestions?patientId=...
- Query pending/approved suggestion history

GET /api/notifications
PATCH /api/notifications/:id/read

## 7.2 Existing endpoints to adjust

POST /api/patients:
- Trigger intake assignment workflow when patient is created.

POST /api/tasks:
- Optionally route through ticket interpretation workflow when content is present.

POST /api/documents:
- Trigger document indexing + diagnostic suggestion generation.

GET /api/patient-portal:
- No major change required; approved schedule already appears from PatientScheduleItem.

## 8) Core Decision Logic

## 8.1 Doctor auto-assignment scoring

Input signals:
- Department match (highest weight)
- Doctor availability
- Active patient load
- Current critical-patient load
- Historical continuity (if patient has previous doctor)

Example score:
score = 0.45 * departmentMatch + 0.20 * availability + 0.20 * inverseLoad + 0.10 * continuity + 0.05 * escalationCapacity

Hard constraints:
- Must be active doctor.
- Must belong to required department.
- If unavailable and no fallback doctor, escalate to admin queue.

## 8.2 Nurse routing scoring

Input signals:
- Nurse availability
- Open task count
- Task priority and urgency
- Nurse skill tags (future extension)
- Patient ward proximity (optional)

Hard constraints:
- Must be active nurse.
- Must pass maximum open-task threshold.

## 8.3 Suggestion confidence thresholds

- confidence >= 0.85: auto-draft for quick approval
- 0.65 to 0.84: require careful review banner
- < 0.65: create low-confidence warning and manual-only action

## 9) RAG Pipeline Design

## 9.1 Data sources
- MedicalRecord (diagnosisSummary, medicalHistory, currentPlan)
- Notes timeline
- Document extracted text
- Active tasks and assignments
- Room/ward context

## 9.2 Chunking strategy
- clinical_summary chunks: 400-700 tokens
- notes chunks: by note with optional merge of adjacent notes
- documents chunks: 500 tokens with 80 token overlap

## 9.3 Metadata for filtering
- patientId
- sourceType (record, note, document, task)
- createdAt
- department
- authorRole

## 9.4 Retrieval strategy
1. Filter by patientId first.
2. Retrieve top-k semantic matches (k=8 to 15).
3. Re-rank by recency and source priority.
4. Feed only selected evidence to Gemini.

## 10) Gemini Integration Blueprint

Models:
- gemini-2.5-flash for extraction/classification/routing
- gemini-2.5-pro for higher-complexity clinical synthesis (optional)

Generation contract:
- Force JSON output schema for every agent workflow.
- Validate with zod before any DB write.
- Reject malformed output and retry with fallback prompt.

Required environment variables:
- GEMINI_API_KEY
- GEMINI_MODEL_ROUTER=gemini-2.5-flash
- GEMINI_MODEL_SYNTHESIS=gemini-2.5-flash (or gemini-2.5-pro)
- QDRANT_URL
- QDRANT_API_KEY
- REDIS_URL (if queue mode enabled)

Security rules for API key:
- Store key in environment/secret manager only.
- Never hardcode key in code.
- Never log key or full raw prompts containing sensitive identity fields.

## 11) UI Changes by Role

Doctor UI:
- New "AI Suggestions" panel on patient profile.
- Approve/Reject/Edit controls per suggestion item.
- Ticket composer with "AI routing preview" before final create.

Nurse UI:
- New "Assigned by Agent" badge on tasks.
- Notification center entry for bot-routed tasks.

Admin UI:
- Assignment rationale preview after patient registration.
- Fallback queue when no matching doctor is available.

Patient Portal UI:
- Existing schedule list remains source-of-truth.
- Add "Updated by your care team" timestamp for clarity.

## 12) Safety, Governance, and Audit

Mandatory controls:
- Human approval gate for clinical writes.
- Full audit trail of prompt version, evidence, output, approver.
- PHI minimization in prompts (exclude unnecessary identifiers).
- Timeout + retry policy with deterministic fallback behavior.

Suggested activity log actions to add:
- AGENT_RUN_STARTED
- AGENT_SUGGESTION_CREATED
- AGENT_SUGGESTION_APPROVED
- AGENT_SUGGESTION_REJECTED
- AGENT_AUTO_ASSIGNMENT_APPLIED
- AGENT_NURSE_ROUTING_APPLIED

## 13) Delivery Plan (Phased)

## Phase 0 - Foundation (1 week)
- Add schema migrations for agent models.
- Add environment variable strategy.
- Add base agent service folder structure.
- Add observability and logging contract.

## Phase 1 - Intake Assignment (1 to 1.5 weeks)
- Implement department mapping and doctor scoring.
- Trigger from patient intake route.
- Add doctor notification and activity log.

## Phase 2 - Diagnostic Suggestions (1.5 weeks)
- Document ingestion + RAG indexing.
- Gemini summary and plan suggestion generation.
- Doctor approve/reject UI.

## Phase 3 - Ticket Routing to Nurse (1 week)
- Ticket parsing and structured task generation.
- Nurse recommendation and confidence scoring.
- Task + bot notification dispatch.

## Phase 4 - Schedule Suggestion Sync (1 week)
- Schedule suggestion generation.
- Approval flow and persistence.
- Patient portal sync validation.

## Phase 5 - Hardening and QA (1 week)
- Security review and failure-mode tests.
- Load tests and prompt-cost optimization.
- Rollout flags and gradual release.

Total estimate: 6 to 7 weeks for robust MVP.

## 14) Team Ownership Plan

Product Owner / Clinical Lead:
- Approves clinical rules, escalation policy, and acceptance criteria.

Backend Engineer:
- Prisma migrations, APIs, permissions, workflow orchestration.

AI Engineer:
- RAG pipeline, Gemini prompting, confidence policy, evaluation harness.

Frontend Engineer:
- Suggestion approval UI, notifications, task/schedule experience.

QA Engineer:
- Role-based test matrix, regression tests, edge-case and fallback testing.

DevOps/Platform Engineer (part-time):
- Secret management, queue/vector deployment, monitoring setup.

## 15) Testing Strategy

Unit tests:
- Department classification and assignment scoring.
- Nurse routing scoring and fallback logic.
- Suggestion JSON validation.

Integration tests:
- Patient intake -> assignment -> notification flow.
- Doctor ticket -> nurse task creation flow.
- Doctor approval -> schedule persistence -> patient portal read flow.

Security tests:
- Permission bypass attempts.
- Prompt injection in notes/tickets/documents.
- API key leakage checks in logs.

Clinical safety tests:
- Low-confidence recommendations handled correctly.
- Rejected suggestions do not produce writes.

## 16) Rollout and Risk Control

Feature flags:
- agent_intake_assignment
- agent_diagnostic_suggestions
- agent_ticket_routing
- agent_schedule_suggestions

Rollout approach:
- Start with one ward.
- Measure acceptance rate, override rate, and completion SLA.
- Expand gradually to all departments.

Fallback policy:
- If Gemini or vector DB fails, system remains operational with manual workflow only.
- No task/record writes should fail the core patient route.

## 17) KPIs for Success

- Median doctor assignment time after intake
- Suggestion approval rate by feature
- Nurse task turnaround time
- Reduction in manual ticket rewriting
- Patient schedule freshness in portal
- Agent failure rate and mean recovery time

## 18) Immediate Next Steps (Execution order)

1. Approve data model extensions and API contracts.
2. Implement schema migration and agent suggestion tables.
3. Integrate Gemini SDK and RAG vector store connector.
4. Deliver Intake Assignment workflow behind feature flag.
5. Deliver Diagnostic Suggestion workflow and doctor approval UI.

If you keep this order, each step provides business value while preserving safety and auditability.
