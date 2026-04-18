import { z } from "zod";

const patientStatusEnum = z.enum([
  "ADMITTED",
  "UNDER_OBSERVATION",
  "CRITICAL",
  "STABLE",
  "DISCHARGE_READY",
  "DISCHARGED",
]);

const registrationStatusEnum = z.enum(["PENDING", "REGISTERED", "TEMPORARY", "COMPLETED"]);
const admissionSourceEnum = z.enum(["WALK_IN", "EMERGENCY", "REFERRAL", "TRANSFER"]);
const intakeTypeEnum = z.enum(["NORMAL", "EMERGENCY_TEMPORARY"]);
const admissionStatusEnum = z.enum(["WAITING_ASSIGNMENT", "ASSIGNED", "ACTIVE", "DISCHARGED"]);
const sexEnum = z.enum(["MALE", "FEMALE"]);

const optionalTrimmedString = z.string().trim().min(1).optional();
const optionalNullableTrimmedString = z.string().trim().min(1).nullable().optional();

export const patientIntakeSchema = z.object({
  patientCode: optionalTrimmedString,
  firstName: optionalTrimmedString,
  lastName: optionalTrimmedString,
  dateOfBirth: z.string().trim().optional(),
  sex: sexEnum.optional(),
  phoneNumber: optionalNullableTrimmedString,
  emergencyContact: optionalNullableTrimmedString,
  emergencyPhone: optionalNullableTrimmedString,
  admissionDate: z.string().trim().optional(),
  roomId: z.string().trim().nullable().optional(),
  status: patientStatusEnum.optional(),
  registrationStatus: registrationStatusEnum.optional(),
  admissionSource: admissionSourceEnum.optional(),
  intakeType: intakeTypeEnum.optional(),
  admissionStatus: admissionStatusEnum.optional(),
  temporaryRegistration: z.boolean().optional(),
});

export const patientAdminUpdateSchema = z
  .object({
    firstName: optionalTrimmedString,
    lastName: optionalTrimmedString,
    dateOfBirth: z.string().trim().optional(),
    sex: sexEnum.optional(),
    phoneNumber: optionalNullableTrimmedString,
    emergencyContact: optionalNullableTrimmedString,
    emergencyPhone: optionalNullableTrimmedString,
    roomId: z.string().trim().nullable().optional(),
    status: patientStatusEnum.optional(),
    registrationStatus: registrationStatusEnum.optional(),
    admissionSource: admissionSourceEnum.optional(),
    admissionStatus: admissionStatusEnum.optional(),
    admissionDate: z.string().trim().optional(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    "At least one administrative field must be provided"
  );

export const recordUpdateSchema = z.object({
  diagnosisSummary: z.string().optional(),
  medicalHistory: z.string().optional(),
  currentPlan: z.string().optional(),
});

export type PatientIntakeInput = z.infer<typeof patientIntakeSchema>;
export type PatientAdminUpdateInput = z.infer<typeof patientAdminUpdateSchema>;
export type RecordUpdateInput = z.infer<typeof recordUpdateSchema>;
