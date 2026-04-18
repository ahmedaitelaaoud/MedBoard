import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { badRequest, forbidden, notFound, serverError, unauthorized } from "@/lib/errors";
import { requirePermission } from "@/lib/permissions";
import { agentSuggestionRejectSchema } from "@/lib/validation/agent";
import { logActivity } from "@/lib/activity-logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    try {
      requirePermission(user, "agent:suggestion:reject");
    } catch {
      return forbidden("Acces interdit");
    }

    const { id } = await params;

    const suggestion = await prisma.agentSuggestion.findUnique({ where: { id } });
    if (!suggestion) return notFound("Suggestion introuvable");

    if (suggestion.status !== "PENDING") {
      return badRequest("Seules les suggestions PENDING peuvent etre rejetees");
    }

    const body = await request.json().catch(() => ({}));
    const parsed = agentSuggestionRejectSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Entree invalide", parsed.error.flatten());
    }

    const updated = await prisma.agentSuggestion.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectedById: user.id,
        rejectedAt: new Date(),
        rejectionReason: parsed.data.reason ?? null,
      },
    });

    await logActivity({
      action: "AGENT_SUGGESTION_REJECTED",
      userId: user.id,
      patientId: updated.patientId,
      details: `Suggestion agent rejetee (${updated.id})`,
      metadata: {
        suggestionId: updated.id,
        reason: parsed.data.reason ?? null,
      },
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        status: updated.status,
        rejectedAt: updated.rejectedAt,
        rejectionReason: updated.rejectionReason,
      },
    });
  } catch (error) {
    console.error("[POST /api/agent/suggestions/[id]/reject]", error);
    return serverError("Impossible de rejeter la suggestion");
  }
}
