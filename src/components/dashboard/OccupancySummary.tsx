import type { RoomWithPatient } from "@/types/domain";

interface OccupancySummaryProps {
  rooms: RoomWithPatient[];
}

export function OccupancySummary({ rooms }: OccupancySummaryProps) {
  const total = rooms.length;
  const occupied = rooms.filter((r) => r.status === "OCCUPIED").length;
  const critical = rooms.filter((r) => r.status === "CRITICAL").length;
  const dischargeReady = rooms.filter((r) => r.status === "DISCHARGE_READY").length;
  const empty = rooms.filter((r) => r.status === "EMPTY").length;
  const observation = rooms.filter((r) => r.status === "UNDER_OBSERVATION").length;

  const stats = [
    { label: "Total", value: total, color: "text-gray-900" },
    { label: "Occupied", value: occupied, color: "text-blue-600" },
    { label: "Critical", value: critical, color: "text-red-600" },
    { label: "Observation", value: observation, color: "text-amber-600" },
    { label: "Discharge Ready", value: dischargeReady, color: "text-green-600" },
    { label: "Empty", value: empty, color: "text-gray-400" },
  ];

  return (
    <div className="flex items-center gap-6">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
          <p className="text-2xs text-gray-400 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
