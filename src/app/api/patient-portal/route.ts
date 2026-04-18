import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { forbidden, notFound, serverError, unauthorized } from "@/lib/errors";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    try {
      requirePermission(user, "patient-portal:read");
    } catch {
      return forbidden();
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const portalUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        patient: {
          select: {
            id: true,
            patientCode: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            sex: true,
            admissionDate: true,
            emergencyContact: true,
            room: {
              select: {
                number: true,
                ward: { select: { name: true } },
                floor: { select: { name: true } },
              },
            },
            assignments: {
              where: { active: true },
              select: {
                doctor: { select: { firstName: true, lastName: true } },
                nurse: { select: { firstName: true, lastName: true } },
              },
              take: 1,
            },
            scheduleItems: {
              where: { scheduledAt: { gte: today } },
              orderBy: { scheduledAt: "asc" },
              take: 10,
              select: {
                id: true,
                title: true,
                scheduledAt: true,
                type: true,
                notes: true,
              },
            },
          },
        },
      },
    });

    const patient = portalUser?.patient;
    if (!patient) return notFound("Aucun profil patient lié à ce compte");

    const assignment = patient.assignments[0];
    const profile = {
      fullName: `${patient.firstName} ${patient.lastName}`,
      patientCode: patient.patientCode,
      dateOfBirth: patient.dateOfBirth,
      sex: patient.sex,
      admissionDate: patient.admissionDate,
      roomNumber: patient.room?.number ?? null,
      wardName: patient.room?.ward.name ?? null,
      floorName: patient.room?.floor.name ?? null,
      attendingDoctorName: assignment?.doctor
        ? `Dr. ${assignment.doctor.firstName} ${assignment.doctor.lastName}`
        : "Non attribué",
      assignedNurseName: assignment?.nurse
        ? `${assignment.nurse.firstName} ${assignment.nurse.lastName}`
        : "Non attribué",
      emergencyContact: patient.emergencyContact ?? null,
    };

    const schedule = patient.scheduleItems.map((item) => ({
      id: item.id,
      title: item.title,
      scheduledAt: item.scheduledAt,
      type: item.type,
      notes: item.notes,
    }));

    return NextResponse.json({
      data: {
        profile,
        schedule,
      },
    });
  } catch (error) {
    console.error("[GET /api/patient-portal]", error);
    return serverError();
  }
}
