"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PatientIntakeForm } from "@/components/patient/PatientIntakeForm";
import { useAuth } from "@/hooks/useAuth";

export default function PatientRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  const mode = searchParams.get("mode") === "emergency" ? "EMERGENCY_TEMPORARY" : "NORMAL";
  const canRegisterNormal = user?.role === "ADMIN";
  const canRegisterEmergency = user?.role === "ADMIN" || user?.role === "DOCTOR" || user?.role === "NURSE";

  useEffect(() => {
    if (loading) return;

    if (mode === "NORMAL" && !canRegisterNormal) {
      router.replace("/patients/register?mode=emergency");
      return;
    }

    if (!canRegisterEmergency) {
      router.replace("/patients");
    }
  }, [loading, canRegisterNormal, canRegisterEmergency, mode, router]);

  if (loading || !canRegisterEmergency || (mode === "NORMAL" && !canRegisterNormal)) {
    return (
      <AppShell>
        <div className="space-y-4 max-w-4xl animate-pulse">
          <div className="h-6 w-52 bg-gray-100 rounded" />
          <div className="h-28 bg-gray-100 rounded-xl" />
          <div className="h-28 bg-gray-100 rounded-xl" />
          <div className="h-28 bg-gray-100 rounded-xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <nav className="flex items-center gap-1.5 text-sm">
          <Link href="/patients" className="text-gray-400 hover:text-gray-600 transition-colors">
            Patients
          </Link>
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-700 font-medium">
            {mode === "EMERGENCY_TEMPORARY" ? "Emergency Intake" : "Register Patient"}
          </span>
        </nav>

        <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5">
          <h1 className="text-lg font-semibold text-gray-900">
            {mode === "EMERGENCY_TEMPORARY" ? "Emergency Temporary Intake" : "Administrative Patient Registration"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "EMERGENCY_TEMPORARY"
              ? "Create a temporary patient identity so care can start immediately. Admissions/admin can complete official registration later."
              : "Admissions/admin registers patient identity and admission details before medical ownership starts."}
          </p>
        </div>

        <PatientIntakeForm
          userRole={user?.role}
          initialMode={mode}
          onSuccess={(patientId) => router.push(`/patients/${patientId}`)}
        />
      </div>
    </AppShell>
  );
}
