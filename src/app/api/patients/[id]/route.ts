import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { unauthorized, notFound, serverError, badRequest } from "@/lib/errors";
import { patientAdminUpdateSchema, recordUpdateSchema } from "@/lib/validation/patient";
import { logActivity } from "@/lib/activity-logger";
import { can } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    try {
      requirePermission(user, "patient:read");
    } catch {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    const { id } = await params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        room: {
          select: {
            id: true, number: true,
            floor: { select: { name: true } },
            ward: { select: { name: true } },
          },
        },
        medicalRecord: can(user, "record:read") ? {
          include: {
            notes: {
              include: {
                author: { select: { id: true, firstName: true, lastName: true, role: true, email: true } },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        } : false,
        assignments: {
          where: { active: true },
          include: {
            doctor: { select: { id: true, firstName: true, lastName: true, role: true, email: true } },
            nurse: { select: { id: true, firstName: true, lastName: true, role: true, email: true } },
          },
        },
        documents: {
          select: { id: true, name: true, type: true, url: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!patient) return notFound("Patient introuvable");

    return NextResponse.json({ data: patient });
  } catch (error) {
    console.error("[GET /api/patients/[id]]", error);
    return serverError();
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    // Check if updating patient fields or medical record
    if (body.record) {
      try {
        requirePermission(user, "record:write");
      } catch {
        return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
      }

      const parsed = recordUpdateSchema.safeParse(body.record);
      if (!parsed.success) return badRequest("Données du dossier invalides", parsed.error.flatten());

      const patientExists = await prisma.patient.findUnique({ where: { id }, select: { id: true } });
      if (!patientExists) return notFound("Patient introuvable");

      const existingRecord = await prisma.medicalRecord.findUnique({ where: { patientId: id } });

      if (!existingRecord) {
        await prisma.medicalRecord.create({
          data: {
            patientId: id,
            diagnosisSummary: parsed.data.diagnosisSummary,
            medicalHistory: parsed.data.medicalHistory,
            currentPlan: parsed.data.currentPlan,
          },
        });

        await logActivity({
          action: "MEDICAL_RECORD_INITIALIZED",
          userId: user.id,
          patientId: id,
          details: `Medical record initialized by Dr. ${user.lastName}`,
        });

        return NextResponse.json({ success: true, initialized: true });
      }

      await prisma.medicalRecord.update({
        where: { id: existingRecord.id },
        data: parsed.data,
      });

      await logActivity({
        action: "RECORD_UPDATED",
        userId: user.id,
        patientId: id,
        details: `Medical record updated by Dr. ${user.lastName}`,
      });

      return NextResponse.json({ success: true, initialized: false });
    }

    // Update administrative patient fields
    try {
      requirePermission(user, "patient:update:administrative");
    } catch {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    const parsed = patientAdminUpdateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Entrée invalide", parsed.error.flatten());

    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) return notFound("Patient introuvable");

    let nextDateOfBirth: Date | undefined;
    if (parsed.data.dateOfBirth) {
      const parsedDate = new Date(parsed.data.dateOfBirth);
      if (Number.isNaN(parsedDate.getTime())) return badRequest("dateOfBirth invalide");
      nextDateOfBirth = parsedDate;
    }

    let nextAdmissionDate: Date | undefined;
    if (parsed.data.admissionDate) {
      const parsedDate = new Date(parsed.data.admissionDate);
      if (Number.isNaN(parsedDate.getTime())) return badRequest("admissionDate invalide");
      nextAdmissionDate = parsedDate;
    }

    if (parsed.data.roomId) {
      const room = await prisma.room.findUnique({ where: { id: parsed.data.roomId }, select: { id: true } });
      if (!room) return badRequest("La chambre sélectionnée n'existe pas");
    }

    const currentRoomId = patient.roomId;
    const nextRoomId = parsed.data.roomId === undefined ? patient.roomId : parsed.data.roomId;
    const previousRegistrationStatus = patient.registrationStatus;
    const nextRegistrationStatus = parsed.data.registrationStatus;

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        ...parsed.data,
        dateOfBirth: nextDateOfBirth,
        admissionDate: nextAdmissionDate,
      },
    });

    if (parsed.data.status && parsed.data.status !== patient.status) {
      await logActivity({
        action: "STATUS_CHANGED",
        userId: user.id,
        patientId: id,
        details: `Patient status changed to ${parsed.data.status}`,
      });
    }

    if (nextRegistrationStatus && nextRegistrationStatus !== previousRegistrationStatus) {
      await logActivity({
        action: "ADMIN_DATA_COMPLETED",
        userId: user.id,
        patientId: id,
        details: `Administrative registration updated to ${nextRegistrationStatus}`,
      });
    }

    if (nextRoomId !== currentRoomId && nextRoomId) {
      await logActivity({
        action: currentRoomId ? "ROOM_TRANSFERRED" : "ROOM_ASSIGNED",
        userId: user.id,
        patientId: id,
        details: currentRoomId ? "Room transfer completed during administrative update" : "Room assigned during administrative update",
      });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PATCH /api/patients/[id]]", error);
    return serverError();
  }
}
