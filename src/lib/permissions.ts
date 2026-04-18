import { Role } from "./constants";
import type { SessionUser } from "./auth";

// ==============================================================================
// Permissions — Role-Based Access Control
// ==============================================================================
// Declarative permission map. Each permission key maps to the roles that have it.
// Check permissions with `can(user, "permission:key")`.
// ==============================================================================

const PERMISSIONS: Record<string, readonly Role[]> = {
  // Patient data
  "patient:read":          [Role.DOCTOR, Role.NURSE, Role.ADMIN],
  "patient:create":        [Role.ADMIN],
  "patient:create:temporary": [Role.ADMIN, Role.DOCTOR, Role.NURSE],
  "patient:update":        [Role.ADMIN],
  "patient:update:administrative": [Role.ADMIN],

  // Patient portal
  "patient-portal:read":   [Role.PATIENT, Role.READONLY],

  // Medical records
  "record:read":           [Role.DOCTOR, Role.NURSE],
  "record:write":          [Role.DOCTOR],

  // Notes
  "note:read":             [Role.DOCTOR, Role.NURSE, Role.ADMIN],
  "note:create:medical":   [Role.DOCTOR],
  "note:create:observation": [Role.DOCTOR, Role.NURSE],
  "note:update":           [Role.DOCTOR],

  // Documents
  "document:upload":       [Role.DOCTOR],

  // Room management
  "room:read":             [Role.DOCTOR, Role.NURSE, Role.ADMIN],
  "room:manage":           [Role.ADMIN],

  // Staff
  "staff:read":            [Role.DOCTOR, Role.NURSE, Role.ADMIN],
  "staff:manage":          [Role.ADMIN],

  // Activity log
  "activity:read":         [Role.DOCTOR, Role.NURSE, Role.ADMIN],

  // Direct chat
  "chat:read":             [Role.DOCTOR, Role.NURSE],
  "chat:send":             [Role.DOCTOR, Role.NURSE],

  // Dashboard
  "dashboard:read":        [Role.DOCTOR, Role.NURSE, Role.ADMIN],
  "dashboard:manage":      [Role.ADMIN],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a user has a specific permission.
 */
export function can(user: SessionUser | null, permission: string): boolean {
  if (!user) return false;
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return (allowedRoles as readonly string[]).includes(user.role);
}

/**
 * Check if a user has any of the specified permissions.
 */
export function canAny(user: SessionUser | null, permissions: string[]): boolean {
  return permissions.some((p) => can(user, p));
}

/**
 * Assert a user has permission, throwing if not.
 * Use in API routes for clean guard patterns.
 */
export function requirePermission(user: SessionUser | null, permission: string): asserts user is SessionUser {
  if (!can(user, permission)) {
    throw new PermissionError(permission);
  }
}

export class PermissionError extends Error {
  public readonly permission: string;
  constructor(permission: string) {
    super(`Forbidden: requires permission "${permission}"`);
    this.permission = permission;
    this.name = "PermissionError";
  }
}

/**
 * Check if a note type is allowed for a given role.
 * Nurses can only create OBSERVATION notes.
 */
export function canCreateNoteType(role: Role, noteType: string): boolean {
  if (role === Role.DOCTOR) return true;
  if (role === Role.NURSE && noteType === "OBSERVATION") return true;
  return false;
}
