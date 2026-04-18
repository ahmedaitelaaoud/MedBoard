import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { unauthorized, badRequest, serverError } from "@/lib/errors";

const prismaWithChat = prisma as typeof prisma & {
  directMessage: {
    findMany: (...args: unknown[]) => Promise<unknown[]>;
    updateMany: (...args: unknown[]) => Promise<unknown>;
    create: (...args: unknown[]) => Promise<unknown>;
  };
};

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    try {
      requirePermission(user, "chat:read");
    } catch {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    const withUserId = request.nextUrl.searchParams.get("withUserId");
    if (!withUserId) {
      return badRequest("withUserId est requis");
    }

    const target = await prisma.user.findFirst({
      where: {
        id: withUserId,
        active: true,
        role: { in: ["DOCTOR", "NURSE"] },
      },
      select: { id: true },
    });

    if (!target) {
      return badRequest("Destinataire du chat introuvable");
    }

    const messages = await prismaWithChat.directMessage.findMany({
      where: {
        OR: [
          { senderId: user.id, recipientId: withUserId },
          { senderId: withUserId, recipientId: user.id },
        ],
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        recipient: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    await prismaWithChat.directMessage.updateMany({
      where: {
        senderId: withUserId,
        recipientId: user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ data: messages });
  } catch (error) {
    console.error("[GET /api/chat/messages]", error);
    return serverError();
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    try {
      requirePermission(user, "chat:send");
    } catch {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    const body = await request.json();
    const recipientId = typeof body.recipientId === "string" ? body.recipientId.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!recipientId) {
      return badRequest("recipientId est requis");
    }

    if (recipientId === user.id) {
      return badRequest("Impossible d'envoyer un message à vous-même");
    }

    if (!content) {
      return badRequest("Le contenu du message est obligatoire");
    }

    if (content.length > 1500) {
      return badRequest("Le message est trop long");
    }

    const target = await prisma.user.findFirst({
      where: {
        id: recipientId,
        active: true,
        role: { in: ["DOCTOR", "NURSE"] },
      },
      select: { id: true },
    });

    if (!target) {
      return badRequest("Destinataire introuvable");
    }

    const message = await prismaWithChat.directMessage.create({
      data: {
        senderId: user.id,
        recipientId,
        content,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        recipient: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/chat/messages]", error);
    return serverError();
  }
}
