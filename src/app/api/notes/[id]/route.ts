import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { unauthorized, notFound, serverError, badRequest } from "@/lib/errors";
import { noteUpdateSchema } from "@/lib/validation/note";
import { logActivity } from "@/lib/activity-logger";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    if (user.role !== "DOCTOR") {
      return NextResponse.json({ error: "Seuls les médecins peuvent modifier les notes" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = noteUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Entrée invalide", parsed.error.flatten());
    }

    const note = await prisma.note.findUnique({
      where: { id },
      select: { authorId: true, medicalRecord: { select: { patientId: true } } },
    });

    if (!note) return notFound("Note introuvable");

    // Doctors can only edit their own notes
    if (note.authorId !== user.id) {
      return NextResponse.json({ error: "Vous ne pouvez modifier que vos propres notes" }, { status: 403 });
    }

    const updated = await prisma.note.update({
      where: { id },
      data: { content: parsed.data.content },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true, email: true } },
      },
    });

    logActivity({
      action: "NOTE_UPDATED",
      userId: user.id,
      patientId: note.medicalRecord.patientId,
      details: `Note updated by Dr. ${user.lastName}`,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PATCH /api/notes/[id]]", error);
    return serverError();
  }
}
