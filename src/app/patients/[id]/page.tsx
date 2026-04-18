"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { DemographicsCard } from "@/components/patient/DemographicsCard";
import { AdministrativePanel } from "@/components/patient/AdministrativePanel";
import { ClinicalSummary } from "@/components/patient/ClinicalSummary";
import { NotesTimeline } from "@/components/patient/NotesTimeline";
import { DocumentsPlaceholder } from "@/components/patient/DocumentsPlaceholder";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { AgentSuggestionsPanel } from "@/components/patient/AgentSuggestionsPanel";
import { useAuth } from "@/hooks/useAuth";
import { canCreateNoteType } from "@/lib/permissions";
import type { PatientFull } from "@/types/domain";
import type { Role } from "@/lib/constants";

export default function PatientPage() {
  const params = useParams();
  const patientId = params.id as string;
  const { user } = useAuth();
  const [patient, setPatient] = useState<PatientFull | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPatient = useCallback(async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      if (res.ok) {
        const json = await res.json();
        setPatient(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch patient:", err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  const canAddNotes = user && canCreateNoteType(user.role as Role, "OBSERVATION");

  if (loading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-6 max-w-5xl">
          <div className="h-4 w-32 bg-gray-100 dark:bg-slate-800 rounded" />
          <div className="h-28 bg-gray-100 dark:bg-slate-800 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-100 dark:bg-slate-800 rounded-xl" />
            <div className="lg:col-span-2 h-64 bg-gray-100 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!patient) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-gray-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">Patient introuvable</p>
          <Link href="/dashboard" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            ← Retour au tableau de bord
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm">
          <Link href="/dashboard" className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">Tableau de bord</Link>
          <svg className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-700 dark:text-slate-200 font-medium">{patient.firstName} {patient.lastName}</span>
        </nav>

        {/* Patient header */}
        <PatientHeader patient={patient} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link
            href={`/agent/diagnostic?patientId=${patient.id}&patientName=${encodeURIComponent(`${patient.firstName} ${patient.lastName}`)}&patientCode=${patient.patientCode}`}
            className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-900/15 px-4 py-3 hover:border-blue-200 dark:hover:border-blue-800/60 transition-colors"
          >
            <p className="text-xs text-blue-600 dark:text-blue-300">Future AI workflow</p>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mt-0.5">Diagnostic upload et suggestions médecin</p>
            <p className="text-xs text-blue-700/80 dark:text-blue-200/80 mt-1">Simuler upload, analyse IA et validation clinique.</p>
          </Link>

          <Link
            href={`/agent/schedule?patientId=${patient.id}&patientName=${encodeURIComponent(`${patient.firstName} ${patient.lastName}`)}&patientCode=${patient.patientCode}`}
            className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/15 px-4 py-3 hover:border-emerald-200 dark:hover:border-emerald-800/60 transition-colors"
          >
            <p className="text-xs text-emerald-600 dark:text-emerald-300">Future AI workflow</p>
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mt-0.5">Suggestion planning et synchronisation portail patient</p>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-200/80 mt-1">Simuler approbation partielle et reflet instantané côté patient.</p>
          </Link>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — demographics + documents */}
          <div className="space-y-6">
            <AdministrativePanel patient={patient} userRole={user?.role} onUpdated={fetchPatient} />
            <DemographicsCard patient={patient} />
            <DocumentsPlaceholder
              documents={patient.documents}
              patientId={patient.id}
              userRole={user?.role as Role | undefined}
              onUploaded={fetchPatient}
            />
          </div>

          {/* Right column — clinical + notes */}
          <div className="lg:col-span-2 space-y-6">
            {user?.role === "DOCTOR" && <AgentSuggestionsPanel patientId={patient.id} />}

            <ClinicalSummary record={patient.medicalRecord} patientId={patient.id} userRole={user?.role} onUpdate={fetchPatient} />

            {/* Note editor (only for doctors and nurses) */}
            {canAddNotes && patient.medicalRecord && (
              <NoteEditor
                medicalRecordId={patient.medicalRecord.id}
                userRole={user!.role}
                onNoteCreated={fetchPatient}
              />
            )}

            {patient.medicalRecord && (
              <NotesTimeline notes={patient.medicalRecord.notes} userId={user?.id} userRole={user?.role} onUpdate={fetchPatient} />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
