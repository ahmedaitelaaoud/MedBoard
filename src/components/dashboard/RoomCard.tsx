"use client";

import { useRouter } from "next/navigation";
import { ROOM_STATUS_LABELS } from "@/lib/constants";
import type { RoomWithPatient } from "@/types/domain";

interface RoomCardProps {
  room: RoomWithPatient;
}

const statusColors: Record<string, string> = {
  OCCUPIED: "text-blue-700",
  CRITICAL: "text-red-700",
  DISCHARGE_READY: "text-green-700",
  UNDER_OBSERVATION: "text-amber-700",
  EMPTY: "text-gray-700",
  UNAVAILABLE: "text-gray-700",
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

const admDate = patient
    ? new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';

  return (
    <div
      onClick={isOccupied ? handleClick : undefined}
      className={`
        w-full flex h-[130px] rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden
        ${isOccupied ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
      `}
    >
      {/* Left side: Picture */}
      <div className="shrink-0 w-[110px] bg-slate-100 flex items-center justify-center relative border-r border-gray-100 text-gray-400">
        {patient ? (
          <div className="flex flex-col items-center justify-center gap-1">
             <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
             </svg>
             <span className="text-xs font-medium">picture</span>
          </div>
        ) : (
          <span className="text-gray-400 text-xs font-semibold">Vacant</span>
        )}
      </div>

      {/* Right side: Info */}
      <div className="flex-1 p-3.5 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-gray-800 text-[14px]">
              {patient ? `${patient.firstName} ${patient.lastName}` : `Room ${room.number}`}
            </h3>
            <button className="text-gray-400 hover:text-gray-600 px-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
          <div className="text-[12px] text-gray-400 mt-0.5">
            {patient ? (ROOM_STATUS_LABELS[room.status as keyof typeof ROOM_STATUS_LABELS] || room.status) : "Ready for admission"}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          {patient ? (
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
              Admitted : <span className="font-medium text-gray-600">{admDate}</span>
            </div>
          ) : (
             <div className="text-[11px] text-gray-500 opacity-0">Placeholder</div>
          )}

          <div className="flex justify-between items-center text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5">
              Room : <span className={`font-bold ${statusColors[room.status] || "text-gray-700"}`}>{room.number}</span>
            </div>
            <div className="bg-blue-50 p-1 rounded text-blue-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
