# AI Agent Layer — Future Module

## Purpose
An intelligent agent that operates on top of the MedBoard data layer to assist hospital staff with automated insights and task management.

## Planned Capabilities
- **Note Parsing**: Extract structured medical actions from free-text doctor notes
- **Task Extraction**: Automatically identify follow-up tasks (labs, imaging, consultations)
- **Action Suggestions**: Propose prioritized actions for patient care
- **Escalation Detection**: Identify patients needing urgent attention based on data patterns

## Integration Points

### Data Sources (read)
- `GET /api/patients/[id]` — patient details and medical record
- `GET /api/notes` — all notes for analysis
- `GET /api/rooms` — room/ward context

### Actions (write)
- `POST /api/tasks` (future) — create extracted tasks
- `POST /api/alerts` (future) — trigger clinical alerts
- `POST /api/activity` — log agent actions for audit trail

### Schema Extensions
```prisma
// Add to schema.prisma when implementing:

model Task {
  id          String    @id @default(cuid())
  patientId   String
  sourceNoteId String?  // Note that generated this task
  type        String    // "LAB_ORDER" | "IMAGING" | "CONSULT" | "MEDICATION" | "FOLLOW_UP"
  description String
  priority    String    // "URGENT" | "HIGH" | "NORMAL" | "LOW"
  assigneeId  String?
  status      String    @default("PENDING") // "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  dueDate     DateTime?
  aiGenerated Boolean   @default(false)
  confidence  Float?    // AI confidence score
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

## Implementation Notes
- Agent should be non-autonomous: suggest actions, don't auto-execute
- All AI actions must be logged for audit compliance
- Doctor approval required before any clinical task is acted upon
- Consider rate limiting and context window management for LLM calls
