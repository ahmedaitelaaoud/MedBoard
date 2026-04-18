import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { can, requirePermission } from "@/lib/permissions";
import { unauthorized, serverError, badRequest } from "@/lib/errors";
import { Role } from "@/lib/constants";
import { patientIntakeSchema } from "@/lib/validation/patient";
import { logActivity } from "@/lib/activity-logger";

function parseDateOrNull(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

async function generatePatientCode(): Promise<string> {
  const total = await prisma.patient.count();
  return `PAT-${String(total + 1).padStart(5, "0")}`;
}

async function generateTemporaryIdentity(): Promise<{ firstName: string; lastName: string; patientCode: string }> {
  const temporaryCount = await prisma.patient.count({
    where: { intakeType: "EMERGENCY_TEMPORARY" },
  });
  const n = String(temporaryCount + 1).padStart(2, "0");
  return {
    firstName: "Unknown",
    lastName: `Male ${n}`,
    patientCode: `TMP-${Date.now().toString().slice(-8)}-${Math.floor(100 + Math.random() * 900)}`,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    try {
      requirePermission(user, "patient:read");
    } catch {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const registrationStatus = searchParams.get("registrationStatus");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (registrationStatus) where.registrationStatus = registrationStatus;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { patientCode: { contains: search } },
      ];
    }

    // Doctors see all their current and past patients; admins see all hospital patients.
    if (user.role === Role.DOCTOR) {
      where.assignments = {
        some: {
          doctorId: user.id,
        },
      };
    }

    const patients = await prisma.patient.findMany({
      where,
      include: {
        room: { select: { id: true, number: true, floor: { select: { name: true } }, ward: { select: { name: true } } } },
        medicalRecord: { select: { id: true } },
        assignments: {
          where: { active: true },
          select: {
            doctor: { select: { id: true, firstName: true, lastName: true, role: true, email: true } },
            nurse: { select: { id: true, firstName: true, lastName: true, role: true, email: true } },
          },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const transformed = patients.map((patient) => ({
      ...patient,
      hasMedicalRecord: Boolean(patient.medicalRecord),
    }));

    return NextResponse.json({ data: transformed });
  } catch (error) {
    console.error("[GET /api/patients]", error);
    return serverError();
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = patientIntakeSchema.safeParse(body);
    if (!parsed.success) return badRequest("Données d'admission invalides", parsed.error.flatten());

    const isEmergencyTemporary =
      parsed.data.temporaryRegistration === true || parsed.data.intakeType === "EMERGENCY_TEMPORARY";

    const canCreateNormal = can(user, "patient:create");
    const canCreateTemporary = can(user, "patient:create:temporary");

    if (user.role === Role.READONLY || user.role === Role.PATIENT) {
      return NextResponse.json({ error: "Les utilisateurs du portail patient ne peuvent pas enregistrer de patients" }, { status: 403 });
    }

    if (!isEmergencyTemporary && !canCreateNormal) {
      return NextResponse.json(
        {
          error:
            "Seuls les admissions/admin peuvent effectuer un enregistrement patient normal. Les médecins et infirmiers(ères) ne peuvent créer qu'une admission d'urgence temporaire.",
        },
        { status: 403 }
      );
    }

    if (isEmergencyTemporary && !canCreateTemporary) {
      return NextResponse.json({ error: "Seuls les admins, médecins ou infirmiers(ères) peuvent créer une admission d'urgence temporaire" }, { status: 403 });
    }

    const roomId = parsed.data.roomId ?? null;
    if (roomId) {
      const room = await prisma.room.findUnique({ where: { id: roomId }, select: { id: true } });
      if (!room) return badRequest("La chambre sélectionnée n'existe pas");
    }

    const temporaryIdentity = isEmergencyTemporary ? await generateTemporaryIdentity() : null;

    const firstName = parsed.data.firstName?.trim() || temporaryIdentity?.firstName || "";
    const lastName = parsed.data.lastName?.trim() || temporaryIdentity?.lastName || "";
    if (!firstName || !lastName) {
      return badRequest("Le prénom et le nom sont requis pour un enregistrement normal");
    }

    const sex = parsed.data.sex || (isEmergencyTemporary ? "MALE" : undefined);
    if (!sex) return badRequest("Le sexe est requis pour un enregistrement normal");

    const dateOfBirth = parseDateOrNull(parsed.data.dateOfBirth);
    const resolvedDateOfBirth = dateOfBirth || (isEmergencyTemporary ? new Date("1970-01-01") : null);
    if (!resolvedDateOfBirth) {
      return badRequest("La date de naissance est requise pour un enregistrement normal");
    }

    const admissionDate = parseDateOrNull(parsed.data.admissionDate) || new Date();
    const patientCode = parsed.data.patientCode?.trim() || temporaryIdentity?.patientCode || (await generatePatientCode());

    const registrationStatus = isEmergencyTemporary
      ? "TEMPORARY"
      : parsed.data.registrationStatus || "REGISTERED";

    const admissionSource = parsed.data.admissionSource || (isEmergencyTemporary ? "EMERGENCY" : "WALK_IN");
    const intakeType = isEmergencyTemporary ? "EMERGENCY_TEMPORARY" : "NORMAL";
    const admissionStatus =
      parsed.data.admissionStatus ||
      (roomId ? "ASSIGNED" : isEmergencyTemporary ? "WAITING_ASSIGNMENT" : "ACTIVE");

    const patient = await prisma.patient.create({
      data: {
        patientCode,
        firstName,
        lastName,
        dateOfBirth: resolvedDateOfBirth,
        sex,
        phoneNumber: parsed.data.phoneNumber ?? null,
        emergencyContact: parsed.data.emergencyContact ?? null,
        emergencyPhone: parsed.data.emergencyPhone ?? null,
        status: parsed.data.status || "ADMITTED",
        registrationStatus,
        createdByRole: user.role,
        admissionSource,
        intakeType,
        admissionStatus,
        admissionDate,
        roomId,
      },
      include: {
        room: { select: { id: true, number: true, floor: { select: { name: true } }, ward: { select: { name: true } } } },
        medicalRecord: { select: { id: true } },
      },
    });

    if (isEmergencyTemporary) {
      await logActivity({
        action: "TEMPORARY_PATIENT_CREATED",
        userId: user.id,
        patientId: patient.id,
        details: `Temporary patient created in emergency mode by ${user.firstName} ${user.lastName}`,
      });
    } else {
      await logActivity({
        action: "PATIENT_REGISTERED",
        userId: user.id,
        patientId: patient.id,
        details: `Patient registered by admissions/admin (${user.firstName} ${user.lastName})`,
      });
    }

    if (roomId) {
      await logActivity({
        action: "ROOM_ASSIGNED",
        userId: user.id,
        patientId: patient.id,
        details: `Room assigned during intake`,
      });
    }

    return NextResponse.json(
      {
        data: {
          ...patient,
          hasMedicalRecord: Boolean(patient.medicalRecord),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/patients]", error);
    return serverError();
  }
}
