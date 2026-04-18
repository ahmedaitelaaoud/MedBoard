"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/lib/constants";

interface ScheduleDraftItem {
  id: string;
  title: string;
  scheduledAt: string;
  type: "DOCTOR_VISIT" | "NURSE_VISIT" | "CHECKUP";
  confidence: number;
  rationale: string;
  selected: boolean;
  status: "SUGGESTED" | "APPROVED";
}

interface SyncEvent {
  id: string;
  message: string;
  at: Date;
}

const seedSuggestions: ScheduleDraftItem[] = [
  {
    id: "sched-1",
    title: "Reevaluation respiratoire par medecin",
    scheduledAt: "Demain · 09:30",
    type: "DOCTOR_VISIT",
    confidence: 0.9,
    rationale: "Priorite elevee selon note evolutive + saturation basse nocturne.",
    selected: true,
    status: "SUGGESTED",
  },
  {
    id: "sched-2",
    title: "Controle constantes infirmier",
    scheduledAt: "Demain · 12:00",
    type: "NURSE_VISIT",
    confidence: 0.88,
    rationale: "Alignement avec plan de soins initial et charge de service.",
    selected: true,
    status: "SUGGESTED",
  },
  {
    id: "sched-3",
    title: "Bilan biologique de suivi",
    scheduledAt: "Demain · 14:15",
    type: "CHECKUP",
    confidence: 0.83,
    rationale: "Controle recommande apres ajustement therapeutique.",
    selected: false,
    status: "SUGGESTED",
  },
  {
    id: "sched-4",
    title: "Point education patient et adherence",
    scheduledAt: "Apres-demain · 10:30",
    type: "NURSE_VISIT",
    confidence: 0.78,
    rationale: "Risque de non-observance detecte dans les notes recentes.",
    selected: false,
    status: "SUGGESTED",
  },
];

function typeLabel(type: ScheduleDraftItem["type"]): string {
  if (type === "DOCTOR_VISIT") return "Medecin";
  if (type === "NURSE_VISIT") return "Infirmier";
  return "Controle";
}

function typeVariant(type: ScheduleDraftItem["type"]): "info" | "success" | "warning" {
  if (type === "DOCTOR_VISIT") return "info";
  if (type === "NURSE_VISIT") return "success";
  return "warning";
}

function formatSyncTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AgentSchedulePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [patientName, setPatientName] = useState("Fatima Zahra Kettani");
  const [patientCode, setPatientCode] = useState("PAT-00002");

  const [items, setItems] = useState<ScheduleDraftItem[]>(seedSuggestions);
  const [approved, setApproved] = useState<ScheduleDraftItem[]>([]);
  const [syncEvents, setSyncEvents] = useState<SyncEvent[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== Role.DOCTOR)) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPatientName(params.get("patientName") || "Fatima Zahra Kettani");
    setPatientCode(params.get("patientCode") || "PAT-00002");
  }, []);

  const selectedCount = useMemo(
    () => items.filter((item) => item.selected && item.status === "SUGGESTED").length,
    [items]
  );

  const syncState = approved.length === 0 ? "En attente" : "Synchronise";

  const addSyncEvent = (message: string) => {
    setSyncEvents((prev) => [{ id: crypto.randomUUID(), message, at: new Date() }, ...prev]);
  };

  const updateSelection = (id: string, selected: boolean) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, selected } : item)));
  };

  const approveSelected = () => {
    const toApprove = items.filter((item) => item.status === "SUGGESTED" && item.selected);
    if (toApprove.length === 0) return;

    setItems((prev) =>
      prev.map((item) =>
        item.status === "SUGGESTED" && item.selected ? { ...item, status: "APPROVED", selected: false } : item
      )
    );
    setApproved((prev) => [
      ...toApprove.map<ScheduleDraftItem>((item) => ({ ...item, status: "APPROVED" })),
      ...prev,
    ]);
    addSyncEvent(`${toApprove.length} item(s) approuve(s) et pushes vers le portail patient`);
  };

  const rejectAllDraft = () => {
    const pending = items.some((item) => item.status === "SUGGESTED");
    if (!pending) return;

    setItems((prev) => prev.filter((item) => item.status !== "SUGGESTED"));
    addSyncEvent("Suggestions en attente rejetees par le medecin");
  };

  const resetSuggestions = () => {
    setItems(seedSuggestions);
    setApproved([]);
    setSyncEvents([]);
  };

  if (loading || !user) {
    return (
      <AppShell>
        <div className="space-y-3 max-w-6xl">
          <div className="h-24 rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-80 rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (user.role !== Role.DOCTOR) {
    return (
      <AppShell>
        <Card className="max-w-2xl">
          <CardHeader>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Acces restreint</h1>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-slate-400">Cette experience de synchronisation planning est reservee aux medecins.</p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl">
        <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs text-emerald-600 dark:text-emerald-300 font-medium">Prototype UX futur agentique</p>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mt-0.5">Suggestion planning et synchronisation portail patient</h1>
              <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">Patient(e): {patientName} · {patientCode}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info" dot>{selectedCount} selectionnee(s)</Badge>
              <Badge variant={approved.length > 0 ? "success" : "warning"}>{syncState}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">1) Suggestions proposees par l’agent</h2>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={approveSelected} disabled={selectedCount === 0}>Approuver la selection</Button>
                    <Button size="sm" variant="danger" onClick={rejectAllDraft}>Rejeter le reste</Button>
                    <Button size="sm" variant="secondary" onClick={resetSuggestions}>Reinitialiser</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="info">Source: diagnostic + notes + taches actives</Badge>
                  <Badge variant="muted">RAG patient-context scope</Badge>
                  <Badge variant="muted">Mode: validation médecin obligatoire</Badge>
                </div>

                {items.filter((item) => item.status === "SUGGESTED").length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400">Aucune suggestion en attente.</p>
                ) : (
                  items
                    .filter((item) => item.status === "SUGGESTED")
                    .map((item) => (
                      <label
                        key={item.id}
                        className="flex gap-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3"
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={item.selected}
                          onChange={(e) => updateSelection(item.id, e.target.checked)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{item.title}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant={typeVariant(item.type)}>{typeLabel(item.type)}</Badge>
                              <Badge variant="muted">Confiance {(item.confidence * 100).toFixed(0)}%</Badge>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{item.scheduledAt}</p>
                          <p className="text-sm text-gray-700 dark:text-slate-300 mt-1.5">{item.rationale}</p>
                        </div>
                      </label>
                    ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">2) Planning approuve (persistance mock)</h2>
              </CardHeader>
              <CardContent className="space-y-2">
                {approved.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400">Aucun element approuve pour le moment.</p>
                ) : (
                  approved.map((item) => (
                    <div key={item.id} className="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/15 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">{item.title}</p>
                        <Badge variant="success">Persisté</Badge>
                      </div>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-200/80 mt-1">{item.scheduledAt}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">3) Apercu portail patient</h2>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-slate-400">Les elements approuves apparaissent automatiquement ici.</p>
                {approved.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400">Portail en attente de synchronisation.</p>
                ) : (
                  approved.map((item) => (
                    <div key={`portal-${item.id}`} className="rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-900/15 px-3 py-2">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{item.title}</p>
                      <p className="text-xs text-blue-700/80 dark:text-blue-200/80 mt-1">{item.scheduledAt}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">4) Historique de synchronisation</h2>
              </CardHeader>
              <CardContent className="space-y-2">
                {syncEvents.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400">Aucun evenement de sync pour le moment.</p>
                ) : (
                  syncEvents.map((event) => (
                    <div key={event.id} className="rounded-lg border border-gray-100 dark:border-slate-800 px-3 py-2">
                      <p className="text-xs text-gray-500 dark:text-slate-400">{formatSyncTime(event.at)}</p>
                      <p className="text-sm text-gray-800 dark:text-slate-200 mt-0.5">{event.message}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Contexte patient (editable mock)</h2>
              </CardHeader>
              <CardContent className="space-y-2">
                <input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-slate-100"
                  placeholder="Nom patient"
                />
                <input
                  value={patientCode}
                  onChange={(e) => setPatientCode(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-slate-100"
                  placeholder="Code patient"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
