import { agentSuggestionPayloadSchema, type AgentSuggestionPayload, agentSuggestionPatchSchema } from "@/lib/validation/agent";

export function parseSuggestionPayload(payloadJson: string): AgentSuggestionPayload {
  const parsedJson = JSON.parse(payloadJson);
  return agentSuggestionPayloadSchema.parse(parsedJson);
}

export function patchSuggestionPayload(payloadJson: string, updates: unknown): AgentSuggestionPayload {
  const current = parseSuggestionPayload(payloadJson);
  const parsedUpdates = agentSuggestionPatchSchema.parse(updates);

  return agentSuggestionPayloadSchema.parse({
    ...current,
    ...parsedUpdates,
    metadata: {
      ...current.metadata,
      ...(current.metadata?.fallbackUsed ? { fallbackUsed: true } : {}),
    },
  });
}
