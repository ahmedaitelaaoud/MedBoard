"use client";

import { useRouter } from "next/navigation";
import { Badge, statusToBadgeVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ROOM_STATUS_LABELS, PATIENT_STATUS_LABELS } from "@/lib/constants";
import type { RoomWithPatient } from "@/types/domain";

interface RoomCardProps {
  room: RoomWithPatient;
}

const statusBorderColors: Record<string, string> = {
  OCCUPIED: "border-l-blue-400",
  CRITICAL: "border-l-red-400",
  DISCHARGE_READY: "border-l-emerald-400",
  UNDER_OBSERVATION: "border-l-amber-400",
  EMPTY: "border-l-gray-200",
  UNAVAILABLE: "border-l-gray-200",
};

export function RoomCard({ room }: RoomCardProps) {
  const router = useRouter();
  const patient = room.patients[0];
  const hasPatient = Boolean(patient);
  const doctor = patient?.assignments?.doctor;

  const handleClick = () => {
    if (patient) {
      router.push(`/patients/${patient.id}`);
    }
  };

  return (
    <div
      onClick={hasPatient ? handleClick : undefined}
      className={`
        bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 border-l-[3px] ${statusBorderColors[room.status] || "border-l-gray-200"}
        rounded-xl overflow-hidden transition-all duration-150
        ${hasPatient ? "cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700" : ""}
      `}
    >
      <div className="px-4 py-3.5">
        {/* Room number + status */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-400 dark:text-slate-400">Room {room.number}</span>
          <Badge variant={statusToBadgeVariant(room.status)} className="text-[10px] px-1.5 py-0">
            {ROOM_STATUS_LABELS[room.status as keyof typeof ROOM_STATUS_LABELS] || room.status}
          </Badge>
        </div>

        {patient ? (
          <>
            {/* Patient info */}
            <div className="flex items-center gap-2.5">
              <Avatar firstName={patient.firstName} lastName={patient.lastName} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                  {patient.firstName} {patient.lastName}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500">{patient.patientCode}</p>
              </div>
            </div>

            {/* Bottom info */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50 dark:border-slate-800">
              <Badge variant={statusToBadgeVariant(patient.status)} className="text-[10px] px-1.5 py-0">
                {PATIENT_STATUS_LABELS[patient.status as keyof typeof PATIENT_STATUS_LABELS] || patient.status}
              </Badge>
              {doctor && (
                <span className="text-[10px] text-gray-400 dark:text-slate-400 truncate max-w-[120px]">
                  Dr. {doctor.firstName} {doctor.lastName}
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-1.5">
                <svg className="w-4 h-4 text-gray-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <p className="text-[10px] text-gray-300 dark:text-slate-500 font-medium">Available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
