"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { PatientFull } from "@/types/domain";

interface ClinicalSummaryProps {
  record: PatientFull["medicalRecord"];
  patientId?: string;
  userRole?: string;
  onUpdate?: () => void;
}

export function ClinicalSummary({ record, patientId, userRole, onUpdate }: ClinicalSummaryProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [diagnosis, setDiagnosis] = useState(record?.diagnosisSummary || "");
  const [history, setHistory] = useState(record?.medicalHistory || "");
  const [plan, setPlan] = useState(record?.currentPlan || "");

  const canEdit = userRole === "DOCTOR" && record;

  const handleSave = async () => {
    if (!patientId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          record: {
            diagnosisSummary: diagnosis,
            medicalHistory: history,
            currentPlan: plan,
          },
        }),
      });
      if (res.ok) {
        setEditing(false);
        onUpdate?.();
      }
    } catch (err) {
      console.error("Failed to update record:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!record) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">Clinical Summary</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">No medical record available</p>
        </CardContent>
      </Card>
    );
  }

  const sections = [
    { label: "Diagnosis", value: diagnosis, setter: setDiagnosis, content: record.diagnosisSummary },
    { label: "Medical History", value: history, setter: setHistory, content: record.medicalHistory },
    { label: "Current Plan", value: plan, setter: setPlan, content: record.currentPlan },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Clinical Summary</h2>
          {canEdit && !editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
          {editing && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setDiagnosis(record.diagnosisSummary || ""); setHistory(record.medicalHistory || ""); setPlan(record.currentPlan || ""); }}>
                Cancel
              </Button>
              <Button size="sm" loading={saving} onClick={handleSave}>
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {sections.map((section) => (
          <div key={section.label}>
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              {section.label}
            </h3>
            {editing ? (
              <textarea
                value={section.value}
                onChange={(e) => section.setter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all duration-150 resize-y min-h-[60px]"
                rows={3}
              />
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed">
                {section.content || "—"}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
