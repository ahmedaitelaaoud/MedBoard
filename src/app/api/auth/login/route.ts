import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createToken, getSessionCookieName } from "@/lib/auth";
import { loginSchema } from "@/lib/validation/auth";
import { logActivity } from "@/lib/activity-logger";
import { badRequest, serverError } from "@/lib/errors";
import type { Role } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Entrée invalide", parsed.error.flatten());
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.password !== password || !user.active) {
      return badRequest("Email ou mot de passe invalide");
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as Role,
    };

    const token = await createToken(sessionUser);

    // Log the login
    logActivity({
      action: "LOGIN",
      userId: user.id,
      details: `${user.firstName} ${user.lastName} logged in`,
    });

    const response = NextResponse.json({ user: sessionUser });
    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return serverError();
  }
}
