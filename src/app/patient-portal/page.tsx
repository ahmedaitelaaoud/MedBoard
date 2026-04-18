"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { PatientProfileCard } from "@/components/patient-portal/PatientProfileCard";
import { PatientScheduleList } from "@/components/patient-portal/PatientScheduleList";

interface PatientPortalData {
  profile: {
    fullName: string;
    patientCode: string;
    dateOfBirth: string;
    sex: string;
    admissionDate: string;
    roomNumber: string | null;
    wardName: string | null;
    floorName: string | null;
    attendingDoctorName: string;
    assignedNurseName: string;
    emergencyContact: string | null;
  };
  schedule: Array<{
    id: string;
    title: string;
    scheduledAt: string;
    type: string;
    notes: string | null;
  }>;
}

export default function PatientPortalPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { theme, toggleTheme, mounted } = useTheme();

  const [data, setData] = useState<PatientPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPatientRole = user?.role === "PATIENT" || user?.role === "READONLY";

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!isPatientRole) {
      router.replace("/dashboard");
      return;
    }

    async function loadPortalData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/patient-portal");
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || "Unable to load your portal information");
          return;
        }

        setData(json.data);
      } catch {
        setError("Unable to load your portal information");
      } finally {
        setLoading(false);
      }
    }

    loadPortalData();
  }, [authLoading, user, isPatientRole, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 px-6 py-8 sm:px-8 transition-colors duration-200">
        <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
          <div className="h-10 bg-gray-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-56 bg-gray-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-48 bg-gray-100 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 px-6 py-8 sm:px-8 transition-colors duration-200">
        <div className="max-w-3xl mx-auto rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-5 transition-colors duration-200">
          <h1 className="text-base font-semibold text-gray-900 dark:text-slate-100">Patient Portal</h1>
          <p className="text-sm text-red-600 mt-3">{error || "Unable to load portal information"}</p>
          <div className="mt-4">
            <Button variant="danger" onClick={logout}>Sign out</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 px-6 py-8 sm:px-8 transition-colors duration-200">
      <div className="max-w-3xl mx-auto space-y-5">
        <header className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 transition-colors duration-200">
          <div>
            <p className="text-xs text-gray-400 dark:text-slate-500">MedBoard</p>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Patient Portal</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              title="Toggle night mode"
              aria-label="Toggle night mode"
            >
              {!mounted || theme === "light" ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1.5m0 15V21m9-9h-1.5m-15 0H3m15.364 6.364l-1.06-1.06M6.697 6.697l-1.06-1.06m12.727 0l-1.06 1.06M6.697 17.303l-1.06 1.06M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                </svg>
              )}
              <span>{!mounted ? "Theme" : theme === "dark" ? "Night" : "Day"}</span>
            </button>
            <Button variant="danger" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </header>

        <PatientProfileCard profile={data.profile} />
        <PatientScheduleList schedule={data.schedule} />
      </div>
    </div>
  );
}
