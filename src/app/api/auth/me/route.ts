import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { unauthorized } from "@/lib/errors";

export async function GET() {
  const user = await getSession();
  if (!user) return unauthorized();
  return NextResponse.json({ user });
}
