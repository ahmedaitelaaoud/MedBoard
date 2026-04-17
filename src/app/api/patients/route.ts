import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { unauthorized, serverError } from "@/lib/errors";
import { Role } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    try {
      requirePermission(user, "patient:read");
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role !== Role.DOCTOR && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Only doctors and admins can access the patient directory" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
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

    return NextResponse.json({ data: patients });
  } catch (error) {
    console.error("[GET /api/patients]", error);
    return serverError();
  }
}
