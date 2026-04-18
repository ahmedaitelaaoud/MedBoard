"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusToBadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { useAuth } from "@/hooks/useAuth";
import { PATIENT_STATUS_LABELS, REGISTRATION_STATUS_LABELS } from "@/lib/constants";

interface Patient {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  status: string;
  registrationStatus: "PENDING" | "REGISTERED" | "TEMPORARY" | "COMPLETED";
  intakeType: "NORMAL" | "EMERGENCY_TEMPORARY";
  hasMedicalRecord: boolean;
  room: { number: string; floor: { name: string }; ward: { name: string } } | null;
}

function registrationToVariant(status: Patient["registrationStatus"]): "warning" | "success" | "info" {
  if (status === "TEMPORARY") return "warning";
  if (status === "COMPLETED") return "success";
  return "info";
}

export default function PatientsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const canViewPatients =
    user?.role === "DOCTOR" ||
    user?.role === "NURSE" ||
    user?.role === "ADMIN";

  const canRegisterNormal = user?.role === "ADMIN";
  const canRegisterEmergency = user?.role === "ADMIN" || user?.role === "DOCTOR" || user?.role === "NURSE";

  useEffect(() => {
    if (!authLoading && !canViewPatients) {
      router.replace("/dashboard");
    }
  }, [authLoading, canViewPatients, router]);

  useEffect(() => {
    if (authLoading || !canViewPatients) return;

    async function load() {
      setLoading(true);
      try {
        const params = search ? `?search=${encodeURIComponent(search)}` : "";
        const res = await fetch(`/api/patients${params}`);
        if (res.ok) {
          const json = await res.json();
          setPatients(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch patients:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [search, authLoading, canViewPatients]);

  if (authLoading || !canViewPatients) {
    return (
      <AppShell>
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Patients</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              {user?.role === "DOCTOR"
                ? `${patients.length} de vos patients actuels et passés`
                : `${patients.length} patients dans le registre`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-64">
              <SearchInput
                placeholder="Rechercher des patients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch("")}
              />
            </div>
            {canRegisterNormal && (
              <Button size="sm" onClick={() => router.push("/patients/register")}>Enregistrer un patient</Button>
            )}
            {canRegisterEmergency && (
              <Button size="sm" variant="secondary" onClick={() => router.push("/patients/register?mode=emergency")}>Admission d'urgence</Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400 dark:text-slate-500">Aucun patient trouvé</p>
          </div>
        ) : (
          <div className="space-y-2">
            {patients.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/patients/${p.id}`)}
                className="flex items-center gap-3.5 px-4 py-3.5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-150 cursor-pointer group"
              >
                <Avatar firstName={p.firstName} lastName={p.lastName} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{p.patientCode}</p>
                </div>
                <Badge variant={registrationToVariant(p.registrationStatus)} className="text-[10px]">
                  {REGISTRATION_STATUS_LABELS[p.registrationStatus]}
                </Badge>
                <Badge variant={statusToBadgeVariant(p.status)} className="text-[10px]">
                  {PATIENT_STATUS_LABELS[p.status as keyof typeof PATIENT_STATUS_LABELS] || p.status}
                </Badge>
                {!p.hasMedicalRecord && (
                  <Badge variant="warning" className="text-[10px]">Dossier médical manquant</Badge>
                )}
                {p.room && (
                  <span className="text-xs text-gray-400 dark:text-slate-500">Chambre {p.room.number}</span>
                )}
                <svg className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-brand-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
