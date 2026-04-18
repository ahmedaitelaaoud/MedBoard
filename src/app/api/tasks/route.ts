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

    if (user.role !== "DOCTOR") {
      return NextResponse.json({ error: "Only doctors can create tasks" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, priority, assignedToId, patientId, content } = body;

    const normalizedContent = typeof content === "string" ? content.trim() : "";
    const normalizedTitle = typeof title === "string" ? title.trim() : "";
    const resolvedTitle = normalizedTitle || normalizedContent.slice(0, 80);
    const resolvedDescription =
      normalizedContent || (typeof description === "string" ? description.trim() : "") || null;
    let resolvedAssignedToId =
      typeof assignedToId === "string" && assignedToId.trim() ? assignedToId.trim() : "";

    if (!resolvedAssignedToId) {
      const nurses = await prisma.user.findMany({
        where: { role: "NURSE", active: true },
        select: {
          id: true,
          tasksAssigned: {
            where: { status: { not: "COMPLETED" } },
            select: { id: true },
          },
        },
      });

      if (nurses.length > 0) {
        const leastBusyNurse = nurses.reduce((best, current) =>
          current.tasksAssigned.length < best.tasksAssigned.length ? current : best
        );
        resolvedAssignedToId = leastBusyNurse.id;
      } else {
        resolvedAssignedToId = user.id;
      }
    }

    if (!resolvedTitle) {
      return badRequest("Content is required");
    }

    const task = await prisma.task.create({
      data: {
        title: resolvedTitle,
        description: resolvedDescription,
        priority: priority || "NORMAL",
        patientId: patientId || null,
        createdById: user.id,
        assignedToId: resolvedAssignedToId,
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
      details: `Ticket "${resolvedTitle}" created by ${user.firstName} ${user.lastName}`,
    });

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tasks]", error);
    return serverError();
  }
}
