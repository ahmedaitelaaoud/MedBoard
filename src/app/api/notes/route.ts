import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canCreateNoteType } from "@/lib/permissions";
import { unauthorized, badRequest, serverError } from "@/lib/errors";
import { noteCreateSchema } from "@/lib/validation/note";
import { logActivity } from "@/lib/activity-logger";
import type { Role } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = noteCreateSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Entrée invalide", parsed.error.flatten());
    }

    // Check note type permission
    if (!canCreateNoteType(user.role as Role, parsed.data.type)) {
      return NextResponse.json(
        { error: `Votre rôle ne peut pas créer de notes ${parsed.data.type}` },
        { status: 403 }
      );
    }

    // Verify medical record exists
    const record = await prisma.medicalRecord.findUnique({
      where: { id: parsed.data.medicalRecordId },
      select: { patientId: true },
    });
    if (!record) return badRequest("Dossier médical introuvable");

    const note = await prisma.note.create({
      data: {
        medicalRecordId: parsed.data.medicalRecordId,
        authorId: user.id,
        type: parsed.data.type,
        content: parsed.data.content,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true, email: true } },
      },
    });

    logActivity({
      action: "NOTE_CREATED",
      userId: user.id,
      patientId: record.patientId,
      details: `${parsed.data.type} note created by ${user.firstName} ${user.lastName}`,
    });

    return NextResponse.json({ data: note }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/notes]", error);
    return serverError();
  }
}
