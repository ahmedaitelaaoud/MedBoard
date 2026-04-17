"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { DemographicsCard } from "@/components/patient/DemographicsCard";
import { ClinicalSummary } from "@/components/patient/ClinicalSummary";
import { NotesTimeline } from "@/components/patient/NotesTimeline";
import { DocumentsPlaceholder } from "@/components/patient/DocumentsPlaceholder";
import { NoteEditor } from "@/components/notes/NoteEditor";
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
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-100 rounded-xl" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-64 bg-gray-100 rounded-xl" />
            <div className="h-64 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!patient) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <p className="text-gray-500">Patient not found</p>
          <Link href="/dashboard" className="text-sm text-brand-500 hover:underline mt-2 inline-block">
            Back to dashboard
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/dashboard" className="hover:text-gray-600 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-700">{patient.firstName} {patient.lastName}</span>
        </nav>

        {/* Patient header */}
        <PatientHeader patient={patient} />

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — demographics + documents */}
          <div className="space-y-6">
            <DemographicsCard patient={patient} />
            <DocumentsPlaceholder documents={patient.documents} />
          </div>

          {/* Right column — clinical + notes */}
          <div className="lg:col-span-2 space-y-6">
            <ClinicalSummary record={patient.medicalRecord} />

            {/* Note editor (only for doctors and nurses) */}
            {canAddNotes && patient.medicalRecord && (
              <NoteEditor
                medicalRecordId={patient.medicalRecord.id}
                userRole={user!.role}
                onNoteCreated={fetchPatient}
              />
            )}

            {patient.medicalRecord && (
              <NotesTimeline notes={patient.medicalRecord.notes} />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
