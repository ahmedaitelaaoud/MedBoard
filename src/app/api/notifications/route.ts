import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { forbidden, serverError, unauthorized } from "@/lib/errors";
import { requirePermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    try {
      requirePermission(user, "notification:read");
    } catch {
      return forbidden("Acces interdit");
    }

    const includeRead = request.nextUrl.searchParams.get("includeRead") === "true";
    const limitRaw = request.nextUrl.searchParams.get("limit") ?? "20";
    const limit = Number.isNaN(Number(limitRaw)) ? 20 : Math.max(1, Math.min(100, Number(limitRaw)));

    const notifications = await prisma.agentNotification.findMany({
      where: {
        recipientUserId: user.id,
        ...(includeRead ? {} : { readAt: null }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ data: notifications });
  } catch (error) {
    console.error("[GET /api/notifications]", error);
    return serverError("Impossible de charger les notifications");
  }
}
