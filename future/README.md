# Future Extensions — MedBoard

This directory contains placeholder modules for future capabilities that will be layered on top of the base operational platform.

## Planned Modules

### `/agents` — AI Agent Layer
Intelligent agent that can parse doctor notes, extract structured actions, suggest tasks, and coordinate workflows. Will integrate with the Notes API and a future Task system.

### `/tasks` — Task Queue & Management
Structured task extraction, assignment, tracking, and completion. Will model tasks with patient association, priority, assignee, status, and deadlines.

### `/alerts` — Alert & Escalation Engine
Condition-based alerting with severity levels, triggered by patient status changes, vital signs, lab results, or AI analysis. Supports notification hooks and escalation chains.

### `/integrations` — External System Connectors
Adapters for HL7/FHIR interoperability, lab information systems, pharmacy systems, imaging (PACS), and national health ID registries.

## Architecture Notes

All future modules should:
1. Use the existing permission system (`src/lib/permissions.ts`) — add new permission keys as needed
2. Use the existing activity logger for audit trails
3. Follow the API route pattern established in `src/app/api/`
4. Define Prisma models in the main `schema.prisma` and run migrations
5. Use Zod for input validation
6. Integrate with the existing domain types in `src/types/domain.ts`
