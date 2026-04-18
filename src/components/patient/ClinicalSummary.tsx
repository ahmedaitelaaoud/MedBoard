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
  const canInitialize = userRole === "DOCTOR" && !record;

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
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Résumé clinique</h2>
            {canInitialize && (
              <Button
                size="sm"
                loading={saving}
                onClick={async () => {
                  if (!patientId) return;
                  setSaving(true);
                  try {
                    const res = await fetch(`/api/patients/${patientId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        record: {
                          diagnosisSummary: "",
                          medicalHistory: "",
                          currentPlan: "",
                        },
                      }),
                    });
                    if (res.ok) onUpdate?.();
                  } catch (err) {
                    console.error("Failed to initialize medical record:", err);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Initialiser le dossier
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Le patient est enregistré, mais le dossier clinique n’est pas encore initialisé.
          </p>
          {userRole !== "DOCTOR" && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">Seuls les médecins peuvent initialiser et modifier le dossier médical.</p>
          )}
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
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Résumé clinique</h2>
          {canEdit && !editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              Modifier
            </Button>
          )}
          {editing && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setDiagnosis(record.diagnosisSummary || ""); setHistory(record.medicalHistory || ""); setPlan(record.currentPlan || ""); }}>
                Annuler
              </Button>
              <Button size="sm" loading={saving} onClick={handleSave}>
                Enregistrer
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {sections.map((section) => (
          <div key={section.label}>
            <h3 className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              {section.label === "Diagnosis" ? "Diagnostic" : section.label === "Medical History" ? "Antécédents médicaux" : "Plan actuel"}
            </h3>
            {editing ? (
              <textarea
                value={section.value}
                onChange={(e) => section.setter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all duration-150 resize-y min-h-[60px]"
                rows={3}
              />
            ) : (
              <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                {section.content || "—"}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
