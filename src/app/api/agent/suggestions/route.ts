import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forbidden, serverError, unauthorized } from "@/lib/errors";
import { requirePermission } from "@/lib/permissions";
import { agentSuggestionListQuerySchema } from "@/lib/validation/agent";
import { prisma } from "@/lib/db";
import { parseSuggestionPayload } from "@/lib/agent/suggestion-payload";

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    try {
      requirePermission(user, "agent:suggestion:read");
    } catch {
      return forbidden("Acces interdit");
    }

    const parsedQuery = agentSuggestionListQuerySchema.safeParse({
      patientId: request.nextUrl.searchParams.get("patientId") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json({ error: "Parametres de recherche invalides", details: parsedQuery.error.flatten() }, { status: 400 });
    }

    const { patientId, status, limit } = parsedQuery.data;

    const suggestions = await prisma.agentSuggestion.findMany({
      where: {
        ...(patientId ? { patientId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit ?? 20,
      include: {
        approvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        rejectedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    const nurseIds = new Set<string>();
    const normalized = suggestions.map((suggestion) => {
      const payload = parseSuggestionPayload(suggestion.payloadJson);
      nurseIds.add(payload.recommendedNurseId);
      return {
        ...suggestion,
        payload,
      };
    });

    const nurses = await prisma.user.findMany({
      where: {
        id: { in: Array.from(nurseIds) },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isAvailable: true,
      },
    });

    const nurseById = new Map(nurses.map((nurse) => [nurse.id, nurse]));

    return NextResponse.json({
      data: normalized.map((item) => ({
        id: item.id,
        agentRunId: item.agentRunId,
        patientId: item.patientId,
        status: item.status,
        confidence: item.confidence,
        approvedBy: item.approvedBy,
        approvedAt: item.approvedAt,
        rejectedBy: item.rejectedBy,
        rejectedAt: item.rejectedAt,
        rejectionReason: item.rejectionReason,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        payload: item.payload,
        recommendedNurse: nurseById.get(item.payload.recommendedNurseId) ?? null,
      })),
    });
  } catch (error) {
    console.error("[GET /api/agent/suggestions]", error);
    return serverError("Impossible de charger les suggestions");
  }
}
