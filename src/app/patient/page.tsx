"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PATIENT_STATUS_LABELS, Role } from "@/lib/constants";
import { Badge, statusToBadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface TeamMember {
  firstName: string;
  lastName: string;
  email: string;
}

interface PortalPatient {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  status: string;
  allergies: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  admissionDate: string;
  room: { number: string; floor: { name: string }; ward: { name: string } } | null;
  diagnosisSummary: string | null;
  currentPlan: string | null;
  assignedTeam: {
    doctor: TeamMember | null;
    nurse: TeamMember | null;
  };
}

interface ScheduleItem {
  id: string;
  dayKey: string;
  dayLabel: string;
  dateLabel: string;
  timeLabel: string;
  scheduledAt: string;
  staffRole: "DOCTOR" | "NURSE";
  staffName: string;
  title: string;
  details: string;
  source: "planned" | "task";
}

interface PortalData {
  patient: PortalPatient;
  schedule: ScheduleItem[];
}

const DAY_WINDOW = 5;

function dayKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayLabelFromDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function dateLabelFromDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default function PatientPortalPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== Role.PATIENT) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user || user.role !== Role.PATIENT) return;

    async function loadPortal() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/patient-portal");
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (res.status === 403) {
          setError("Your account does not have patient portal access.");
          return;
        }

        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Failed to load your profile.");
          return;
        }

        setData(json.data);
      } catch {
        setError("Network error while loading your care information.");
      } finally {
        setLoading(false);
      }
    }

    loadPortal();
  }, [authLoading, user, router]);

  const upcomingDays = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    return Array.from({ length: DAY_WINDOW }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return {
        dayKey: dayKeyFromDate(day),
        dayLabel: dayLabelFromDate(day),
        dateLabel: dateLabelFromDate(day),
      };
    });
  }, []);

  const scheduleByDay = useMemo(() => {
    const grouped = new Map<string, ScheduleItem[]>();
    for (const day of upcomingDays) grouped.set(day.dayKey, []);

    if (data?.schedule) {
      for (const item of data.schedule) {
        const bucket = grouped.get(item.dayKey);
        if (bucket) bucket.push(item);
      }
    }

    grouped.forEach((bucket) => {
      bucket.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    });

    return grouped;
  }, [data, upcomingDays]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
          <div className="h-14 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800" />
          <div className="h-56 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-56 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Patient Portal</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">{error || "Unable to load your care information."}</p>
          <Button
            onClick={logout}
            variant="danger"
            size="md"
            className="mt-4"
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  const patient = data.patient;
  const patientAge = calculateAge(patient.dateOfBirth);
  const todayKey = upcomingDays[0]?.dayKey;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6 page-enter">
        <header className="bg-gradient-to-r from-brand-50 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">MedBoard</p>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">My Care Portal</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Your profile and upcoming nurse/doctor visits</p>
          </div>
          <Button
            onClick={logout}
            variant="danger"
            size="sm"
          >
            Sign out
          </Button>
        </header>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  {patient.firstName} {patient.lastName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {patient.patientCode} • {patient.sex} • {patientAge} years
                </p>
              </div>
              <Badge variant={statusToBadgeVariant(patient.status)}>
                {PATIENT_STATUS_LABELS[patient.status as keyof typeof PATIENT_STATUS_LABELS] || patient.status}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 px-3 py-2.5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Room</p>
                <p className="font-medium text-gray-900 dark:text-slate-100 mt-0.5">
                  {patient.room ? `Room ${patient.room.number} • ${patient.room.ward.name}` : "Not currently assigned"}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 px-3 py-2.5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Admitted</p>
                <p className="font-medium text-gray-900 dark:text-slate-100 mt-0.5">
                  {new Date(patient.admissionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 px-3 py-2.5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Allergies</p>
                <p className="font-medium text-gray-900 dark:text-slate-100 mt-0.5">{patient.allergies || "None recorded"}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 px-3 py-2.5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Emergency Contact</p>
                <p className="font-medium text-gray-900 dark:text-slate-100 mt-0.5">
                  {patient.emergencyContact ? `${patient.emergencyContact} (${patient.emergencyPhone || "No phone"})` : "Not provided"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Assigned Doctor</p>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mt-1">
                {patient.assignedTeam.doctor
                  ? `Dr. ${patient.assignedTeam.doctor.firstName} ${patient.assignedTeam.doctor.lastName}`
                  : "Not assigned"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Assigned Nurse</p>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mt-1">
                {patient.assignedTeam.nurse
                  ? `${patient.assignedTeam.nurse.firstName} ${patient.assignedTeam.nurse.lastName}`
                  : "Not assigned"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Diagnosis Summary</p>
              <p className="text-sm text-gray-700 dark:text-slate-300 mt-1 leading-relaxed">
                {patient.diagnosisSummary || "Your diagnosis summary will appear here when available."}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Upcoming Visit Schedule</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Next {DAY_WINDOW} days of planned care visits</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="info">Doctor</Badge>
              <Badge variant="success">Nurse</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {upcomingDays.map((day) => {
              const events = scheduleByDay.get(day.dayKey) || [];
              return (
                <div
                  key={day.dayKey}
                  className={`rounded-xl border overflow-hidden bg-white dark:bg-slate-900 ${
                    day.dayKey === todayKey
                      ? "border-brand-200 dark:border-brand-900/50"
                      : "border-gray-200 dark:border-slate-700"
                  }`}
                >
                  <div className={`px-3 py-2.5 border-b ${day.dayKey === todayKey ? "bg-brand-50 dark:bg-brand-900/20 border-brand-100 dark:border-brand-900/40" : "bg-gray-50 dark:bg-slate-800/70 border-gray-100 dark:border-slate-700"}`}>
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{day.dayLabel}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{day.dateLabel}</p>
                  </div>

                  <div className="p-3 min-h-[220px] space-y-2">
                    {events.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-slate-500">No planned visits</p>
                    ) : (
                      events.map((event) => (
                        <article
                          key={event.id}
                          className={
                            event.staffRole === "DOCTOR"
                              ? "rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-2"
                              : "rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-2"
                          }
                        >
                          <p className="text-[11px] font-semibold text-gray-600 dark:text-slate-300">{event.timeLabel}</p>
                          <p
                            className={
                              event.staffRole === "DOCTOR"
                                ? "text-sm font-semibold text-blue-900 dark:text-blue-200"
                                : "text-sm font-semibold text-emerald-900 dark:text-emerald-200"
                            }
                          >
                            {event.title}
                          </p>
                          <p className="text-[11px] text-gray-600 dark:text-slate-300 mt-0.5">with {event.staffName}</p>
                          <p className="text-[11px] text-gray-600 dark:text-slate-300 mt-1 leading-relaxed">{event.details}</p>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
