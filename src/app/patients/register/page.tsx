"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PatientIntakeForm } from "@/components/patient/PatientIntakeForm";
import { useAuth } from "@/hooks/useAuth";

export default function PatientRegisterPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"NORMAL" | "EMERGENCY_TEMPORARY">("NORMAL");

  const canRegisterNormal = user?.role === "ADMIN";
  const canRegisterEmergency = user?.role === "ADMIN" || user?.role === "DOCTOR" || user?.role === "NURSE";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setMode(params.get("mode") === "emergency" ? "EMERGENCY_TEMPORARY" : "NORMAL");
  }, []);

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
          <div className="h-6 w-52 bg-gray-100 dark:bg-slate-800 rounded" />
          <div className="h-28 bg-gray-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-28 bg-gray-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-28 bg-gray-100 dark:bg-slate-800 rounded-xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <nav className="flex items-center gap-1.5 text-sm">
          <Link href="/patients" className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
            Patients
          </Link>
          <svg className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-700 dark:text-slate-200 font-medium">
            {mode === "EMERGENCY_TEMPORARY" ? "Admission d'urgence" : "Enregistrer un patient"}
          </span>
        </nav>

        <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            {mode === "EMERGENCY_TEMPORARY" ? "Admission d'urgence temporaire" : "Enregistrement administratif du patient"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {mode === "EMERGENCY_TEMPORARY"
              ? "Créez une identité patient temporaire pour démarrer les soins immédiatement. L'admission/admin peut compléter l'enregistrement officiel plus tard."
              : "L'admission/admin enregistre l'identité du patient et les détails d'admission avant le début de la prise en charge médicale."}
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
