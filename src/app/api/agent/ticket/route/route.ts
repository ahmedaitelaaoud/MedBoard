import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { badRequest, forbidden, notFound, serverError, unauthorized } from "@/lib/errors";
import { requirePermission } from "@/lib/permissions";
import { ticketRoutingRequestSchema } from "@/lib/validation/agent";
import { generateTicketRoutingSuggestion } from "@/lib/agent/ticket-routing";
import { logActivity } from "@/lib/activity-logger";

export async function POST(request: Request) {
  let agentRunId: string | null = null;

  try {
    const user = await getSession();
    if (!user) return unauthorized();

    try {
      requirePermission(user, "agent:ticket:route");
    } catch {
      return forbidden("Acces interdit");
    }

    if (process.env.AGENT_TICKET_ROUTING_ENABLED === "false") {
      return badRequest("Le routage agentique est desactive");
    }

    const body = await request.json();
    const parsedBody = ticketRoutingRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return badRequest("Entree invalide", parsedBody.error.flatten());
    }

    const { patientId, ticketContent } = parsedBody.data;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        patientCode: true,
        firstName: true,
        lastName: true,
        status: true,
        medicalRecord: {
          select: {
            notes: {
              orderBy: { createdAt: "desc" },
              take: 5,
              select: {
                type: true,
                content: true,
                createdAt: true,
                author: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!patient) return notFound("Patient introuvable");

    const [openTasks, nurses] = await Promise.all([
      prisma.task.findMany({
        where: {
          patientId,
          status: { not: "COMPLETED" },
        },
        select: {
          title: true,
          status: true,
          priority: true,
          assignedTo: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.user.findMany({
        where: {
          role: "NURSE",
          active: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          isAvailable: true,
          tasksAssigned: {
            where: {
              status: { not: "COMPLETED" },
            },
            select: { id: true },
          },
        },
      }),
    ]);

    if (nurses.length === 0) {
      return badRequest("Aucun infirmier actif disponible pour suggestion");
    }

    const inputContext = {
      patient: {
        id: patient.id,
        patientCode: patient.patientCode,
        firstName: patient.firstName,
        lastName: patient.lastName,
        status: patient.status,
      },
      latestNotes: (patient.medicalRecord?.notes ?? []).map((note) => ({
        type: note.type,
        content: note.content,
        createdAt: note.createdAt.toISOString(),
        authorName: `${note.author.firstName} ${note.author.lastName}`,
      })),
      openPatientTasks: openTasks.map((task) => ({
        title: task.title,
        status: task.status,
        priority: task.priority,
        assignedToName: `${task.assignedTo.firstName} ${task.assignedTo.lastName}`,
      })),
      activeNurses: nurses.map((nurse) => ({
        id: nurse.id,
        firstName: nurse.firstName,
        lastName: nurse.lastName,
        isAvailable: nurse.isAvailable,
        openTaskCount: nurse.tasksAssigned.length,
      })),
      rawDoctorTicketContent: ticketContent,
    };

    const run = await prisma.agentRun.create({
      data: {
        workflowType: "TICKET_ROUTING",
        triggerEntityType: "PATIENT",
        triggerEntityId: patientId,
        status: "PENDING",
        modelName: process.env.GEMINI_MODEL_ROUTER || "gemini-2.5-flash",
        promptVersion: "v1",
        inputJson: JSON.stringify(inputContext),
        triggeredById: user.id,
        patientId,
      },
    });

    agentRunId = run.id;

    await logActivity({
      action: "AGENT_RUN_STARTED",
      userId: user.id,
      patientId,
      details: `Run agent ticket routing demarre (${run.id})`,
      metadata: {
        runId: run.id,
        workflowType: "TICKET_ROUTING",
      },
    });

    const routingResult = await generateTicketRoutingSuggestion(inputContext);

    const suggestion = await prisma.agentSuggestion.create({
      data: {
        agentRunId: run.id,
        patientId,
        targetType: "TASK",
        payloadJson: JSON.stringify(routingResult.suggestion),
        confidence: routingResult.suggestion.confidence,
        status: "PENDING",
      },
    });

    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        modelName: routingResult.modelName,
        latencyMs: routingResult.latencyMs,
        tokenInput: routingResult.tokenInput,
        tokenOutput: routingResult.tokenOutput,
        errorCode: routingResult.errorCode ?? null,
        errorMessage: routingResult.errorMessage ?? null,
      },
    });

    await logActivity({
      action: "AGENT_SUGGESTION_CREATED",
      userId: user.id,
      patientId,
      details: `Suggestion agent creee (${suggestion.id})`,
      metadata: {
        runId: run.id,
        suggestionId: suggestion.id,
        fallbackUsed: routingResult.fallbackUsed,
      },
    });

    return NextResponse.json({
      data: {
        id: suggestion.id,
        status: suggestion.status,
        confidence: suggestion.confidence,
        payload: routingResult.suggestion,
        fallbackUsed: routingResult.fallbackUsed,
        runId: run.id,
      },
    });
  } catch (error) {
    if (agentRunId) {
      await prisma.agentRun
        .update({
          where: { id: agentRunId },
          data: {
            status: "FAILED",
            errorCode: "ROUTE_HANDLER_FAILURE",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          },
        })
        .catch(() => {
          // Best-effort update only.
        });
    }

    console.error("[POST /api/agent/ticket/route]", error);
    return serverError("Echec du routage agentique");
  }
}
