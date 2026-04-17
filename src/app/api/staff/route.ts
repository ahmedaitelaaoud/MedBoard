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
      requirePermission(user, "staff:read");
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const staff = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        specialty: true,
        isAvailable: true,
        createdAt: true,
      },
      orderBy: [{ role: "asc" }, { lastName: "asc" }],
    });

    return NextResponse.json({ data: staff });
  } catch (error) {
    console.error("[GET /api/staff]", error);
    return serverError();
  }
}
