import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { forbidden, notFound, serverError, unauthorized } from "@/lib/errors";
import { requirePermission } from "@/lib/permissions";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    try {
      requirePermission(user, "notification:update");
    } catch {
      return forbidden("Acces interdit");
    }

    const { id } = await params;

    const notification = await prisma.agentNotification.findUnique({ where: { id } });
    if (!notification) return notFound("Notification introuvable");
    if (notification.recipientUserId !== user.id) {
      return forbidden("Acces interdit");
    }

    const updated = await prisma.agentNotification.update({
      where: { id },
      data: {
        readAt: notification.readAt ?? new Date(),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PATCH /api/notifications/[id]/read]", error);
    return serverError("Impossible de mettre a jour la notification");
  }
}
