import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { unauthorized, serverError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    try {
      requirePermission(user, "room:read");
    } catch {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const floorNumber = searchParams.get("floor");
    const wardCode = searchParams.get("ward");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (floorNumber) {
      where.floor = { number: parseInt(floorNumber) };
    }
    if (wardCode) {
      where.ward = { code: wardCode };
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { number: { contains: search } },
        { patients: { some: { OR: [{ firstName: { contains: search } }, { lastName: { contains: search } }] } } },
      ];
    }

    const rooms = await prisma.room.findMany({
      where,
      include: {
        floor: { select: { id: true, name: true, number: true } },
        ward: { select: { id: true, name: true, code: true } },
        patients: {
          where: { status: { not: "DISCHARGED" } },
          select: {
            id: true,
            patientCode: true,
            firstName: true,
            lastName: true,
            status: true,
            assignments: {
              where: { active: true },
              select: {
                doctor: { select: { id: true, firstName: true, lastName: true, role: true, email: true } },
                nurse: { select: { id: true, firstName: true, lastName: true, role: true, email: true } },
              },
              take: 1,
            },
          },
        },
      },
      orderBy: [{ floor: { number: "asc" } }, { number: "asc" }],
    });

    // Transform assignments for cleaner frontend consumption
    const transformed = rooms.map((room) => ({
      ...room,
      patients: room.patients.map((p) => ({
        ...p,
        assignments: {
          doctor: p.assignments[0]?.doctor ?? null,
          nurse: p.assignments[0]?.nurse ?? null,
        },
      })),
    }));

    return NextResponse.json({ data: transformed });
  } catch (error) {
    console.error("[GET /api/rooms]", error);
    return serverError();
  }
}
