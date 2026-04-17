import { Avatar } from "@/components/ui/Avatar";
import type { ActivityLogItem } from "@/types/domain";

interface ActivityFeedProps {
  activities: ActivityLogItem[];
  loading?: boolean;
}

const actionIcons: Record<string, string> = {
  PATIENT_ADMITTED: "🏥",
  PATIENT_DISCHARGED: "🚪",
  NOTE_CREATED: "📝",
  NOTE_UPDATED: "✏️",
  RECORD_UPDATED: "📋",
  STATUS_CHANGED: "🔄",
  ROOM_ASSIGNED: "🛏️",
  ROOM_TRANSFERRED: "↔️",
  ASSIGNMENT_CHANGED: "👤",
  LOGIN: "🔑",
  LOGOUT: "👋",
};

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
            <div className="w-7 h-7 bg-gray-100 rounded-full" />
            <div className="flex-1">
              <div className="w-48 h-4 bg-gray-100 rounded" />
              <div className="w-24 h-3 bg-gray-50 rounded mt-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return <p className="text-sm text-gray-400 italic py-4">No recent activity</p>;
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-100"
        >
          <Avatar firstName={activity.user.firstName} lastName={activity.user.lastName} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700">
              <span className="mr-1.5">{actionIcons[activity.action] || "•"}</span>
              {activity.details || activity.action}
            </p>
            <p className="text-2xs text-gray-400 mt-0.5">
              {new Date(activity.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {activity.patient && (
                <span> · {activity.patient.firstName} {activity.patient.lastName}</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
