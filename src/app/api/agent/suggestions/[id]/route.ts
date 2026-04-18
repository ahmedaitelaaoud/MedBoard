import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { badRequest, forbidden, notFound, serverError, unauthorized } from "@/lib/errors";
import { requirePermission } from "@/lib/permissions";
import { patchSuggestionPayload } from "@/lib/agent/suggestion-payload";
import { logActivity } from "@/lib/activity-logger";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    try {
      requirePermission(user, "agent:suggestion:update");
    } catch {
      return forbidden("Acces interdit");
    }

    const { id } = await params;
    const suggestion = await prisma.agentSuggestion.findUnique({ where: { id } });
    if (!suggestion) return notFound("Suggestion introuvable");

    if (suggestion.status !== "PENDING") {
      return badRequest("Seules les suggestions PENDING peuvent etre modifiees");
    }

    const body = await request.json();
    const nextPayload = patchSuggestionPayload(suggestion.payloadJson, body);

    const nurseExists = await prisma.user.findFirst({
      where: {
        id: nextPayload.recommendedNurseId,
        role: "NURSE",
        active: true,
      },
      select: { id: true },
    });

    if (!nurseExists) {
      return badRequest("Infirmier(ere) recommande(e) invalide");
    }

    const nextConfidence = Math.max(0, Math.min(1, nextPayload.confidence));
    nextPayload.confidence = nextConfidence;

    const updated = await prisma.agentSuggestion.update({
      where: { id },
      data: {
        payloadJson: JSON.stringify(nextPayload),
        confidence: nextConfidence,
      },
    });

    await logActivity({
      action: "AGENT_SUGGESTION_UPDATED",
      userId: user.id,
      patientId: updated.patientId,
      details: `Suggestion agent mise a jour (${updated.id})`,
      metadata: {
        suggestionId: updated.id,
      },
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        status: updated.status,
        confidence: updated.confidence,
        payload: nextPayload,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("[PATCH /api/agent/suggestions/[id]]", error);
    return serverError("Impossible de mettre a jour la suggestion");
  }
}
