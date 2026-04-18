import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { unauthorized, notFound, serverError, badRequest } from "@/lib/errors";
import { roomUpdateSchema } from "@/lib/validation/room";
import { logActivity } from "@/lib/activity-logger";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    try {
      requirePermission(user, "room:manage");
    } catch {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = roomUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Entrée invalide", parsed.error.flatten());
    }

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return notFound("Chambre introuvable");

    const updated = await prisma.room.update({
      where: { id },
      data: parsed.data,
    });

    logActivity({
      action: "STATUS_CHANGED",
      userId: user.id,
      details: `Room ${room.number} status changed to ${parsed.data.status}`,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PATCH /api/rooms/[id]]", error);
    return serverError();
  }
}
