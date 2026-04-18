import { z } from "zod";

export const taskPrioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);

export const ticketRoutingRequestSchema = z.object({
  patientId: z.string().min(1),
  ticketContent: z.string().trim().min(3).max(4000),
});

export const agentSuggestionPayloadSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(3).max(4000),
  priority: taskPrioritySchema,
  recommendedNurseId: z.string().min(1),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().trim().min(3).max(4000),
  metadata: z
    .object({
      fallbackUsed: z.boolean().default(false),
      provider: z.string().optional(),
      model: z.string().optional(),
    })
    .optional(),
});

export const agentSuggestionPatchSchema = z
  .object({
    title: z.string().trim().min(3).max(160).optional(),
    description: z.string().trim().min(3).max(4000).optional(),
    priority: taskPrioritySchema.optional(),
    recommendedNurseId: z.string().trim().min(1).optional(),
    confidence: z.number().min(0).max(1).optional(),
    reasoning: z.string().trim().min(3).max(4000).optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), "Aucun champ a mettre a jour");

export const agentSuggestionRejectSchema = z.object({
  reason: z.string().trim().min(3).max(500).optional(),
});

export const agentSuggestionListQuerySchema = z.object({
  patientId: z.string().min(1).optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "APPLIED"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type AgentSuggestionPayload = z.infer<typeof agentSuggestionPayloadSchema>;
export type AgentSuggestionPatchInput = z.infer<typeof agentSuggestionPatchSchema>;
export type TicketRoutingRequest = z.infer<typeof ticketRoutingRequestSchema>;
