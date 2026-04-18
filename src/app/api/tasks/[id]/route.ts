import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { unauthorized, notFound, serverError } from "@/lib/errors";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return notFound("Tâche introuvable");

    // Only assignee or creator can update
    if (task.assignedToId !== user.id && task.createdById !== user.id) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (body.status) {
      data.status = body.status;
      if (body.status === "COMPLETED") data.completedAt = new Date();
    }
    if (body.title) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;

    const updated = await prisma.task.update({
      where: { id },
      data,
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

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PATCH /api/tasks/[id]]", error);
    return serverError();
  }
}
