import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { unauthorized, badRequest, serverError } from "@/lib/errors";
import { logActivity } from "@/lib/activity-logger";

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    const role = request.nextUrl.searchParams.get("role") || "assignee";

    const where =
      role === "creator"
        ? { createdById: user.id }
        : { assignedToId: user.id };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, patientCode: true, status: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ data: tasks });
  } catch (error) {
    console.error("[GET /api/tasks]", error);
    return serverError();
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    if (user.role !== "DOCTOR" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only doctors can create tasks" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, priority, assignedToId, patientId } = body;

    if (!title || !assignedToId) {
      return badRequest("Title and assignee are required");
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        priority: priority || "NORMAL",
        patientId: patientId || null,
        createdById: user.id,
        assignedToId,
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, patientCode: true, status: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    logActivity({
      action: "NOTE_CREATED",
      userId: user.id,
      patientId: patientId || undefined,
      details: `Task "${title}" assigned to ${task.assignedTo.firstName} ${task.assignedTo.lastName}`,
    });

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tasks]", error);
    return serverError();
  }
}
