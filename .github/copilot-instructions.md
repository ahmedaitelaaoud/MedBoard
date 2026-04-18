# MedBoard Workspace Instructions

## Build And Run
- Prefer `./setup.sh` for first-time setup on cluster machines.
- If npm is broken on the host, use local Node from `/goinfre/$USER/node/bin` in `PATH`.
- Development server: `npm run dev`.
- Lint before finalizing work: `npm run lint`.
- Prisma workflow after schema changes: `npx prisma generate` then `npx prisma db push`.
- Seed/reset utilities: `npx prisma db seed`, `make reset`.

## Architecture
- UI routes use Next.js App Router in `src/app`.
- API endpoints live in `src/app/api/**/route.ts`.
- Shared backend logic lives in `src/lib`:
  - Auth/session: `src/lib/auth.ts`
  - Permissions/RBAC: `src/lib/permissions.ts`
  - Validation schemas: `src/lib/validation/*`
  - API error helpers: `src/lib/errors.ts`
  - Activity audit logging: `src/lib/activity-logger.ts`
- Database schema and seed are in `prisma/schema.prisma` and `prisma/seed.ts`.
- Shared domain and API types are in `src/types`.

## Conventions
- Keep permission checks explicit in API routes using `can(...)` or `requirePermission(...)`.
- Validate request bodies with Zod `safeParse` using schemas from `src/lib/validation`.
- Use error helpers from `src/lib/errors.ts` for consistent API response shape.
- Log state-changing operations with `logActivity(...)`; activity logging must not block the main request path.
- Follow existing role boundaries in `src/lib/permissions.ts` and avoid widening permissions without explicit request.

## Environment Notes
- This workspace often runs in goinfre-constrained environments; keep npm cache in `/goinfre/$USER/.npm_cache`.
- When running from host shell outside Flatpak, use `host-spawn` and export local Node path if needed.
- Keep secrets in environment files; do not add or rely on hardcoded secret values.

## Docs Index
- Product scope, backlog, and acceptance context: `README.md`.
- Deferred architecture plans:
  - `future/README.md`
  - `future/agents/README.md`
  - `future/tasks/README.md`
  - `future/alerts/README.md`
  - `future/integrations/README.md`

When detailed behavior is documented in those files, reference them instead of duplicating long guidance here.
