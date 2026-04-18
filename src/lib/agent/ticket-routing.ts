import { agentSuggestionPayloadSchema, type AgentSuggestionPayload } from "@/lib/validation/agent";

interface RoutingPatientContext {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  status: string;
}

interface RoutingNoteContext {
  type: string;
  content: string;
  createdAt: string;
  authorName: string;
}

interface RoutingTaskContext {
  title: string;
  status: string;
  priority: string;
  assignedToName: string;
}

interface RoutingNurseContext {
  id: string;
  firstName: string;
  lastName: string;
  isAvailable: boolean;
  openTaskCount: number;
}

export interface TicketRoutingInputContext {
  patient: RoutingPatientContext;
  latestNotes: RoutingNoteContext[];
  openPatientTasks: RoutingTaskContext[];
  activeNurses: RoutingNurseContext[];
  rawDoctorTicketContent: string;
}

export interface TicketRoutingResult {
  suggestion: AgentSuggestionPayload;
  fallbackUsed: boolean;
  modelName: string;
  latencyMs: number;
  tokenInput?: number;
  tokenOutput?: number;
  errorCode?: string;
  errorMessage?: string;
}

function truncateText(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  return `${value.slice(0, maxLen)}...`;
}

function pickLeastBusyNurse(nurses: RoutingNurseContext[]): RoutingNurseContext | null {
  if (nurses.length === 0) return null;

  const available = nurses.filter((nurse) => nurse.isAvailable);
  const pool = available.length > 0 ? available : nurses;

  return pool
    .slice()
    .sort((a, b) => {
      if (a.openTaskCount !== b.openTaskCount) return a.openTaskCount - b.openTaskCount;
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    })[0] ?? null;
}

function inferPriority(ticketContent: string): AgentSuggestionPayload["priority"] {
  const value = ticketContent.toLowerCase();
  if (/(urgence|urgent|immediate|immédiat|immediat|critique|stat|asap)/.test(value)) return "URGENT";
  if (/(douleur|pain|saignement|bleeding|fievre|fièvre|infection|allerg)/.test(value)) return "HIGH";
  if (/(suivi|follow-up|controle|contrôle|routine|monitoring|surveillance)/.test(value)) return "NORMAL";
  return "LOW";
}

function inferTitle(ticketContent: string): string {
  const firstLine = ticketContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstLine) return "Suivi infirmier recommande";
  return truncateText(firstLine, 120);
}

function buildFallbackSuggestion(input: TicketRoutingInputContext, reason: string): AgentSuggestionPayload {
  const selectedNurse = pickLeastBusyNurse(input.activeNurses);
  const recommendedNurseId = selectedNurse?.id ?? "";

  return {
    title: inferTitle(input.rawDoctorTicketContent),
    description: truncateText(input.rawDoctorTicketContent.trim(), 1000),
    priority: inferPriority(input.rawDoctorTicketContent),
    recommendedNurseId,
    confidence: 0.42,
    reasoning: `Fallback deterministe utilise: ${reason}. Affectation a l'infirmier(ere) le/la moins charge(e).`,
    metadata: {
      fallbackUsed: true,
      provider: "deterministic-fallback",
    },
  };
}

function extractJsonFromText(rawText: string): Record<string, unknown> {
  const trimmed = rawText.trim();
  if (!trimmed) throw new Error("Empty provider response");

  const assertObject = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Provider response is not a JSON object");
    }
    return value as Record<string, unknown>;
  };

  try {
    return assertObject(JSON.parse(trimmed));
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found in provider response");
    return assertObject(JSON.parse(match[0]));
  }
}

async function callGemini(input: TicketRoutingInputContext, apiKey: string, modelName: string): Promise<{ parsed: AgentSuggestionPayload; tokenInput?: number; tokenOutput?: number; }> {
  const promptPayload = {
    patient: input.patient,
    latestNotes: input.latestNotes.map((note) => ({
      ...note,
      content: truncateText(note.content, 300),
    })),
    openPatientTasks: input.openPatientTasks,
    activeNurses: input.activeNurses,
    doctorTicket: truncateText(input.rawDoctorTicketContent, 2000),
  };

  const systemInstruction = [
    "You are a clinical operations routing assistant.",
    "Return ONLY a valid JSON object and no markdown.",
    "Use this schema:",
    '{"title":"string","description":"string","priority":"LOW|NORMAL|HIGH|URGENT","recommendedNurseId":"string","confidence":0.0,"reasoning":"string"}',
    "Ensure recommendedNurseId is one of the provided nurse ids.",
    "Confidence must be a number between 0 and 1.",
  ].join("\n");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: JSON.stringify(promptPayload) }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gemini HTTP ${response.status}: ${message}`);
  }

  const json = await response.json();
  const rawText = json?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part?.text ?? "")
    .join("\n");

  const extracted = extractJsonFromText(rawText ?? "");
  const parsed = agentSuggestionPayloadSchema.parse({
    ...extracted,
    metadata: {
      fallbackUsed: false,
      provider: "gemini",
      model: modelName,
    },
  });

  return {
    parsed,
    tokenInput: json?.usageMetadata?.promptTokenCount,
    tokenOutput: json?.usageMetadata?.candidatesTokenCount,
  };
}

export async function generateTicketRoutingSuggestion(input: TicketRoutingInputContext): Promise<TicketRoutingResult> {
  const modelName = process.env.GEMINI_MODEL_ROUTER || "gemini-2.5-flash";
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const startedAt = Date.now();

  if (!apiKey) {
    const fallback = buildFallbackSuggestion(input, "GEMINI_API_KEY/GOOGLE_API_KEY non configuree");
    return {
      suggestion: fallback,
      fallbackUsed: true,
      modelName,
      latencyMs: Date.now() - startedAt,
      errorCode: "MISSING_API_KEY",
      errorMessage: "GEMINI_API_KEY or GOOGLE_API_KEY is not configured",
    };
  }

  try {
    const result = await callGemini(input, apiKey, modelName);

    const nurseExists = input.activeNurses.some((nurse) => nurse.id === result.parsed.recommendedNurseId);
    if (!nurseExists) {
      throw new Error("Gemini returned an unknown recommendedNurseId");
    }

    return {
      suggestion: result.parsed,
      fallbackUsed: false,
      modelName,
      latencyMs: Date.now() - startedAt,
      tokenInput: result.tokenInput,
      tokenOutput: result.tokenOutput,
    };
  } catch (error) {
    const fallback = buildFallbackSuggestion(
      input,
      error instanceof Error ? error.message : "provider failure"
    );

    if (!fallback.recommendedNurseId) {
      throw new Error("No nurse available for deterministic fallback");
    }

    return {
      suggestion: fallback,
      fallbackUsed: true,
      modelName,
      latencyMs: Date.now() - startedAt,
      errorCode: "PROVIDER_OR_VALIDATION_FAILURE",
      errorMessage: error instanceof Error ? error.message : "Unknown provider error",
    };
  }
}

export function rankNursesByAvailability(nurses: RoutingNurseContext[]): RoutingNurseContext[] {
  const available = nurses.filter((nurse) => nurse.isAvailable);
  const busy = nurses.filter((nurse) => !nurse.isAvailable);

  const sorter = (a: RoutingNurseContext, b: RoutingNurseContext) => {
    if (a.openTaskCount !== b.openTaskCount) return a.openTaskCount - b.openTaskCount;
    return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
  };

  return [...available.sort(sorter), ...busy.sort(sorter)];
}
