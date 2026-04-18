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
  PATIENT: "PATIENT",
  READONLY: "READONLY",
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

export const RegistrationStatus = {
  PENDING: "PENDING",
  REGISTERED: "REGISTERED",
  TEMPORARY: "TEMPORARY",
  COMPLETED: "COMPLETED",
} as const;
export type RegistrationStatus = (typeof RegistrationStatus)[keyof typeof RegistrationStatus];

export const AdmissionSource = {
  WALK_IN: "WALK_IN",
  EMERGENCY: "EMERGENCY",
  REFERRAL: "REFERRAL",
  TRANSFER: "TRANSFER",
} as const;
export type AdmissionSource = (typeof AdmissionSource)[keyof typeof AdmissionSource];

export const IntakeType = {
  NORMAL: "NORMAL",
  EMERGENCY_TEMPORARY: "EMERGENCY_TEMPORARY",
} as const;
export type IntakeType = (typeof IntakeType)[keyof typeof IntakeType];

export const AdmissionStatus = {
  WAITING_ASSIGNMENT: "WAITING_ASSIGNMENT",
  ASSIGNED: "ASSIGNED",
  ACTIVE: "ACTIVE",
  DISCHARGED: "DISCHARGED",
} as const;
export type AdmissionStatus = (typeof AdmissionStatus)[keyof typeof AdmissionStatus];

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
  PATIENT_REGISTERED: "PATIENT_REGISTERED",
  TEMPORARY_PATIENT_CREATED: "TEMPORARY_PATIENT_CREATED",
  ADMIN_DATA_COMPLETED: "ADMIN_DATA_COMPLETED",
  MEDICAL_RECORD_INITIALIZED: "MEDICAL_RECORD_INITIALIZED",
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

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  PENDING: "Pending",
  REGISTERED: "Registered",
  TEMPORARY: "Temporary",
  COMPLETED: "Completed",
};

export const ADMISSION_SOURCE_LABELS: Record<AdmissionSource, string> = {
  WALK_IN: "Walk-in",
  EMERGENCY: "Emergency",
  REFERRAL: "Referral",
  TRANSFER: "Transfer",
};

export const INTAKE_TYPE_LABELS: Record<IntakeType, string> = {
  NORMAL: "Normal Intake",
  EMERGENCY_TEMPORARY: "Emergency Temporary",
};

export const ADMISSION_STATUS_LABELS: Record<AdmissionStatus, string> = {
  WAITING_ASSIGNMENT: "Waiting Assignment",
  ASSIGNED: "Assigned",
  ACTIVE: "Active",
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
  PATIENT: "Patient",
  READONLY: "Read-Only",
};
