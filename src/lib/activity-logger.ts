import { prisma } from "./db";
import type { ActivityType } from "./constants";

// ==============================================================================
// Activity Logger
// ==============================================================================
// Logs user actions for the activity feed. Non-blocking — fire and forget.
// ==============================================================================

interface LogEntry {
  action: ActivityType;
  userId: string;
  patientId?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(entry: LogEntry): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action: entry.action,
        userId: entry.userId,
        patientId: entry.patientId ?? null,
        details: entry.details ?? null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      },
    });
  } catch (error) {
    // Non-critical — log but don't throw
    console.error("[ActivityLogger] Failed to log activity:", error);
  }
}
