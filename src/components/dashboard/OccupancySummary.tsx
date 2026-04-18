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
    { label: "Total Rooms", value: total, color: "text-gray-900 dark:text-slate-100", borderColor: "border-l-gray-300 dark:border-l-slate-500", bg: "bg-white dark:bg-slate-900" },
    { label: "Occupied", value: occupied, color: "text-blue-600 dark:text-blue-300", borderColor: "border-l-blue-400 dark:border-l-blue-500", bg: "bg-blue-50/50 dark:bg-blue-900/20" },
    { label: "Critical", value: critical, color: "text-red-600 dark:text-red-300", borderColor: "border-l-red-400 dark:border-l-red-500", bg: "bg-red-50/50 dark:bg-red-900/20" },
    { label: "Observation", value: observation, color: "text-amber-600 dark:text-amber-300", borderColor: "border-l-amber-400 dark:border-l-amber-500", bg: "bg-amber-50/50 dark:bg-amber-900/20" },
    { label: "Discharge Ready", value: dischargeReady, color: "text-emerald-600 dark:text-emerald-300", borderColor: "border-l-emerald-400 dark:border-l-emerald-500", bg: "bg-emerald-50/50 dark:bg-emerald-900/20" },
    { label: "Available", value: empty, color: "text-gray-400 dark:text-slate-400", borderColor: "border-l-gray-200 dark:border-l-slate-600", bg: "bg-white dark:bg-slate-900" },
  ];

  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`${stat.bg} border border-gray-100 dark:border-slate-800 border-l-[3px] ${stat.borderColor} rounded-lg px-4 py-3 transition-colors`}
        >
          <p className={`text-xl font-semibold ${stat.color}`}>{stat.value}</p>
          <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 font-medium">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
