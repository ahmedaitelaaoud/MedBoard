import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity-logger";

interface DispatchNotificationInput {
  recipientUserId: string;
  title: string;
  message: string;
  type?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actorUserId: string;
  patientId?: string;
}

export async function dispatchAgentNotification(input: DispatchNotificationInput) {
  const notification = await prisma.agentNotification.create({
    data: {
      recipientUserId: input.recipientUserId,
      type: input.type ?? "AGENT_ROUTING_ASSIGNED",
      title: input.title,
      message: input.message,
      relatedEntityType: input.relatedEntityType ?? null,
      relatedEntityId: input.relatedEntityId ?? null,
    },
  });

  logActivity({
    action: "AGENT_NOTIFICATION_CREATED",
    userId: input.actorUserId,
    patientId: input.patientId,
    details: `Notification agent creee pour utilisateur ${input.recipientUserId}`,
    metadata: {
      notificationId: notification.id,
      type: notification.type,
      relatedEntityType: notification.relatedEntityType,
      relatedEntityId: notification.relatedEntityId,
    },
  }).catch(() => {
    // Notification created successfully; activity logging failures are non-blocking.
  });

  return notification;
}
