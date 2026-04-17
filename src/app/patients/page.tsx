"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusToBadgeVariant } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { PATIENT_STATUS_LABELS } from "@/lib/constants";

interface Patient {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  status: string;
  room: { number: string; floor: { name: string }; ward: { name: string } } | null;
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
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
  }, [search]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Patients</h1>
            <p className="text-sm text-gray-500 mt-0.5">{patients.length} patients</p>
          </div>
          <div className="w-64">
            <SearchInput
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">No patients found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {patients.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/patients/${p.id}`)}
                className="flex items-center gap-3.5 px-4 py-3.5 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all duration-150 cursor-pointer group"
              >
                <Avatar firstName={p.firstName} lastName={p.lastName} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-brand-700 transition-colors">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.patientCode}</p>
                </div>
                <Badge variant={statusToBadgeVariant(p.status)} className="text-[10px]">
                  {PATIENT_STATUS_LABELS[p.status as keyof typeof PATIENT_STATUS_LABELS]}
                </Badge>
                {p.room && (
                  <span className="text-xs text-gray-400">Room {p.room.number}</span>
                )}
                <svg className="w-4 h-4 text-gray-300 group-hover:text-brand-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
