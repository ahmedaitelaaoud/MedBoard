"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/lib/constants";

type PipelineStage = "idle" | "indexing" | "reasoning" | "drafting" | "ready";
type SuggestionStatus = "PENDING" | "APPROVED" | "REJECTED";

interface UploadedDocument {
  id: string;
  name: string;
  sizeKb: number;
  category: "LAB" | "XRAY" | "REPORT";
}

interface SuggestionItem {
  id: string;
  title: string;
  type: "SUMMARY" | "DIAGNOSTIC" | "CARE_PLAN";
  confidence: number;
  content: string;
  evidence: string[];
  status: SuggestionStatus;
}

interface ActivityEvent {
  id: string;
  action: string;
  at: Date;
}

const baseSuggestions: Omit<SuggestionItem, "status">[] = [
  {
    id: "sum-01",
    type: "SUMMARY",
    title: "Brouillon de synthese clinique",
    confidence: 0.91,
    content:
      "Tableau compatible avec une exacerbation infectieuse respiratoire sur terrain diabetique, avec surcharge inflammatoire moderee et besoin de surveillance rapprochee pendant 24h.",
    evidence: ["CRP 86 mg/L", "Rx thorax: opacites basales droites", "Note clinique 08:12"],
  },
  {
    id: "diag-01",
    type: "DIAGNOSTIC",
    title: "Considerations diagnostiques",
    confidence: 0.86,
    content:
      "Hypotheses prioritaires: pneumonie communautaire, insuffisance cardiaque debutante, complication metabolique liee au diabete. L’agent recommande de confirmer BNP et gaz du sang.",
    evidence: ["SpO2 91%", "Tachycardie 112 bpm", "Antecedent HTA + diabete"],
  },
  {
    id: "plan-01",
    type: "CARE_PLAN",
    title: "Suggestions initiales de plan de soins",
    confidence: 0.89,
    content:
      "Demarrer antibiotherapie probabiliste, surveillance des constantes toutes les 4h, reevaluation clinique dans 6h, et demande de controle biologique a H+12.",
    evidence: ["Leucocytes 14.2", "Fiievre 38.4C", "Charge en lits de soins critiques: elevee"],
  },
];

function stageLabel(stage: PipelineStage): string {
  switch (stage) {
    case "indexing":
      return "Indexation RAG";
    case "reasoning":
      return "Raisonnement Gemini";
    case "drafting":
      return "Generation des suggestions";
    case "ready":
      return "Pret pour revue medecin";
    default:
      return "En attente";
  }
}

function typeBadge(type: SuggestionItem["type"]): "info" | "warning" | "success" {
  if (type === "SUMMARY") return "info";
  if (type === "DIAGNOSTIC") return "warning";
  return "success";
}

function formatEventTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function estimateCategory(name: string): UploadedDocument["category"] {
  const lower = name.toLowerCase();
  if (lower.includes("xray") || lower.includes("radio")) return "XRAY";
  if (lower.includes("report") || lower.includes("compte")) return "REPORT";
  return "LAB";
}

function categoryLabel(category: UploadedDocument["category"]): string {
  if (category === "XRAY") return "Imagerie";
  if (category === "REPORT") return "Rapport";
  return "Analyse";
}

export default function AgentDiagnosticPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [patientId, setPatientId] = useState("PATIENT-DEMO");
  const [patientName, setPatientName] = useState("Fatima Zahra Kettani");
  const [patientCode, setPatientCode] = useState("PAT-00002");

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [running, setRunning] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== Role.DOCTOR)) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPatientId(params.get("patientId") || "PATIENT-DEMO");
    setPatientName(params.get("patientName") || "Fatima Zahra Kettani");
    setPatientCode(params.get("patientCode") || "PAT-00002");
  }, []);

  const approvedSuggestions = useMemo(
    () => suggestions.filter((item) => item.status === "APPROVED"),
    [suggestions]
  );

  const rejectedSuggestions = useMemo(
    () => suggestions.filter((item) => item.status === "REJECTED").length,
    [suggestions]
  );

  const addEvent = (action: string) => {
    setEvents((prev) => [{ id: crypto.randomUUID(), action, at: new Date() }, ...prev]);
  };

  const onPickFiles = () => {
    inputRef.current?.click();
  };

  const onFilesSelected: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const mapped = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      sizeKb: Math.max(1, Math.round(file.size / 1024)),
      category: estimateCategory(file.name),
    }));

    setUploadedDocs((prev) => [...prev, ...mapped]);
    addEvent(`${mapped.length} document(s) ajoute(s) au dossier d’analyse`);
    event.target.value = "";
  };

  const runPipeline = async () => {
    if (uploadedDocs.length === 0 || running) return;

    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    setRunning(true);
    setStage("indexing");
    addEvent("Pipeline IA demarre: indexation du contexte patient");
    await pause(900);

    setStage("reasoning");
    addEvent("Gemini analyse les documents et les notes recentes");
    await pause(900);

    setStage("drafting");
    addEvent("Brouillons de synthese et recommandations en preparation");
    await pause(900);

    setSuggestions(baseSuggestions.map((item) => ({ ...item, status: "PENDING" })));
    setStage("ready");
    addEvent("Suggestions pretes pour validation medecin");
    setRunning(false);
  };

  const updateSuggestionStatus = (id: string, status: SuggestionStatus) => {
    setSuggestions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );

    const selected = suggestions.find((item) => item.id === id);
    if (!selected) return;

    if (status === "APPROVED") {
      addEvent(`Suggestion approuvee: ${selected.title}`);
    }
    if (status === "REJECTED") {
      addEvent(`Suggestion rejetee: ${selected.title}`);
    }
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
            <p className="text-sm text-gray-500 dark:text-slate-400">Cette experience de validation diagnostique est reservee aux medecins.</p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl">
        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">Prototype UX futur agentique</p>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mt-0.5">Diagnostic upload et suggestions medecin</h1>
              <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">Patient(e): {patientName} · {patientCode} · ID {patientId}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info" dot>
                {stageLabel(stage)}
              </Badge>
              <Badge variant="success">{approvedSuggestions.length} approuvee(s)</Badge>
              <Badge variant="warning">{rejectedSuggestions} rejetee(s)</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">1) Upload des documents cliniques</h2>
                  <Button size="sm" variant="secondary" onClick={onPickFiles}>Ajouter des fichiers</Button>
                  <input ref={inputRef} type="file" multiple className="hidden" onChange={onFilesSelected} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-dashed border-gray-300 dark:border-slate-700 px-4 py-5 text-center bg-gray-50/60 dark:bg-slate-900/40">
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-200">Deposer analyses, radios, ou comptes rendus</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Simulation locale uniquement, aucune donnee n’est envoyee.</p>
                </div>

                {uploadedDocs.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400">Aucun document pour le moment.</p>
                ) : (
                  <div className="space-y-2">
                    {uploadedDocs.map((doc) => (
                      <div key={doc.id} className="rounded-lg border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{doc.name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{doc.sizeKb} KB · {categoryLabel(doc.category)}</p>
                        </div>
                        <Badge variant="muted">Pret</Badge>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button onClick={runPipeline} loading={running} disabled={uploadedDocs.length === 0}>
                    Lancer l’analyse IA
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Pipeline mock: RAG + Gemini + validation medecin</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">2) Suggestions generees pour validation medecin</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestions.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400">Les suggestions apparaitront apres lancement de l’analyse.</p>
                ) : (
                  suggestions.map((item) => (
                    <div key={item.id} className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{item.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={typeBadge(item.type)}>{item.type}</Badge>
                          <Badge variant="muted">Confiance {(item.confidence * 100).toFixed(0)}%</Badge>
                          {item.status === "APPROVED" && <Badge variant="success">Approuvee</Badge>}
                          {item.status === "REJECTED" && <Badge variant="critical">Rejetee</Badge>}
                          {item.status === "PENDING" && <Badge variant="warning">A valider</Badge>}
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-slate-300 mt-2">{item.content}</p>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.evidence.map((signal) => (
                          <Badge key={signal} variant="info" className="text-[10px]">{signal}</Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => updateSuggestionStatus(item.id, "APPROVED")}
                          disabled={item.status === "APPROVED"}
                        >
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => updateSuggestionStatus(item.id, "REJECTED")}
                          disabled={item.status === "REJECTED"}
                        >
                          Rejeter
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">3) Brouillon dossier medical</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {approvedSuggestions.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400">Aucune suggestion approuvee pour ecriture.</p>
                ) : (
                  approvedSuggestions.map((item) => (
                    <div key={item.id} className="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/15 px-3 py-2">
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">Pret a ecrire dans le dossier</p>
                      <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100 mt-0.5">{item.title}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">4) Flux activite (simulation)</h2>
              </CardHeader>
              <CardContent className="space-y-2">
                {events.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400">Aucun evenement pour le moment.</p>
                ) : (
                  events.slice(0, 8).map((event) => (
                    <div key={event.id} className="rounded-lg border border-gray-100 dark:border-slate-800 px-3 py-2">
                      <p className="text-xs text-gray-500 dark:text-slate-400">{formatEventTime(event.at)}</p>
                      <p className="text-sm text-gray-800 dark:text-slate-200 mt-0.5">{event.action}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
