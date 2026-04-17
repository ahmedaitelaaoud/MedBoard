import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { unauthorized, notFound, serverError, badRequest } from "@/lib/errors";
import { patientUpdateSchema, recordUpdateSchema } from "@/lib/validation/patient";
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    if (!patient) return notFound("Patient not found");

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
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const parsed = recordUpdateSchema.safeParse(body.record);
      if (!parsed.success) return badRequest("Invalid record data", parsed.error.flatten());

      const record = await prisma.medicalRecord.findUnique({ where: { patientId: id } });
      if (!record) return notFound("Medical record not found");

      await prisma.medicalRecord.update({
        where: { id: record.id },
        data: parsed.data,
      });

      logActivity({
        action: "RECORD_UPDATED",
        userId: user.id,
        patientId: id,
        details: `Medical record updated by Dr. ${user.lastName}`,
      });

      return NextResponse.json({ success: true });
    }

    // Update patient fields
    try {
      requirePermission(user, "patient:update");
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = patientUpdateSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) return notFound("Patient not found");

    const updated = await prisma.patient.update({
      where: { id },
      data: parsed.data,
    });

    if (parsed.data.status) {
      logActivity({
        action: "STATUS_CHANGED",
        userId: user.id,
        patientId: id,
        details: `Patient status changed to ${parsed.data.status}`,
      });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PATCH /api/patients/[id]]", error);
    return serverError();
  }
}
