interface PatientScheduleItem {
  id: string;
  title: string;
  scheduledAt: string;
  type: string;
  notes: string | null;
}

interface PatientScheduleListProps {
  schedule: PatientScheduleItem[];
}

function typeToStyles(type: string): { dot: string; label: string; card: string } {
  if (type === "DOCTOR_VISIT") {
    return {
      dot: "bg-blue-500",
      label: "text-blue-700 dark:text-blue-300",
      card: "border-blue-100 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-900/15",
    };
  }

  if (type === "NURSE_VISIT") {
    return {
      dot: "bg-emerald-500",
      label: "text-emerald-700 dark:text-emerald-300",
      card: "border-emerald-100 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-900/15",
    };
  }

  return {
    dot: "bg-amber-500",
    label: "text-amber-700 dark:text-amber-300",
    card: "border-amber-100 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-900/15",
  };
}

function formatScheduleDate(value: string): { day: string; time: string } {
  const date = new Date(value);

  const day = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return { day, time };
}

export function PatientScheduleList({ schedule }: PatientScheduleListProps) {
  return (
    <section className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-5 transition-colors duration-200">
      <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Upcoming Schedule</h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Your planned visits and routine checks.</p>

      {schedule.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-5">No upcoming visits scheduled yet.</p>
      ) : (
        <ol className="mt-5 space-y-3">
          {schedule.map((item) => {
            const formatted = formatScheduleDate(item.scheduledAt);
            const styles = typeToStyles(item.type);
            return (
              <li key={item.id} className={`rounded-xl border px-4 py-3 ${styles.card}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{item.title}</p>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] ${styles.label}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                    {item.type === "DOCTOR_VISIT" ? "Doctor" : item.type === "NURSE_VISIT" ? "Nurse" : "Checkup"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {formatted.day} at {formatted.time}
                </p>
                {item.notes && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5">{item.notes}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
