"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

interface NurseOption {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  active: boolean;
  isAvailable: boolean;
}

interface SuggestionPayload {
  title: string;
  description: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  recommendedNurseId: string;
  confidence: number;
  reasoning: string;
}

interface SuggestionItem {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "APPLIED";
  confidence: number | null;
  createdAt: string;
  payload: SuggestionPayload;
  recommendedNurse: {
    id: string;
    firstName: string;
    lastName: string;
    isAvailable: boolean;
  } | null;
}

interface AgentSuggestionsPanelProps {
  patientId: string;
}

export function AgentSuggestionsPanel({ patientId }: AgentSuggestionsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [nurses, setNurses] = useState<NurseOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<SuggestionPayload | null>(null);

  const fetchNurses = useCallback(async () => {
    const res = await fetch("/api/staff");
    if (!res.ok) return;
    const json = await res.json();
    const nurseList = (Array.isArray(json.data) ? json.data : []).filter((person: NurseOption) => person.role === "NURSE");
    setNurses(nurseList);
  }, []);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/agent/suggestions?patientId=${encodeURIComponent(patientId)}&status=PENDING&limit=20`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Impossible de charger les suggestions");
      }
      const json = await res.json();
      setSuggestions(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchSuggestions();
    fetchNurses();
  }, [fetchSuggestions, fetchNurses]);

  const nurseOptions = useMemo(
    () => nurses.map((nurse) => ({ value: nurse.id, label: `${nurse.firstName} ${nurse.lastName}${nurse.isAvailable ? "" : " (indisponible)"}` })),
    [nurses]
  );

  const startEditing = (suggestion: SuggestionItem) => {
    setEditingId(suggestion.id);
    setEditDraft(suggestion.payload);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveSuggestion = async (suggestionId: string) => {
    if (!editDraft) return;

    setSavingId(suggestionId);
    setError(null);
    try {
      const res = await fetch(`/api/agent/suggestions/${suggestionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Impossible d'enregistrer les modifications");
      }

      cancelEditing();
      await fetchSuggestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSavingId(null);
    }
  };

  const approveSuggestion = async (suggestionId: string) => {
    setSavingId(suggestionId);
    setError(null);
    try {
      const res = await fetch(`/api/agent/suggestions/${suggestionId}/approve`, { method: "POST" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Impossible d'approuver la suggestion");
      }
      await fetchSuggestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSavingId(null);
    }
  };

  const rejectSuggestion = async (suggestionId: string) => {
    const reason = window.prompt("Motif du rejet (optionnel):") ?? "";
    setSavingId(suggestionId);
    setError(null);

    try {
      const res = await fetch(`/api/agent/suggestions/${suggestionId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Impossible de rejeter la suggestion");
      }
      await fetchSuggestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Suggestions IA de routage infirmier</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Validation medecin obligatoire avant creation de la tache.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={fetchSuggestions} loading={loading}>
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="text-xs rounded-md px-2.5 py-2 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">Chargement des suggestions...</p>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">Aucune suggestion IA en attente pour ce patient.</p>
        ) : (
          suggestions.map((suggestion) => {
            const isEditing = editingId === suggestion.id && editDraft !== null;
            const currentPayload = isEditing ? editDraft : suggestion.payload;
            const currentNurse = nurses.find((nurse) => nurse.id === currentPayload.recommendedNurseId) ?? suggestion.recommendedNurse;

            return (
              <div key={suggestion.id} className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">Confiance {(currentPayload.confidence * 100).toFixed(0)}%</Badge>
                  <Badge variant="muted">{currentPayload.priority}</Badge>
                  <Badge variant="warning">{suggestion.status}</Badge>
                  <Badge variant="default">{new Date(suggestion.createdAt).toLocaleString("fr-FR")}</Badge>
                </div>

                {isEditing ? (
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      value={editDraft.title}
                      onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                    />
                    <textarea
                      value={editDraft.description}
                      onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg min-h-[90px]"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={editDraft.priority}
                        onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, priority: e.target.value as SuggestionPayload["priority"] } : prev))}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                      >
                        <option value="LOW">LOW</option>
                        <option value="NORMAL">NORMAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="URGENT">URGENT</option>
                      </select>

                      <select
                        value={editDraft.recommendedNurseId}
                        onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, recommendedNurseId: e.target.value } : prev))}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg sm:col-span-2"
                      >
                        {nurseOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={editDraft.confidence}
                        onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, confidence: Number(e.target.value) } : prev))}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                      />
                      <p className="text-xs text-gray-500 dark:text-slate-400 self-center">Confiance (0 a 1)</p>
                    </div>
                    <textarea
                      value={editDraft.reasoning}
                      onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, reasoning: e.target.value } : prev))}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg min-h-[75px]"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{currentPayload.title}</p>
                    <p className="text-sm text-gray-600 dark:text-slate-300">{currentPayload.description}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Infirmier(ere) suggere(e): {currentNurse ? `${currentNurse.firstName} ${currentNurse.lastName}` : "Inconnu"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Raisonnement: {currentPayload.reasoning}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={() => saveSuggestion(suggestion.id)} loading={savingId === suggestion.id}>Enregistrer</Button>
                      <Button size="sm" variant="secondary" onClick={cancelEditing} disabled={savingId === suggestion.id}>Annuler</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => startEditing(suggestion)}>Editer</Button>
                      <Button size="sm" onClick={() => approveSuggestion(suggestion.id)} loading={savingId === suggestion.id}>Approuver</Button>
                      <Button size="sm" variant="danger" onClick={() => rejectSuggestion(suggestion.id)} loading={savingId === suggestion.id}>Rejeter</Button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
