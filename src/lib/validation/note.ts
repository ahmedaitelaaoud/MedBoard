import { z } from "zod";

export const noteCreateSchema = z.object({
  medicalRecordId: z.string().min(1),
  type: z.enum(["ADMISSION", "PROGRESS", "OBSERVATION", "PROCEDURE", "DISCHARGE", "CONSULTATION"]),
  content: z.string().min(1, "Note content is required").max(10000),
});

export const noteUpdateSchema = z.object({
  content: z.string().min(1).max(10000),
});

export type NoteCreateInput = z.infer<typeof noteCreateSchema>;
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>;
