// ==============================================================================
// Constants & Enums
// ==============================================================================
// String-based enums for use across the app. These mirror the Prisma schema
// string fields and provide type safety without requiring native Prisma enums
// (which are not supported in SQLite).
// ==============================================================================

export const Role = {
  DOCTOR: "DOCTOR",
  NURSE: "NURSE",
  ADMIN: "ADMIN",
  READONLY: "READONLY",
  PATIENT: "PATIENT",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const RoomStatus = {
  EMPTY: "EMPTY",
  OCCUPIED: "OCCUPIED",
  CRITICAL: "CRITICAL",
  DISCHARGE_READY: "DISCHARGE_READY",
  UNDER_OBSERVATION: "UNDER_OBSERVATION",
  UNAVAILABLE: "UNAVAILABLE",
} as const;
export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export const PatientStatus = {
  ADMITTED: "ADMITTED",
  UNDER_OBSERVATION: "UNDER_OBSERVATION",
  CRITICAL: "CRITICAL",
  STABLE: "STABLE",
  DISCHARGE_READY: "DISCHARGE_READY",
  DISCHARGED: "DISCHARGED",
} as const;
export type PatientStatus = (typeof PatientStatus)[keyof typeof PatientStatus];

export const NoteType = {
  ADMISSION: "ADMISSION",
  PROGRESS: "PROGRESS",
  OBSERVATION: "OBSERVATION",
  PROCEDURE: "PROCEDURE",
  DISCHARGE: "DISCHARGE",
  CONSULTATION: "CONSULTATION",
} as const;
export type NoteType = (typeof NoteType)[keyof typeof NoteType];

export const ActivityType = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  PATIENT_ADMITTED: "PATIENT_ADMITTED",
  PATIENT_DISCHARGED: "PATIENT_DISCHARGED",
  ROOM_ASSIGNED: "ROOM_ASSIGNED",
  ROOM_TRANSFERRED: "ROOM_TRANSFERRED",
  NOTE_CREATED: "NOTE_CREATED",
  NOTE_UPDATED: "NOTE_UPDATED",
  RECORD_UPDATED: "RECORD_UPDATED",
  STATUS_CHANGED: "STATUS_CHANGED",
  ASSIGNMENT_CHANGED: "ASSIGNMENT_CHANGED",
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const AssignmentRole = {
  PRIMARY: "PRIMARY",
  CONSULTING: "CONSULTING",
  COVERING: "COVERING",
} as const;
export type AssignmentRole = (typeof AssignmentRole)[keyof typeof AssignmentRole];

// ─── Display helpers ─────────────────────────────────────────────────────────

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  EMPTY: "Empty",
  OCCUPIED: "Occupied",
  CRITICAL: "Critical",
  DISCHARGE_READY: "Discharge Ready",
  UNDER_OBSERVATION: "Under Observation",
  UNAVAILABLE: "Unavailable",
};

export const PATIENT_STATUS_LABELS: Record<PatientStatus, string> = {
  ADMITTED: "Admitted",
  UNDER_OBSERVATION: "Under Observation",
  CRITICAL: "Critical",
  STABLE: "Stable",
  DISCHARGE_READY: "Discharge Ready",
  DISCHARGED: "Discharged",
};

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  ADMISSION: "Admission",
  PROGRESS: "Progress",
  OBSERVATION: "Observation",
  PROCEDURE: "Procedure",
  DISCHARGE: "Discharge",
  CONSULTATION: "Consultation",
};

export const ROLE_LABELS: Record<Role, string> = {
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  ADMIN: "Admin",
  READONLY: "Read-Only (Legacy)",
  PATIENT: "Patient",
};
