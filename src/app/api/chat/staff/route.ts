import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { unauthorized, serverError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    try {
      requirePermission(user, "chat:read");
    } catch {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    const staff = await prisma.user.findMany({
      where: {
        id: { not: user.id },
        active: true,
        role: { in: ["DOCTOR", "NURSE"] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        specialty: true,
        isAvailable: true,
      },
      orderBy: [{ role: "asc" }, { firstName: "asc" }, { lastName: "asc" }],
    });

    return NextResponse.json({ data: staff });
  } catch (error) {
    console.error("[GET /api/chat/staff]", error);
    return serverError();
  }
}
