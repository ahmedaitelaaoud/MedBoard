"use client";

import { useRouter } from "next/navigation";
import { Badge, statusToBadgeVariant } from "@/components/ui/Badge";
import { ROOM_STATUS_LABELS } from "@/lib/constants";
import type { RoomWithPatient } from "@/types/domain";

interface RoomCardProps {
  room: RoomWithPatient;
}

const borderLeftColors: Record<string, string> = {
  OCCUPIED: "border-l-blue-400",
  CRITICAL: "border-l-red-400",
  DISCHARGE_READY: "border-l-green-400",
  UNDER_OBSERVATION: "border-l-amber-400",
  EMPTY: "border-l-gray-200",
  UNAVAILABLE: "border-l-gray-300",
};

export function RoomCard({ room }: RoomCardProps) {
  const router = useRouter();
  const patient = room.patients[0];
  const isOccupied = room.status !== "EMPTY" && room.status !== "UNAVAILABLE";

  const handleClick = () => {
    if (patient) {
      router.push(`/patients/${patient.id}`);
    }
  };

  return (
    <div
      onClick={isOccupied ? handleClick : undefined}
      className={`
        bg-white border border-gray-100 rounded-xl shadow-card p-4
        border-l-[3px] ${borderLeftColors[room.status] || "border-l-gray-200"}
        ${isOccupied ? "hover:shadow-card-hover hover:border-gray-200 cursor-pointer" : ""}
        ${room.status === "UNAVAILABLE" ? "opacity-50" : ""}
        transition-all duration-200 min-h-[120px] flex flex-col justify-between
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">{room.number}</p>
          <p className="text-2xs text-gray-400 mt-0.5">{room.ward.name}</p>
        </div>
        <Badge variant={statusToBadgeVariant(room.status)} dot>
          {ROOM_STATUS_LABELS[room.status as keyof typeof ROOM_STATUS_LABELS] || room.status}
        </Badge>
      </div>

      {/* Patient info */}
      {patient ? (
        <div className="mt-auto">
          <p className="text-sm font-medium text-gray-800 truncate">
            {patient.firstName} {patient.lastName}
          </p>
          {patient.assignments?.doctor && (
            <p className="text-2xs text-gray-400 mt-1 truncate">
              Dr. {patient.assignments.doctor.lastName}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-auto">
          <p className="text-xs text-gray-300 italic">
            {room.status === "UNAVAILABLE" ? "Unavailable" : "No patient"}
          </p>
        </div>
      )}

      {/* Updated at */}
      <p className="text-2xs text-gray-300 mt-2">
        {new Date(room.updatedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}
