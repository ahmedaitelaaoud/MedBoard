import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { badRequest, forbidden, notFound, serverError, unauthorized } from "@/lib/errors";
import { requirePermission } from "@/lib/permissions";
import { parseSuggestionPayload } from "@/lib/agent/suggestion-payload";
import { logActivity } from "@/lib/activity-logger";
import { dispatchAgentNotification } from "@/lib/agent/notification-dispatcher";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    try {
      requirePermission(user, "agent:suggestion:approve");
    } catch {
      return forbidden("Acces interdit");
    }

    const { id } = await params;

    const suggestion = await prisma.agentSuggestion.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientCode: true,
          },
        },
      },
    });

    if (!suggestion) return notFound("Suggestion introuvable");
    if (suggestion.status !== "PENDING") {
      return badRequest("Seules les suggestions PENDING peuvent etre approuvees");
    }

    const payload = parseSuggestionPayload(suggestion.payloadJson);

    const nurse = await prisma.user.findFirst({
      where: {
        id: payload.recommendedNurseId,
        role: "NURSE",
        active: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!nurse) {
      return badRequest("Infirmier(ere) recommande(e) introuvable");
    }

    const { updatedSuggestion, task } = await prisma.$transaction(async (tx) => {
      const updated = await tx.agentSuggestion.update({
        where: { id: suggestion.id },
        data: {
          status: "APPLIED",
          approvedById: user.id,
          approvedAt: new Date(),
        },
      });

      const createdTask = await tx.task.create({
        data: {
          title: payload.title,
          description: payload.description,
          priority: payload.priority,
          source: "AGENT",
          sourceSuggestionId: suggestion.id,
          confidence: payload.confidence,
          reasoning: payload.reasoning,
          patientId: suggestion.patientId,
          createdById: user.id,
          assignedToId: payload.recommendedNurseId,
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              patientCode: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return { updatedSuggestion: updated, task: createdTask };
    });

    await logActivity({
      action: "AGENT_SUGGESTION_APPROVED",
      userId: user.id,
      patientId: suggestion.patientId,
      details: `Suggestion agent approuvee (${suggestion.id})`,
      metadata: {
        suggestionId: suggestion.id,
      },
    });

    await logActivity({
      action: "AGENT_NURSE_ROUTING_APPLIED",
      userId: user.id,
      patientId: suggestion.patientId,
      details: `Routage infirmier applique vers ${nurse.firstName} ${nurse.lastName}`,
      metadata: {
        suggestionId: suggestion.id,
        taskId: task.id,
      },
    });

    dispatchAgentNotification({
      recipientUserId: nurse.id,
      type: "AGENT_TASK_ASSIGNED",
      title: "Nouvelle tache IA assignee",
      message: `${payload.title} - Patient ${suggestion.patient.patientCode}`,
      relatedEntityType: "TASK",
      relatedEntityId: task.id,
      actorUserId: user.id,
      patientId: suggestion.patientId,
    }).catch((error) => {
      console.error("[AgentNotification] Dispatch failed", error);
    });

    return NextResponse.json({
      data: {
        suggestionId: updatedSuggestion.id,
        status: updatedSuggestion.status,
        task,
      },
    });
  } catch (error) {
    console.error("[POST /api/agent/suggestions/[id]/approve]", error);
    return serverError("Impossible d'approuver la suggestion");
  }
}
