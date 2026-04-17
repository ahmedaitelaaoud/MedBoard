"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/lib/constants";

interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  active: boolean;
}

const roleBadgeVariant: Record<string, "info" | "success" | "warning" | "default"> = {
  DOCTOR: "info",
  NURSE: "success",
  ADMIN: "warning",
  READONLY: "default",
};

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

  const grouped = {
    DOCTOR: staff.filter((s) => s.role === "DOCTOR"),
    NURSE: staff.filter((s) => s.role === "NURSE"),
    ADMIN: staff.filter((s) => s.role === "ADMIN"),
    READONLY: staff.filter((s) => s.role === "READONLY"),
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Staff Directory</h1>
          <p className="text-sm text-gray-500 mt-0.5">Team members and their roles</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([role, members]) => (
              members.length > 0 && (
                <Card key={role}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-gray-900">
                        {ROLE_LABELS[role as Role]}s
                      </h2>
                      <span className="text-2xs text-gray-400">{members.length}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-surface-50 border border-gray-50"
                        >
                          <Avatar firstName={member.firstName} lastName={member.lastName} size="md" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {member.role === "DOCTOR" ? "Dr. " : ""}{member.firstName} {member.lastName}
                            </p>
                            <p className="text-2xs text-gray-400 truncate">{member.email}</p>
                          </div>
                          <Badge variant={roleBadgeVariant[member.role] || "default"} className="ml-auto flex-shrink-0">
                            {ROLE_LABELS[member.role as Role]}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
