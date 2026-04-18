"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/lib/constants";

interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  active: boolean;
  specialty?: string;
  isAvailable?: boolean;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/staff");
        if (res.ok) {
          const json = await res.json();
          setStaff(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch staff:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const doctors = staff.filter((s) => s.role === "DOCTOR");
  const nurses = staff.filter((s) => s.role === "NURSE");
  const others = staff.filter((s) => s.role !== "DOCTOR" && s.role !== "NURSE");

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "DOCTOR": return "info";
      case "NURSE": return "success";
      case "ADMIN": return "warning";
      default: return "muted";
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-5xl">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Annuaire du personnel</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{staff.length} membres de l’équipe</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="h-[88px] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Doctors */}
            {doctors.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Médecins ({doctors.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {doctors.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3.5 px-4 py-3.5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-150"
                    >
                      <Avatar firstName={member.firstName} lastName={member.lastName} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                          Dr. {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
                          {member.specialty || "Médecine générale"}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge
                            variant={member.isAvailable ? "success" : "muted"}
                            dot
                            className="text-[10px] px-1.5 py-0"
                          >
                            {member.isAvailable ? "Disponible" : "Indisponible"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nurses */}
            {nurses.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Infirmiers(ères) ({nurses.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {nurses.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3.5 px-4 py-3.5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-150"
                    >
                      <Avatar firstName={member.firstName} lastName={member.lastName} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="success" className="text-[10px] px-1.5 py-0">Infirmier(ère)</Badge>
                          <Badge
                            variant={member.active ? "success" : "muted"}
                            dot
                            className="text-[10px] px-1.5 py-0"
                          >
                            {member.active ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Staff */}
            {others.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Autre personnel ({others.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {others.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3.5 px-4 py-3.5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-150"
                    >
                      <Avatar firstName={member.firstName} lastName={member.lastName} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant={roleBadgeVariant(member.role) as "info" | "success" | "warning" | "muted"} className="text-[10px] px-1.5 py-0">
                            {ROLE_LABELS[member.role as Role] || member.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
