import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { unauthorized, serverError } from "@/lib/errors";

const NOTE_ACTIONS = ["NOTE_CREATED", "NOTE_UPDATED"] as const;

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    try {
      requirePermission(user, "activity:read");
    } catch {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "30");
    const includeNotes = request.nextUrl.searchParams.get("includeNotes") === "true";

    const logs = await prisma.activityLog.findMany({
      take: Math.min(limit, 100),
      orderBy: { createdAt: "desc" },
      where: includeNotes
        ? undefined
        : {
            action: {
              notIn: [...NOTE_ACTIONS],
            },
          },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true, email: true } },
        patient: { select: { id: true, firstName: true, lastName: true, patientCode: true } },
      },
    });

    return NextResponse.json({ data: logs });
  } catch (error) {
    console.error("[GET /api/activity]", error);
    return serverError();
  }
}
