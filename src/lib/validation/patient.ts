import { z } from "zod";

export const patientUpdateSchema = z.object({
  status: z.enum(["ADMITTED", "UNDER_OBSERVATION", "CRITICAL", "STABLE", "DISCHARGE_READY", "DISCHARGED"]).optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  allergies: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  roomId: z.string().nullable().optional(),
});

export const recordUpdateSchema = z.object({
  diagnosisSummary: z.string().optional(),
  medicalHistory: z.string().optional(),
  currentPlan: z.string().optional(),
});

export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;
export type RecordUpdateInput = z.infer<typeof recordUpdateSchema>;
