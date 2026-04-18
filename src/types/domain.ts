// ==============================================================================
// Domain Types — shared across frontend and backend
// ==============================================================================

import type { Role, RoomStatus, PatientStatus, NoteType, ActivityType } from "@/lib/constants";

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
  email: string;
}

export interface FloorWithRooms {
  id: string;
  name: string;
  number: number;
  rooms: RoomWithPatient[];
}

export interface RoomWithPatient {
  id: string;
  number: string;
  status: RoomStatus;
  capacity: number;
  floor: { id: string; name: string; number: number };
  ward: { id: string; name: string; code: string };
  patients: PatientBrief[];
  updatedAt: string;
}

export interface PatientBrief {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  status: PatientStatus;
  registrationStatus?: "PENDING" | "REGISTERED" | "TEMPORARY" | "COMPLETED";
  intakeType?: "NORMAL" | "EMERGENCY_TEMPORARY";
  assignments: {
    doctor: UserSummary | null;
    nurse: UserSummary | null;
  };
}

export interface PatientFull {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  phoneNumber: string | null;
  height: number | null;
  weight: number | null;
  allergies: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  status: PatientStatus;
  registrationStatus: "PENDING" | "REGISTERED" | "TEMPORARY" | "COMPLETED";
  createdByRole: Role;
  admissionSource: "WALK_IN" | "EMERGENCY" | "REFERRAL" | "TRANSFER";
  intakeType: "NORMAL" | "EMERGENCY_TEMPORARY";
  admissionStatus: "WAITING_ASSIGNMENT" | "ASSIGNED" | "ACTIVE" | "DISCHARGED";
  admissionDate: string;
  dischargeDate: string | null;
  room: { id: string; number: string; floor: { name: string }; ward: { name: string } } | null;
  medicalRecord: {
    id: string;
    diagnosisSummary: string | null;
    medicalHistory: string | null;
    currentPlan: string | null;
    notes: NoteItem[];
  } | null;
  assignments: AssignmentItem[];
  documents: DocumentItem[];
}

export interface NoteItem {
  id: string;
  type: NoteType;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: UserSummary;
}

export interface AssignmentItem {
  id: string;
  role: string;
  active: boolean;
  doctor: UserSummary;
  nurse: UserSummary | null;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  url: string | null;
  createdAt: string;
}

export interface ActivityLogItem {
  id: string;
  action: ActivityType;
  details: string | null;
  createdAt: string;
  user: UserSummary;
  patient: { id: string; firstName: string; lastName: string; patientCode: string } | null;
}

export interface DashboardFilters {
  floorNumber?: number;
  wardCode?: string;
  status?: RoomStatus;
  search?: string;
}
