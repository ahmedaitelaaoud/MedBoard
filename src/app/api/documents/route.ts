import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { unauthorized, badRequest, serverError } from "@/lib/errors";
import { logActivity } from "@/lib/activity-logger";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user) return unauthorized();

    try {
      requirePermission(user, "document:upload");
    } catch {
      return NextResponse.json({ error: "Only doctors can upload documents" }, { status: 403 });
    }

    const formData = await request.formData();
    const patientId = String(formData.get("patientId") || "").trim();
    const file = formData.get("file");

    if (!patientId) return badRequest("Missing patientId");
    if (!(file instanceof File)) return badRequest("Missing file");
    if (file.size === 0) return badRequest("Empty file");
    if (file.size > 10 * 1024 * 1024) return badRequest("File too large (max 10MB)");

    const patient = await prisma.patient.findUnique({ where: { id: patientId }, select: { id: true } });
    if (!patient) return badRequest("Patient not found");

    const originalName = sanitizeFilename(file.name || "document");
    const timestamp = Date.now();
    const filename = `${timestamp}-${originalName}`;

    const relativeDir = path.join("uploads", "patients", patientId);
    const absoluteDir = path.join(process.cwd(), "public", relativeDir);
    await mkdir(absoluteDir, { recursive: true });

    const absolutePath = path.join(absoluteDir, filename);
    const fileBytes = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, fileBytes);

    const url = `/${relativeDir}/${filename}`.replace(/\\/g, "/");

    const document = await prisma.document.create({
      data: {
        name: originalName,
        type: file.type || "application/octet-stream",
        url,
        patientId,
        uploadedBy: user.id,
      },
      select: {
        id: true,
        name: true,
        type: true,
        url: true,
        createdAt: true,
      },
    });

    logActivity({
      action: "RECORD_UPDATED",
      userId: user.id,
      patientId,
      details: `${user.firstName} ${user.lastName} uploaded document ${originalName}`,
    });

    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/documents]", error);
    return serverError();
  }
}
